/* Basic Pathshala - NMMS : exam patterns + paper generator (40% easy / 40% moderate / 20% hard) */
(function () {
  const PATTERNS = {
    UP_MAT: {
      name: { hi: 'उ.प्र. NMMS — मानसिक योग्यता परीक्षा (MAT)', en: 'UP NMMS — Mental Ability Test (MAT)' },
      kind: 'MAT', startNo: 1, durationMin: 90,
      sections: [{ subject: 'mat', count: 90 }]
    },
    UP_SAT: {
      name: { hi: 'उ.प्र. NMMS — शैक्षिक अभिरुचि परीक्षा (SAT)', en: 'UP NMMS — Scholastic Aptitude Test (SAT)' },
      kind: 'SAT', startNo: 91, durationMin: 90,
      sections: [{ subject: 'science', count: 35 }, { subject: 'sst', count: 35 }, { subject: 'maths', count: 20 }]
    },
    UP_FULL: {
      name: { hi: 'उ.प्र. NMMS — पूर्ण मॉडल पेपर (MAT + SAT)', en: 'UP NMMS — Full Model Paper (MAT + SAT)' },
      kind: 'FULL', startNo: 1, durationMin: 180,
      sections: [{ subject: 'mat', count: 90 }, { subject: 'science', count: 35 }, { subject: 'sst', count: 35 }, { subject: 'maths', count: 20 }]
    }
  };

  const GENERATABLE = { mat: true, maths: true };

  /* pick n items from pool, spreading across topics and preferring least-used */
  function pickSpread(pool, n) {
    const byTopic = {};
    U.shuffle(pool).sort((a, b) => (a.used || 0) - (b.used || 0)).forEach((q) => {
      const t = (q.topic || '').replace(/ · Q\d+$/, '') || 'misc';
      (byTopic[t] = byTopic[t] || []).push(q);
    });
    const topics = U.shuffle(Object.keys(byTopic));
    const out = [];
    while (out.length < n && topics.some((t) => byTopic[t].length)) {
      for (const t of topics) {
        if (out.length >= n) break;
        if (byTopic[t].length) out.push(byTopic[t].shift());
      }
    }
    return out;
  }

  /* build one section. bank: all questions in the bank.
     opts: { ratio, mixGenerated (0..1 share of fresh generated for mat/maths), includePyq } */
  function buildSection(sec, bank, opts, used, warnings) {
    const need = U.splitDifficulty(sec.count, opts.ratio);
    const chosen = [];
    for (const diff of ['easy', 'moderate', 'hard']) {
      let n = need[diff];
      if (!n) continue;
      let pool = bank.filter((q) => q.subject === sec.subject && q.difficulty === diff && q.answer >= 0 && !used.has(q.id) && (opts.includePyq !== false || q.source !== 'pyq'));
      let fromBank = n;
      if (GENERATABLE[sec.subject]) {
        const genShare = Math.round(n * (opts.mixGenerated == null ? 0.5 : opts.mixGenerated));
        fromBank = Math.min(pool.length, n - genShare);
      }
      const picked = pickSpread(pool, Math.min(fromBank, pool.length));
      picked.forEach((q) => used.add(q.id));
      chosen.push(...picked);
      let short = n - picked.length;
      if (short > 0 && GENERATABLE[sec.subject]) {
        chosen.push(...GEN.many(sec.subject, diff, short));
        short = 0;
      }
      if (short > 0) {
        // borrow from neighbouring difficulty so the paper is still complete
        const alt = bank.filter((q) => q.subject === sec.subject && q.answer >= 0 && !used.has(q.id));
        const extra = pickSpread(alt, short);
        extra.forEach((q) => used.add(q.id));
        chosen.push(...extra);
        warnings.push(`${U.SUBJECTS[sec.subject].hi}: ${U.DIFF[diff].hi} प्रश्न ${short} कम थे — दूसरे स्तर से लिए गए${extra.length < short ? ` (${short - extra.length} फिर भी कम)` : ''}। AI Question Generator से और प्रश्न जोड़ें।`);
      }
    }
    // group by topic like a real booklet, keep difficulty mixed inside a topic
    const order = {};
    chosen.forEach((q) => { const t = q.topic || ''; if (!(t in order)) order[t] = Object.keys(order).length; });
    return chosen.map((q) => Object.assign({}, q, { section: sec.subject }))
      .sort((a, b) => (sec.subject === 'mat' || sec.subject === 'maths' ? order[a.topic] - order[b.topic] : 0));
  }

  async function generate(cfg) {
    // cfg: { patternKey | sections, title, lang, ratio, mixGenerated, includePyq, durationMin, startNo }
    const pat = PATTERNS[cfg.patternKey] || { kind: 'CUSTOM', sections: cfg.sections, startNo: 1, durationMin: cfg.durationMin || 90, name: { hi: cfg.title, en: cfg.title } };
    const bank = await DB.all('questions');
    const used = new Set();
    const warnings = [];
    let questions = [];
    for (const sec of pat.sections) questions.push(...buildSection(sec, bank, cfg, used, warnings));
    // save fresh generated questions into the bank as well, and bump usage counters
    const fresh = questions.filter((q) => q.source === 'generated');
    if (cfg.saveGenerated !== false && fresh.length) await DB.putMany('questions', fresh.map((q) => { const c = Object.assign({}, q); delete c.section; c.used = 1; return c; }));
    const bumped = bank.filter((q) => used.has(q.id)).map((q) => Object.assign({}, q, { used: (q.used || 0) + 1 }));
    if (bumped.length) await DB.putMany('questions', bumped);
    const paper = makePaper({
      title: cfg.title || U.txt(pat.name, 'hi'),
      kind: pat.kind, lang: cfg.lang || 'bi',
      startNo: cfg.startNo || pat.startNo || 1,
      durationMin: cfg.durationMin || pat.durationMin,
      questions, ratio: cfg.ratio
    });
    await DB.put('papers', paper);
    return { paper, warnings };
  }

  function makePaper(p) {
    const questions = (p.questions || []).map((q) => {
      const c = U.normQuestion(q);
      c.section = q.section || c.subject;
      return c;
    });
    return {
      id: p.id || U.uid('paper'),
      title: p.title || 'NMMS Practice Paper',
      kind: p.kind || 'CUSTOM',
      lang: p.lang || 'bi',
      startNo: p.startNo || 1,
      durationMin: p.durationMin || 90,
      questions,
      createdAt: p.createdAt || Date.now(),
      ratio: p.ratio || { easy: 40, moderate: 40, hard: 20 }
    };
  }

  function stats(questions) {
    const s = { total: questions.length, easy: 0, moderate: 0, hard: 0, bySubject: {} };
    questions.forEach((q) => {
      s[q.difficulty] = (s[q.difficulty] || 0) + 1;
      s.bySubject[q.section || q.subject] = (s.bySubject[q.section || q.subject] || 0) + 1;
    });
    return s;
  }

  /* sections in display order with their question number ranges */
  function sections(paper) {
    const out = [];
    paper.questions.forEach((q, i) => {
      const key = q.section || q.subject;
      const last = out[out.length - 1];
      if (!last || last.key !== key) out.push({ key, from: i, to: i, label: U.SUBJECTS[key] || U.SUBJECTS.other });
      else last.to = i;
    });
    return out;
  }

  /* score one answer sheet (answers indexed by question position, -1 blank, -2 multiple) */
  function score(paper, answers) {
    const r = { correct: 0, wrong: 0, blank: 0, total: paper.questions.length, bySection: {} };
    paper.questions.forEach((q, i) => {
      const a = answers[i];
      const sec = q.section || q.subject;
      const b = r.bySection[sec] = r.bySection[sec] || { correct: 0, total: 0 };
      b.total++;
      if (a == null || a === -1) r.blank++;
      else if (a === q.answer) { r.correct++; b.correct++; }
      else r.wrong++;
    });
    r.score = r.correct; // 1 mark each, no negative marking in NMMS
    r.percent = r.total ? Math.round((r.correct / r.total) * 1000) / 10 : 0;
    return r;
  }

  window.PAPER = { PATTERNS, generate, makePaper, stats, sections, score, pickSpread };
})();
