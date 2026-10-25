/* Basic Pathshala - NMMS : figure engine — SVG figure questions in the UP NMMS style
   (Venn diagrams, figure series / analogy / odd one, mirror & water image, paper folding, dice,
   counting triangles, numbers in overlapping figures, missing number figures, maths diagrams).
   A figure question carries `figure` (SVG text). With `figOpts` the four answer figures are drawn
   inside the figure, labelled (1)–(4), and the text options are just "Figure 1…4". */
(function () {
  const { rand, pick, shuffle, bi } = U;

  /* ---------------- SVG helpers ---------------- */
  const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="Arial, Helvetica, sans-serif"><rect width="${w}" height="${h}" fill="#fff"/>${body}</svg>`;
  const T = (x, y, s, size, extra) => `<text x="${x}" y="${y}" font-size="${size || 16}" text-anchor="middle" fill="#000" ${extra || ''}>${String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
  const frame = (x, y, w, h, inner, dashed) => `<g transform="translate(${x},${y})"><rect x="0" y="0" width="${w}" height="${h}" fill="#fff" stroke="#000" stroke-width="1.6" ${dashed ? 'stroke-dasharray="5 4"' : ''}/>${inner}</g>`;

  /* lay out problem cells (and optional answer cells) — cell: { w, h, inner } | { text } */
  function compose(problem, answers, opts) {
    opts = opts || {};
    const gap = 14, pad = 12;
    const rowW = (cells) => cells.reduce((s, c) => s + (c.text != null ? c.tw || 26 : c.w), 0) + gap * (cells.length - 1);
    const rowH = (cells) => Math.max(...cells.map((c) => c.h || 0));
    const pw = rowW(problem), ph = rowH(problem);
    const labels = problem.some((c) => c.label) ? 24 : 0;
    const two = answers && rowW(answers) > 560;
    const aw = answers ? (two ? rowW(answers.slice(0, 2)) : rowW(answers)) : 0;
    const ah = answers ? (rowH(answers) + 26) * (two ? 2 : 1) : 0;
    const W = Math.max(pw, aw) + pad * 2;
    const H = pad + ph + labels + (answers ? 30 + ah : 0) + pad;
    let out = '';
    let x = (W - pw) / 2;
    problem.forEach((c) => {
      if (c.text != null) { out += T(x + (c.tw || 26) / 2, pad + ph / 2 + 8, c.text, c.size || 26, 'font-weight="bold"'); x += (c.tw || 26) + gap; return; }
      out += c.noFrame ? `<g transform="translate(${x},${pad + (ph - c.h) / 2})">${c.inner}</g>` : frame(x, pad + (ph - c.h) / 2, c.w, c.h, c.inner, c.dashed);
      if (c.label) out += T(x + c.w / 2, pad + ph + 18, c.label, 14);
      x += c.w + gap;
    });
    if (answers) {
      const y0 = pad + ph + labels + 30, rh = rowH(answers) + 26;
      out += `<line x1="${pad}" y1="${y0 - 14}" x2="${W - pad}" y2="${y0 - 14}" stroke="#999" stroke-width="1" stroke-dasharray="4 4"/>`;
      answers.forEach((c, i) => {
        const row = two ? Math.floor(i / 2) : 0, col = two ? i % 2 : i;
        const x0 = (W - aw) / 2 + (two ? col * (c.w + gap) : answers.slice(0, i).reduce((s2, a) => s2 + a.w + gap, 0));
        const y = y0 + row * rh;
        out += frame(x0, y, c.w, c.h, c.inner);
        out += T(x0 + c.w / 2, y + c.h + 20, `(${i + 1})`, 16, 'font-weight="bold"');
      });
    }
    return svg(W, H, out);
  }

  /* ---------------- rotating elements inside a 100×100 cell ---------------- */
  // e = { t: 'arrow'|'pin'|'dot'|'tri'|'sq'|'flag', a: angle (0 = up, clockwise), f: filled?, s: flag side ±1, n: count }
  function elemSvg(e) {
    const fill = e.f ? '#000' : '#fff';
    const rot = (inner) => `<g transform="rotate(${e.a} 50 50)">${inner}</g>`;
    switch (e.t) {
      case 'arrow': return rot('<line x1="50" y1="50" x2="50" y2="16" stroke="#000" stroke-width="3"/><polygon points="50,7 43,19 57,19" fill="#000"/>');
      case 'pin': return rot(`<line x1="50" y1="50" x2="50" y2="18" stroke="#000" stroke-width="3"/><circle cx="50" cy="13" r="6" fill="${fill}" stroke="#000" stroke-width="2"/>`);
      case 'dot': return rot(`<circle cx="50" cy="18" r="7" fill="${fill}" stroke="#000" stroke-width="2"/>`);
      case 'tri': return rot(`<polygon points="50,9 41,25 59,25" fill="${fill}" stroke="#000" stroke-width="2"/>`);
      case 'sq': return rot(`<rect x="42" y="11" width="16" height="16" fill="${fill}" stroke="#000" stroke-width="2"/>`);
      case 'flag': return rot(`<line x1="50" y1="56" x2="50" y2="10" stroke="#000" stroke-width="3"/><polygon points="50,10 ${50 + 18 * e.s},16 50,23" fill="${fill}" stroke="#000" stroke-width="1.5"/>`);
      case 'dots': { let o = ''; for (let i = 0; i < e.n; i++) o += `<circle cx="${22 + (i % 4) * 19}" cy="${78 + Math.floor(i / 4) * -14}" r="5" fill="#000"/>`; return o; }
      default: return '';
    }
  }
  const cellOf = (els) => {
    const dots = els.find((e) => e.t === 'dots');
    const main = els.filter((e) => e.t !== 'dots').map(elemSvg).join('');
    if (!dots) return { w: 100, h: 100, inner: main };
    // shrink the rotating part and keep a strip at the bottom for the dots so they never overlap
    let row = '';
    for (let i = 0; i < dots.n; i++) row += `<circle cx="${50 - (dots.n - 1) * 6 + i * 12}" cy="91" r="4" fill="#000"/>`;
    return { w: 100, h: 100, inner: `<g transform="translate(50 42) scale(0.76) translate(-50 -50)">${main}</g>${row}` };
  };
  const norm = (a) => ((a % 360) + 360) % 360;
  const keyOf = (els) => els.map((e) => [e.t, norm(e.a), e.f ? 1 : 0, e.s || 0, e.n || 0].join(':')).join('|');
  const rotate = (els, d) => els.map((e) => Object.assign({}, e, { a: norm(e.a + d) }));
  const mirror = (els) => els.map((e) => Object.assign({}, e, { a: norm(360 - e.a), s: e.s ? -e.s : e.s }));
  const flipV = (els) => els.map((e) => Object.assign({}, e, { a: norm(180 - e.a), s: e.s ? -e.s : e.s }));

  /* pick 3 distinct wrong options (by key) */
  function figOptions(correct, wrongs) {
    const seen = new Set([keyOf(correct)]), ws = [];
    for (const w of wrongs) { const k = keyOf(w); if (!seen.has(k) && ws.length < 3) { seen.add(k); ws.push(w); } }
    if (ws.length < 3) return null;
    const all = shuffle([correct, ...ws]);
    return { cells: all.map(cellOf), answer: all.findIndex((x) => keyOf(x) === keyOf(correct)) };
  }
  const figText = [0, 1, 2, 3].map((i) => bi(`आकृति ${i + 1}`, `Figure ${i + 1}`));
  function figQ(topic, cat, q, figure, answer, explanation, extra) {
    return Object.assign({ topic, cat, q, figure, figOpts: true, options: figText.map((o) => Object.assign({}, o)), answer, explanation }, extra || {});
  }
  const ELS = ['arrow', 'pin', 'tri', 'sq', 'dot'];
  /* correct value + 3 distinct wrong values from pool, shuffled; null if not enough */
  function pick4(ans, pool) {
    const w = shuffle([...new Set(pool.map((x) => (typeof x === 'number' ? Math.round(x * 100) / 100 : x)))].filter((x) => x !== ans && (typeof x !== 'number' || x > 0))).slice(0, 3);
    return w.length < 3 ? null : shuffle([ans, ...w]);
  }

  /* 1. figure series — which answer figure continues the series */
  function figSeries(diff) {
    let start, step;
    if (diff === 'easy') {
      const t = pick(['arrow', 'pin', 'tri', 'flag']);
      start = [{ t, a: pick([0, 45, 90, 180, 270]), f: true, s: 1 }];
      const d = pick([45, 90, -45, -90]);
      step = (els, k) => rotate(els, d * k);
    } else if (diff === 'moderate') {
      const [t1, t2] = shuffle(ELS).slice(0, 2);
      start = [{ t: t1, a: pick([0, 90, 180, 270]), f: true }, { t: t2, a: pick([45, 135, 225, 315]), f: false }];
      const d1 = pick([90, -90]), d2 = pick([45, -45, 135]);
      step = (els, k) => [Object.assign({}, els[0], { a: norm(els[0].a + d1 * k) }), Object.assign({}, els[1], { a: norm(els[1].a + d2 * k) })];
    } else {
      const t1 = pick(['arrow', 'flag']), t2 = pick(['tri', 'sq', 'dot']);
      start = [{ t: t1, a: pick([0, 90, 180]), f: true, s: 1 }, { t: t2, a: 180, f: true }, { t: 'dots', a: 0, n: rand(1, 2) }];
      // first element turns 45°, 90°, 135°… (growing steps), second alternates filled / empty and turns -90°, dots +1
      step = (els, k) => [Object.assign({}, els[0], { a: norm(els[0].a + 45 * (k * (k + 1)) / 2) }), Object.assign({}, els[1], { a: norm(els[1].a - 90 * k), f: k % 2 === 0 }), Object.assign({}, els[2], { n: els[2].n + k })];
    }
    const seq = [0, 1, 2, 3, 4].map((k) => step(start, k));
    const right = step(start, 5);
    const wrongs = [step(start, 4), mirror(right), rotate(right, 45), rotate(right, 90), rotate(right, 180), step(start, 6)];
    if (diff === 'hard') wrongs.unshift(right.map((e, i) => (i === 1 ? Object.assign({}, e, { f: !e.f }) : i === 2 ? Object.assign({}, e, { n: e.n + 1 }) : e)));
    const o = figOptions(right, wrongs);
    if (!o) return null;
    const fig = compose([...seq.map(cellOf), { text: '?', tw: 40 }], o.cells);
    return figQ('Figure Series', 'figure', bi('प्रश्न आकृतियों की श्रेणी को आगे बढ़ाने वाली उत्तर आकृति चुनिए।', 'Choose the answer figure which continues the series of problem figures.'), fig, o.answer,
      bi(diff === 'easy' ? 'आकृति हर बार एक निश्चित कोण घूमती है।' : diff === 'moderate' ? 'दोनों तत्व अलग-अलग कोण से घूमते हैं।' : 'पहला तत्व 45°, 90°, 135°… घूमता है, दूसरा बारी-बारी से भरा/खाली होकर घूमता है और बिंदु एक-एक बढ़ते हैं।',
        diff === 'easy' ? 'The figure turns by a fixed angle each step.' : diff === 'moderate' ? 'The two elements turn by different angles.' : 'First element turns 45°, 90°, 135°…; second alternates filled/empty while turning; dots increase by one.'));
  }

  /* 2. figure analogy  A : B :: C : ? */
  function figAnalogy(diff) {
    const base = () => {
      const [t1, t2] = shuffle(['flag', 'pin', 'tri', 'sq', 'dot']).slice(0, 2);
      return [{ t: diff === 'moderate' ? 'flag' : t1, a: pick([0, 45, 90]), f: true, s: pick([1, -1]) }, { t: t2 === 'flag' && diff === 'moderate' ? 'tri' : t2, a: pick([135, 180, 225, 270]), f: Math.random() < 0.5, s: 1 }];
    };
    let tf, why;
    if (diff === 'easy') { const d = pick([90, -90, 180]); tf = (e) => rotate(e, d); why = bi(`आकृति ${Math.abs(d)}° ${d > 0 ? 'दक्षिणावर्त' : 'वामावर्त'} घूमती है।`, `The figure turns ${Math.abs(d)}° ${d > 0 ? 'clockwise' : 'anticlockwise'}.`); }
    else if (diff === 'moderate') { tf = (e) => mirror(e); why = bi('दूसरी आकृति पहली का दर्पण प्रतिबिंब है।', 'The second figure is the mirror image of the first.'); }
    else { tf = (e) => rotate(e, 90).map((x, i) => (i === 1 ? Object.assign({}, x, { f: !x.f }) : x)); why = bi('आकृति 90° दक्षिणावर्त घूमती है और छोटी आकृति का भराव बदल जाता है।', 'The figure turns 90° clockwise and the small shape changes its shading.'); }
    const ok = (x) => keyOf(tf(x)) !== keyOf(x) && keyOf(rotate(x, 180)) !== keyOf(x);
    let A = base(), C = base();
    for (let i = 0; i < 40 && !ok(A); i++) A = base();
    for (let i = 0; i < 40 && (!ok(C) || keyOf(A) === keyOf(C)); i++) C = base();
    if (!ok(A) || !ok(C)) return null;
    const right = tf(C);
    const wrongs = [C, rotate(right, 90), rotate(right, 180), mirror(right), rotate(C, -90), right.map((x, i) => (i === 1 ? Object.assign({}, x, { f: !x.f }) : x))];
    const o = figOptions(right, wrongs);
    if (!o) return null;
    const fig = compose([cellOf(A), { text: ':', tw: 14 }, cellOf(tf(A)), { text: '::', tw: 24 }, cellOf(C), { text: ':', tw: 14 }, { w: 100, h: 100, inner: T(50, 62, '?', 40, 'font-weight="bold"') }], o.cells);
    return figQ('Figure Analogy', 'analogy', bi('जो संबंध पहली और दूसरी आकृति में है, वही संबंध तीसरी आकृति और किस उत्तर आकृति में है?', 'The first two figures are related in a certain way. Which answer figure is related to the third figure in the same way?'), fig, o.answer, why);
  }

  /* 3. odd figure out */
  function figOdd(diff) {
    const base = [{ t: 'flag', a: 0, f: true, s: 1 }, { t: pick(['dot', 'tri', 'sq']), a: 90, f: true }, { t: 'dots', a: 0, n: 3 }];
    const angles = shuffle([0, 90, 180, 270, 45, 135, 225, 315]).slice(0, 4);
    const figs = angles.map((a) => rotate(base, a).map((e) => (e.t === 'dots' ? Object.assign({}, e, { a: 0 }) : e)));
    const oddIdx = rand(0, 3);
    let why;
    if (diff === 'easy') { figs[oddIdx] = figs[oddIdx].map((e) => (e.t === 'dots' ? Object.assign({}, e, { n: 2 }) : e)); why = bi('बाकी सभी आकृतियों में तीन बिंदु हैं।', 'All other figures have three dots.'); }
    else if (diff === 'moderate') { figs[oddIdx] = figs[oddIdx].map((e, i) => (i === 1 ? Object.assign({}, e, { a: norm(e.a + 180) }) : e)); why = bi('बाकी सभी में छोटी आकृति झंडे से 90° दक्षिणावर्त है।', 'In all others the small shape is 90° clockwise from the flag.'); }
    else { figs[oddIdx] = mirror(figs[oddIdx]); why = bi('बाकी तीनों एक ही आकृति के घुमाए हुए रूप हैं; यह उसका दर्पण प्रतिबिंब है।', 'The other three are rotations of one figure; this one is its mirror image.'); }
    const fig = compose(figs.map(cellOf).map((c, i) => Object.assign(c, { label: `(${i + 1})` })), null);
    return figQ('Odd Figure Out', 'odd', bi('निम्नलिखित आकृतियों में से भिन्न आकृति चुनिए।', 'Choose the figure which is different from the others.'), fig, oddIdx, why);
  }

  /* 4. mirror / water image of a word or number */
  const ASYM = 'FGJKLNPQRSZ234579'.split('');
  function mirrorImage(diff) {
    const len = diff === 'easy' ? 4 : diff === 'moderate' ? 6 : 7;
    let word = '';
    for (let i = 0; i < len; i++) word += pick(ASYM);
    const water = diff !== 'easy' && Math.random() < 0.5;
    const W = 34 * len + 30, H = 70;
    const txt = (tf) => `<g transform="${tf}"><text x="${W / 2}" y="${H / 2 + 14}" font-size="40" font-weight="bold" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" letter-spacing="4">${word}</text></g>`;
    const tfs = { mirror: `translate(${W} 0) scale(-1 1)`, water: `translate(0 ${H}) scale(1 -1)`, both: `translate(${W} ${H}) scale(-1 -1)`, none: '' };
    // a near-miss: mirror the letters' order but keep each letter unflipped
    const rev = word.split('').reverse().join('');
    const nearMiss = `<text x="${W / 2}" y="${H / 2 + 14}" font-size="40" font-weight="bold" text-anchor="middle" letter-spacing="4">${rev}</text>`;
    const cells = { mirror: txt(tfs.mirror), water: txt(tfs.water), both: txt(tfs.both), none: txt(''), near: water ? `<g transform="translate(0 ${H}) scale(1 -1)">${txt(tfs.mirror)}</g>` : nearMiss };
    const right = water ? 'water' : 'mirror';
    const keys = shuffle([right, ...shuffle(['both', 'near', water ? 'mirror' : 'water', 'none'].filter((k) => k !== right)).slice(0, 3)]);
    const line = water ? `<line x1="0" y1="${H + 6}" x2="${W}" y2="${H + 6}" stroke="#000" stroke-width="2"/>${T(W / 2, H + 22, '~~~~~~', 14)}` : `<line x1="${W + 8}" y1="0" x2="${W + 8}" y2="${H}" stroke="#000" stroke-width="3"/>${T(W + 22, H / 2 + 5, 'M', 14)}`;
    const prob = { w: W + (water ? 0 : 34), h: H + (water ? 26 : 0), inner: `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff" stroke="#000" stroke-width="1.6"/>` + txt('') + line, noFrame: true };
    const fig = compose([prob], keys.map((k) => ({ w: W, h: H, inner: cells[k] })));
    return figQ(water ? 'Water Image' : 'Mirror Image', 'figure', water ? bi(`दिए गए शब्द/संख्या "${word}" का जल प्रतिबिंब कौन-सा है?`, `Which is the water image of "${word}"?`) : bi(`दर्पण (M) को दाईं ओर रखने पर "${word}" का दर्पण प्रतिबिंब कौन-सा होगा?`, `Which is the mirror image of "${word}" when the mirror (M) is placed on the right?`),
      fig, keys.indexOf(right), water ? bi('जल प्रतिबिंब में ऊपर-नीचे उलट जाता है, बाएँ-दाएँ नहीं।', 'A water image is flipped top-to-bottom, not left-to-right.') : bi('दर्पण प्रतिबिंब में बाएँ-दाएँ उलट जाता है।', 'A mirror image is flipped left-to-right.'));
  }

  /* 5. paper folding and punching */
  function paperFold(diff) {
    const twoFolds = diff !== 'easy';
    const holes = [];
    const nh = diff === 'hard' ? 2 : 1;
    for (let t = 0; holes.length < nh && t < 50; t++) {
      const h = { x: rand(58, 92), y: twoFolds ? rand(58, 92) : rand(12, 88), sq: diff === 'hard' && holes.length === 1 };
      if (holes.every((o) => Math.hypot(o.x - h.x, o.y - h.y) > 18)) holes.push(h);
    }
    if (holes.length < nh) return null;
    const unfold = (hs, v, h) => {
      let out = hs.slice();
      if (h) out = out.concat(out.map((p) => Object.assign({}, p, { y: 100 - p.y })));
      if (v) out = out.concat(out.map((p) => Object.assign({}, p, { x: 100 - p.x })));
      return out;
    };
    const holeSvg = (p) => (p.sq ? `<rect x="${p.x - 5}" y="${p.y - 5}" width="10" height="10" fill="#000"/>` : `<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="#000"/>`);
    const sheet = (hs) => ({ w: 100, h: 100, inner: hs.map(holeSvg).join('') });
    const right = unfold(holes, true, twoFolds);
    const wrongSets = [holes, unfold(holes, true, false), unfold(holes, false, true), unfold(holes.map((p) => Object.assign({}, p, { x: p.y, y: p.x })), true, twoFolds), right.slice(0, right.length - 1), right.map((p) => Object.assign({}, p, { y: 100 - p.y + (twoFolds ? 0 : 8) }))];
    const k = (hs) => hs.map((p) => `${Math.round(p.x)},${Math.round(p.y)},${p.sq ? 1 : 0}`).sort().join(';');
    const seen = new Set([k(right)]), ws = [];
    for (const w of wrongSets) { if (!seen.has(k(w)) && ws.length < 3) { seen.add(k(w)); ws.push(w); } }
    if (ws.length < 3) return null;
    const all = shuffle([right, ...ws]);
    const arrowR = '<path d="M30 30 Q50 8 72 30" fill="none" stroke="#000" stroke-width="2"/><polygon points="72,30 62,26 68,20" fill="#000"/>';
    const arrowD = '<path d="M22 24 Q44 50 22 76" fill="none" stroke="#000" stroke-width="2"/><polygon points="22,76 20,65 30,69" fill="#000"/>';
    const steps = [{ w: 100, h: 100, inner: `<line x1="50" y1="0" x2="50" y2="100" stroke="#000" stroke-dasharray="5 4" stroke-width="1.5"/>${arrowR}` }];
    if (twoFolds) {
      steps.push({ w: 50, h: 100, inner: `<line x1="0" y1="50" x2="50" y2="50" stroke="#000" stroke-dasharray="5 4" stroke-width="1.5"/>${arrowD}` });
      steps.push({ w: 50, h: 50, inner: holes.map((p) => holeSvg({ x: p.x - 50, y: p.y - 50, sq: p.sq })).join('') });
    } else {
      steps.push({ w: 50, h: 100, inner: holes.map((p) => holeSvg({ x: p.x - 50, y: p.y, sq: p.sq })).join('') });
    }
    const fig = compose(steps, all.map(sheet));
    return figQ('Paper Folding', 'figure', bi('एक कागज़ को चित्र के अनुसार मोड़कर उसमें छेद किया गया है। खोलने पर कागज़ कैसा दिखेगा?', 'A sheet of paper is folded as shown and punched. How will it look when unfolded?'), fig, all.findIndex((x) => k(x) === k(right)),
      bi('हर मोड़ खोलने पर छेद मोड़ की रेखा के दूसरी ओर दर्पण-स्थिति में दिखते हैं।', 'Each unfold mirrors the holes across that fold line.'));
  }

  /* 6. dice — two physically consistent views of one cube */
  function cubeSvg(top, left, right) {
    return '<polygon points="50,8 88,27 50,46 12,27" fill="#f2f2f2" stroke="#000" stroke-width="2"/><polygon points="12,27 50,46 50,92 12,73" fill="#fff" stroke="#000" stroke-width="2"/><polygon points="50,46 88,27 88,73 50,92" fill="#e4e4e4" stroke="#000" stroke-width="2"/>' +
      T(50, 33, top, 18, 'font-weight="bold"') + T(31, 66, left, 18, 'font-weight="bold"') + T(69, 66, right, 18, 'font-weight="bold"');
  }
  function dice(diff) {
    const n = shuffle([1, 2, 3, 4, 5, 6]);
    const [U1, D, F, B, R, L] = n; // up, down, front, back, right, left
    // view from front-right corner: top=U, left=F, right=R; from back-left corner: top=U, left=B, right=L
    const v1 = cubeSvg(U1, F, R), v2 = cubeSvg(U1, B, L);
    let ask, ans, why;
    if (diff === 'hard') { ask = F; ans = B; why = bi(`ऊपर ${U1} के चारों ओर दक्षिणावर्त क्रम ${F}, ${R}, ${B}, ${L} है, अतः ${F} के विपरीत ${B}।`, `Around the top ${U1} the clockwise order is ${F}, ${R}, ${B}, ${L}, so ${B} is opposite ${F}.`); }
    else { ask = U1; ans = D; why = bi(`${U1} के साथ ${F}, ${R}, ${B}, ${L} दिखते हैं, ये सब आसन्न हैं; बची संख्या ${D} विपरीत है।`, `${F}, ${R}, ${B}, ${L} all touch ${U1}; the remaining number ${D} is opposite.`); }
    const opts = shuffle([ans, ...shuffle(n.filter((x) => x !== ans && x !== ask)).slice(0, 3)]);
    const fig = compose([{ w: 100, h: 100, inner: v1, label: '(i)' }, { w: 100, h: 100, inner: v2, label: '(ii)' }], null);
    return { topic: 'Dice', cat: 'figure', figure: fig, q: bi(`एक ही पासे की दो स्थितियाँ दिखाई गई हैं। ${ask} के विपरीत फलक पर कौन-सी संख्या है?`, `Two positions of the same die are shown. Which number is on the face opposite ${ask}?`), options: opts.map((x) => bi(String(x), String(x))), answer: opts.indexOf(ans), explanation: why };
  }

  /* 7. counting triangles */
  function countTriangles(diff) {
    const [m, h] = pick({ easy: [[1, 0], [2, 0]], moderate: [[1, 1], [3, 0], [2, 1]], hard: [[3, 1], [2, 2], [4, 1], [3, 2]] }[diff]);
    const A = [110, 10], B = [10, 170], C = [210, 170];
    let body = `<polygon points="${A} ${B} ${C}" fill="none" stroke="#000" stroke-width="2.5"/>`;
    for (let i = 1; i <= m; i++) { const x = 10 + (200 * i) / (m + 1); body += `<line x1="${A[0]}" y1="${A[1]}" x2="${x}" y2="170" stroke="#000" stroke-width="2"/>`; }
    for (let j = 1; j <= h; j++) { const t = j / (h + 1) * 0.8 + 0.1; const y = A[1] + (170 - A[1]) * (1 - t); const half = 100 * (1 - t); body += `<line x1="${110 - half}" y1="${y}" x2="${110 + half}" y2="${y}" stroke="#000" stroke-width="2"/>`; }
    const ans = ((m + 1) * (m + 2) / 2) * (h + 1);
    const fig = svg(220, 180, body);
    const opts = pick4(ans, [ans - 2, ans - 1, ans + 1, ans + 2, ans + 3, ans - 3, (m + 1) * (h + 1), ans * 2]);
    if (!opts) return null;
    return { topic: 'Counting Figures', cat: 'figure', figure: fig, q: bi('दी गई आकृति में कुल कितने त्रिभुज हैं?', 'How many triangles are there in the given figure?'), options: opts.map((x) => bi(String(x), String(x))), answer: opts.indexOf(ans),
      explanation: bi(`हर पट्टी में ${(m + 1) * (m + 2) / 2} त्रिभुज × ${h + 1} पट्टियाँ = ${ans}`, `${(m + 1) * (m + 2) / 2} triangles per strip × ${h + 1} strip(s) = ${ans}`) };
  }

  /* 8. numbers in overlapping circle, square and triangle */
  const OV = { C: [70, 121], S: [214, 80], T: [193, 213], CS: [146, 89], CT: [114, 192], ST: [201, 158], CST: [160, 150] };
  function overlap(diff) {
    const regs = Object.keys(OV);
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, regs.length);
    const val = {}; regs.forEach((r, i) => { val[r] = nums[i]; });
    const body = '<circle cx="110" cy="130" r="80" fill="none" stroke="#000" stroke-width="2.5"/><rect x="120" y="45" width="130" height="130" fill="none" stroke="#000" stroke-width="2.5"/><polygon points="40,250 270,250 180,90" fill="none" stroke="#000" stroke-width="2.5"/>' +
      regs.map((r) => T(OV[r][0], OV[r][1] + 7, val[r], 20, 'font-weight="bold"')).join('');
    const fig = svg(300, 262, body);
    const name = { C: ['वृत्त', 'circle'], S: ['वर्ग', 'square'], T: ['त्रिभुज', 'triangle'] };
    let q, ans, why, pool;
    if (diff === 'easy') {
      ans = val.CST; pool = nums;
      q = bi('कौन-सी संख्या तीनों आकृतियों (वृत्त, वर्ग, त्रिभुज) के अंदर है?', 'Which number is inside all three figures (circle, square and triangle)?');
      why = bi(`तीनों के साझे भाग में ${ans} है।`, `${ans} lies in the common part of all three.`);
    } else if (diff === 'moderate') {
      const r = pick(['CS', 'CT', 'ST']), [a, b] = r.split(''), c = 'CST'.replace(a, '').replace(b, '');
      ans = val[r]; pool = nums;
      q = bi(`कौन-सी संख्या ${name[a][0]} और ${name[b][0]} दोनों में है, परंतु ${name[c][0]} में नहीं?`, `Which number is in both the ${name[a][1]} and the ${name[b][1]} but not in the ${name[c][1]}?`);
      why = bi(`केवल ${name[a][0]} व ${name[b][0]} वाले भाग में ${ans} है।`, `${ans} is in the part shared only by the ${name[a][1]} and ${name[b][1]}.`);
    } else {
      const s = pick(['C', 'S', 'T']);
      ans = val.CST * val[s];
      pool = [ans + val.CST, ans - val[s], val.CST + val[s], val.CST * (val[s] + 1), ans + 2, ans - 2];
      q = bi(`तीनों आकृतियों में स्थित संख्या को केवल ${name[s][0]} में स्थित संख्या से गुणा करें। परिणाम क्या है?`, `Multiply the number in all three figures by the number that is only in the ${name[s][1]}. What is the result?`);
      why = bi(`${val.CST} × ${val[s]} = ${ans}`, `${val.CST} × ${val[s]} = ${ans}`);
    }
    const opts = shuffle([ans, ...shuffle(pool.filter((x) => x !== ans && x > 0)).filter((x, i, arr) => arr.indexOf(x) === i).slice(0, 3)]);
    if (opts.length < 4) return null;
    return { topic: 'Numbers in Figures', cat: 'figurenum', figure: fig, q, options: opts.map((x) => bi(String(x), String(x))), answer: opts.indexOf(ans), explanation: why };
  }

  /* 9. missing number in figures (circle in four parts with a centre) */
  function missingFigure(diff) {
    const rule = {
      easy: [(a, b, c, d) => a + b + c + d, 'बीच की संख्या = चारों का योग', 'Centre = sum of the four numbers'],
      moderate: [(a, b, c, d) => a * c + b * d, 'बीच = (ऊपर × नीचे) + (बाएँ × दाएँ)', 'Centre = (top × bottom) + (left × right)'],
      hard: [(a, b, c, d) => (a + c) * (b + d) - a * c, 'बीच = (ऊपर + नीचे) × (बाएँ + दाएँ) − ऊपर × नीचे', 'Centre = (top + bottom) × (left + right) − top × bottom']
    }[diff];
    const sets = [0, 1, 2].map(() => [rand(1, 9), rand(1, 9), rand(1, 9), rand(1, 9)]); // top, right, bottom, left
    const cell = (s, centre) => ({ w: 110, h: 110, inner: '<circle cx="55" cy="55" r="50" fill="none" stroke="#000" stroke-width="2"/><line x1="20" y1="20" x2="90" y2="90" stroke="#000" stroke-width="1.5"/><line x1="90" y1="20" x2="20" y2="90" stroke="#000" stroke-width="1.5"/><circle cx="55" cy="55" r="14" fill="#fff" stroke="#000" stroke-width="2"/>' +
      T(55, 28, s[0], 17, 'font-weight="bold"') + T(88, 61, s[1], 17, 'font-weight="bold"') + T(55, 98, s[2], 17, 'font-weight="bold"') + T(22, 61, s[3], 17, 'font-weight="bold"') + T(55, 61, centre, centre === '?' ? 17 : String(centre).length > 2 ? 11 : 14, 'font-weight="bold"') });
    const val = (s) => rule[0](s[0], s[1], s[2], s[3]);
    const ans = val(sets[2]);
    const fig = compose(sets.map((s, i) => cell(s, i === 2 ? '?' : val(s))), null);
    const opts = pick4(ans, [ans + 1, ans - 1, ans + 2, ans - 2, ans + sets[2][0], ans + 5, ans - 4]);
    if (!opts) return null;
    return { topic: 'Missing Number (Figure)', cat: 'figurenum', figure: fig, q: bi('तीनों आकृतियों में संख्याएँ एक ही नियम से हैं। प्रश्नचिह्न (?) के स्थान पर कौन-सी संख्या आएगी?', 'The numbers in all three figures follow the same rule. Which number replaces the question mark (?)?'), options: opts.map((x) => bi(String(x), String(x))), answer: opts.indexOf(ans), explanation: bi(rule[1], rule[2]) };
  }

  /* 10. Venn diagrams — which diagram shows the relation between three words */
  const VD = {
    nest3: { w: 110, d: '<circle cx="55" cy="50" r="44"/><circle cx="55" cy="50" r="29"/><circle cx="55" cy="50" r="14"/>' },
    sep3: { w: 130, d: '<circle cx="24" cy="50" r="18"/><circle cx="65" cy="50" r="18"/><circle cx="106" cy="50" r="18"/>' },
    two_in_one: { w: 110, d: '<circle cx="55" cy="50" r="44"/><circle cx="36" cy="50" r="15"/><circle cx="74" cy="50" r="15"/>' },
    int2_in_one: { w: 110, d: '<circle cx="55" cy="50" r="44"/><circle cx="43" cy="50" r="19"/><circle cx="67" cy="50" r="19"/>' },
    nest2_sep1: { w: 130, d: '<circle cx="40" cy="50" r="34"/><circle cx="36" cy="50" r="15"/><circle cx="106" cy="50" r="18"/>' },
    int2_sep1: { w: 130, d: '<circle cx="30" cy="50" r="22"/><circle cx="58" cy="50" r="22"/><circle cx="110" cy="50" r="15"/>' },
    int3: { w: 110, d: '<circle cx="42" cy="40" r="26"/><circle cx="68" cy="40" r="26"/><circle cx="55" cy="64" r="26"/>' },
    chain3: { w: 120, d: '<circle cx="30" cy="50" r="21"/><circle cx="60" cy="50" r="21"/><circle cx="90" cy="50" r="21"/>' },
    sep3tri: { w: 110, d: '<circle cx="34" cy="34" r="17"/><circle cx="76" cy="34" r="17"/><circle cx="55" cy="72" r="17"/>' }
  };
  const VW = {
    nest3: [['लखनऊ, उत्तर प्रदेश, भारत', 'Lucknow, Uttar Pradesh, India'], ['गुलाब, फूल, पौधा', 'Rose, Flower, Plant'], ['गौरैया, पक्षी, जीव', 'Sparrow, Bird, Living beings'], ['सेब, फल, भोजन', 'Apple, Fruit, Food'], ['सोना, धातु, तत्व', 'Gold, Metal, Element'], ['वर्ग, आयत, चतुर्भुज', 'Square, Rectangle, Quadrilateral'], ['प्राकृत संख्याएँ, पूर्णांक, परिमेय संख्याएँ', 'Natural numbers, Integers, Rational numbers']],
    sep3: [['कलम, मेज़, गाय', 'Pen, Table, Cow'], ['सूर्य, गुलाब, बस', 'Sun, Rose, Bus'], ['गेहूँ, लोहा, बाघ', 'Wheat, Iron, Tiger'], ['जूते, नदी, पेंसिल', 'Shoes, River, Pencil'], ['चंद्रमा, कुर्सी, शेर', 'Moon, Chair, Lion'], ['पहाड़, चावल, घड़ी', 'Mountain, Rice, Clock']],
    two_in_one: [['कलम, पेंसिल, लेखन सामग्री', 'Pen, Pencil, Stationery'], ['गाय, कुत्ता, जानवर', 'Cow, Dog, Animals'], ['हिंदी, अंग्रेज़ी, भाषा', 'Hindi, English, Language'], ['आम, केला, फल', 'Mango, Banana, Fruits'], ['गेहूँ, चावल, अनाज', 'Wheat, Rice, Cereals'], ['लखनऊ, कानपुर, उत्तर प्रदेश', 'Lucknow, Kanpur, Uttar Pradesh'], ['भाई, बहन, परिवार', 'Brother, Sister, Family']],
    int2_in_one: [['शिक्षक, महिलाएँ, मनुष्य', 'Teachers, Women, Human beings'], ['गायक, नर्तक, कलाकार', 'Singers, Dancers, Artists'], ['डॉक्टर, पुरुष, मनुष्य', 'Doctors, Men, Human beings'], ['सम संख्याएँ, अभाज्य संख्याएँ, प्राकृत संख्याएँ', 'Even numbers, Prime numbers, Natural numbers'], ['लेखक, कवि, मनुष्य', 'Writers, Poets, Human beings']],
    nest2_sep1: [['गुलाब, फूल, कार', 'Rose, Flower, Car'], ['आम, फल, लोहा', 'Mango, Fruit, Iron'], ['शेर, जानवर, मेज़', 'Lion, Animal, Table'], ['दिल्ली, भारत, चंद्रमा', 'Delhi, India, Moon'], ['हिंदी, भाषा, नदी', 'Hindi, Language, River']],
    int2_sep1: [['डॉक्टर, महिलाएँ, मेज़', 'Doctors, Women, Tables'], ['गायक, शिक्षक, पेड़', 'Singers, Teachers, Trees'], ['विद्यार्थी, खिलाड़ी, पुस्तकें', 'Students, Players, Books'], ['माताएँ, डॉक्टर, कुर्सियाँ', 'Mothers, Doctors, Chairs']],
    chain3: [['फूल, सफ़ेद वस्तुएँ, कपड़ा', 'Flowers, White things, Cloth'], ['मछलियाँ, तैराक, मनुष्य', 'Fish, Swimmers, Human beings']],
    int3: [['डॉक्टर, महिलाएँ, गायक', 'Doctors, Women, Singers'], ['शिक्षक, पुरुष, स्नातक', 'Teachers, Men, Graduates'], ['विद्यार्थी, खिलाड़ी, लड़कियाँ', 'Students, Players, Girls'], ['माताएँ, शिक्षक, लेखक', 'Mothers, Teachers, Writers']]
  };
  const VLEVEL = { easy: ['nest3', 'sep3', 'two_in_one'], moderate: ['two_in_one', 'nest2_sep1', 'int2_sep1'], hard: ['int2_in_one', 'int3', 'chain3'] };
  const VWHY = {
    nest3: ['पहला दूसरे का भाग है और दूसरा तीसरे का।', 'The first is a part of the second and the second of the third.'],
    sep3: ['तीनों का आपस में कोई संबंध नहीं है।', 'The three are not related to each other.'],
    two_in_one: ['पहले दोनों अलग-अलग हैं, पर दोनों तीसरे के अंतर्गत आते हैं।', 'The first two are separate but both belong to the third.'],
    int2_in_one: ['पहले दोनों में कुछ साझा है और दोनों तीसरे के अंतर्गत आते हैं।', 'The first two overlap and both belong to the third.'],
    nest2_sep1: ['पहला दूसरे का भाग है, तीसरा बिल्कुल अलग है।', 'The first is a part of the second; the third is unrelated.'],
    int2_sep1: ['पहले दोनों में कुछ साझा है, तीसरा बिल्कुल अलग है।', 'The first two overlap; the third is unrelated.'],
    int3: ['तीनों में आपस में कुछ-कुछ साझा है।', 'All three partly overlap with each other.'],
    chain3: ['बीच वाला दोनों से कुछ साझा करता है, पर पहले और तीसरे में कुछ साझा नहीं।', 'The middle one overlaps both, but the first and third do not overlap.']
  };
  function venn(diff) {
    const type = pick(VLEVEL[diff]);
    const [hi, en] = pick(VW[type]);
    const others = shuffle(Object.keys(VD).filter((k) => k !== type && k !== 'sep3tri' && !(type === 'sep3' && k === 'sep3tri'))).slice(0, 3);
    const types = shuffle([type, ...others]);
    const cells = types.map((t, i) => ({ w: VD[t].w, h: 100, label: `(${i + 1})`, inner: `<g fill="none" stroke="#000" stroke-width="2">${VD[t].d}</g>` }));
    const fig = compose(cells, null);
    return figQ('Venn Diagram', 'venn', bi(`नीचे दिए गए आरेखों में से कौन-सा आरेख इन शब्दों के संबंध को सबसे अच्छा दर्शाता है?\n${hi}`, `Which diagram best represents the relationship among these words?\n${en}`), fig, types.indexOf(type), bi(VWHY[type][0], VWHY[type][1]),
      { options: [0, 1, 2, 3].map((i) => bi(`आरेख ${i + 1}`, `Diagram ${i + 1}`)) });
  }

  /* ---------------- SAT maths diagrams ---------------- */
  const P = (cx, cy, r, deg) => [cx + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)];
  const pt = (p, label, dx, dy) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="#000"/>${T(p[0] + (dx || 0), p[1] + (dy || 0), label, 16, 'font-weight="bold"')}`;
  const seg = (a, b, w) => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#000" stroke-width="${w || 2}"/>`;
  function circleAngles(diff) {
    const O = [130, 120], r = 85;
    let body = `<circle cx="${O[0]}" cy="${O[1]}" r="${r}" fill="none" stroke="#000" stroke-width="2.2"/>` + pt(O, 'O', 12, -6);
    let q, ans, x, opts, why;
    if (diff === 'easy') {
      x = pick([60, 70, 80, 100, 110, 120, 130, 140]);
      const a = 180 - x / 2, b = 180 + x / 2;
      const A = P(...O, r, a), B = P(...O, r, b), C = P(...O, r, rand(-40, 40));
      body += seg(O, A) + seg(O, B) + seg(C, A) + seg(C, B) + pt(A, 'A', 14, 14) + pt(B, 'B', -14, 14) + pt(C, 'C', 0, -10) + T(O[0], O[1] + 30, `${x}°`, 15);
      q = bi(`दी गई आकृति में O वृत्त का केन्द्र है और ∠AOB = ${x}° है। ∠ACB का मान है:`, `In the given figure O is the centre of the circle and ∠AOB = ${x}°. The value of ∠ACB is:`);
      ans = x / 2; opts = [x, 180 - x, 90 - x / 2, x / 2 + 10, x / 2 - 10, 180 - x / 2]; why = bi('वृत्त की परिधि पर बना कोण केन्द्र पर बने कोण का आधा होता है।', 'The angle at the circumference is half the angle at the centre.');
    } else if (diff === 'moderate') {
      x = pick([65, 70, 75, 80, 85, 95, 100, 105, 110]);
      const pts = [P(...O, r, 200), P(...O, r, 300), P(...O, r, 30), P(...O, r, 120)];
      body += pts.map((p, i) => seg(p, pts[(i + 1) % 4])).join('') + pt(pts[0], 'A', -12, 12) + pt(pts[1], 'B', -14, -4) + pt(pts[2], 'C', 12, -6) + pt(pts[3], 'D', 14, 12) + T(pts[1][0] + 26, pts[1][1] + 12, `${x}°`, 15);
      q = bi(`ABCD एक चक्रीय चतुर्भुज है। यदि ∠ABC = ${x}° हो, तो ∠ADC का मान है:`, `ABCD is a cyclic quadrilateral. If ∠ABC = ${x}°, then ∠ADC is:`);
      ans = 180 - x; opts = [x, 90 + x / 2, 360 - 2 * x, 180 - x + 10, 90 - x / 2]; why = bi('चक्रीय चतुर्भुज के सम्मुख कोणों का योग 180° होता है।', 'Opposite angles of a cyclic quadrilateral add up to 180°.');
    } else {
      x = pick([100, 110, 120, 130, 140]);
      const Pp = P(...O, r, 90 - x / 2), Q = P(...O, r, 90 + x / 2);
      const d = r / Math.cos(((x / 2) * Math.PI) / 180);
      const Tt = [O[0] + d, O[1]];
      body += seg(O, Pp) + seg(O, Q) + seg(Pp, Tt) + seg(Q, Tt) + pt(Pp, 'P', 0, -10) + pt(Q, 'Q', 0, 22) + pt(Tt, 'T', 12, 5) + T(O[0] + 34, O[1] + 22, `${x}°`, 14);
      q = bi(`O वृत्त का केन्द्र है। बिन्दु P तथा Q पर स्पर्श रेखाएँ PT तथा QT हैं। यदि ∠POQ = ${x}° हो, तो ∠PTQ का मान है:`, `O is the centre of the circle and PT, QT are tangents at P and Q. If ∠POQ = ${x}°, then ∠PTQ is:`);
      ans = 180 - x; opts = [x / 2, 90 - x / 2, 270 - x, x - 30, 180 - x + 20]; why = bi('स्पर्श रेखा त्रिज्या पर लम्ब होती है, अतः ∠PTQ = 180° − ∠POQ।', 'Tangents are perpendicular to radii, so ∠PTQ = 180° − ∠POQ.');
    }
    const uniq = pick4(Math.round(ans), opts.map((v) => Math.round(v)));
    if (!uniq) return null;
    const W = diff === 'hard' ? 420 : 260;
    return { topic: 'Circle Geometry', cat: 'maths', figure: svg(W, 240, body), q, options: uniq.map((v) => bi(v + '°', v + '°')), answer: uniq.indexOf(Math.round(ans)), explanation: why };
  }

  function coordFigure(diff) {
    const trip = diff === 'easy' ? [3, 4, 5] : pick([[3, 4, 5], [6, 8, 10]]);
    const lim = diff === 'easy' ? 5 : 8;
    let x1 = rand(-lim + 1, 0), y1 = rand(-lim + 1, 0);
    let [dx, dy, d] = trip; if (Math.random() < 0.5) [dx, dy] = [dy, dx];
    if (x1 + dx > lim) x1 = lim - dx; if (y1 + dy > lim) y1 = lim - dy;
    if (diff === 'easy') { x1 = 0; y1 = 0; }
    const x2 = x1 + dx, y2 = y1 + dy;
    const s = 200 / (2 * lim + 2), o = 120;
    const X = (x) => o + x * s, Y = (y) => o - y * s;
    let body = '';
    for (let i = -lim; i <= lim; i++) body += `<line x1="${X(i)}" y1="${Y(-lim)}" x2="${X(i)}" y2="${Y(lim)}" stroke="#ddd"/><line x1="${X(-lim)}" y1="${Y(i)}" x2="${X(lim)}" y2="${Y(i)}" stroke="#ddd"/>`;
    body += seg([X(-lim), Y(0)], [X(lim), Y(0)], 1.8) + seg([X(0), Y(-lim)], [X(0), Y(lim)], 1.8) + T(X(lim) + 10, Y(0) + 5, 'X', 13) + T(X(0), Y(lim) - 6, 'Y', 13);
    body += pt([X(x1), Y(y1)], `P(${x1}, ${y1})`, -4, 18) + pt([X(x2), Y(y2)], `Q(${x2}, ${y2})`, 4, -10);
    const opts = shuffle([d, dx + dy, d + 1, Math.abs(dx - dy) || d + 2]);
    if (new Set(opts).size < 4) return null;
    return { topic: 'Coordinate Geometry', cat: 'maths', figure: svg(240, 240, body), q: bi('कार्तीय तल में दिए गए बिन्दुओं P तथा Q के बीच की दूरी कितनी है?', 'What is the distance between the points P and Q shown in the Cartesian plane?'), options: opts.map((v) => bi(`${v} इकाई`, `${v} units`)), answer: opts.indexOf(d), explanation: bi(`√(${dx}² + ${dy}²) = ${d}`, `√(${dx}² + ${dy}²) = ${d}`) };
  }

  function triangleExterior(diff) {
    const a = rand(35, 75), b = rand(35, 75), A = [40, 170], B = [190, 170], C = [100, 40], E = [270, 170];
    let body = seg(A, B) + seg(B, C) + seg(C, A) + seg(B, E) + pt(A, 'A', -10, 14) + pt(B, 'B', 0, 20) + pt(C, 'C', 0, -10) + pt(E, 'D', 8, 20);
    let q, ans, opts;
    if (diff === 'hard') {
      const ext = a + b;
      body += T(62, 160, `${a}°`, 14) + T(214, 160, `${ext}°`, 14);
      q = bi(`दी गई आकृति में ∠CAB = ${a}° तथा बाह्य कोण ∠CBD = ${ext}° है। ∠ACB का मान है:`, `In the figure ∠CAB = ${a}° and the exterior angle ∠CBD = ${ext}°. Find ∠ACB.`);
      ans = b; opts = [a, 180 - ext, 180 - a, ext, b + 10];
    } else {
      body += T(62, 160, `${a}°`, 14) + T(102, 66, `${b}°`, 14);
      q = bi(`दी गई आकृति में ∠CAB = ${a}° तथा ∠ACB = ${b}° है। बाह्य कोण ∠CBD का मान है:`, `In the figure ∠CAB = ${a}° and ∠ACB = ${b}°. Find the exterior angle ∠CBD.`);
      ans = a + b; opts = [180 - a - b, 180 - a, 180 - b, a + b + 10];
    }
    const u = pick4(ans, opts);
    if (!u) return null;
    return { topic: 'Triangle Angles', cat: 'maths', figure: svg(290, 190, body), q, options: u.map((v) => bi(v + '°', v + '°')), answer: u.indexOf(ans), explanation: bi('त्रिभुज का बाह्य कोण दोनों अंतःसम्मुख कोणों के योग के बराबर होता है।', 'An exterior angle equals the sum of the two interior opposite angles.') };
  }

  /* ---------------- rendering helpers ---------------- */
  const src = (s) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  const pngCache = new Map();
  /* SVG text → PNG data URL (for PowerPoint and Google Forms, which cannot take SVG) */
  function toPng(s, scale) {
    const ck = (scale || 2) + '|' + s;
    if (pngCache.has(ck)) return Promise.resolve(pngCache.get(ck));
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const k = scale || 2;
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        const out = c.toDataURL('image/png');
        pngCache.set(ck, out);
        resolve(out);
      };
      img.onerror = () => reject(new Error('figure render failed'));
      img.src = src(s);
    });
  }
  const size = (s) => { const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(s || ''); return m ? { w: +m[1], h: +m[2] } : { w: 400, h: 200 }; };

  /* register generators (cat tells the paper builder where they belong in the UP MAT order) */
  const MAT_FIG = [figSeries, figAnalogy, figOdd, mirrorImage, paperFold, dice, countTriangles, overlap, missingFigure, venn];
  const MATHS_FIG = [circleAngles, coordFigure, triangleExterior];
  /* the four labelled Venn diagrams of a set, e.g. a previous-year paper's direction figure */
  const vennSet = (types) => compose(types.map((t, i) => ({ w: VD[t].w, h: 100, label: `(${i + 1})`, inner: `<g fill="none" stroke="#000" stroke-width="2">${VD[t].d}</g>` })), null);
  window.FIG = { src, toPng, size, MAT_FIG, MATHS_FIG, compose, svg, text: T, vennSet };
})();
