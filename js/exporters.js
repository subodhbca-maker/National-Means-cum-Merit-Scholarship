/* Basic Pathshala - NMMS : printable paper/answer key, PowerPoint, Google Form (Apps Script), Excel */
(function () {
  const { esc, txt, txtLines } = U;
  const OPT_NUM = ['1', '2', '3', '4'];

  async function school() {
    return {
      name: await DB.getSetting('schoolName', 'Basic Pathshala'),
      logo: (await DB.getSetting('schoolLogo', '')) || BRAND.logo,
      tagline: await DB.getSetting('schoolTagline', '')
    };
  }

  /* bottom-of-page credit used on every document */
  function footHtml(right) {
    return `<div class="foot"><span><img src="${BRAND.logo}" alt="">${esc(BRAND.footer)}</span><span>${esc(right || '')}</span></div>`;
  }

  /* a table whose repeating <tfoot> keeps page content clear of the fixed footer on every printed page */
  function pageWrap(body) {
    return `<table class="pgwrap"><tbody><tr><td>${body}</td></tr></tbody><tfoot><tr><td><div class="footspace"></div></td></tr></tfoot></table>`;
  }

  /* ---------------- printable booklet ---------------- */
  const PRINT_CSS = `
    @page { size: A4; margin: 12mm 11mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Segoe UI', Arial, sans-serif; color: #111; font-size: 11.5pt; margin: 0; line-height: 1.35; }
    .hdr { display: flex; align-items: center; gap: 14px; border-bottom: 2.5px solid #1e2a78; padding-bottom: 8px; margin-bottom: 8px; }
    .hdr img { width: 62px; height: 62px; object-fit: contain; }
    .hdr h1 { font-size: 18pt; margin: 0; color: #1e2a78; }
    .hdr .sub { font-size: 10pt; color: #444; }
    .meta { display: flex; justify-content: space-between; font-weight: 600; margin: 6px 0; font-size: 10.5pt; }
    .title { text-align: center; font-size: 14pt; font-weight: 700; margin: 6px 0 2px; }
    .inst { border: 1px solid #999; padding: 6px 10px; font-size: 9.5pt; margin: 6px 0 10px; }
    .inst ol { margin: 2px 0 0 18px; padding: 0; }
    .sec { background: #1e2a78; color: #fff; padding: 4px 10px; font-weight: 700; margin: 12px 0 6px; break-after: avoid; }
    .q { break-inside: avoid; padding: 5px 0 6px; border-bottom: 1px dotted #ccc; }
    .bi { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
    .bi > div + div { border-left: 1px solid #bbb; padding-left: 12px; }
    .qt { white-space: pre-wrap; }
    .psg { border: 1px solid #999; background: #f6f7fb; padding: 6px 10px; margin: 8px 0 4px; font-size: 10pt; white-space: pre-wrap; break-inside: avoid; }
    .qn { font-weight: 700; }
    .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 10px; margin-top: 3px; font-size: 10.5pt; }
    .opts.long { grid-template-columns: 1fr; }
    .qimg { max-width: 70%; max-height: 55mm; display: block; margin: 4px 0; }
    .fig { display: block; margin: 6px auto 4px; max-width: 100%; max-height: 62mm; }
    .foot { position: fixed; bottom: 0; left: 0; right: 0; height: 7mm; background: #fff; font-size: 8.5pt; color: #555; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #ccc; }
    table.pgwrap { width: 100%; border-collapse: collapse; } table.pgwrap > * > tr > td { padding: 0; } .footspace { height: 9mm; }
    .foot img { height: 13px; vertical-align: -3px; margin-right: 4px; }
    table.key { border-collapse: collapse; width: 100%; font-size: 10pt; }
    table.key td, table.key th { border: 1px solid #888; padding: 3px 4px; text-align: center; }
    .pb { break-before: page; }
    .expl { font-size: 9.5pt; color: #333; margin: 2px 0 0 0; }
    @media screen { .foot { position: static; margin-top: 14px; } .footspace { display: none; } body { max-width: 210mm; margin: 0 auto; padding: 16px; background: #fff; } .noprint { position: sticky; top: 0; background: #fffbe6; border: 1px solid #f0d36b; padding: 8px 12px; margin-bottom: 12px; display: flex; gap: 10px; align-items: center; font-family: sans-serif; } .noprint button { padding: 6px 14px; font-size: 14px; cursor: pointer; } }
    @media print { .noprint { display: none; } }
  `;

  function optsHtml(q, lang) {
    const parts = q.options.map((o, i) => `<div>${OPT_NUM[i]}) ${esc(txt(o, lang === 'bi' ? 'hi' : lang))}</div>`);
    const long = q.options.some((o) => txt(o, lang === 'bi' ? 'hi' : lang).length > 32);
    return `<div class="opts ${long ? 'long' : ''}">${parts.join('')}</div>`;
  }
  function optsHtmlLang(q, l) {
    const long = q.options.some((o) => txt(o, l).length > 30);
    return `<div class="opts ${long ? 'long' : ''}">${q.options.map((o, i) => `<div>${OPT_NUM[i]}) ${esc(txt(o, l))}</div>`).join('')}</div>`;
  }

  /* figure as an <img>; width follows the SVG so small figures are not blown up */
  function figHtml(q) {
    if (!q.figure) return '';
    const s = FIG.size(q.figure);
    return `<img class="fig" src="${FIG.src(q.figure)}" style="width:${Math.min(92, Math.round((s.w / 820) * 100))}%">`;
  }

  function questionHtml(q, no, lang) {
    const img = q.image ? `<img class="qimg" src="${q.image}">` : '';
    if (q.figure) {
      const head = lang === 'bi'
        ? `<div class="bi"><div><span class="qn">Q${no})</span> <span class="qt">${esc(txt(q.q, 'hi'))}</span></div><div><span class="qn">Q${no})</span> <span class="qt">${esc(txt(q.q, 'en'))}</span></div></div>`
        : `<div><span class="qn">Q${no})</span> <span class="qt">${esc(txt(q.q, lang))}</span></div>`;
      const opts = q.figOpts ? '' : lang === 'bi' ? `<div class="bi"><div>${optsHtmlLang(q, 'hi')}</div><div>${optsHtmlLang(q, 'en')}</div></div>` : optsHtml(q, lang);
      return `<div class="q fq">${head}${figHtml(q)}${img}${opts}</div>`;
    }
    if (lang === 'bi') {
      return `<div class="q bi"><div><span class="qn">Q${no})</span> <span class="qt">${esc(txt(q.q, 'hi'))}</span>${img}${optsHtmlLang(q, 'hi')}</div>
        <div><span class="qn">Q${no})</span> <span class="qt">${esc(txt(q.q, 'en'))}</span>${optsHtmlLang(q, 'en')}</div></div>`;
    }
    return `<div class="q"><span class="qn">Q${no})</span> <span class="qt">${esc(txt(q.q, lang))}</span>${img}${optsHtml(q, lang)}</div>`;
  }

  async function printPaper(paper, opts) {
    opts = opts || {};
    const s = await school();
    const lang = opts.lang || paper.lang || 'bi';
    const L = (hi, en) => (lang === 'hi' ? hi : lang === 'en' ? en : hi + ' / ' + en);
    const secs = PAPER.sections(paper);
    let body = '';
    if (!opts.keyOnly) {
      body += `<div class="hdr">${s.logo ? `<img src="${s.logo}">` : ''}<div><h1>${esc(s.name)}</h1><div class="sub">${esc(s.tagline || L('राष्ट्रीय आय एवं योग्यता आधारित छात्रवृत्ति परीक्षा (NMMS)', 'National Means-cum-Merit Scholarship Examination'))}</div></div></div>
        <div class="title">${esc(paper.title)}</div>
        <div class="meta"><span>${L('समय', 'Time')}: ${paper.durationMin} ${L('मिनट', 'minutes')}</span><span>${L('पूर्णांक', 'Max. Marks')}: ${paper.questions.length}</span></div>
        <div class="meta"><span>${L('नाम', 'Name')}: ______________________________</span><span>${L('अनुक्रमांक', 'Roll No.')}: ______________</span></div>
        <div class="inst"><b>${L('निर्देश', 'Instructions')}:</b><ol>
          <li>${L('सभी प्रश्न अनिवार्य हैं। प्रत्येक प्रश्न 1 अंक का है।', 'All questions are compulsory. Each question carries 1 mark.')}</li>
          <li>${L('प्रत्येक प्रश्न के चार विकल्पों में से सही विकल्प की संख्या उत्तर पत्रक (OMR) में संगत प्रश्न संख्या के सामने भरें।', 'Choose the correct alternative out of four and darken its number against the question number on the OMR answer sheet.')}</li>
          <li>${L('ऋणात्मक अंकन नहीं है।', 'There is no negative marking.')}</li>
          <li>${L('इस पुस्तिका में रफ़ कार्य के अतिरिक्त कुछ न लिखें।', 'Do not write anything in this booklet except rough work.')}</li></ol></div>`;
      // linked questions (a passage followed by its question) print the passage once, as in the real booklet
      const headOf = (q, l) => { const t = txt(q.q, l), k = t.lastIndexOf('\n'); return k > 0 ? [t.slice(0, k), t.slice(k + 1)] : ['', t]; };
      secs.forEach((sec) => {
        body += `<div class="sec">${esc(L(sec.label.hi, sec.label.en))} (Q${paper.startNo + sec.from} – Q${paper.startNo + sec.to})</div>`;
        for (let i = sec.from; i <= sec.to; i++) {
          const q = paper.questions[i], h = headOf(q, 'en')[0];
          let j = i;
          while (h && j < sec.to && headOf(paper.questions[j + 1], 'en')[0] === h) j++;
          if (j === i) { body += questionHtml(q, paper.startNo + i, lang); continue; }
          const dir = L(`निर्देश (प्रश्न ${paper.startNo + i} – ${paper.startNo + j}):`, `Directions (Q${paper.startNo + i} – Q${paper.startNo + j}):`);
          const ph = (l) => esc(headOf(q, l)[0]);
          body += lang === 'bi' ? `<div class="psg bi"><div><b>${esc(dir.split(' / ')[0])}</b> ${ph('hi')}</div><div><b>${esc(dir.split(' / ')[1])}</b> ${ph('en')}</div></div>`
            : `<div class="psg"><b>${esc(dir)}</b> ${ph(lang)}</div>`;
          for (let k = i; k <= j; k++) {
            const qk = paper.questions[k];
            body += questionHtml(Object.assign({}, qk, { q: { hi: headOf(qk, 'hi')[1], en: headOf(qk, 'en')[1] } }), paper.startNo + k, lang);
          }
          i = j;
        }
      });
    }
    if (opts.withKey || opts.keyOnly) {
      body += `<div class="${opts.keyOnly ? '' : 'pb'}"><div class="title">${L('उत्तर कुंजी', 'Answer Key')} — ${esc(paper.title)}</div>`;
      const cols = 10;
      let rows = '';
      for (let i = 0; i < paper.questions.length; i += cols) {
        rows += '<tr>' + paper.questions.slice(i, i + cols).map((q, j) => `<td><b>${paper.startNo + i + j}</b> → ${q.answer >= 0 ? q.answer + 1 : '?'}</td>`).join('') + '</tr>';
      }
      body += `<table class="key">${rows}</table>`;
      if (opts.withExplanation) {
        body += `<div class="title" style="margin-top:14px">${L('हल / व्याख्या', 'Solutions')}</div>`;
        paper.questions.forEach((q, i) => {
          const e = txt(q.explanation, lang === 'bi' ? 'hi' : lang);
          if (e) body += `<div class="expl"><b>Q${paper.startNo + i}:</b> ${esc(e)}</div>`;
        });
      }
      body += '</div>';
    }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(paper.title)}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
      <style>${PRINT_CSS}</style></head><body>
      <div class="noprint"><button onclick="window.print()">🖨️ Print / Save as PDF</button><span>${L('प्रिंट विंडो में "Save as PDF" चुनकर PDF बनाएँ।', 'Choose "Save as PDF" in the print dialog to get a PDF.')}</span></div>
      ${pageWrap(body)}${footHtml(paper.title)}</body></html>`;
    openDoc(html);
  }

  function openDoc(html) {
    const w = window.open('', '_blank');
    if (!w) { U.toast('Pop-up blocked — कृपया pop-up allow करें', 'err'); return null; }
    w.document.open(); w.document.write(html); w.document.close();
    return w;
  }

  /* ---------------- PowerPoint ---------------- */
  async function makePPT(paper, opts) {
    if (!window.PptxGenJS) { U.toast('PPT library load नहीं हुई', 'err'); return; }
    opts = Object.assign({ answerSlides: true, lang: paper.lang || 'bi' }, opts);
    const s = await school();
    const lang = opts.lang;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 in
    pptx.title = paper.title;
    pptx.company = s.name;
    pptx.author = 'Basic Pathshala — Subodh Maurya';
    const FONT = 'Nirmala UI';
    const NAVY = '1E2A78', SAFF = 'F28C28', GREEN = '1E9E58', LIGHT = 'F4F6FB';

    pptx.defineSlideMaster({
      title: 'Q', background: { color: 'FFFFFF' },
      objects: [
        { rect: { x: 0, y: 0, w: 13.33, h: 0.75, fill: { color: NAVY } } },
        { rect: { x: 0, y: 7.2, w: 13.33, h: 0.3, fill: { color: LIGHT } } },
        { image: { data: BRAND.logo, x: 0.15, y: 7.21, w: 0.28, h: 0.28 } },
        { text: { text: (s.name === BRAND.name ? '' : s.name + '  ·  ') + BRAND.footer, options: { x: 0.48, y: 7.2, w: 10, h: 0.3, fontSize: 10, color: '555555', fontFace: FONT } } }
      ],
      slideNumber: { x: 12.4, y: 7.2, w: 0.7, h: 0.3, fontSize: 10, color: '666666' }
    });

    // title + closing slides are white so the logo (white background) sits cleanly
    const brandSlide = (big, small) => {
      const sl = pptx.addSlide();
      sl.background = { color: 'FFFFFF' };
      sl.addImage({ data: s.logo, x: 5.17, y: 0.35, w: 3, h: 3, sizing: { type: 'contain', w: 3, h: 3 } });
      sl.addText(big, { x: 0.5, y: 3.55, w: 12.33, h: 0.9, fontSize: 30, bold: true, color: NAVY, align: 'center', fontFace: FONT, fit: 'shrink' });
      if (small) sl.addText(small, { x: 0.5, y: 4.45, w: 12.33, h: 0.6, fontSize: 18, color: '444444', align: 'center', fontFace: FONT });
      sl.addShape(pptx.ShapeType.rect, { x: 0, y: 6.85, w: 13.33, h: 0.65, fill: { color: NAVY } });
      sl.addText(BRAND.footer, { x: 0.3, y: 6.85, w: 12.73, h: 0.65, fontSize: 13, color: 'FFFFFF', align: 'right', valign: 'middle', fontFace: FONT });
      return sl;
    };
    const t = brandSlide(paper.title, `${s.name !== BRAND.name ? s.name + '  ·  ' : ''}${paper.questions.length} ${lang === 'en' ? 'Questions' : 'प्रश्न'}  ·  ${paper.durationMin} ${lang === 'en' ? 'minutes' : 'मिनट'}`);
    void t;

    const secs = PAPER.sections(paper);
    const secOf = (i) => secs.find((x) => i >= x.from && i <= x.to);
    const pngs = await figurePngs(paper);
    paper.questions.forEach((q, i) => {
      const no = paper.startNo + i;
      const sec = secOf(i);
      [false, true].forEach((reveal) => {
        if (reveal && !opts.answerSlides) return;
        const sl = pptx.addSlide({ masterName: 'Q' });
        sl.addText(`Q${no}${reveal ? (lang === 'en' ? '  ·  Answer' : '  ·  उत्तर') : ''}`, { x: 0.3, y: 0.1, w: 4, h: 0.55, fontSize: 22, bold: true, color: 'FFFFFF', fontFace: FONT });
        sl.addText(txt(sec.label, lang === 'en' ? 'en' : 'hi') + '  ·  ' + U.DIFF[q.difficulty][lang === 'en' ? 'en' : 'hi'], { x: 6.3, y: 0.1, w: 6.7, h: 0.55, fontSize: 14, color: 'FFD9A8', align: 'right', fontFace: FONT });
        const lines = txtLines(q.q, lang);
        if (pngs[i]) { figureSlide(sl, q, pngs[i], lines, reveal); return; }
        const hasImg = !!q.image;
        const qw = hasImg ? 8.2 : 12.7;
        const runs = [];
        lines.forEach((ln, k) => runs.push({ text: ln, options: { fontSize: k ? 18 : 22, color: k ? '444444' : '111111', bold: !k, breakLine: true } }));
        sl.addText(runs, { x: 0.3, y: 0.9, w: qw, h: 2.6, valign: 'top', fontFace: FONT, fit: 'shrink', paraSpaceAfter: 4 });
        if (hasImg) sl.addImage({ data: q.image, x: 8.7, y: 0.95, w: 4.3, h: 2.6, sizing: { type: 'contain', w: 4.3, h: 2.6 } });
        q.options.forEach((o, k) => {
          const x = 0.3 + (k % 2) * 6.45, y = 3.7 + Math.floor(k / 2) * 1.6;
          const right = reveal && k === q.answer;
          sl.addShape(pptx.ShapeType.roundRect, { x, y, w: 6.25, h: 1.4, rectRadius: 0.12, fill: { color: right ? 'E3F6EA' : LIGHT }, line: { color: right ? GREEN : 'C9CFE3', width: right ? 3 : 1 } });
          sl.addShape(pptx.ShapeType.ellipse, { x: x + 0.15, y: y + 0.4, w: 0.6, h: 0.6, fill: { color: right ? GREEN : SAFF } });
          sl.addText(String(k + 1), { x: x + 0.15, y: y + 0.4, w: 0.6, h: 0.6, fontSize: 18, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
          sl.addText(txtLines(o, lang).map((ln, j) => ({ text: ln, options: { fontSize: j ? 15 : 18, color: j ? '555555' : '111111', breakLine: true } })),
            { x: x + 0.9, y: y + 0.08, w: 5.25, h: 1.24, valign: 'middle', fontFace: FONT, fit: 'shrink' });
        });
        if (reveal) {
          const e = txt(q.explanation, lang === 'en' ? 'en' : 'hi');
          if (e) sl.addText((lang === 'en' ? 'Explanation: ' : 'व्याख्या: ') + e, { x: 0.3, y: 6.85, w: 12.7, h: 0.35, fontSize: 12, color: '1E5E3A', fontFace: FONT, fit: 'shrink' });
        }
        if (!reveal && q.answer >= 0) sl.addNotes(`Answer: ${q.answer + 1}${txt(q.explanation, 'hi') ? ' — ' + txt(q.explanation, 'hi') : ''}`);
      });
    });
    function figureSlide(sl, q, png, lines, reveal) {
      sl.addText(lines.map((ln, k) => ({ text: ln, options: { fontSize: k ? 15 : 19, color: k ? '444444' : '111111', bold: !k, breakLine: true } })), { x: 0.3, y: 0.82, w: 12.7, h: 1.0, valign: 'top', fontFace: FONT, fit: 'shrink' });
      const sz = FIG.size(q.figure);
      const boxH = q.figOpts ? 4.0 : 2.75, boxW = 12.5;
      const k = Math.min(boxW / sz.w, boxH / sz.h);
      const w = sz.w * k, h = sz.h * k;
      sl.addImage({ data: png, x: (13.33 - w) / 2, y: 1.85, w, h });
      const top = 1.85 + boxH + 0.12;
      q.options.forEach((o, kk) => {
        const right = reveal && kk === q.answer;
        const small = q.figOpts;
        const x = small ? 0.9 + kk * 3.0 : 0.3 + (kk % 2) * 6.45, y = small ? top : top + Math.floor(kk / 2) * 1.02, bw = small ? 2.6 : 6.25, bh = small ? 0.8 : 0.92;
        sl.addShape(pptx.ShapeType.roundRect, { x, y, w: bw, h: bh, rectRadius: 0.1, fill: { color: right ? 'E3F6EA' : LIGHT }, line: { color: right ? GREEN : 'C9CFE3', width: right ? 3 : 1 } });
        sl.addShape(pptx.ShapeType.ellipse, { x: x + 0.12, y: y + (bh - 0.5) / 2, w: 0.5, h: 0.5, fill: { color: right ? GREEN : SAFF } });
        sl.addText(String(kk + 1), { x: x + 0.12, y: y + (bh - 0.5) / 2, w: 0.5, h: 0.5, fontSize: 15, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle' });
        sl.addText(txt(o, lang === 'bi' ? 'hi' : lang) + (lang === 'bi' && !small && txt(o, 'en') !== txt(o, 'hi') ? '  /  ' + txt(o, 'en') : ''), { x: x + 0.7, y, w: bw - 0.8, h: bh, valign: 'middle', fontSize: 15, fontFace: FONT, fit: 'shrink' });
      });
      if (reveal) {
        const e = txt(q.explanation, lang === 'en' ? 'en' : 'hi');
        if (e) sl.addText((lang === 'en' ? 'Explanation: ' : 'व्याख्या: ') + e, { x: 0.3, y: 6.85, w: 12.7, h: 0.35, fontSize: 12, color: '1E5E3A', fontFace: FONT, fit: 'shrink' });
      } else if (q.answer >= 0) sl.addNotes(`Answer: ${q.answer + 1}${txt(q.explanation, 'hi') ? ' — ' + txt(q.explanation, 'hi') : ''}`);
    }
    brandSlide(lang === 'en' ? 'All the best!' : 'शुभकामनाएँ! / All the best!', BRAND.tagline);
    await pptx.writeFile({ fileName: U.safeName(paper.title) + '.pptx' });
  }

  /* PNG copies of every figure (index → data URL), for PowerPoint and Google Forms */
  async function figurePngs(paper, scale) {
    const out = [];
    for (let i = 0; i < paper.questions.length; i++) {
      const q = paper.questions[i];
      if (q.figure) { try { out[i] = await FIG.toPng(q.figure, scale || 2); } catch (e) { console.error(e); } }
    }
    return out;
  }

  /* ---------------- Google Form via Apps Script ---------------- */
  function gformScript(paper, opts) {
    opts = Object.assign({ lang: paper.lang || 'bi', shuffle: false, collectEmail: false }, opts);
    const lang = opts.lang;
    const secs = PAPER.sections(paper);
    const items = [];
    paper.questions.forEach((q, i) => {
      const sec = secs.find((s) => s.from === i);
      if (sec) items.push({ h: txt(sec.label, lang) });
      const lines = txtLines(q.q, lang);
      // option texts must be unique and non-empty in Google Forms
      const seen = {};
      const o = q.options.map((op, k) => {
        let s = (k + 1) + ') ' + (txt(op, lang) || '—');
        while (seen[s]) s += ' ';
        seen[s] = 1;
        return s;
      });
      const it = { t: 'Q' + (paper.startNo + i) + '. ' + lines[0], d: lines.slice(1).join('\n'), o, a: q.answer };
      const ex = txt(q.explanation, lang);
      if (ex) it.e = ex;
      const pic = (opts.pngs && opts.pngs[i]) || q.image;
      if (pic && /^data:image\/(png|jpe?g);base64,/.test(pic)) { it.img = pic.split(',')[1]; it.mime = pic.slice(5, pic.indexOf(';')); }
      items.push(it);
    });
    const meta = { title: paper.title, desc: `${paper.questions.length} प्रश्न · ${paper.durationMin} मिनट · प्रत्येक प्रश्न 1 अंक\n\n${BRAND.footer}`, shuffle: !!opts.shuffle };
    return `/**
 * Basic Pathshala - NMMS : Google Form (Quiz) generator
 * Paper: ${paper.title}
 * 1) https://script.google.com खोलें → New project
 * 2) यह पूरा code paste करें → Save → ऊपर "createNmmsForm" चुनकर ▶ Run दबाएँ
 * 3) Permission दें (Review permissions → Allow)
 * 4) Execution log में Form का link (भेजने के लिए) और Edit link मिल जाएगा
 */
var META = ${JSON.stringify(meta)};
var ITEMS = ${JSON.stringify(items)};

function createNmmsForm() {
  var form = FormApp.create(META.title);
  form.setDescription(META.desc);
  form.setIsQuiz(true);
  form.setShuffleQuestions(META.shuffle);
  form.setProgressBar(true);
  form.setConfirmationMessage('धन्यवाद! आपका उत्तर जमा हो गया। / Thank you! Your response has been recorded.');
  form.addTextItem().setTitle('विद्यार्थी का नाम / Student Name').setRequired(true);
  form.addTextItem().setTitle('अनुक्रमांक / Roll No.').setRequired(true);
  form.addTextItem().setTitle('विद्यालय / School').setRequired(false);
  ITEMS.forEach(function (q) {
    if (q.h) { form.addSectionHeaderItem().setTitle(q.h); return; }
    if (q.img) {
      try { form.addImageItem().setImage(Utilities.newBlob(Utilities.base64Decode(q.img), q.mime, 'img')); } catch (e) {}
    }
    var item = form.addMultipleChoiceItem();
    item.setTitle(q.t);
    if (q.d) item.setHelpText(q.d);
    item.setChoices(q.o.map(function (txt, i) { return item.createChoice(txt, i === q.a); }));
    item.setPoints(1);
    if (q.e) item.setFeedbackForCorrect(FormApp.createFeedback().setText(q.e).build())
                 .setFeedbackForIncorrect(FormApp.createFeedback().setText(q.e).build());
  });
  Logger.log('Student link (भेजने के लिए): ' + form.getPublishedUrl());
  Logger.log('Edit link: ' + form.getEditUrl());
}
`;
  }

  /* ---------------- Excel ---------------- */
  function exportExcel(name, sheets) {
    if (!window.XLSX) { U.toast('Excel library load नहीं हुई', 'err'); return; }
    const wb = XLSX.utils.book_new();
    wb.Props = { Title: name, Author: 'Subodh Maurya', Company: BRAND.name };
    Object.keys(sheets).forEach((k) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheets[k].concat([[], [BRAND.footer]])), k.slice(0, 30)));
    XLSX.writeFile(wb, U.safeName(name) + '.xlsx');
  }

  /* render page-sized HTML blocks to an A4 PDF and download it (images, so Hindi always renders correctly) */
  async function htmlToPdf(pages, css, name) {
    if (!window.html2canvas || !window.jspdf) throw new Error('PDF library load नहीं हुई');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-10000px;top:0;';
    document.body.appendChild(host);
    const pdf = new jspdf.jsPDF({ unit: 'mm', format: 'a4', compress: true });
    try {
      for (let i = 0; i < pages.length; i++) {
        const pg = document.createElement('div');
        pg.style.cssText = 'position:relative;width:794px;height:1123px;padding:40px 38px 60px;background:#fff;box-sizing:border-box;overflow:hidden;';
        pg.innerHTML = `<style>${PRINT_CSS.replace(/@page[^}]*}/, '').replace(/\.foot[^}]*}/, '')}${css || ''}</style>${pages[i]}<div style="position:absolute;left:38px;right:38px;bottom:22px;font-size:9pt;color:#555;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #ccc;padding-top:4px"><span><img src="${BRAND.logo}" style="height:15px;vertical-align:-3px;margin-right:5px">${esc(BRAND.footer)}</span><span>${i + 1} / ${pages.length}</span></div>`;
        host.appendChild(pg);
        const canvas = await html2canvas(pg, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });
        if (i) pdf.addPage();
        const h = Math.min(297, (canvas.height / canvas.width) * 210);
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, h);
        pg.remove();
      }
    } finally { host.remove(); }
    pdf.save(U.safeName(name) + '.pdf');
  }

  window.EXPORT = { figurePngs, figHtml, footHtml, pageWrap, htmlToPdf, printPaper, makePPT, gformScript, exportExcel, openDoc, PRINT_CSS, school };
})();
