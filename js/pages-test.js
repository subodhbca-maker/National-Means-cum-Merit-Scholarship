/* Basic Pathshala - NMMS : online mock test with timer, palette and instant result */
(function () {
  const { esc } = U;
  const PAGES = (window.PAGES = window.PAGES || {});

  PAGES.tests = {
    title: 'मॉक टेस्ट · Mock Test',
    async render(v) {
      const papers = (await DB.all('papers')).sort((a, b) => b.createdAt - a.createdAt);
      v.innerHTML = `<div class="note blue">विद्यार्थी इसी कंप्यूटर/मोबाइल पर टेस्ट दे सकते हैं। दूसरे डिवाइस के लिए पेपर पेज से "📦 पेपर फ़ाइल" डाउनलोड करके वहाँ "मेरे पेपर → पेपर फ़ाइल खोलें" से लोड करें, या Google Form भेजें।</div>
        ${papers.length ? `<div class="grid g3">${papers.map((p) => `<div class="card" style="margin:0"><b>${esc(p.title)}</b><div class="muted" style="font-size:13px;margin:4px 0 10px">${p.questions.length} प्रश्न · ${p.durationMin} मिनट</div><a class="btn primary" href="#/test/${p.id}">▶ टेस्ट शुरू करें</a></div>`).join('')}</div>`
          : '<div class="card empty"><i>⏱️</i>पहले एक पेपर बनाएँ।<br><br><a class="btn primary" href="#/generate">⚡ पेपर बनाएँ</a></div>'}`;
    }
  };

  let timerId = null;
  PAGES.test = {
    title: 'मॉक टेस्ट', nav: 'tests',
    leave() { clearInterval(timerId); window.onbeforeunload = null; },
    async render(v, [id]) {
      const paper = await DB.get('papers', id);
      if (!paper) { v.innerHTML = '<div class="card empty">पेपर नहीं मिला</div>'; return; }
      let lang = paper.lang || 'bi';
      v.innerHTML = `<div class="card" style="max-width:640px;margin:0 auto"><h2>⏱️ ${esc(paper.title)}</h2>
        <div class="muted">${paper.questions.length} प्रश्न · ${paper.durationMin} मिनट · प्रत्येक प्रश्न 1 अंक · ऋणात्मक अंकन नहीं</div>
        <div class="row" style="margin-top:14px"><label class="f">विद्यार्थी का नाम *<input type="text" id="tn"></label><label class="f">अनुक्रमांक<input type="text" id="tr"></label></div>
        <div style="margin-top:12px">${UI.seg('tl', UI.LANGS, lang)}</div>
        <ul class="muted" style="font-size:13.5px"><li>किसी भी प्रश्न पर जाने के लिए दाईं ओर के नंबर दबाएँ।</li><li>"बाद में देखें" से प्रश्न बैंगनी हो जाता है।</li><li>समय पूरा होते ही टेस्ट अपने-आप जमा हो जाएगा।</li></ul>
        <button class="btn saff lg" id="start">▶ टेस्ट शुरू करें</button></div>`;
      UI.bindSeg(v, 'tl', (l) => { lang = l; });
      v.querySelector('#start').onclick = () => {
        const name = v.querySelector('#tn').value.trim();
        if (!name) return U.toast('नाम लिखें', 'err');
        run(v, paper, { name, roll: v.querySelector('#tr').value.trim() }, lang);
      };
    }
  };

  function run(v, paper, info, lang) {
    const n = paper.questions.length;
    const ans = new Array(n).fill(-1), marked = new Array(n).fill(false);
    let cur = 0;
    const end = Date.now() + paper.durationMin * 60000;
    window.onbeforeunload = () => 'टेस्ट चल रहा है';
    v.innerHTML = `<div class="test-wrap"><div class="card test-q" id="qbox"></div>
      <div><div class="card"><div class="btns" style="justify-content:space-between"><span class="muted">शेष समय</span><span class="timer" id="tm"></span></div>
        <div class="muted" style="font-size:12.5px;margin:6px 0">${esc(info.name)} · <span id="cnt"></span></div>
        <div class="palette" id="pal"></div>
        <div class="legend"><span>🟩 उत्तर दिया</span><span>🟪 बाद में देखें</span><span>⬜ बाकी</span></div>
        <button class="btn green lg" id="sub" style="width:100%;justify-content:center;margin-top:12px">✔ टेस्ट जमा करें</button></div></div></div>`;
    const qbox = v.querySelector('#qbox'), pal = v.querySelector('#pal');
    const secs = PAPER.sections(paper);
    const drawQ = () => {
      const q = paper.questions[cur];
      const sec = secs.find((s) => cur >= s.from && cur <= s.to);
      qbox.innerHTML = `<div class="btns" style="justify-content:space-between;margin-bottom:10px"><b style="color:var(--navy)">प्रश्न ${paper.startNo + cur} / ${paper.startNo + n - 1}</b><span class="badge">${esc(sec.label.hi)}</span></div>
        <div class="qtext">${UI.biHtml(q.q, lang)}</div>${q.figure ? `<img class="tfig" src="${FIG.src(q.figure)}">` : ''}${q.image ? `<img src="${q.image}" style="max-height:260px;margin-top:10px;border-radius:8px">` : ''}
        ${q.options.map((o, k) => `<button class="test-opt ${ans[cur] === k ? 'on' : ''}" data-k="${k}"><span class="n">${k + 1}</span><span>${UI.biHtml(o, lang)}</span></button>`).join('')}
        <div class="btns" style="margin-top:14px"><button class="btn" id="prev" ${cur === 0 ? 'disabled' : ''}>‹ पिछला</button><button class="btn" id="mk">${marked[cur] ? '★ चिह्न हटाएँ' : '☆ बाद में देखें'}</button><button class="btn" id="clr">उत्तर हटाएँ</button><button class="btn primary" id="next" ${cur === n - 1 ? 'disabled' : ''}>अगला ›</button></div>`;
      drawPal();
    };
    const drawPal = () => {
      pal.innerHTML = paper.questions.map((_, i) => `<button class="${ans[i] >= 0 ? 'ans' : ''} ${marked[i] ? 'mark' : ''} ${i === cur ? 'cur' : ''}" data-g="${i}">${paper.startNo + i}</button>`).join('');
      v.querySelector('#cnt').textContent = `${ans.filter((a) => a >= 0).length}/${n} उत्तर दिए`;
    };
    qbox.onclick = (e) => {
      const o = e.target.closest('[data-k]');
      if (o) { ans[cur] = +o.dataset.k; drawQ(); return; }
      if (e.target.id === 'prev' && cur > 0) { cur--; drawQ(); }
      if (e.target.id === 'next' && cur < n - 1) { cur++; drawQ(); }
      if (e.target.id === 'mk') { marked[cur] = !marked[cur]; drawQ(); }
      if (e.target.id === 'clr') { ans[cur] = -1; drawQ(); }
    };
    pal.onclick = (e) => { const b = e.target.closest('[data-g]'); if (b) { cur = +b.dataset.g; drawQ(); } };
    document.onkeydown = (e) => {
      if (!document.body.contains(qbox)) { document.onkeydown = null; return; }
      if (e.target.tagName === 'INPUT') return;
      if (e.key >= '1' && e.key <= '4') { ans[cur] = +e.key - 1; drawQ(); }
      if (e.key === 'ArrowRight' && cur < n - 1) { cur++; drawQ(); }
      if (e.key === 'ArrowLeft' && cur > 0) { cur--; drawQ(); }
    };
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      const el = v.querySelector('#tm');
      if (!el) { clearInterval(timerId); return; }
      el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      el.classList.toggle('low', left < 5 * 60000);
      if (!left) { U.toast('समय समाप्त — टेस्ट जमा हो गया'); finish(); }
    };
    const finish = async () => {
      clearInterval(timerId); window.onbeforeunload = null; document.onkeydown = null;
      const r = await PAGES._saveResult(paper, info, ans.slice(), 'online');
      showResult(v, paper, r, lang);
    };
    v.querySelector('#sub').onclick = async () => {
      const left = ans.filter((a) => a < 0).length;
      if (await U.modal('टेस्ट जमा करें?', `<p>${left ? `${left} प्रश्न अभी बाकी हैं। ` : ''}क्या आप टेस्ट जमा करना चाहते हैं?</p>`, [{ label: 'वापस', value: false }, { label: 'जमा करें', value: true, cls: 'green' }])) finish();
    };
    clearInterval(timerId);
    timerId = setInterval(tick, 1000); tick();
    drawQ();
  }

  function showResult(v, paper, r, lang) {
    const secs = PAPER.sections(paper);
    v.innerHTML = `<div class="hero"><h2>🎉 ${esc(r.name)}, आपका परिणाम</h2><p style="font-size:30px;font-weight:800;margin:0">${r.score} / ${r.total} <span style="font-size:18px;font-weight:600">(${r.percent}%)</span></p>
        <p style="margin-top:6px">सही ${r.correct} · गलत ${r.wrong} · छोड़े ${r.blank} · ${r.percent >= 40 ? '✅ क्वालिफ़ाइंग अंक (40%) से ऊपर' : '📈 और अभ्यास करें, 40% क्वालिफ़ाइंग है'}</p>
        <div class="btns"><a class="btn" href="#/results/${paper.id}">🏆 रैंक सूची</a><a class="btn" href="#/test/${paper.id}">🔁 अगला विद्यार्थी</a></div></div>
      <div class="grid g4" style="margin-bottom:18px">${secs.map((s) => { const b = r.bySection[s.key] || { correct: 0, total: 0 }; return `<div class="stat"><b>${b.correct}/${b.total}</b><span>${esc(s.label.hi)}</span></div>`; }).join('')}</div>
      <div class="card"><h2>📖 उत्तरों की समीक्षा</h2>${paper.questions.map((q, i) => {
        const a = r.answers[i];
        return `<div class="qcard"><div class="qh"><span class="no">Q${paper.startNo + i}</span>${UI.badges(q)}<span class="sp"></span>${a < 0 ? '<span class="badge">छोड़ा</span>' : a === q.answer ? '<span class="badge b-easy">✔ सही</span>' : '<span class="badge b-hard">✘ गलत</span>'}</div>
          <div class="qt">${UI.biHtml(q.q, lang)}</div>${q.figure ? `<img class="qfig" src="${FIG.src(q.figure)}">` : ''}${q.image ? `<img class="qimg" src="${q.image}">` : ''}
          <div class="opts">${q.options.map((o, k) => `<div class="${k === q.answer ? 'ok' : ''}" style="${k === a && a !== q.answer ? 'background:#fde8ec;color:#a52929' : ''}"><b>${k + 1})</b> ${UI.biHtml(o, lang)}</div>`).join('')}</div>
          ${U.txt(q.explanation, lang === 'en' ? 'en' : 'hi') ? `<div class="ex">💡 ${esc(U.txt(q.explanation, lang === 'en' ? 'en' : 'hi'))}</div>` : ''}</div>`;
      }).join('')}</div>`;
    window.scrollTo(0, 0);
  }
})();
