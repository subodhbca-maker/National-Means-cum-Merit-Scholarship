/* Basic Pathshala - NMMS : paper generator, papers list, paper detail (print / PPT / Google Form / OMR / test) */
(function () {
  const { esc, SUBJECTS } = U;
  const PAGES = (window.PAGES = window.PAGES || {});

  PAGES.generate = {
    title: 'पेपर बनाएँ · Generate Paper',
    async render(v, [preset]) {
      const pk = PAPER.PATTERNS[preset] ? preset : 'UP_FULL';
      const bank = await DB.all('questions');
      const avail = (s, d) => bank.filter((q) => q.subject === s && q.difficulty === d && q.answer >= 0).length;
      v.innerHTML = `<div class="grid g2">
        <div class="card"><h2>1️⃣ पैटर्न चुनें <small>Pattern</small></h2>
          ${UI.seg('pat', [['UP_FULL', 'पूर्ण (MAT+SAT) · 180'], ['UP_MAT', 'MAT · 90'], ['UP_SAT', 'SAT · 90'], ['CUSTOM', 'कस्टम']], pk)}
          <div id="custom" class="hide" style="margin-top:14px">
            <div class="sub">हर विषय के लिए प्रश्नों की संख्या</div>
            <div class="row">${['mat', 'science', 'sst', 'maths'].map((s) => `<label class="f">${SUBJECTS[s].hi}<input type="number" min="0" max="180" data-cnt="${s}" value="${s === 'mat' ? 20 : 10}"></label>`).join('')}</div>
            <div class="row" style="margin-top:10px"><label class="f">समय (मिनट)<input type="number" id="dur" value="45"></label><label class="f">पहला प्रश्न क्रमांक<input type="number" id="sno" value="1" min="1"><small>OMR पर इसी नंबर से भरेंगे</small></label></div>
          </div>
          <label class="f" style="margin-top:14px">पेपर का नाम / Title<input type="text" id="ttl" placeholder="जैसे: NMMS मॉडल पेपर – 1"></label>
          <div style="margin-top:14px"><div class="sub" style="margin:0 0 6px">भाषा / Language</div>${UI.seg('lang', UI.LANGS, 'bi')}</div>
        </div>
        <div class="card"><h2>2️⃣ कठिनाई अनुपात <small>Difficulty mix</small></h2>
          <div class="row"><label class="f">सरल %<input type="number" id="re" value="40"></label><label class="f">मध्यम %<input type="number" id="rm" value="40"></label><label class="f">कठिन %<input type="number" id="rh" value="20"></label></div>
          <label class="f" style="margin-top:14px">MAT व गणित में नए (generated) प्रश्नों का हिस्सा: <b id="mixv">50%</b><input type="range" id="mix" min="0" max="100" value="50" step="10"><small>बाकी प्रश्न बैंक (PYQ सहित) से आएँगे</small></label>
          <label class="check" style="margin-top:12px"><input type="checkbox" id="pyq" checked> UP पिछले वर्षों (PYQ) के प्रश्न शामिल करें</label>
          <div class="note blue" style="margin:14px 0 0;font-size:13px">बैंक में उपलब्ध (सरल/मध्यम/कठिन): ${['science', 'sst', 'maths', 'mat'].map((s) => `<b>${SUBJECTS[s].hi}</b> ${avail(s, 'easy')}/${avail(s, 'moderate')}/${avail(s, 'hard')}`).join(' · ')}</div>
        </div></div>
        <div class="btns" style="justify-content:center;margin:6px 0 20px"><button class="btn saff lg" id="go">⚡ पेपर बनाएँ / Generate</button></div>`;
      const showCustom = (p) => v.querySelector('#custom').classList.toggle('hide', p !== 'CUSTOM');
      UI.bindSeg(v, 'pat', showCustom); showCustom(pk);
      v.querySelector('#mix').oninput = (e) => { v.querySelector('#mixv').textContent = e.target.value + '%'; };
      v.querySelector('#go').onclick = async () => {
        const pat = UI.segVal(v, 'pat');
        const ratio = { easy: +v.querySelector('#re').value || 0, moderate: +v.querySelector('#rm').value || 0, hard: +v.querySelector('#rh').value || 0 };
        if (ratio.easy + ratio.moderate + ratio.hard !== 100) return U.toast('तीनों प्रतिशत का योग 100 होना चाहिए', 'err');
        const cfg = { patternKey: pat === 'CUSTOM' ? null : pat, title: v.querySelector('#ttl').value.trim(), lang: UI.segVal(v, 'lang'), ratio, mixGenerated: +v.querySelector('#mix').value / 100, includePyq: v.querySelector('#pyq').checked };
        if (pat === 'CUSTOM') {
          cfg.sections = U.$$('[data-cnt]', v).map((i) => ({ subject: i.dataset.cnt, count: Math.max(0, +i.value || 0) })).filter((s) => s.count > 0);
          if (!cfg.sections.length) return U.toast('कम से कम एक विषय में प्रश्न संख्या दें', 'err');
          cfg.durationMin = +v.querySelector('#dur').value || 45;
          cfg.startNo = Math.max(1, +v.querySelector('#sno').value || 1);
          cfg.title = cfg.title || 'NMMS अभ्यास पेपर';
        }
        const btn = v.querySelector('#go'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span> बन रहा है…';
        try {
          const { paper, warnings } = await PAPER.generate(cfg);
          if (warnings.length) sessionStorage.setItem('bp_warn_' + paper.id, JSON.stringify(warnings));
          U.toast('पेपर तैयार ✔', 'ok');
          APP.go('#/paper/' + paper.id);
        } catch (e) { U.toast(e.message, 'err'); btn.disabled = false; btn.innerHTML = '⚡ पेपर बनाएँ / Generate'; }
      };
    }
  };

  PAGES.papers = {
    title: 'मेरे पेपर · Papers',
    async render(v) {
      document.getElementById('topRight').innerHTML = '<label class="btn">⬆ पेपर फ़ाइल खोलें<input type="file" accept=".json,.nmms" id="pimp" hidden></label> <a class="btn primary" href="#/generate">⚡ नया पेपर</a>';
      document.getElementById('pimp').onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        try {
          const d = JSON.parse(await U.readFile(f, 'text'));
          const p = PAPER.makePaper(Object.assign({}, d.paper || d, { id: U.uid('paper') }));
          await DB.put('papers', p); U.toast('पेपर जोड़ा गया', 'ok'); APP.go('#/paper/' + p.id);
        } catch (err) { U.toast('फ़ाइल सही नहीं', 'err'); }
      };
      const papers = (await DB.all('papers')).sort((a, b) => b.createdAt - a.createdAt);
      const results = await DB.all('results');
      if (!papers.length) { v.innerHTML = '<div class="card empty"><i>📄</i>अभी कोई पेपर नहीं।<br><br><a class="btn primary" href="#/generate">⚡ पहला पेपर बनाएँ</a> <a class="btn" href="#/import">📥 PDF से बनाएँ</a></div>'; return; }
      v.innerHTML = `<div class="grid g3">${papers.map((p) => {
        const s = PAPER.stats(p.questions);
        const n = results.filter((r) => r.paperId === p.id).length;
        return `<div class="card" style="margin:0;display:flex;flex-direction:column;gap:8px"><div class="btns" style="justify-content:space-between"><span class="badge">${esc(p.kind)}</span><span class="muted" style="font-size:12px">${U.fmtDate(p.createdAt)}</span></div>
          <b style="font-size:15.5px">${esc(p.title)}</b>
          <div class="muted" style="font-size:13px">${s.total} प्रश्न · ${p.durationMin} मिनट · ${n} परिणाम</div>${UI.distBar(s)}
          <div class="btns" style="margin-top:auto"><a class="btn primary sm" href="#/paper/${p.id}">खोलें</a><a class="btn sm" href="#/test/${p.id}">⏱ टेस्ट</a><a class="btn sm" href="#/results/${p.id}">🏆</a></div></div>`;
      }).join('')}</div>`;
    }
  };

  /* --------- paper detail --------- */
  PAGES.paper = {
    title: 'पेपर · Paper', nav: 'papers',
    async render(v, [id]) {
      let paper = await DB.get('papers', id);
      if (!paper) { v.innerHTML = '<div class="card empty">पेपर नहीं मिला</div>'; return; }
      let lang = paper.lang || 'bi';
      const warn = JSON.parse(sessionStorage.getItem('bp_warn_' + id) || '[]');
      const save = async () => { await DB.put('papers', paper); };
      const draw = () => {
        const st = PAPER.stats(paper.questions);
        const secs = PAPER.sections(paper);
        const noKey = paper.questions.filter((q) => q.answer < 0).length;
        v.innerHTML = `${warn.length ? `<div class="note">${warn.map(esc).join('<br>')}</div>` : ''}
          ${noKey ? `<div class="note">⚠ ${noKey} प्रश्नों का सही उत्तर सेट नहीं है — ✏️ से सुधारें, वरना Form/OMR में गलत अंक आएँगे।</div>` : ''}
          <div class="card"><div class="btns" style="justify-content:space-between;align-items:flex-start">
            <div style="flex:1;min-width:240px"><h2 style="margin-bottom:4px" id="ptitle">${esc(paper.title)} <button class="btn sm ghost" id="ren">✏️</button></h2>
              <div class="muted">${st.total} प्रश्न · ${paper.durationMin} मिनट · प्रश्न क्रमांक ${paper.startNo}–${paper.startNo + st.total - 1} · ${secs.map((s) => esc(s.label.hi) + ' ' + (s.to - s.from + 1)).join(' · ')}</div>
              <div style="margin-top:10px;max-width:520px">${UI.distBar(st)}</div></div>
            <div>${UI.seg('lang', UI.LANGS, lang)}</div></div></div>
          <div class="card"><h2>📤 निर्यात व उपयोग <small>Export & use</small></h2>
            <div class="quick">
              <a href="javascript:void 0" data-act="print"><i>🖨️</i><b>प्रश्न पत्र (PDF)</b><span>UP बुकलेट जैसा, Hindi | English</span></a>
              <a href="javascript:void 0" data-act="printkey"><i>🔑</i><b>पेपर + उत्तर कुंजी</b><span>हल/व्याख्या सहित</span></a>
              <a href="javascript:void 0" data-act="ppt"><i>📊</i><b>PowerPoint (PPT)</b><span>हर प्रश्न + उत्तर स्लाइड</span></a>
              <a href="javascript:void 0" data-act="gform"><i>📝</i><b>Google Form (Quiz)</b><span>Auto-grading, answer key सहित</span></a>
              <a href="javascript:void 0" data-act="omr"><i>🧾</i><b>OMR शीट प्रिंट</b><span>UP NMMS जैसा 180 प्रश्न</span></a>
              <a href="#/omr/scan/${paper.id}"><i>📷</i><b>OMR स्कैन करें</b><span>मोबाइल फ़ोटो से अंक</span></a>
              <a href="#/test/${paper.id}"><i>⏱️</i><b>ऑनलाइन मॉक टेस्ट</b><span>टाइमर व तुरंत परिणाम</span></a>
              <a href="#/results/${paper.id}"><i>🏆</i><b>परिणाम / रैंक</b><span>Excel export</span></a>
              <a href="javascript:void 0" data-act="share"><i>📦</i><b>पेपर फ़ाइल</b><span>दूसरे डिवाइस पर टेस्ट हेतु</span></a>
            </div>
            <div class="btns" style="margin-top:14px"><button class="btn sm" data-act="shuffle">🔀 प्रश्न क्रम बदलें</button><button class="btn sm" data-act="dup">📑 कॉपी बनाएँ</button><button class="btn sm danger" data-act="del">🗑 पेपर हटाएँ</button></div></div>
          <div id="qlist">${secs.map((s) => `<h3 style="margin:18px 4px 8px">${esc(s.label.hi)} · ${esc(s.label.en)} <span class="muted" style="font-weight:500;font-size:14px">(Q${paper.startNo + s.from}–Q${paper.startNo + s.to})</span></h3>` +
            paper.questions.slice(s.from, s.to + 1).map((q, k) => UI.qCard(q, { no: paper.startNo + s.from + k, lang, actions: `<button class="btn sm" title="बदलें" data-swap="${s.from + k}">🔁</button><button class="btn sm" title="संपादित" data-ed="${s.from + k}">✏️</button>` })).join('')).join('')}</div>`;
        UI.bindSeg(v, 'lang', (l) => { lang = l; paper.lang = l; save(); draw(); });
        v.querySelector('#ren').onclick = async () => {
          const t = await U.modal('नाम बदलें', `<input type="text" id="nt" value="${esc(paper.title)}">`, [{ label: 'Cancel', value: null }, { label: 'Save', cls: 'primary', value: 'ok', onClick: (w) => { PAGES.paper._t = w.querySelector('#nt').value.trim(); } }]);
          if (t && PAGES.paper._t) { paper.title = PAGES.paper._t; await save(); draw(); }
        };
      };
      v.addEventListener('click', async (e) => {
        const a = e.target.closest('[data-act]');
        if (a) {
          const act = a.dataset.act;
          if (act === 'print') EXPORT.printPaper(paper, { lang });
          if (act === 'printkey') EXPORT.printPaper(paper, { lang, withKey: true, withExplanation: true });
          if (act === 'ppt') pptDialog(paper, lang);
          if (act === 'gform') gformDialog(paper, lang);
          if (act === 'omr') OMR.printSheets({ title: paper.title, copies: 1 });
          if (act === 'share') U.download(U.safeName(paper.title) + '.nmms.json', JSON.stringify({ app: 'Basic Pathshala - NMMS', paper }), 'application/json');
          if (act === 'shuffle') {
            const secs = PAPER.sections(paper);
            paper.questions = secs.flatMap((s) => U.shuffle(paper.questions.slice(s.from, s.to + 1)));
            await save(); draw(); U.toast('हर खंड के अंदर क्रम बदला गया');
          }
          if (act === 'dup') { const c = PAPER.makePaper(Object.assign({}, paper, { id: null, title: paper.title + ' (कॉपी)', createdAt: null })); await DB.put('papers', c); APP.go('#/paper/' + c.id); }
          if (act === 'del' && await U.confirm('यह पेपर हटाएँ? (परिणाम सुरक्षित रहेंगे)')) { await DB.del('papers', paper.id); APP.go('#/papers'); }
          return;
        }
        const ed = e.target.closest('[data-ed]');
        if (ed) {
          const i = +ed.dataset.ed;
          const n = await UI.editQuestion(paper.questions[i]);
          if (n) { n.section = paper.questions[i].section; paper.questions[i] = n; await save(); await DB.put('questions', Object.assign({}, n, { section: undefined })); draw(); }
          return;
        }
        const sw = e.target.closest('[data-swap]');
        if (sw) {
          const i = +sw.dataset.swap, old = paper.questions[i];
          const used = new Set(paper.questions.map((q) => q.id));
          const bank = await DB.all('questions');
          let pool = bank.filter((q) => q.subject === old.subject && q.difficulty === old.difficulty && q.answer >= 0 && !used.has(q.id));
          let nq = pool.length ? U.pick(pool) : (old.subject === 'mat' || old.subject === 'maths' ? GEN.one(old.subject, old.difficulty) : null);
          if (!nq) return U.toast('इस स्तर का दूसरा प्रश्न बैंक में नहीं है', 'err');
          paper.questions[i] = Object.assign({}, nq, { section: old.section });
          await save(); draw(); U.toast('प्रश्न बदला गया (उसी कठिनाई का)');
        }
      });
      draw();
    }
  };

  async function pptDialog(paper, lang) {
    const r = await U.modal('PowerPoint बनाएँ', `<p>हर प्रश्न की एक स्लाइड बनेगी (4 विकल्प, बड़े अक्षर)। उत्तर-स्लाइड में सही विकल्प हरा दिखेगा और व्याख्या भी होगी।</p>
      <label class="check"><input type="checkbox" id="pa" checked> हर प्रश्न के बाद उत्तर-स्लाइड जोड़ें</label>
      <div style="margin-top:10px">${UI.seg('pl', UI.LANGS, lang)}</div>`, [{ label: 'रद्द', value: null }, { label: '📊 PPT डाउनलोड', cls: 'primary', value: 'go', onClick: (w) => { pptDialog._o = { answerSlides: w.querySelector('#pa').checked, lang: UI.segVal(w, 'pl') }; } }],
    { onOpen: (w) => UI.bindSeg(w, 'pl', () => {}) });
    if (r !== 'go') return;
    U.toast('PPT बन रहा है…');
    try { await EXPORT.makePPT(paper, pptDialog._o); U.toast('PPT डाउनलोड हुआ ✔', 'ok'); } catch (e) { console.error(e); U.toast('PPT त्रुटि: ' + e.message, 'err'); }
  }

  async function gformDialog(paper, lang) {
    let code = EXPORT.gformScript(paper, { lang });
    const big = paper.questions.some((q) => q.image);
    await U.modal('Google Form (Quiz) बनाएँ', `<ol class="steps">
        <li><a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener"><b>script.google.com</b></a> खोलें → <b>New project</b> (Google account से login)</li>
        <li>वहाँ पहले से लिखा code मिटाकर नीचे का पूरा code <b>Paste</b> करें (या .gs फ़ाइल डाउनलोड करके उसकी सामग्री)</li>
        <li>💾 Save करें → ऊपर function <b>createNmmsForm</b> चुनकर <b>▶ Run</b> दबाएँ</li>
        <li>पहली बार "Review permissions" → अपना account → Advanced → Allow</li>
        <li>नीचे <b>Execution log</b> में Form का link आएगा। विद्यार्थियों को भेजें, अंक अपने-आप लगेंगे।</li></ol>
      <div style="margin:8px 0">${UI.seg('gl', UI.LANGS, lang)} <label class="check" style="margin-left:10px"><input type="checkbox" id="gsh"> प्रश्न क्रम shuffle करें</label></div>
      ${big ? '<div class="note">इस पेपर में चित्र हैं, इसलिए code बड़ा है। Paste के बाद Save ज़रूर करें।</div>' : ''}
      <pre class="code" id="gcode">${esc(code.slice(0, 4000))}${code.length > 4000 ? '\n… (' + Math.round(code.length / 1024) + ' KB — पूरा code copy/download करें)' : ''}</pre>`,
    [{ label: '⬇ .gs फ़ाइल', value: null, onClick: () => { U.download(U.safeName(paper.title) + '_GoogleForm.gs', code, 'text/plain'); return false; } },
      { label: '📋 Code Copy करें', cls: 'primary', value: null, onClick: () => { copy(code); return false; } }],
    { wide: true, onOpen: (w) => {
      const regen = () => { code = EXPORT.gformScript(paper, { lang: UI.segVal(w, 'gl'), shuffle: w.querySelector('#gsh').checked }); w.querySelector('#gcode').textContent = code.slice(0, 4000) + (code.length > 4000 ? '\n…' : ''); };
      UI.bindSeg(w, 'gl', regen); w.querySelector('#gsh').onchange = regen;
    } });
  }

  function copy(text) {
    const done = () => U.toast('Code copy हो गया ✔ अब script.google.com में paste करें', 'ok');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); }
  }
  PAGES._copy = copy;
})();
