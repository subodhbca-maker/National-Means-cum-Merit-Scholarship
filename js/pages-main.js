/* Basic Pathshala - NMMS : dashboard, question bank, AI generator, results, settings */
(function () {
  const { esc, txt, SUBJECTS, DIFF } = U;
  const PAGES = (window.PAGES = window.PAGES || {});

  /* ---------------- Dashboard ---------------- */
  PAGES.home = {
    title: 'डैशबोर्ड · Dashboard',
    async render(v) {
      const [qs, papers, results, key, sname] = await Promise.all([DB.all('questions'), DB.all('papers'), DB.all('results'), AI.hasKey(), DB.getSetting('schoolName', '')]);
      const by = {};
      qs.forEach((q) => { by[q.subject] = by[q.subject] || { total: 0, easy: 0, moderate: 0, hard: 0 }; by[q.subject].total++; by[q.subject][q.difficulty]++; });
      const pyq = qs.filter((q) => q.source === 'pyq').length;
      const recent = papers.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
      v.innerHTML = `
        <div class="hero">
          <h2>नमस्ते${sname ? ', ' + esc(sname) : ''} 👋</h2>
          <p>UP NMMS के लिए पेपर, PPT, Google Form, OMR शीट और मॉक टेस्ट, हर पेपर 40% सरल · 40% मध्यम · 20% कठिन के अनुपात में।</p>
          <div class="btns">
            <a class="btn saff lg" href="#/generate/UP_FULL">⚡ पूरा मॉडल पेपर (MAT + SAT)</a>
            <a class="btn lg" href="#/generate/UP_MAT">🧠 MAT पेपर</a>
            <a class="btn lg" href="#/generate/UP_SAT">📘 SAT पेपर</a>
          </div>
        </div>
        ${key ? '' : '<div class="note">✨ <b>Gemini AI</b> अभी चालू नहीं है। PDF से प्रश्न निकालने और नए प्रश्न बनाने के लिए <a href="#/settings">Settings</a> में अपनी free Gemini API key डालें।</div>'}
        <div class="grid g4" style="margin-bottom:18px">
          <div class="stat" style="--accent:#e3e8ff"><b>${qs.length}</b><span>कुल प्रश्न · Questions</span></div>
          <div class="stat" style="--accent:#fff1df"><b>${pyq}</b><span>UP पिछले वर्ष (PYQ)</span></div>
          <div class="stat" style="--accent:#e3f6ea"><b>${papers.length}</b><span>पेपर · Papers</span></div>
          <div class="stat" style="--accent:#fde8ec"><b>${results.length}</b><span>परिणाम · Results</span></div>
        </div>
        <div class="grid g2">
          <div class="card"><h2>📚 प्रश्न बैंक <small>विषय व कठिनाई अनुसार</small></h2>
            ${['mat', 'science', 'sst', 'maths', 'other'].filter((k) => by[k]).map((k) => `<div style="margin-bottom:12px"><div class="btns" style="justify-content:space-between"><b>${SUBJECTS[k].hi} <span class="muted" style="font-weight:500">${SUBJECTS[k].en}</span></b><span class="muted">${by[k].total}</span></div>${UI.distBar(by[k])}</div>`).join('')}
            <div class="note blue" style="margin:8px 0 0">MAT और गणित के प्रश्न generator से असीमित बनते हैं, इसलिए हर नया पेपर अलग होता है।</div>
          </div>
          <div class="card"><h2>🚀 त्वरित कार्य <small>Quick actions</small></h2>
            <div class="quick">
              <a href="#/import"><i>📥</i><b>कोई भी PDF → PPT + Form</b><span>किसी भी परीक्षा का पेपर</span></a>
              <a href="#/omr"><i>🧾</i><b>OMR प्रिंट / स्कैन</b><span>मोबाइल कैमरा से जाँच</span></a>
              <a href="#/tests"><i>⏱️</i><b>मॉक टेस्ट</b><span>टाइमर के साथ ऑनलाइन</span></a>
              <a href="#/ai"><i>✨</i><b>AI से नए प्रश्न</b><span>Gemini · हिंदी + English</span></a>
              <a href="#/results"><i>🏆</i><b>रैंक सूची</b><span>Excel · PDF डाउनलोड</span></a>
              <a href="#/bank"><i>➕</i><b>प्रश्न जोड़ें</b><span>चित्र सहित</span></a>
            </div>
          </div>
        </div>
        <div class="card"><h2>🕘 हाल के पेपर <small>Recent papers</small></h2>
          ${recent.length ? `<div class="tablewrap"><table class="t"><tr><th>पेपर</th><th>प्रश्न</th><th>कठिनाई</th><th>बनाया</th><th></th></tr>${recent.map((p) => { const s = PAPER.stats(p.questions); return `<tr><td><b>${esc(p.title)}</b></td><td>${s.total}</td><td style="min-width:160px">${UI.distBar(s).split('<div class="legend">')[0]}</td><td class="muted">${U.fmtDate(p.createdAt)}</td><td class="right"><a class="btn sm" href="#/paper/${p.id}">खोलें</a></td></tr>`; }).join('')}</table></div>` : '<div class="empty"><i>📄</i>अभी कोई पेपर नहीं। ऊपर से पहला पेपर बनाएँ।</div>'}
        </div>`;
    }
  };

  /* ---------------- Question bank ---------------- */
  const bankState = { subject: '', difficulty: '', source: '', q: '', page: 1, lang: 'bi' };
  PAGES.bank = {
    title: 'प्रश्न बैंक · Question Bank',
    async render(v) {
      document.getElementById('topRight').innerHTML = '<button class="btn primary" id="addQ">➕ नया प्रश्न</button>';
      document.getElementById('addQ').onclick = async () => {
        const q = await UI.editQuestion(null);
        if (q) { await DB.put('questions', q); U.toast('प्रश्न जोड़ा गया', 'ok'); draw(); }
      };
      v.innerHTML = `<div class="card">
        <div class="row">
          <label class="f">खोजें / Search<input type="search" id="bq" placeholder="शब्द, टॉपिक, वर्ष…" value="${esc(bankState.q)}"></label>
          <label class="f">विषय<select id="bs">${UI.subjOptions(bankState.subject, true)}</select></label>
          <label class="f">कठिनाई<select id="bd">${UI.diffOptions(bankState.difficulty, true)}</select></label>
          <label class="f">स्रोत / Source<select id="bsrc">
            <option value="">सभी</option><option value="pyq">UP PYQ</option><option value="bank">Practice bank</option><option value="generated">Generated</option><option value="ai">AI (Gemini)</option><option value="import">Imported</option><option value="manual">Manual</option></select></label>
        </div>
        <div class="btns" style="margin-top:12px;justify-content:space-between">
          ${UI.seg('lang', UI.LANGS, bankState.lang)}
          <div class="btns"><button class="btn sm" id="selAll">सभी चुनें</button><button class="btn sm danger" id="delSel">🗑 चुने हुए हटाएँ</button><button class="btn sm" id="mkPaper">📄 चुने हुए से पेपर</button><button class="btn sm" id="expB">⬇ Excel</button></div>
        </div></div>
        <div id="bstat" class="muted" style="margin:0 0 10px 4px"></div><div id="blist"></div>`;
      v.querySelector('#bsrc').value = bankState.source;
      let all = await DB.all('questions');
      let filtered = [];
      const draw = async (reload) => {
        if (reload !== false) all = await DB.all('questions');
        const s = bankState.q.toLowerCase();
        filtered = all.filter((q) => (!bankState.subject || q.subject === bankState.subject) && (!bankState.difficulty || q.difficulty === bankState.difficulty) && (!bankState.source || q.source === bankState.source)
          && (!s || (txt(q.q, 'hi') + ' ' + txt(q.q, 'en') + ' ' + q.topic + ' ' + q.options.map((o) => txt(o)).join(' ')).toLowerCase().includes(s)))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const st = PAPER.stats(filtered);
        v.querySelector('#bstat').innerHTML = `${filtered.length} प्रश्न मिले · <span style="color:var(--easy)">सरल ${st.easy}</span> · <span style="color:var(--mod)">मध्यम ${st.moderate}</span> · <span style="color:var(--hard)">कठिन ${st.hard}</span>`;
        const size = 30, pages = Math.max(1, Math.ceil(filtered.length / size));
        if (bankState.page > pages) bankState.page = pages;
        const slice = filtered.slice((bankState.page - 1) * size, bankState.page * size);
        v.querySelector('#blist').innerHTML = slice.length ? slice.map((q) => UI.qCard(q, { lang: bankState.lang, selectable: true, actions: `<button class="btn sm" data-ed="${q.id}">✏️</button><button class="btn sm danger" data-del="${q.id}">🗑</button>` })).join('') + UI.pager(filtered.length, bankState.page, size)
          : '<div class="card empty"><i>🔍</i>कोई प्रश्न नहीं मिला</div>';
      };
      let t;
      v.querySelector('#bq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { bankState.q = e.target.value; bankState.page = 1; draw(false); }, 250); };
      v.querySelector('#bs').onchange = (e) => { bankState.subject = e.target.value; bankState.page = 1; draw(false); };
      v.querySelector('#bd').onchange = (e) => { bankState.difficulty = e.target.value; bankState.page = 1; draw(false); };
      v.querySelector('#bsrc').onchange = (e) => { bankState.source = e.target.value; bankState.page = 1; draw(false); };
      UI.bindSeg(v, 'lang', (l) => { bankState.lang = l; draw(false); });
      v.querySelector('#blist').addEventListener('click', async (e) => {
        const pg = e.target.closest('[data-pg]');
        if (pg) { bankState.page = Number(pg.dataset.pg); draw(false); window.scrollTo(0, 0); return; }
        const ed = e.target.closest('[data-ed]');
        if (ed) {
          const q = await DB.get('questions', ed.dataset.ed);
          const n = await UI.editQuestion(q);
          if (n) { await DB.put('questions', n); U.toast('सेव हो गया', 'ok'); draw(); }
          return;
        }
        const del = e.target.closest('[data-del]');
        if (del && await U.confirm('यह प्रश्न हटाएँ?')) { await DB.del('questions', del.dataset.del); draw(); }
      });
      const selected = () => U.$$('.qsel:checked', v).map((c) => c.dataset.id);
      v.querySelector('#selAll').onclick = () => { const cs = U.$$('.qsel', v); const on = cs.some((c) => !c.checked); cs.forEach((c) => { c.checked = on; }); };
      v.querySelector('#delSel').onclick = async () => {
        const ids = selected(); if (!ids.length) return U.toast('पहले प्रश्न चुनें');
        if (await U.confirm(`${ids.length} प्रश्न हटाएँ?`)) { await DB.delMany('questions', ids); draw(); }
      };
      v.querySelector('#mkPaper').onclick = async () => {
        const ids = selected(); if (!ids.length) return U.toast('पहले प्रश्न चुनें');
        const qs = ids.map((id) => all.find((q) => q.id === id)).filter(Boolean);
        const p = PAPER.makePaper({ title: 'चुने हुए प्रश्न · ' + new Date().toLocaleDateString('en-IN'), questions: qs, lang: bankState.lang, durationMin: Math.max(10, qs.length) });
        await DB.put('papers', p); APP.go('#/paper/' + p.id);
      };
      v.querySelector('#expB').onclick = () => {
        const rows = [['ID', 'Subject', 'Difficulty', 'Topic', 'Source', 'Question (Hindi)', 'Question (English)', 'Opt1', 'Opt2', 'Opt3', 'Opt4', 'Answer']];
        filtered.forEach((q) => rows.push([q.id, SUBJECTS[q.subject].en, q.difficulty, q.topic, q.source, q.q.hi, q.q.en, ...q.options.map((o) => U.txt(o)), q.answer + 1]));
        EXPORT.exportExcel('NMMS_Question_Bank', { Questions: rows });
      };
      await draw(false);
    }
  };

  /* ---------------- AI generator ---------------- */
  PAGES.ai = {
    title: 'AI प्रश्न निर्माता · Gemini',
    async render(v) {
      const key = await AI.hasKey();
      v.innerHTML = `${key ? '' : '<div class="note">Gemini API key सेट नहीं है। <a href="#/settings">Settings</a> में जाकर key डालें (aistudio.google.com से free मिलती है)।</div>'}
        <div class="card"><h2>✨ नए प्रश्न बनाएँ <small>हिंदी + English, उत्तर व व्याख्या सहित</small></h2>
          <div class="row">
            <label class="f">विषय<select id="as">${UI.subjOptions('science')}</select></label>
            <label class="f">टॉपिक (वैकल्पिक)<input type="text" id="at" placeholder="जैसे: प्रकाश, 1857 की क्रांति, कोडिंग-डिकोडिंग"></label>
            <label class="f">संख्या<input type="number" id="an" value="10" min="1" max="40"></label>
          </div>
          <div class="row" style="margin-top:10px">
            <label class="f">सरल %<input type="number" id="re" value="40"></label>
            <label class="f">मध्यम %<input type="number" id="rm" value="40"></label>
            <label class="f">कठिन %<input type="number" id="rh" value="20"></label>
            <div><button class="btn primary lg" id="ago" ${key ? '' : 'disabled'}>✨ बनाएँ / Generate</button></div>
          </div></div>
        <div id="aout"></div>`;
      v.querySelector('#ago').onclick = async () => {
        const btn = v.querySelector('#ago');
        const opts = { subject: v.querySelector('#as').value, topic: v.querySelector('#at').value.trim(), count: Math.max(1, Math.min(40, +v.querySelector('#an').value || 10)),
          mix: { easy: +v.querySelector('#re').value, moderate: +v.querySelector('#rm').value, hard: +v.querySelector('#rh').value } };
        const bank = await DB.all('questions');
        opts.similarTo = U.shuffle(bank.filter((q) => q.subject === opts.subject && q.source === 'pyq')).slice(0, 5);
        btn.disabled = true; btn.innerHTML = '<span class="spin"></span> बन रहे हैं…';
        try {
          const qs = await AI.generate(opts);
          showReview(v.querySelector('#aout'), qs);
        } catch (e) { U.toast(e.message, 'err'); }
        btn.disabled = false; btn.innerHTML = '✨ बनाएँ / Generate';
      };
    }
  };

  function showReview(box, qs) {
    let list = qs.slice();
    const draw = () => {
      box.innerHTML = `<div class="card"><h2>समीक्षा करें <small>${list.length} प्रश्न · जाँचकर सेव करें</small></h2>${UI.distBar(PAPER.stats(list))}
        <div class="btns" style="margin:12px 0"><button class="btn primary" id="rsave">💾 बैंक में सेव करें</button><button class="btn" id="rpaper">📄 इनसे पेपर बनाएँ</button></div>
        ${list.map((q, i) => UI.qCard(q, { no: i + 1, actions: `<button class="btn sm" data-ed="${i}">✏️</button><button class="btn sm danger" data-rm="${i}">✕</button>` })).join('')}</div>`;
      box.querySelector('#rsave').onclick = async () => { await DB.putMany('questions', list); U.toast(`${list.length} प्रश्न सेव हुए`, 'ok'); box.innerHTML = ''; };
      box.querySelector('#rpaper').onclick = async () => {
        await DB.putMany('questions', list);
        const p = PAPER.makePaper({ title: 'AI अभ्यास पेपर · ' + new Date().toLocaleDateString('en-IN'), questions: list, durationMin: Math.max(10, list.length) });
        await DB.put('papers', p); APP.go('#/paper/' + p.id);
      };
    };
    box.onclick = async (e) => {
      const ed = e.target.closest('[data-ed]');
      if (ed) { const n = await UI.editQuestion(list[+ed.dataset.ed]); if (n) { list[+ed.dataset.ed] = n; draw(); } return; }
      const rm = e.target.closest('[data-rm]');
      if (rm) { list.splice(+rm.dataset.rm, 1); draw(); }
    };
    draw();
  }
  PAGES._showReview = showReview;

  /* ---------------- Results ---------------- */
  PAGES.results = {
    title: 'परिणाम व रैंक · Results',
    async render(v, [paperId]) {
      const papers = (await DB.all('papers')).sort((a, b) => b.createdAt - a.createdAt);
      if (!papers.length) { v.innerHTML = '<div class="card empty"><i>🏆</i>पहले एक पेपर बनाएँ, फिर OMR स्कैन या मॉक टेस्ट से परिणाम आएँगे।</div>'; return; }
      const all = await DB.all('results');
      const counts = {}; all.forEach((r) => { counts[r.paperId] = (counts[r.paperId] || 0) + 1; });
      const pid = paperId || (papers.find((p) => counts[p.id]) || papers[0]).id;
      const paper = papers.find((p) => p.id === pid) || papers[0];
      const rs = ranked(all.filter((r) => r.paperId === paper.id));
      const secs = PAPER.sections(paper);
      const avg = rs.length ? (rs.reduce((s, r) => s + r.score, 0) / rs.length).toFixed(1) : 0;
      const top = rs.length ? rs[0].score : 0;
      v.innerHTML = `<div class="card"><div class="row"><label class="f">पेपर चुनें<select id="rp">${papers.map((p) => `<option value="${p.id}" ${p.id === paper.id ? 'selected' : ''}>${esc(p.title)} (${counts[p.id] || 0})</option>`).join('')}</select></label>
          <div class="btns" style="flex:0 0 auto"><button class="btn" id="rx">⬇ Excel</button><button class="btn" id="rpdf">⬇ PDF</button><a class="btn primary" href="#/omr/scan/${paper.id}">🧾 OMR स्कैन</a></div></div></div>
        <div class="grid g4" style="margin-bottom:18px">
          <div class="stat"><b>${rs.length}</b><span>विद्यार्थी</span></div>
          <div class="stat"><b>${avg}</b><span>औसत अंक / ${paper.questions.length}</span></div>
          <div class="stat"><b>${top}</b><span>सर्वोच्च अंक</span></div>
          <div class="stat"><b>${rs.filter((r) => r.percent >= 40).length}</b><span>40% से ऊपर (क्वालिफ़ाइंग)</span></div>
        </div>
        <div class="card"><h2>🏆 मेरिट सूची <small>${esc(paper.title)}</small></h2>
        ${rs.length ? `<div class="tablewrap"><table class="t"><tr><th>रैंक</th><th>अनुक्रमांक</th><th>नाम</th>${secs.map((s) => `<th>${esc(s.label.hi)}</th>`).join('')}<th>सही</th><th>गलत</th><th>खाली</th><th>अंक</th><th>%</th><th>माध्यम</th><th></th></tr>
          ${rs.map((r) => `<tr><td><b>${r.rank}</b></td><td class="mono">${esc(r.roll || '')}</td><td>${esc(r.name || '')}</td>${secs.map((s) => `<td>${(r.bySection[s.key] || {}).correct || 0}/${(r.bySection[s.key] || {}).total || 0}</td>`).join('')}<td style="color:var(--green)">${r.correct}</td><td style="color:var(--red)">${r.wrong}</td><td>${r.blank}</td><td><b>${r.score}</b></td><td>${r.percent}%</td><td>${r.method === 'omr' ? '🧾 OMR' : '💻 Online'}</td><td><button class="btn sm" data-view="${r.id}">👁</button><button class="btn sm danger" data-del="${r.id}">🗑</button></td></tr>`).join('')}</table></div>` : '<div class="empty"><i>📭</i>इस पेपर का अभी कोई परिणाम नहीं।</div>'}
        </div>`;
      v.querySelector('#rp').onchange = (e) => APP.go('#/results/' + e.target.value);
      v.querySelector('#rx').onclick = () => resultsExcel(paper, rs);
      v.querySelector('#rpdf').onclick = (e) => resultsPdf(paper, rs, e.currentTarget);
      v.querySelector('.card:last-child').addEventListener('click', async (e) => {
        const d = e.target.closest('[data-del]');
        if (d && await U.confirm('यह परिणाम हटाएँ?')) { await DB.del('results', d.dataset.del); APP.route(); return; }
        const w = e.target.closest('[data-view]');
        if (w) {
          const r = rs.find((x) => x.id === w.dataset.view);
          const grid = paper.questions.map((q, i) => { const a = r.answers[i]; const cls = a === -1 || a == null ? 'blank' : a === q.answer ? 'ok' : 'bad'; return `<div class="${cls}"><b>${paper.startNo + i}</b> ${a >= 0 ? a + 1 : a === -2 ? '✱' : '–'} / ${q.answer + 1}</div>`; }).join('');
          U.modal(`${r.name || ''} (${r.roll || ''}) — ${r.score}/${r.total}`, `<p class="muted">दिया गया उत्तर / सही उत्तर · ✱ = एक से अधिक गोले</p><div class="ans-grid" style="max-height:60vh">${grid}</div>`, null, { wide: true });
        }
      });
    }
  };

  /* rank by score (ties share a rank) */
  function ranked(rs) {
    rs = rs.slice().sort((a, b) => b.score - a.score || (a.name || '').localeCompare(b.name || ''));
    let rank = 0, prev = null;
    rs.forEach((r, i) => { if (r.score !== prev) { rank = i + 1; prev = r.score; } r.rank = rank; });
    return rs;
  }

  function resultsExcel(paper, rs) {
    const secs = PAPER.sections(paper);
    const head = ['Rank', 'Roll No', 'Name', ...secs.map((s) => s.label.en), 'Correct', 'Wrong', 'Blank', 'Score', 'Out of', 'Percent', 'Method', 'Date'];
    const rows = rs.map((r) => [r.rank, r.roll, r.name, ...secs.map((s) => (r.bySection[s.key] || {}).correct || 0), r.correct, r.wrong, r.blank, r.score, r.total, r.percent, r.method === 'omr' ? 'OMR' : 'Online', U.fmtDate(r.createdAt)]);
    const key = [['Q No', 'Answer'], ...paper.questions.map((q, i) => [paper.startNo + i, q.answer + 1])];
    EXPORT.exportExcel(paper.title + '_Result', { 'Merit List': [head, ...rows], 'Answer Key': key });
    U.toast('Excel डाउनलोड हुई ✔', 'ok');
  }

  async function resultsPdf(paper, rs, btn) {
    const s = await EXPORT.school();
    const secs = PAPER.sections(paper);
    const avg = rs.length ? (rs.reduce((a, r) => a + r.score, 0) / rs.length).toFixed(1) : 0;
    const head = `<div class="hdr">${s.logo ? `<img src="${s.logo}">` : ''}<div><h1>${esc(s.name)}</h1><div class="sub">मेरिट सूची / Merit List — ${esc(paper.title)}</div></div></div>`;
    const summary = `<div class="meta"><span>विद्यार्थी / Students: ${rs.length}</span><span>औसत / Average: ${avg} / ${paper.questions.length}</span><span>सर्वोच्च / Top: ${rs.length ? rs[0].score : 0}</span><span>40%+ : ${rs.filter((r) => r.percent >= 40).length}</span></div>`;
    const th = `<tr><th>रैंक<br>Rank</th><th>अनुक्रमांक<br>Roll No</th><th>नाम<br>Name</th>${secs.map((x) => `<th>${esc(x.label.hi)}<br>${esc(x.label.en)}</th>`).join('')}<th>सही</th><th>गलत</th><th>खाली</th><th>अंक<br>Score</th><th>%</th></tr>`;
    const row = (r) => `<tr><td><b>${r.rank}</b></td><td>${esc(r.roll || '')}</td><td style="text-align:left;white-space:nowrap">${esc(r.name || '')}</td>${secs.map((x) => `<td>${(r.bySection[x.key] || {}).correct || 0}/${(r.bySection[x.key] || {}).total || 0}</td>`).join('')}<td>${r.correct}</td><td>${r.wrong}</td><td>${r.blank}</td><td><b>${r.score}</b>/${r.total}</td><td>${r.percent}%</td></tr>`;
    const PER = 28, pages = [];
    for (let i = 0; i < Math.max(1, rs.length); i += PER) {
      pages.push(`${i ? '' : head + summary}<table class="ml">${th}${rs.slice(i, i + PER).map(row).join('') || '<tr><td colspan="20">कोई परिणाम नहीं</td></tr>'}</table>`);
    }
    const css = 'table.ml{border-collapse:collapse;width:100%;font-size:10pt;margin-top:8px}table.ml td,table.ml th{border:1px solid #888;padding:4px 5px;text-align:center}table.ml th{background:#e8ecfa;font-size:9pt}table.ml tr:nth-child(even) td{background:#f8f9fd}';
    const old = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span> PDF…'; }
    try { await EXPORT.htmlToPdf(pages, css, paper.title + '_Merit_List'); U.toast('PDF डाउनलोड हुई ✔', 'ok'); } catch (e) { console.error(e); U.toast('PDF त्रुटि: ' + e.message, 'err'); }
    if (btn) { btn.disabled = false; btn.innerHTML = old; }
  }

  /* used by the paper page tile */
  PAGES._exportResults = async (paper, kind, btn) => {
    const rs = ranked((await DB.all('results')).filter((r) => r.paperId === paper.id));
    if (!rs.length) return U.toast('इस पेपर का अभी कोई परिणाम नहीं — पहले OMR स्कैन या मॉक टेस्ट करें', 'err');
    if (kind === 'pdf') return resultsPdf(paper, rs, btn);
    resultsExcel(paper, rs);
  };

  /* save a result for a paper (used by OMR + mock test) */
  PAGES._saveResult = async (paper, info, answers, method) => {
    const sc = PAPER.score(paper, answers);
    const r = Object.assign({ id: U.uid('res'), paperId: paper.id, paperTitle: paper.title, name: info.name || '', roll: info.roll || '', school: info.school || '', answers, method, createdAt: Date.now() }, sc);
    await DB.put('results', r);
    return r;
  };

  /* ---------------- Settings ---------------- */
  PAGES.settings = {
    title: 'सेटिंग्स · Settings',
    async render(v) {
      const s = {
        name: await DB.getSetting('schoolName', 'Basic Pathshala'), tag: await DB.getSetting('schoolTagline', ''), logo: await DB.getSetting('schoolLogo', ''),
        key: await DB.getSetting('geminiKey', ''), model: await DB.getSetting('geminiModel', AI.DEFAULT_MODEL)
      };
      v.innerHTML = `<div class="grid g2">
        <div class="card"><h2>🏫 विद्यालय / संस्था <small>पेपर, PPT, OMR पर छपेगा</small></h2>
          <label class="f">नाम / Name<input type="text" id="sn" value="${esc(s.name)}"></label>
          <label class="f" style="margin-top:10px">उप-शीर्षक / Tagline<input type="text" id="st" value="${esc(s.tag)}" placeholder="जैसे: NMMS कोचिंग, जनपद …"></label>
          <div class="btns" style="margin-top:12px"><img id="slogo" src="${s.logo || BRAND.logo}" style="width:64px;height:64px;object-fit:contain;border:1px solid var(--line);border-radius:12px;background:#fff">
            <label class="btn">🖼️ लोगो बदलें<input type="file" accept="image/*" id="sl" hidden></label><button class="btn danger sm" id="slr">Basic Pathshala लोगो</button></div>
          <div class="btns" style="margin-top:14px"><button class="btn primary" id="ssave">💾 सेव करें</button></div></div>
        <div class="card"><h2>✨ Google Gemini AI <small>PDF आयात व AI प्रश्नों के लिए</small></h2>
          <ol class="steps"><li><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> खोलें (Google account से login)</li><li>"Create API key" दबाकर key copy करें</li><li>नीचे paste करके Save करें</li></ol>
          <label class="f">API Key<input type="password" id="gk" value="${esc(s.key)}" placeholder="AIza…"></label>
          <label class="f" style="margin-top:10px">Model<input type="text" id="gm" value="${esc(s.model)}" list="gml"><datalist id="gml"><option value="gemini-2.5-flash"><option value="gemini-2.5-pro"><option value="gemini-2.5-flash-lite"></datalist><small>तेज़ के लिए flash, बेहतर गुणवत्ता के लिए pro</small></label>
          <div class="btns" style="margin-top:12px"><button class="btn primary" id="gsave">💾 सेव</button><button class="btn" id="gtest">🔌 जाँचें</button></div>
          <p class="muted" style="font-size:12.5px">Key सिर्फ़ इसी डिवाइस/ब्राउज़र में रहती है और बैकअप फ़ाइल में शामिल नहीं होती।</p></div>
      </div>
      <div class="card"><div class="btns" style="gap:18px;align-items:center"><img src="icons/logo.jpg" alt="" style="width:110px;height:110px;border-radius:16px;border:1px solid var(--line)">
        <div><h2 style="margin:0 0 4px">Basic Pathshala - NMMS</h2><div class="muted">${esc(BRAND.tagline)}</div>
        <div style="margin-top:8px">परिकल्पना एवं विकास / Concept &amp; Development: <b>Subodh Maurya</b></div>
        <div class="muted" style="font-size:12.5px;margin-top:4px">हर पेपर, PPT, OMR, Google Form, Excel और PDF रिपोर्ट के नीचे यह श्रेय अपने-आप छपता है।</div></div></div></div>
      <div class="card"><h2>💾 बैकअप व डेटा <small>Backup & restore</small></h2>
        <div class="btns"><button class="btn" id="bexp">⬇ पूरा बैकअप (.json)</button><label class="btn">⬆ बैकअप वापस लाएँ<input type="file" accept=".json,application/json" id="bimp" hidden></label>
        <button class="btn" id="reseed">🔄 UP PYQ फिर से जोड़ें</button><button class="btn danger" id="wipe">⚠ सारा डेटा मिटाएँ</button></div>
        <p class="muted" style="font-size:13px">सारा डेटा (प्रश्न, पेपर, परिणाम) इसी ब्राउज़र में सुरक्षित रहता है। समय-समय पर बैकअप लें या दूसरे कंप्यूटर पर ले जाएँ।</p></div>
      <div class="card"><h2>ℹ️ परीक्षा पैटर्न (UP NMMS)</h2>
        <table class="t"><tr><th>भाग</th><th>प्रश्न</th><th>समय</th><th>OMR क्रमांक</th></tr>
        <tr><td>भाग I — मानसिक योग्यता (MAT)</td><td>90</td><td>90 मिनट</td><td>1 – 90</td></tr>
        <tr><td>भाग II — SAT: विज्ञान 35 · सामाजिक अध्ययन 35 · गणित 20</td><td>90</td><td>90 मिनट</td><td>91 – 180</td></tr></table>
        <p class="muted" style="font-size:13px">प्रत्येक प्रश्न 1 अंक, ऋणात्मक अंकन नहीं। चयन के लिए दोनों भागों में सामान्यतः 40% (आरक्षित वर्ग 32%) अंक आवश्यक। पिछले वर्षों (2023–2025) के पेपरों में कई प्रश्न दोहराए गए हैं, इसलिए PYQ अभ्यास ज़रूरी है।</p></div>`;
      let logo = s.logo;
      v.querySelector('#sl').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; logo = await U.shrinkImage(await U.readFile(f), 300); v.querySelector('#slogo').src = logo; };
      v.querySelector('#slr').onclick = () => { logo = ''; v.querySelector('#slogo').src = BRAND.logo; };
      v.querySelector('#ssave').onclick = async () => {
        await DB.setSetting('schoolName', v.querySelector('#sn').value.trim() || 'Basic Pathshala');
        await DB.setSetting('schoolTagline', v.querySelector('#st').value.trim());
        await DB.setSetting('schoolLogo', logo);
        U.toast('सेव हो गया', 'ok');
      };
      const saveKey = async () => { await DB.setSetting('geminiKey', v.querySelector('#gk').value.trim()); await DB.setSetting('geminiModel', v.querySelector('#gm').value.trim() || AI.DEFAULT_MODEL); };
      v.querySelector('#gsave').onclick = async () => { await saveKey(); U.toast('Gemini सेटिंग सेव हुई', 'ok'); };
      v.querySelector('#gtest').onclick = async (e) => {
        await saveKey();
        e.target.innerHTML = '<span class="spin"></span> जाँच…';
        try { const r = await AI.call([{ text: 'Reply with JSON {"ok": true, "msg": "नमस्ते"}' }]); U.toast('✅ Gemini जुड़ गया: ' + (r.msg || 'OK'), 'ok'); } catch (err) { U.toast('❌ ' + err.message, 'err'); }
        e.target.innerHTML = '🔌 जाँचें';
      };
      v.querySelector('#bexp').onclick = async () => U.download('BasicPathshala_NMMS_backup_' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(await DB.exportAll()), 'application/json');
      v.querySelector('#bimp').onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        try {
          const data = JSON.parse(await U.readFile(f, 'text'));
          const merge = await U.modal('बैकअप वापस लाएँ', '<p>मौजूदा डेटा के साथ जोड़ें (merge) या उसे बदल दें (replace)?</p>', [{ label: 'Replace', value: false, cls: 'danger' }, { label: 'Merge', value: true, cls: 'primary' }]);
          if (merge === null) return;
          await DB.importAll(data, merge);
          U.toast('बैकअप लोड हुआ', 'ok'); APP.route();
        } catch (err) { U.toast('फ़ाइल सही नहीं: ' + err.message, 'err'); }
      };
      v.querySelector('#reseed').onclick = async () => {
        const base = [].concat(PYQ_UP_2023, PYQ_UP_2024, PYQ_UP_2025, SAT_BANK).map(U.normQuestion);
        await DB.putMany('questions', base); U.toast(`${base.length} प्रश्न फिर से जोड़े गए`, 'ok');
      };
      v.querySelector('#wipe').onclick = async () => {
        if (!(await U.confirm('सारे प्रश्न, पेपर और परिणाम मिट जाएँगे। पहले बैकअप ले लें। आगे बढ़ें?'))) return;
        for (const st of ['questions', 'papers', 'results']) await DB.clear(st);
        await DB.setSetting('seedVersion', 0);
        location.reload();
      };
    }
  };
})();
