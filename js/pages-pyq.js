/* Basic Pathshala - NMMS : previous-year UP NMMS papers, rebuilt as fresh booklets (not scans) */
(function () {
  const { esc } = U;
  const PAGES = (window.PAGES = window.PAGES || {});

  const YEARS = [
    { year: 2027, held: '1 नवम्बर 2026', heldEn: '1 November 2026', data: () => window.PYQ_UP_2027 },
    { year: 2025, held: '2024–25 सत्र', heldEn: 'session 2024–25', data: () => window.PYQ_UP_2025 },
    { year: 2024, held: '2023–24 सत्र', heldEn: 'session 2023–24', data: () => window.PYQ_UP_2024 },
    { year: 2023, held: '2022–23 सत्र', heldEn: 'session 2022–23', data: () => window.PYQ_UP_2023 }
  ];
  const noOf = (q) => +((/Q(\d+)$/.exec(q.topic || '') || [])[1] || 0);

  /* all questions of one year in booklet order (text, figure and extra sets together) */
  function questionsOf(y) {
    const all = [].concat(y.data() || [], window.PYQ_FIGURES || [], window.PYQ_EXTRA || []).filter((q) => q.year === y.year);
    const seen = new Set();
    return all.filter((q) => (seen.has(q.id) ? false : seen.add(q.id))).sort((a, b) => noOf(a) - noOf(b));
  }

  /* the paper record for a year; rebuilt from the data each time so corrections reach it, id stays the same for results */
  async function paperOf(y) {
    const id = 'pyqpaper_' + y.year;
    const old = await DB.get('papers', id);
    const paper = PAPER.makePaper({
      id, kind: 'PYQ', lang: old ? old.lang : 'bi', startNo: 1, durationMin: 180, createdAt: old ? old.createdAt : Date.now(),
      title: `UP NMMS ${y.year} · मूल प्रश्न पत्र`,
      questions: questionsOf(y).map((q) => Object.assign({}, q, { section: q.subject }))
    });
    await DB.put('papers', paper);
    return paper;
  }
  PAGES._pyqPaper = async (year) => paperOf(YEARS.find((y) => y.year === year));

  PAGES.pyq = {
    title: 'पिछले वर्ष के प्रश्न पत्र · Previous Year Papers',
    async render(v) {
      const rows = YEARS.map((y) => {
        const qs = questionsOf(y), fig = qs.filter((q) => q.figure).length, noKey = qs.filter((q) => q.answer < 0).length;
        return `<div class="card" style="margin:0;display:flex;flex-direction:column;gap:10px">
          <div class="btns" style="justify-content:space-between"><span class="badge">UP NMMS</span><span class="muted" style="font-size:12px">${esc(y.held)}</span></div>
          <b style="font-size:20px">NMMS ${y.year}</b>
          <div class="muted" style="font-size:13px">${qs.length} / 180 प्रश्न · ${fig} चित्र वाले${noKey ? ` · ${noKey} त्रुटिपूर्ण/विवादित (उत्तर कुंजी में ✱)` : ''}<br>MAT ${qs.filter((q) => q.subject === 'mat').length} · विज्ञान ${qs.filter((q) => q.subject === 'science').length} · सामाजिक ${qs.filter((q) => q.subject === 'sst').length} · गणित ${qs.filter((q) => q.subject === 'maths').length}</div>
          <div class="btns" style="margin-top:auto">
            <button class="btn primary sm" data-y="${y.year}" data-a="book">🖨️ प्रश्न पुस्तिका</button>
            <button class="btn sm" data-y="${y.year}" data-a="key">🔑 उत्तर कुंजी + हल</button>
            <button class="btn sm" data-y="${y.year}" data-a="test">⏱ ऑनलाइन टेस्ट</button>
            <button class="btn sm" data-y="${y.year}" data-a="open">📄 खोलें (PPT · Form · OMR)</button>
          </div></div>`;
      }).join('');
      v.innerHTML = `<div class="note blue">UP NMMS के पिछले वर्षों के मूल प्रश्न पत्र, नए सिरे से टाइप और चित्र दोबारा बनाकर — स्कैन कॉपी नहीं। हर पेज पर Basic Pathshala की ब्रांडिंग और ऐप का QR कोड छपता है। उत्तर हर प्रश्न को हल करके डाले गए हैं (पुस्तिकाओं में आधिकारिक कुंजी नहीं थी)।</div>
        <div class="grid g2">${rows}</div>`;
      v.onclick = async (e) => {
        const b = e.target.closest('[data-a]');
        if (!b) return;
        const y = YEARS.find((x) => x.year === +b.dataset.y);
        const paper = await paperOf(y);
        if (b.dataset.a === 'book') EXPORT.printPaper(paper, { lang: paper.lang });
        else if (b.dataset.a === 'key') EXPORT.printPaper(paper, { lang: paper.lang, keyOnly: true, withExplanation: true });
        else if (b.dataset.a === 'test') APP.go('#/test/' + paper.id);
        else APP.go('#/paper/' + paper.id);
      };
    }
  };
})();
