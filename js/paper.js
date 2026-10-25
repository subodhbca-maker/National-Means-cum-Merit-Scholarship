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
  /* at most this many questions of one figure type in a paper, so no figure style feels repeated */
  const FIG_CAPS = { figSeries: 3, paperFold: 2, mirrorImage: 2, dice: 1, countTriangles: 1, countSquares: 1, matrix: 1, cubeNet: 1, overlap: 1, missingFigure: 2, figAnalogy: 3, figOdd: 2 };

  /* UP MAT booklet order with question counts (out of 90), taken from the 2023–2025 papers */
  const MAT_BLUEPRINT = [
    ['odd', 10], ['analogy', 12], ['coding', 8], ['ops', 8], ['relation', 6], ['series', 8],
    ['figure', 12], ['figurenum', 6], ['gap', 6], ['venn', 8], ['arith', 6]
  ];
  /* category of a UP previous-year MAT question, from its year and question number */
  const PYQ_RANGES = {
    2023: [[1, 12, 'odd'], [13, 24, 'analogy'], [25, 36, 'ops'], [37, 43, 'coding'], [59, 61, 'figurenum'], [65, 68, 'series'], [70, 77, 'gap'], [78, 85, 'venn'], [86, 90, 'passage']],
    2024: [[1, 12, 'odd'], [13, 27, 'analogy'], [28, 39, 'ops'], [40, 46, 'coding'], [47, 49, 'ops'], [50, 61, 'analogy'], [62, 64, 'figurenum'], [65, 69, 'series'], [70, 77, 'gap'], [78, 85, 'venn'], [86, 90, 'passage']],
    2025: [[1, 10, 'odd'], [11, 20, 'analogy'], [21, 30, 'coding'], [31, 35, 'ops'], [36, 40, 'relation'], [41, 45, 'series'], [46, 50, 'figure'], [51, 60, 'analogy'], [61, 77, 'figure'], [78, 80, 'arith'], [81, 85, 'arith'], [86, 90, 'passage']]
  };
  const TOPIC_CAT = [[/counting pattern|clock|calendar|age/i, 'arith'], [/venn|diagram/i, 'venn'], [/gap/i, 'gap'], [/odd/i, 'odd'], [/analog/i, 'analogy'], [/cod/i, 'coding'], [/sign|operation|operator/i, 'ops'], [/direction|relation|rank/i, 'relation'],
    [/series|alphabet/i, 'series'], [/figure|mirror|water|fold|dice|count/i, 'figure'], [/missing|number.*fig/i, 'figurenum']];
  function catOf(q) {
    if (q.cat) return q.cat;
    if (q.source === 'pyq') {
      const m = /Q(\d+)$/.exec(q.topic || ''), r = (PYQ_RANGES[q.year] || []).find(([a, b]) => m && +m[1] >= a && +m[1] <= b);
      if (r) return r[2];
    }
    const t = (TOPIC_CAT.find(([re]) => re.test(q.topic || '')) || [])[1];
    return t || 'arith';
  }
  /* spread items so the same template never appears twice in a row (round-robin over generator / topic) */
  function interleave(items) {
    const groups = {};
    U.shuffle(items).forEach((q) => { const k = q.gen || (q.source === 'pyq' ? 'pyq' + q.year : q.topic) || 'x'; (groups[k] = groups[k] || []).push(q); });
    const keys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
    const out = [];
    let last = null;
    while (out.length < items.length) {
      const k = keys.filter((x) => groups[x].length && x !== last).sort((a, b) => groups[b].length - groups[a].length)[0] || keys.find((x) => groups[x].length);
      out.push(groups[k].shift()); last = k;
    }
    return out;
  }

  /* MAT section built category by category in UP order; generated questions fill whatever the bank lacks */
  function buildMat(count, bank, opts, used, warnings) {
    const scale = count / 90;
    let cats = MAT_BLUEPRINT.map(([c, n]) => [c, n * scale]);
    const floor = cats.map(([c, n]) => [c, Math.floor(n), n - Math.floor(n)]);
    let left = count - floor.reduce((s2, x) => s2 + x[1], 0);
    floor.slice().sort((a, b) => b[2] - a[2]).forEach((x) => { if (left > 0) { x[1]++; left--; } });
    cats = floor.map(([c, n]) => [c, n]).filter(([, n]) => n > 0);
    const target = U.splitDifficulty(count, opts.ratio);
    const share = opts.mixGenerated == null ? 0.5 : opts.mixGenerated;
    const pool = bank.filter((q) => q.subject === 'mat' && q.answer >= 0 && !used.has(q.id) && (opts.includePyq !== false || q.source !== 'pyq'));
    const byCat = {};
    pool.forEach((q) => { const c = catOf(q); (byCat[c] = byCat[c] || []).push(q); });
    const out = [];
    for (const [cat, n] of cats) {
      let items = [];
      // one previous-year passage set (5 linked questions) goes at the end, as in the real booklet
      if (cat === 'arith' && opts.includePyq !== false && n >= 5 && count >= 60) {
        const sets = {};
        (byCat.passage || []).forEach((q) => { (sets[q.year] = sets[q.year] || []).push(q); });
        const ys = Object.keys(sets).filter((y) => sets[y].length >= 5);
        if (ys.length) {
          const set = sets[U.pick(ys)].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })).slice(0, 5);
          set.forEach((q) => used.add(q.id));
          items.push(...set.map((q) => Object.assign({}, q, { cat: 'passage' })));
        }
      }
      const need = n - items.length;
      const split = U.splitDifficulty(need, opts.ratio);
      const gens = U.shuffle(GEN.ofCat(cat));
      const mine = [];
      // how many questions each generator already has in this category — keeps the mix even (max 2 of a kind for figures)
      const genCount = {};
      const tally = (q) => { if (q.gen) genCount[q.gen] = (genCount[q.gen] || 0) + 1; };
      const capOf = (name) => (FIG_CAPS[name] != null ? FIG_CAPS[name] : 99);
      const nextGen = () => {
        const free = gens.filter((g) => (genCount[g.name] || 0) < capOf(g.name));
        const pool2 = free.length ? free : gens;
        const min = Math.min(...pool2.map((g) => genCount[g.name] || 0));
        return U.pick(pool2.filter((g) => (genCount[g.name] || 0) === min));
      };
      for (const d of U.shuffle(['easy', 'moderate', 'hard'])) {
        let k = split[d];
        if (!k) continue;
        const figCat = cat === 'figure' || cat === 'venn' || cat === 'figurenum';
        const fromBank = gens.length ? Math.min(k - Math.round(k * (figCat ? Math.max(share, 0.75) : share)), k) : k;
        const cand = (byCat[cat] || []).filter((q) => q.difficulty === d && !used.has(q.id) && !(q.source === 'generated' && q.figure && (q.used || 0) > 0) && (!q.gen || (genCount[q.gen] || 0) < capOf(q.gen)));
        const got = pickSpread(cand, Math.max(0, fromBank));
        got.forEach((q) => { used.add(q.id); tally(q); GEN.markUsed(q); });
        mine.push(...got);
        k -= got.length;
        for (let i = 0; i < k; i++) {
          const g = gens.length ? nextGen() : null;
          const q = g ? (GEN.one('mat', d, g) || GEN.one('mat', d, U.pick(gens))) : null;
          if (q) { mine.push(q); tally(q); }
        }
      }
      while (mine.length < need) { // category without generator and empty bank: borrow any arithmetic generator
        const q = GEN.one('mat', U.pick(['easy', 'moderate', 'hard']), U.pick(GEN.ofCat('arith')));
        if (q) mine.push(q); else break;
      }
      items = items.concat(interleave(mine));
      out.push(...items.map((q) => Object.assign({}, q, { section: 'mat', cat: catOf(q) === 'passage' ? 'passage' : cat })));
    }
    // move the passage set to the very end and make the difficulty mix exact
    const passage = out.filter((q) => q.cat === 'passage'), rest = out.filter((q) => q.cat !== 'passage');
    return rebalance(rest.concat(passage), target, warnings);
  }

  /* regenerate generated questions until the easy / moderate / hard counts match the target exactly */
  function rebalance(list, target, warnings) {
    const cnt = () => ({ easy: list.filter((q) => q.difficulty === 'easy').length, moderate: list.filter((q) => q.difficulty === 'moderate').length, hard: list.filter((q) => q.difficulty === 'hard').length });
    for (let guard = 0; guard < 200; guard++) {
      const c = cnt();
      const over = ['easy', 'moderate', 'hard'].find((d) => c[d] > target[d]);
      const under = ['easy', 'moderate', 'hard'].find((d) => c[d] < target[d]);
      if (!over || !under) break;
      const cands = list.map((q, i) => [q, i]).filter(([q]) => q.difficulty === over && q.gen && GEN.byName(q.gen));
      if (!cands.length) { warnings.push('कठिनाई अनुपात पूरी तरह मेल नहीं खा सका।'); break; }
      const [q, i] = U.pick(cands);
      const nq = GEN.one(q.subject, under, GEN.byName(q.gen));
      if (nq) list[i] = Object.assign(nq, { section: q.section, cat: q.cat });
    }
    return list;
  }

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
    return interleave(chosen).map((q) => Object.assign({}, q, { section: sec.subject }));
  }

  async function generate(cfg) {
    // cfg: { patternKey | sections, title, lang, ratio, mixGenerated, includePyq, durationMin, startNo }
    const pat = PATTERNS[cfg.patternKey] || { kind: 'CUSTOM', sections: cfg.sections, startNo: 1, durationMin: cfg.durationMin || 90, name: { hi: cfg.title, en: cfg.title } };
    const bank = await DB.all('questions');
    const used = new Set();
    // remember what recent papers drew so a new mock test does not look like the last one
    const history = await DB.getSetting('figHistory', []);
    GEN.beginSession(history);
    const warnings = [];
    let questions = [];
    for (const sec of pat.sections) {
      if (sec.subject === 'mat') questions.push(...buildMat(sec.count, bank, cfg, used, warnings));
      else questions.push(...buildSection(sec, bank, cfg, used, warnings));
    }
    // save fresh generated questions into the bank as well, and bump usage counters
    await DB.setSetting('figHistory', history.concat(GEN.sessionSigs()).slice(-600));
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

  window.PAPER = { PATTERNS, generate, makePaper, stats, sections, score, pickSpread, catOf, MAT_BLUEPRINT };
})();
