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

  /* ---------------- shape library inside a 100×100 cell ---------------- */
  // e = { t, a: angle (0 = up, clockwise), f: filled?, s: side ±1 for chiral shapes, n: count (dots) }
  // pointers start at the centre; orbit shapes sit on a ring of radius 32
  const POINTERS = ['arrow', 'pin', 'flag', 'hook', 'dblarrow', 'tline'];
  const ORBITS = ['dot', 'tri', 'sq', 'star', 'cross', 'diamond', 'half', 'pent'];
  const CHIRAL = ['flag', 'hook'];
  const SHAPE_HI = { arrow: 'तीर', pin: 'पिन', flag: 'झंडा', hook: 'हुक', dblarrow: 'दोमुँहा तीर', tline: 'T-रेखा', dot: 'वृत्त', tri: 'त्रिभुज', sq: 'वर्ग', star: 'तारा', cross: 'क्रॉस', diamond: 'हीरा', half: 'अर्धवृत्त', pent: 'पंचभुज' };
  const SHAPE_EN = { arrow: 'arrow', pin: 'pin', flag: 'flag', hook: 'hook', dblarrow: 'double arrow', tline: 'T-line', dot: 'circle', tri: 'triangle', sq: 'square', star: 'star', cross: 'cross', diamond: 'diamond', half: 'half circle', pent: 'pentagon' };
  const starPts = (cx, cy, R, r) => Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2, rr = i % 2 ? r : R; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const pentPts = (cx, cy, R) => Array.from({ length: 5 }, (_, i) => { const a = ((2 * Math.PI) / 5) * i - Math.PI / 2; return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`; }).join(' ');
  /* a small shape drawn at (cx, cy) pointing up — used on the orbit and in matrix cells */
  function shapeAt(t, cx, cy, f, sc) {
    const k = sc || 1, fill = f ? '#000' : '#fff', st = 'stroke="#000" stroke-width="2"';
    switch (t) {
      case 'dot': return `<circle cx="${cx}" cy="${cy}" r="${7 * k}" fill="${fill}" ${st}/>`;
      case 'tri': return `<polygon points="${cx},${cy - 9 * k} ${cx - 8 * k},${cy + 7 * k} ${cx + 8 * k},${cy + 7 * k}" fill="${fill}" ${st}/>`;
      case 'sq': return `<rect x="${cx - 7.5 * k}" y="${cy - 7.5 * k}" width="${15 * k}" height="${15 * k}" fill="${fill}" ${st}/>`;
      case 'star': return `<polygon points="${starPts(cx, cy, 10 * k, 4.5 * k)}" fill="${fill}" stroke="#000" stroke-width="1.6"/>`;
      case 'cross': return `<path d="M${cx - 8 * k} ${cy} H${cx + 8 * k} M${cx} ${cy - 8 * k} V${cy + 8 * k}" stroke="#000" stroke-width="${f ? 4 : 2.5}"/>`;
      case 'diamond': return `<polygon points="${cx},${cy - 10 * k} ${cx + 7 * k},${cy} ${cx},${cy + 10 * k} ${cx - 7 * k},${cy}" fill="${fill}" ${st}/>`;
      case 'half': return `<circle cx="${cx}" cy="${cy}" r="${8 * k}" fill="#fff" ${st}/><path d="M${cx - 8 * k} ${cy} A${8 * k} ${8 * k} 0 0 1 ${cx + 8 * k} ${cy} Z" fill="#000"/>`;
      case 'pent': return `<polygon points="${pentPts(cx, cy, 9 * k)}" fill="${fill}" ${st}/>`;
      default: return '';
    }
  }
  function elemSvg(e) {
    const fill = e.f ? '#000' : '#fff';
    const rot = (inner) => `<g transform="rotate(${e.a} 50 50)">${inner}</g>`;
    switch (e.t) {
      case 'arrow': return rot('<line x1="50" y1="50" x2="50" y2="16" stroke="#000" stroke-width="3"/><polygon points="50,7 43,19 57,19" fill="#000"/>');
      case 'dblarrow': return rot('<line x1="50" y1="84" x2="50" y2="16" stroke="#000" stroke-width="3"/><polygon points="50,7 43,19 57,19" fill="#000"/><polygon points="50,93 43,81 57,81" fill="#fff" stroke="#000" stroke-width="2"/>');
      case 'tline': return rot('<line x1="50" y1="56" x2="50" y2="14" stroke="#000" stroke-width="3"/><line x1="38" y1="14" x2="62" y2="14" stroke="#000" stroke-width="3"/>');
      case 'pin': return rot(`<line x1="50" y1="50" x2="50" y2="18" stroke="#000" stroke-width="3"/><circle cx="50" cy="13" r="6" fill="${fill}" stroke="#000" stroke-width="2"/>`);
      case 'flag': return rot(`<line x1="50" y1="56" x2="50" y2="10" stroke="#000" stroke-width="3"/><polygon points="50,10 ${50 + 18 * (e.s || 1)},16 50,23" fill="${fill}" stroke="#000" stroke-width="1.5"/>`);
      case 'hook': return rot(`<polyline points="50,56 50,14 ${50 + 16 * (e.s || 1)},14 ${50 + 16 * (e.s || 1)},24" fill="none" stroke="#000" stroke-width="3"/>`);
      default: return ORBITS.includes(e.t) ? rot(shapeAt(e.t, 50, 18, e.f)) : '';
    }
  }
  const STYLES = ['plain', 'ring', 'diag', 'quad'];
  function styleSvg(st) {
    if (st === 'ring') return '<circle cx="50" cy="50" r="45" fill="none" stroke="#999" stroke-width="1.2"/>';
    if (st === 'diag') return '<path d="M4 4 L96 96 M96 4 L4 96" stroke="#bbb" stroke-width="1" stroke-dasharray="3 3"/>';
    if (st === 'quad') return '<path d="M50 3 V97 M3 50 H97" stroke="#bbb" stroke-width="1" stroke-dasharray="3 3"/>';
    return '';
  }
  const cellOf = (els, style) => {
    const dots = els.find((e) => e.t === 'dots');
    const main = styleSvg(style) + els.filter((e) => e.t !== 'dots').map(elemSvg).join('');
    if (!dots) return { w: 100, h: 100, inner: main };
    // shrink the rotating part and keep a strip at the bottom for the dots so they never overlap
    let row = '';
    const gap = Math.min(12, 84 / Math.max(1, dots.n - 1));
    for (let i = 0; i < dots.n; i++) row += `<circle cx="${50 - ((dots.n - 1) * gap) / 2 + i * gap}" cy="91" r="${dots.n > 7 ? 3.4 : 4}" fill="#000"/>`;
    return { w: 100, h: 100, inner: `<g transform="translate(50 42) scale(0.76) translate(-50 -50)">${main}</g>${row}` };
  };
  const norm = (a) => ((a % 360) + 360) % 360;
  const keyOf = (els) => els.map((e) => [e.t, norm(e.a), e.f ? 1 : 0, e.s || 0, e.n || 0].join(':')).join('|');
  const rotate = (els, d) => els.map((e) => (e.t === 'dots' ? e : Object.assign({}, e, { a: norm(e.a + d) })));
  const mirror = (els) => els.map((e) => (e.t === 'dots' ? e : Object.assign({}, e, { a: norm(360 - e.a), s: e.s ? -e.s : e.s })));
  const flipV = (els) => els.map((e) => (e.t === 'dots' ? e : Object.assign({}, e, { a: norm(180 - e.a), s: e.s ? -e.s : e.s })));
  const invert = (els, idx) => els.map((e, i) => ((idx == null || i === idx) && ORBITS.concat(['pin', 'flag']).includes(e.t) ? Object.assign({}, e, { f: !e.f }) : e));
  /* visually symmetric under rotation by 180 / mirror?  (then a transformation would be invisible) */
  const sameAs = (a, b) => keyOf(a) === keyOf(b);

  /* pick 3 distinct wrong options (by key) */
  function figOptions(correct, wrongs, style) {
    const seen = new Set([keyOf(correct)]), ws = [];
    for (const w of shuffle(wrongs)) { const k = keyOf(w); if (!seen.has(k) && ws.length < 3) { seen.add(k); ws.push(w); } }
    if (ws.length < 3) return null;
    const all = shuffle([correct, ...ws]);
    return { cells: all.map((x) => cellOf(x, style)), answer: all.findIndex((x) => keyOf(x) === keyOf(correct)) };
  }
  const figText = [0, 1, 2, 3].map((i) => bi(`आकृति ${i + 1}`, `Figure ${i + 1}`));
  function figQ(topic, cat, q, figure, answer, explanation, extra) {
    return Object.assign({ topic, cat, q, figure, figOpts: true, options: figText.map((o) => Object.assign({}, o)), answer, explanation }, extra || {});
  }
  /* correct value + 3 distinct wrong values from pool, shuffled; null if not enough */
  function pick4(ans, pool) {
    const w = shuffle([...new Set(pool.map((x) => (typeof x === 'number' ? Math.round(x * 100) / 100 : x)))].filter((x) => x !== ans && (typeof x !== 'number' || x > 0))).slice(0, 3);
    return w.length < 3 ? null : shuffle([ans, ...w]);
  }
  const dirHi = (d) => `${Math.abs(d)}° ${d > 0 ? 'दक्षिणावर्त' : 'वामावर्त'}`, dirEn = (d) => `${Math.abs(d)}° ${d > 0 ? 'clockwise' : 'anticlockwise'}`;

  /* 1. figure series — built from rule "tracks": each element has its own rotation / shading / shape-cycle / count rule */
  function figSeries(diff) {
    const style = pick(STYLES);
    const nTracks = diff === 'easy' ? 1 : diff === 'moderate' ? 2 : rand(2, 3);
    const used = new Set(), tracks = [];
    const freshType = (list) => { const free = list.filter((x) => !used.has(x)); if (!free.length) return null; const t = pick(free); used.add(t); return t; };
    for (let i = 0; i < nTracks; i++) {
      const pointer = i === 0 && Math.random() < 0.6;
      const t = freshType(pointer ? POINTERS : ORBITS);
      if (!t) break;
      const kind = diff === 'hard' && i === 0 ? pick(['grow', 'fixed']) : 'fixed';
      const d = pick(diff === 'easy' ? [45, 90, -45, -90] : [45, 90, 135, -45, -90, -135]);
      const tr = { t, a0: pick([0, 45, 90, 135, 180, 225, 270, 315]), f0: Math.random() < 0.6, s: pick([1, -1]), kind, d };
      if (!pointer && diff !== 'easy' && Math.random() < 0.45) tr.fillAlt = true;
      if (!pointer && diff === 'hard' && !tr.fillAlt && i === 1 && Math.random() < 0.5) { tr.cycle = shuffle(ORBITS.filter((x) => !used.has(x))).slice(0, 3); tr.cycle.forEach((x) => used.add(x)); }
      tracks.push(tr);
    }
    if (diff !== 'easy' && Math.random() < 0.5) tracks.push({ t: 'dots', n0: rand(1, 2), inc: 1 });
    // keep pointers apart from orbit shapes so the figure stays readable
    const at = (k) => tracks.map((tr) => {
      if (tr.t === 'dots') return { t: 'dots', a: 0, n: tr.n0 + tr.inc * k };
      const rotBy = tr.kind === 'grow' ? (tr.d * k * (k + 1)) / 2 : tr.d * k;
      return { t: tr.cycle ? tr.cycle[k % tr.cycle.length] : tr.t, a: norm(tr.a0 + rotBy), f: tr.fillAlt ? (k % 2 === 0) === tr.f0 : tr.f0, s: tr.s };
    });
    if (tracks.filter((x) => x.t !== 'dots').every((tr) => tr.d % 360 === 0)) return null;
    const seq = [0, 1, 2, 3, 4].map(at), right = at(5);
    const wrongs = [at(4), at(6), mirror(right), rotate(right, 45), rotate(right, 90), rotate(right, -90), invert(right, 0), invert(right, 1)];
    tracks.forEach((tr, i) => {
      if (tr.t === 'dots') wrongs.push(right.map((e, j) => (j === i ? Object.assign({}, e, { n: e.n + 1 }) : e)));
      else wrongs.push(right.map((e, j) => (j === i ? Object.assign({}, e, { a: norm(e.a + tr.d) }) : e)), right.map((e, j) => (j === i ? Object.assign({}, e, { a: norm(e.a - tr.d) }) : e)));
    });
    const o = figOptions(right, wrongs, style);
    if (!o) return null;
    const whyHi = [], whyEn = [];
    tracks.forEach((tr) => {
      if (tr.t === 'dots') { whyHi.push(`बिंदु हर बार ${tr.inc} बढ़ते हैं`); whyEn.push(`dots increase by ${tr.inc}`); return; }
      const nm = tr.cycle ? tr.cycle.map((x) => SHAPE_HI[x]).join('→') : SHAPE_HI[tr.t], nmE = tr.cycle ? tr.cycle.map((x) => SHAPE_EN[x]).join('→') : SHAPE_EN[tr.t];
      whyHi.push(tr.kind === 'grow' ? `${nm} ${Math.abs(tr.d)}°, ${2 * Math.abs(tr.d)}°, ${3 * Math.abs(tr.d)}°… ${tr.d > 0 ? 'दक्षिणावर्त' : 'वामावर्त'} घूमता है` : `${nm} हर बार ${dirHi(tr.d)} घूमता है${tr.fillAlt ? ' और भरा/खाली बदलता है' : ''}`);
      whyEn.push(tr.kind === 'grow' ? `the ${nmE} turns ${Math.abs(tr.d)}°, ${2 * Math.abs(tr.d)}°, ${3 * Math.abs(tr.d)}°… ${tr.d > 0 ? 'clockwise' : 'anticlockwise'}` : `the ${nmE} turns ${dirEn(tr.d)} each step${tr.fillAlt ? ' and alternates filled/empty' : ''}`);
    });
    const fig = compose([...seq.map((x) => cellOf(x, style)), { text: '?', tw: 40 }], o.cells);
    return figQ('Figure Series', 'figure', bi('प्रश्न आकृतियों की श्रेणी को आगे बढ़ाने वाली उत्तर आकृति चुनिए।', 'Choose the answer figure which continues the series of problem figures.'), fig, o.answer,
      bi(whyHi.join('; ') + '।', whyEn.join('; ') + '.'), { tpl: `series:${tracks[0].t}:${tracks.length}`, sig: `series:${tracks.map((t) => (t.cycle || [t.t]).join('/') + (t.kind || '') + (t.fillAlt ? 'F' : '')).join(',')}:${style}` });
  }

  /* random figure of 2–3 elements (one pointer, one or two orbit shapes) */
  function randomFigure(nOrb, chiral) {
    const p = chiral ? pick(CHIRAL) : pick(POINTERS);
    const els = [{ t: p, a: pick([0, 45, 90, 135, 180, 225, 270, 315]), f: Math.random() < 0.5, s: pick([1, -1]) }];
    const orbs = shuffle(ORBITS).slice(0, nOrb);
    orbs.forEach((t) => els.push({ t, a: norm(els[0].a + pick([90, 135, 180, 225, 270])), f: Math.random() < 0.5 }));
    return els;
  }

  /* 2. figure analogy  A : B :: C : ? */
  const ANALOGY_TF = {
    easy: [
      ['rot90', (e) => rotate(e, 90), ['आकृति 90° दक्षिणावर्त घूमती है।', 'The figure turns 90° clockwise.']],
      ['rot-90', (e) => rotate(e, -90), ['आकृति 90° वामावर्त घूमती है।', 'The figure turns 90° anticlockwise.']],
      ['rot180', (e) => rotate(e, 180), ['आकृति 180° घूमती है।', 'The figure turns through 180°.']],
      ['invert', (e) => invert(e), ['भरी आकृतियाँ खाली और खाली आकृतियाँ भरी हो जाती हैं।', 'Filled shapes become empty and empty ones become filled.']]
    ],
    moderate: [
      ['mirror', (e) => mirror(e), ['दूसरी आकृति पहली का दर्पण प्रतिबिंब है।', 'The second figure is the mirror image of the first.']],
      ['flipV', (e) => flipV(e), ['दूसरी आकृति पहली का जल प्रतिबिंब (ऊपर-नीचे उलटी) है।', 'The second figure is the water image (upside-down reflection) of the first.']],
      ['rot45', (e) => rotate(e, 45), ['आकृति 45° दक्षिणावर्त घूमती है।', 'The figure turns 45° clockwise.']],
      ['rot135', (e) => rotate(e, -135), ['आकृति 135° वामावर्त घूमती है।', 'The figure turns 135° anticlockwise.']]
    ],
    hard: [
      ['rot90inv', (e) => invert(rotate(e, 90), 1), ['आकृति 90° दक्षिणावर्त घूमती है और छोटी आकृति का भराव बदलता है।', 'The figure turns 90° clockwise and the small shape changes its shading.']],
      ['mirrorRot', (e) => rotate(mirror(e), 90), ['आकृति का दर्पण प्रतिबिंब बनाकर उसे 90° दक्षिणावर्त घुमाया गया है।', 'The figure is mirrored and then turned 90° clockwise.']],
      ['split', (e) => e.map((x, i) => (i === 0 ? Object.assign({}, x, { a: norm(x.a + 90) }) : Object.assign({}, x, { a: norm(x.a - 90) }))), ['बड़ा तत्व 90° दक्षिणावर्त और छोटी आकृति 90° वामावर्त घूमती है।', 'The main element turns 90° clockwise while the small shape turns 90° anticlockwise.']],
      ['rot135inv', (e) => invert(rotate(e, 135)), ['आकृति 135° दक्षिणावर्त घूमती है और सभी भराव उलट जाते हैं।', 'The figure turns 135° clockwise and all shading is reversed.']]
    ]
  };
  function figAnalogy(diff) {
    const style = pick(STYLES);
    const [name, tf, why] = pick(ANALOGY_TF[diff]);
    const chiral = /mirror|flip/i.test(name);
    const nOrb = diff === 'easy' ? 1 : rand(1, 2);
    const ok = (x) => !sameAs(tf(x), x) && !sameAs(rotate(x, 180), x);
    let A, C;
    for (let i = 0; i < 40; i++) { A = randomFigure(nOrb, chiral); if (ok(A)) break; }
    for (let i = 0; i < 40; i++) { C = randomFigure(nOrb, chiral); if (ok(C) && C[0].t !== A[0].t) break; }
    if (!ok(A) || !ok(C)) return null;
    const right = tf(C);
    const wrongs = [C, rotate(right, 90), rotate(right, 180), rotate(right, -90), mirror(right), flipV(right), invert(right), invert(right, 1), rotate(C, 45)];
    const o = figOptions(right, wrongs, style);
    if (!o) return null;
    const fig = compose([cellOf(A, style), { text: ':', tw: 14 }, cellOf(tf(A), style), { text: '::', tw: 24 }, cellOf(C, style), { text: ':', tw: 14 }, { w: 100, h: 100, inner: T(50, 62, '?', 40, 'font-weight="bold"') }], o.cells);
    return figQ('Figure Analogy', 'analogy', bi('जो संबंध पहली और दूसरी आकृति में है, वही संबंध तीसरी आकृति और किस उत्तर आकृति में है?', 'The first two figures are related in a certain way. Which answer figure is related to the third figure in the same way?'), fig, o.answer, bi(why[0], why[1]),
      { tpl: `analogy:${name}`, sig: `analogy:${name}:${A[0].t}:${C[0].t}:${style}` });
  }

  /* 3. odd figure out — three figures obey one rule, one breaks it */
  function figOdd(diff) {
    const style = pick(STYLES);
    const rule = pick({ easy: ['count', 'fill', 'shape'], moderate: ['angle', 'shape', 'fill'], hard: ['mirror', 'angle'] }[diff]);
    const base = randomFigure(diff === 'easy' ? 1 : 2, true);
    if (rule === 'count' || Math.random() < 0.3) base.push({ t: 'dots', a: 0, n: rand(2, 4) });
    const angles = shuffle([0, 45, 90, 135, 180, 225, 270, 315]).slice(0, 4);
    const figs = angles.map((a) => rotate(base, a));
    const oddIdx = rand(0, 3);
    let why;
    if (rule === 'count') { figs[oddIdx] = figs[oddIdx].map((e) => (e.t === 'dots' ? Object.assign({}, e, { n: e.n + pick([1, -1]) }) : e)); why = bi(`बाकी सभी में ${base.find((e) => e.t === 'dots').n} बिंदु हैं।`, `All the others have ${base.find((e) => e.t === 'dots').n} dots.`); }
    else if (rule === 'fill') { figs[oddIdx] = invert(figs[oddIdx], 1); why = bi(`बाकी सभी में ${SHAPE_HI[base[1].t]} ${base[1].f ? 'भरा' : 'खाली'} है।`, `In all the others the ${SHAPE_EN[base[1].t]} is ${base[1].f ? 'filled' : 'empty'}.`); }
    else if (rule === 'shape') { const nt = pick(ORBITS.filter((t) => !base.some((e) => e.t === t))); figs[oddIdx] = figs[oddIdx].map((e, i) => (i === 1 ? Object.assign({}, e, { t: nt }) : e)); why = bi(`बाकी सभी में ${SHAPE_HI[base[1].t]} है, इसमें ${SHAPE_HI[nt]}।`, `All the others have a ${SHAPE_EN[base[1].t]}; this one has a ${SHAPE_EN[nt]}.`); }
    else if (rule === 'angle') { figs[oddIdx] = figs[oddIdx].map((e, i) => (i === 1 ? Object.assign({}, e, { a: norm(e.a + pick([90, 180, 270])) }) : e)); why = bi(`बाकी सभी में ${SHAPE_HI[base[1].t]} की स्थिति ${SHAPE_HI[base[0].t]} के सापेक्ष एक जैसी है।`, `In all the others the ${SHAPE_EN[base[1].t]} keeps the same position relative to the ${SHAPE_EN[base[0].t]}.`); }
    else { figs[oddIdx] = mirror(figs[oddIdx]); why = bi('बाकी तीनों एक ही आकृति के घुमाए हुए रूप हैं; यह उसका दर्पण प्रतिबिंब है।', 'The other three are rotations of one figure; this one is its mirror image.'); }
    // the odd one must not accidentally equal a rotation of the base
    if ([0, 45, 90, 135, 180, 225, 270, 315].some((a) => sameAs(rotate(base, a), figs[oddIdx]))) return null;
    const fig = compose(figs.map((x) => cellOf(x, style)).map((c, i) => Object.assign(c, { label: `(${i + 1})` })), null);
    return figQ('Odd Figure Out', 'odd', bi('निम्नलिखित आकृतियों में से भिन्न आकृति चुनिए।', 'Choose the figure which is different from the others.'), fig, oddIdx, why, { tpl: `odd:${rule}`, sig: `odd:${rule}:${base.map((e) => e.t).join('/')}:${style}` });
  }

  /* 3a. matrix completion — 3×3 grid with one missing cell */
  function matrix(diff) {
    const shapes = shuffle(ORBITS.filter((t) => t !== 'half')).slice(0, 3);
    const cellSvg = (c) => {
      if (!c) return T(45, 57, '?', 34, 'font-weight="bold"');
      const pos = { 1: [[45, 45]], 2: [[30, 45], [60, 45]], 3: [[45, 28], [28, 60], [62, 60]], 4: [[30, 30], [60, 30], [30, 60], [60, 60]] }[c.n];
      const body = pos.map(([x, y]) => shapeAt(c.t, x, y, c.f, c.n > 2 ? 0.9 : 1.1)).join('');
      return c.a ? `<g transform="rotate(${c.a} 45 45)">${body}</g>` : body;
    };
    let grid, rule;
    const latin = shuffle([[0, 1, 2], [1, 2, 0], [2, 0, 1]]);
    if (diff === 'easy') { // each row one shape, count 1,2,3 across
      const fills = [Math.random() < 0.5, Math.random() < 0.5, Math.random() < 0.5];
      grid = [0, 1, 2].map((r) => [0, 1, 2].map((c) => ({ t: shapes[r], n: c + 1, f: fills[r] })));
      rule = bi('हर पंक्ति में एक ही आकृति है और उनकी संख्या 1, 2, 3 बढ़ती है।', 'Each row has one shape and their number grows 1, 2, 3.');
    } else if (diff === 'moderate') { // Latin square of shapes, each row a fixed count, column decides fill
      const counts = shuffle([1, 2, 3]);
      grid = [0, 1, 2].map((r) => [0, 1, 2].map((c) => ({ t: shapes[latin[r][c]], n: counts[r], f: c === 1 })));
      rule = bi('हर पंक्ति व स्तंभ में तीनों आकृतियाँ एक-एक बार आती हैं; हर पंक्ति में संख्या समान है और बीच का स्तंभ भरा है।', 'Each row and column has all three shapes once; each row keeps one count and the middle column is filled.');
    } else { // Latin square of shapes and Latin square of counts, filled when count is odd
      const lat2 = shuffle([[0, 1, 2], [2, 0, 1], [1, 2, 0]]);
      grid = [0, 1, 2].map((r) => [0, 1, 2].map((c) => ({ t: shapes[latin[r][c]], n: lat2[r][c] + 2, f: (lat2[r][c] + 2) % 2 === 1 })));
      rule = bi('हर पंक्ति व स्तंभ में तीनों आकृतियाँ और 2, 3, 4 की संख्या एक-एक बार आती है; विषम संख्या वाली आकृतियाँ भरी हैं।', 'Every row and column has each shape and each count (2, 3, 4) once; shapes in odd counts are filled.');
    }
    const ans = grid[2][2];
    const k = (c) => `${c.t}${c.n}${c.f ? 1 : 0}`;
    const pool = [Object.assign({}, ans, { n: ans.n === 1 ? 2 : ans.n - 1 }), Object.assign({}, ans, { f: !ans.f }), Object.assign({}, ans, { t: shapes.find((s) => s !== ans.t) }), Object.assign({}, ans, { n: ans.n === 4 ? 3 : ans.n + 1 }), Object.assign({}, ans, { t: shapes.find((s) => s !== ans.t), f: !ans.f }), grid[2][1], grid[1][2]];
    const seen = new Set([k(ans)]), ws = [];
    for (const p of shuffle(pool)) if (p.n >= 1 && p.n <= 4 && !seen.has(k(p)) && ws.length < 3) { seen.add(k(p)); ws.push(p); }
    if (ws.length < 3) return null;
    const opts = shuffle([ans, ...ws]);
    let body = '';
    grid.forEach((row, r) => row.forEach((c, j) => { body += `<g transform="translate(${12 + j * 90},${12 + r * 90})"><rect width="90" height="90" fill="#fff" stroke="#000" stroke-width="1.6"/>${cellSvg(r === 2 && j === 2 ? null : c)}</g>`; }));
    const W = 294;
    const probe = { w: W - 24, h: 270, noFrame: true, inner: `<g transform="translate(-12 -12)">${body}</g>` };
    const fig = compose([probe], opts.map((c) => ({ w: 90, h: 90, inner: cellSvg(c) })));
    return figQ('Matrix Completion', 'figure', bi('आव्यूह (मैट्रिक्स) के रिक्त खाने में कौन-सी उत्तर आकृति आएगी?', 'Which answer figure completes the matrix?'), fig, opts.findIndex((c) => k(c) === k(ans)), rule, { tpl: `matrix:${diff}`, sig: `matrix:${diff}:${shapes.join('/')}` });
  }

  /* 3b. cube net — which face is opposite a given face when the net is folded */
  const NET_SYMBOLS = [['1', '2', '3', '4', '5', '6'], ['A', 'B', 'C', 'D', 'E', 'F'], ['P', 'Q', 'R', 'S', 'T', 'U'], ['★', '●', '▲', '■', '◆', '✚']];
  function cubeNet(diff) {
    const syms = shuffle(pick(diff === 'easy' ? NET_SYMBOLS.slice(0, 1) : NET_SYMBOLS)).slice(0, 6);
    // 1-4-1 nets: a strip of four with one flap above and one below (any columns) — flaps are opposite, strip faces 0–2 and 1–3 are opposite
    const top = diff === 'easy' ? 1 : rand(0, 3), bot = diff === 'easy' ? 1 : rand(0, 3);
    const cells = [[top, 0], [0, 1], [1, 1], [2, 1], [3, 1], [bot, 2]];
    const opp = { 0: 5, 5: 0, 1: 3, 3: 1, 2: 4, 4: 2 };
    const ask = diff === 'hard' ? pick([1, 2, 3, 4]) : pick([0, 5, 1, 2, 3, 4]);
    const ans = opp[ask];
    const s = 44;
    let body = cells.map(([c, r], i) => `<rect x="${10 + c * s}" y="${10 + r * s}" width="${s}" height="${s}" fill="#fff" stroke="#000" stroke-width="2"/>` + T(10 + c * s + s / 2, 10 + r * s + s / 2 + 8, syms[i], 22, 'font-weight="bold"')).join('');
    const fig = svg(20 + 4 * s, 20 + 3 * s, body);
    const opts = shuffle([syms[ans], ...shuffle([0, 1, 2, 3, 4, 5].filter((i) => i !== ans && i !== ask)).slice(0, 3).map((i) => syms[i])]);
    return { topic: 'Cube Net', cat: 'figure', figure: fig, q: bi(`दिए गए खुले घन (जाल) को मोड़कर घन बनाने पर "${syms[ask]}" के विपरीत फलक पर क्या होगा?`, `When the given net is folded into a cube, what will be on the face opposite "${syms[ask]}"?`),
      options: opts.map((x) => bi(x, x)), answer: opts.indexOf(syms[ans]), explanation: bi('मोड़ने पर एक पंक्ति में एक-एक छोड़कर आने वाले फलक, और पट्टी के ऊपर व नीचे जुड़े फलक आपस में विपरीत होते हैं।', 'In a straight strip, faces with one face between them are opposite; the flaps above and below the strip are opposite.'),
      tpl: `net:${syms[0]}`, sig: `net:${top}${bot}:${syms.join('')}` };
  }

  /* 3c. counting squares in a grid */
  function countSquares(diff) {
    const [m, n, extra] = pick({ easy: [[2, 2, 0], [3, 1, 0]], moderate: [[3, 2, 0], [3, 3, 0], [4, 1, 0]], hard: [[4, 3, 0], [4, 4, 0], [3, 3, 1], [5, 2, 0]] }[diff]);
    const s = 40;
    let body = '';
    for (let i = 0; i <= m; i++) body += `<line x1="${10 + i * s}" y1="10" x2="${10 + i * s}" y2="${10 + n * s}" stroke="#000" stroke-width="2.2"/>`;
    for (let j = 0; j <= n; j++) body += `<line x1="10" y1="${10 + j * s}" x2="${10 + m * s}" y2="${10 + j * s}" stroke="#000" stroke-width="2.2"/>`;
    let ans = 0;
    for (let k = 1; k <= Math.min(m, n); k++) ans += (m - k + 1) * (n - k + 1);
    // hard variant: a tilted square joining the mid-points of the outer square's sides
    if (extra) { const c = 10 + (m * s) / 2, r = (m * s) / 2; body += `<polygon points="${c},10 ${10 + m * s},${10 + r} ${c},${10 + n * s} 10,${10 + r}" fill="none" stroke="#000" stroke-width="2.2"/>`; ans += 1; }
    const opts = pick4(ans, [ans - 1, ans + 1, ans - 2, ans + 2, m * n, ans + 4]);
    if (!opts) return null;
    return { topic: 'Counting Figures', cat: 'figure', figure: svg(20 + m * s, 20 + n * s, body), q: bi('दी गई आकृति में कुल कितने वर्ग हैं?', 'How many squares are there in the given figure?'), options: opts.map((x) => bi(String(x), String(x))), answer: opts.indexOf(ans),
      explanation: bi(`सभी आकार के वर्ग गिनने पर कुल ${ans}`, `Counting squares of every size gives ${ans}.`), tpl: 'squares', sig: `sq:${m}x${n}:${extra}` };
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
      fig, keys.indexOf(right), water ? bi('जल प्रतिबिंब में ऊपर-नीचे उलट जाता है, बाएँ-दाएँ नहीं।', 'A water image is flipped top-to-bottom, not left-to-right.') : bi('दर्पण प्रतिबिंब में बाएँ-दाएँ उलट जाता है।', 'A mirror image is flipped left-to-right.'),
      { tpl: `mirror:${water}`, sig: `mirror:${word}` });
  }

  /* 5. paper folding and punching */
  function paperFold(diff) {
    const twoFolds = diff !== 'easy';
    const holes = [];
    const nh = diff === 'hard' ? rand(2, 3) : diff === 'moderate' ? rand(1, 2) : rand(1, 2);
    const shapes = shuffle(['c', 'sq', 'tri', 'c']);
    for (let t = 0; holes.length < nh && t < 80; t++) {
      const h = { x: rand(58, 92), y: twoFolds ? rand(58, 92) : rand(12, 88), sq: shapes[holes.length] };
      if (holes.every((o) => Math.hypot(o.x - h.x, o.y - h.y) > 18)) holes.push(h);
    }
    if (holes.length < nh) return null;
    const unfold = (hs, v, h) => {
      let out = hs.slice();
      if (h) out = out.concat(out.map((p) => Object.assign({}, p, { y: 100 - p.y })));
      if (v) out = out.concat(out.map((p) => Object.assign({}, p, { x: 100 - p.x })));
      return out;
    };
    const holeSvg = (p) => (p.sq === 'sq' ? `<rect x="${p.x - 5}" y="${p.y - 5}" width="10" height="10" fill="#000"/>` : p.sq === 'tri' ? `<polygon points="${p.x},${p.y - 6} ${p.x - 6},${p.y + 5} ${p.x + 6},${p.y + 5}" fill="#000"/>` : `<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="#000"/>`);
    // the whole question is drawn in one of four orientations (fold right→left, bottom→top…) for variety
    const orient = pick(['', 'mx', 'fy', 'r180']);
    const tf = (w, h) => ({ '': '', mx: `translate(${w} 0) scale(-1 1)`, fy: `translate(0 ${h}) scale(1 -1)`, r180: `translate(${w} ${h}) scale(-1 -1)` }[orient]);
    const wrapT = (c) => Object.assign(c, { inner: `<g transform="${tf(c.w, c.h)}">${c.inner}</g>` });
    const sheet = (hs) => wrapT({ w: 100, h: 100, inner: hs.map(holeSvg).join('') });
    const right = unfold(holes, true, twoFolds);
    const wrongSets = [holes, unfold(holes, true, false), unfold(holes, false, true), unfold(holes.map((p) => Object.assign({}, p, { x: p.y, y: p.x })), true, twoFolds), right.slice(0, right.length - 1), right.map((p) => Object.assign({}, p, { y: 100 - p.y + (twoFolds ? 0 : 8) }))];
    const k = (hs) => hs.map((p) => `${Math.round(p.x)},${Math.round(p.y)},${p.sq}`).sort().join(';');
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
    steps.forEach(wrapT);
    const fig = compose(steps, all.map(sheet));
    return figQ('Paper Folding', 'figure', bi('एक कागज़ को चित्र के अनुसार मोड़कर उसमें छेद किया गया है। खोलने पर कागज़ कैसा दिखेगा?', 'A sheet of paper is folded as shown and punched. How will it look when unfolded?'), fig, all.findIndex((x) => k(x) === k(right)),
      bi('हर मोड़ खोलने पर छेद मोड़ की रेखा के दूसरी ओर दर्पण-स्थिति में दिखते हैं।', 'Each unfold mirrors the holes across that fold line.'), { tpl: `fold:${twoFolds}:${orient}`, sig: `fold:${twoFolds}:${orient}:${holes.map((h) => h.sq).join('')}` });
  }

  /* 6. dice — two physically consistent views of one cube */
  function cubeSvg(top, left, right) {
    return '<polygon points="50,8 88,27 50,46 12,27" fill="#f2f2f2" stroke="#000" stroke-width="2"/><polygon points="12,27 50,46 50,92 12,73" fill="#fff" stroke="#000" stroke-width="2"/><polygon points="50,46 88,27 88,73 50,92" fill="#e4e4e4" stroke="#000" stroke-width="2"/>' +
      T(50, 33, top, 18, 'font-weight="bold"') + T(31, 66, left, 18, 'font-weight="bold"') + T(69, 66, right, 18, 'font-weight="bold"');
  }
  function dice(diff) {
    const set = diff === 'easy' ? NET_SYMBOLS[0] : pick(NET_SYMBOLS.slice(0, 3));
    const n = shuffle(set.slice());
    const [U1, D, F, B, R, L] = n; // up, down, front, back, right, left
    // view from front-right corner: top=U, left=F, right=R; from back-left corner: top=U, left=B, right=L
    const v1 = cubeSvg(U1, F, R), v2 = cubeSvg(U1, B, L);
    let ask, ans, why;
    if (diff === 'hard') { ask = F; ans = B; why = bi(`ऊपर ${U1} के चारों ओर दक्षिणावर्त क्रम ${F}, ${R}, ${B}, ${L} है, अतः ${F} के विपरीत ${B}।`, `Around the top ${U1} the clockwise order is ${F}, ${R}, ${B}, ${L}, so ${B} is opposite ${F}.`); }
    else { ask = U1; ans = D; why = bi(`${U1} के साथ ${F}, ${R}, ${B}, ${L} दिखते हैं, ये सब आसन्न हैं; बची संख्या ${D} विपरीत है।`, `${F}, ${R}, ${B}, ${L} all touch ${U1}; the remaining number ${D} is opposite.`); }
    const opts = shuffle([ans, ...shuffle(n.filter((x) => x !== ans && x !== ask)).slice(0, 3)]);
    const fig = compose([{ w: 100, h: 100, inner: v1, label: '(i)' }, { w: 100, h: 100, inner: v2, label: '(ii)' }], null);
    return { topic: 'Dice', cat: 'figure', figure: fig, q: bi(`एक ही पासे की दो स्थितियाँ दिखाई गई हैं। ${ask} के विपरीत फलक पर क्या है?`, `Two positions of the same die are shown. What is on the face opposite ${ask}?`), options: opts.map((x) => bi(String(x), String(x))), answer: opts.indexOf(ans), explanation: why,
      tpl: `dice:${diff === 'hard' ? 'side' : 'top'}`, sig: `dice:${n.join('')}` };
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
    return { tpl: 'triangles', sig: `tri:${m}:${h}`, topic: 'Counting Figures', cat: 'figure', figure: fig, q: bi('दी गई आकृति में कुल कितने त्रिभुज हैं?', 'How many triangles are there in the given figure?'), options: opts.map((x) => bi(String(x), String(x))), answer: opts.indexOf(ans),
      explanation: bi(`हर पट्टी में ${(m + 1) * (m + 2) / 2} त्रिभुज × ${h + 1} पट्टियाँ = ${ans}`, `${(m + 1) * (m + 2) / 2} triangles per strip × ${h + 1} strip(s) = ${ans}`) };
  }

  /* 8. numbers in overlapping circle, square and triangle */
  const OV = { C: [70, 121], S: [214, 80], T: [193, 213], CS: [146, 89], CT: [114, 192], ST: [201, 158], CST: [160, 150] };
  function overlap(diff) {
    const regs = Object.keys(OV);
    const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, regs.length);
    const val = {}; regs.forEach((r, i) => { val[r] = nums[i]; });
    const flip = Math.random() < 0.5;
    const X = (x) => (flip ? 300 - x : x);
    const body = `<g transform="${flip ? 'translate(300 0) scale(-1 1)' : ''}"><circle cx="110" cy="130" r="80" fill="none" stroke="#000" stroke-width="2.5"/><rect x="120" y="45" width="130" height="130" fill="none" stroke="#000" stroke-width="2.5"/><polygon points="40,250 270,250 180,90" fill="none" stroke="#000" stroke-width="2.5"/></g>` +
      regs.map((r) => T(X(OV[r][0]), OV[r][1] + 7, val[r], 20, 'font-weight="bold"')).join('');
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
    return { tpl: `overlap:${diff}`, sig: `overlap:${nums.join('')}`, topic: 'Numbers in Figures', cat: 'figurenum', figure: fig, q, options: opts.map((x) => bi(String(x), String(x))), answer: opts.indexOf(ans), explanation: why };
  }

  /* 9. missing number in figures (circle in four parts with a centre) */
  function missingFigure(diff) {
    const rule = {
      easy: [(a, b, c, d) => a + b + c + d, 'बीच की संख्या = चारों का योग', 'Centre = sum of the four numbers'],
      moderate: [(a, b, c, d) => a * c + b * d, 'बीच = (ऊपर × नीचे) + (बाएँ × दाएँ)', 'Centre = (top × bottom) + (left × right)'],
      hard: [(a, b, c, d) => (a + c) * (b + d) - a * c, 'बीच = (ऊपर + नीचे) × (बाएँ + दाएँ) − ऊपर × नीचे', 'Centre = (top + bottom) × (left + right) − top × bottom']
    }[diff];
    const sets = [0, 1, 2].map(() => [rand(1, 9), rand(1, 9), rand(1, 9), rand(1, 9)]); // top, right, bottom, left
    const sqr = Math.random() < 0.5;
    const outline = sqr ? '<rect x="6" y="6" width="98" height="98" fill="none" stroke="#000" stroke-width="2"/><line x1="6" y1="6" x2="104" y2="104" stroke="#000" stroke-width="1.5"/><line x1="104" y1="6" x2="6" y2="104" stroke="#000" stroke-width="1.5"/><rect x="41" y="41" width="28" height="28" fill="#fff" stroke="#000" stroke-width="2"/>'
      : '<circle cx="55" cy="55" r="50" fill="none" stroke="#000" stroke-width="2"/><line x1="20" y1="20" x2="90" y2="90" stroke="#000" stroke-width="1.5"/><line x1="90" y1="20" x2="20" y2="90" stroke="#000" stroke-width="1.5"/><circle cx="55" cy="55" r="14" fill="#fff" stroke="#000" stroke-width="2"/>';
    const cell = (s, centre) => ({ w: 110, h: 110, noFrame: sqr, inner: outline +
      T(55, 28, s[0], 17, 'font-weight="bold"') + T(88, 61, s[1], 17, 'font-weight="bold"') + T(55, 98, s[2], 17, 'font-weight="bold"') + T(22, 61, s[3], 17, 'font-weight="bold"') + T(55, 61, centre, centre === '?' ? 17 : String(centre).length > 2 ? 11 : 14, 'font-weight="bold"') });
    const val = (s) => rule[0](s[0], s[1], s[2], s[3]);
    const ans = val(sets[2]);
    const fig = compose(sets.map((s, i) => cell(s, i === 2 ? '?' : val(s))), null);
    const opts = pick4(ans, [ans + 1, ans - 1, ans + 2, ans - 2, ans + sets[2][0], ans + 5, ans - 4]);
    if (!opts) return null;
    return { tpl: `missfig:${diff}:${sqr}`, sig: `missfig:${sets.flat().join('')}`, topic: 'Missing Number (Figure)', cat: 'figurenum', figure: fig, q: bi('तीनों आकृतियों में संख्याएँ एक ही नियम से हैं। प्रश्नचिह्न (?) के स्थान पर कौन-सी संख्या आएगी?', 'The numbers in all three figures follow the same rule. Which number replaces the question mark (?)?'), options: opts.map((x) => bi(String(x), String(x))), answer: opts.indexOf(ans), explanation: bi(rule[1], rule[2]) };
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
    nest3: [['वाराणसी, उत्तर प्रदेश, भारत', 'Varanasi, Uttar Pradesh, India'], ['आम, फल, पौधों से प्राप्त भोजन', 'Mango, Fruit, Plant food'], ['मोर, पक्षी, जन्तु', 'Peacock, Bird, Animals'], ['हिंदी, भारतीय भाषाएँ, भाषाएँ', 'Hindi, Indian languages, Languages'], ['गंगा, नदी, जलस्रोत', 'Ganga, River, Water bodies'], ['सूर्य, तारा, आकाशीय पिंड', 'Sun, Star, Heavenly bodies'], ['लखनऊ, उत्तर प्रदेश, भारत', 'Lucknow, Uttar Pradesh, India'], ['गुलाब, फूल, पौधा', 'Rose, Flower, Plant'], ['गौरैया, पक्षी, जीव', 'Sparrow, Bird, Living beings'], ['सेब, फल, भोजन', 'Apple, Fruit, Food'], ['सोना, धातु, तत्व', 'Gold, Metal, Element'], ['वर्ग, आयत, चतुर्भुज', 'Square, Rectangle, Quadrilateral'], ['प्राकृत संख्याएँ, पूर्णांक, परिमेय संख्याएँ', 'Natural numbers, Integers, Rational numbers']],
    sep3: [['बादल, जूता, आम', 'Cloud, Shoe, Mango'], ['रेलगाड़ी, फूल, घड़ी', 'Train, Flower, Clock'], ['नमक, पहाड़, कुत्ता', 'Salt, Mountain, Dog'], ['तारा, पेंसिल, मछली', 'Star, Pencil, Fish'], ['कलम, मेज़, गाय', 'Pen, Table, Cow'], ['सूर्य, गुलाब, बस', 'Sun, Rose, Bus'], ['गेहूँ, लोहा, बाघ', 'Wheat, Iron, Tiger'], ['जूते, नदी, पेंसिल', 'Shoes, River, Pencil'], ['चंद्रमा, कुर्सी, शेर', 'Moon, Chair, Lion'], ['पहाड़, चावल, घड़ी', 'Mountain, Rice, Clock']],
    two_in_one: [['मंगल, शुक्र, ग्रह', 'Mars, Venus, Planets'], ['हाथ, पैर, शरीर', 'Hand, Leg, Body'], ['सोना, चाँदी, धातु', 'Gold, Silver, Metals'], ['गंगा, यमुना, नदियाँ', 'Ganga, Yamuna, Rivers'], ['आँख, कान, ज्ञानेन्द्रियाँ', 'Eye, Ear, Sense organs'], ['कलम, पेंसिल, लेखन सामग्री', 'Pen, Pencil, Stationery'], ['गाय, कुत्ता, जानवर', 'Cow, Dog, Animals'], ['हिंदी, अंग्रेज़ी, भाषा', 'Hindi, English, Language'], ['आम, केला, फल', 'Mango, Banana, Fruits'], ['गेहूँ, चावल, अनाज', 'Wheat, Rice, Cereals'], ['लखनऊ, कानपुर, उत्तर प्रदेश', 'Lucknow, Kanpur, Uttar Pradesh'], ['भाई, बहन, परिवार', 'Brother, Sister, Family']],
    int2_in_one: [['खिलाड़ी, विद्यार्थी, मनुष्य', 'Players, Students, Human beings'], ['गायक, माताएँ, मनुष्य', 'Singers, Mothers, Human beings'], ['विषम संख्याएँ, अभाज्य संख्याएँ, पूर्ण संख्याएँ', 'Odd numbers, Prime numbers, Whole numbers'], ['शिक्षक, महिलाएँ, मनुष्य', 'Teachers, Women, Human beings'], ['गायक, नर्तक, कलाकार', 'Singers, Dancers, Artists'], ['डॉक्टर, पुरुष, मनुष्य', 'Doctors, Men, Human beings'], ['सम संख्याएँ, अभाज्य संख्याएँ, प्राकृत संख्याएँ', 'Even numbers, Prime numbers, Natural numbers'], ['लेखक, कवि, मनुष्य', 'Writers, Poets, Human beings']],
    nest2_sep1: [['कौआ, पक्षी, पेंसिल', 'Crow, Bird, Pencil'], ['ताँबा, धातु, कपास', 'Copper, Metal, Cotton'], ['गेहूँ, अनाज, घड़ी', 'Wheat, Cereal, Clock'], ['गुलाब, फूल, कार', 'Rose, Flower, Car'], ['आम, फल, लोहा', 'Mango, Fruit, Iron'], ['शेर, जानवर, मेज़', 'Lion, Animal, Table'], ['दिल्ली, भारत, चंद्रमा', 'Delhi, India, Moon'], ['हिंदी, भाषा, नदी', 'Hindi, Language, River']],
    int2_sep1: [['तैराक, धावक, पत्थर', 'Swimmers, Runners, Stones'], ['कवि, शिक्षक, नदियाँ', 'Poets, Teachers, Rivers'], ['डॉक्टर, महिलाएँ, मेज़', 'Doctors, Women, Tables'], ['गायक, शिक्षक, पेड़', 'Singers, Teachers, Trees'], ['विद्यार्थी, खिलाड़ी, पुस्तकें', 'Students, Players, Books'], ['माताएँ, डॉक्टर, कुर्सियाँ', 'Mothers, Doctors, Chairs']],
    chain3: [['फूल, सफ़ेद वस्तुएँ, कपड़ा', 'Flowers, White things, Cloth'], ['मछलियाँ, तैराक, मनुष्य', 'Fish, Swimmers, Human beings']],
    int3: [['खिलाड़ी, विद्यार्थी, लड़के', 'Players, Students, Boys'], ['किसान, पिता, शिक्षित लोग', 'Farmers, Fathers, Educated people'], ['डॉक्टर, महिलाएँ, गायक', 'Doctors, Women, Singers'], ['शिक्षक, पुरुष, स्नातक', 'Teachers, Men, Graduates'], ['विद्यार्थी, खिलाड़ी, लड़कियाँ', 'Students, Players, Girls'], ['माताएँ, शिक्षक, लेखक', 'Mothers, Teachers, Writers']]
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
      { options: [0, 1, 2, 3].map((i) => bi(`आरेख ${i + 1}`, `Diagram ${i + 1}`)), tpl: `venn:${type}`, sig: `venn:${en}` });
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
    return { tpl: `circle:${diff}`, sig: `circle:${diff}:${x}`, topic: 'Circle Geometry', cat: 'maths', figure: svg(W, 240, body), q, options: uniq.map((v) => bi(v + '°', v + '°')), answer: uniq.indexOf(Math.round(ans)), explanation: why };
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
    return { tpl: 'coord', sig: `coord:${x1}${y1}${x2}${y2}`, topic: 'Coordinate Geometry', cat: 'maths', figure: svg(240, 240, body), q: bi('कार्तीय तल में दिए गए बिन्दुओं P तथा Q के बीच की दूरी कितनी है?', 'What is the distance between the points P and Q shown in the Cartesian plane?'), options: opts.map((v) => bi(`${v} इकाई`, `${v} units`)), answer: opts.indexOf(d), explanation: bi(`√(${dx}² + ${dy}²) = ${d}`, `√(${dx}² + ${dy}²) = ${d}`) };
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
    return { tpl: `ext:${diff}`, sig: `ext:${a}:${b}`, topic: 'Triangle Angles', cat: 'maths', figure: svg(290, 190, body), q, options: u.map((v) => bi(v + '°', v + '°')), answer: u.indexOf(ans), explanation: bi('त्रिभुज का बाह्य कोण दोनों अंतःसम्मुख कोणों के योग के बराबर होता है।', 'An exterior angle equals the sum of the two interior opposite angles.') };
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
  const MAT_FIG = [figSeries, figAnalogy, figOdd, matrix, cubeNet, countSquares, mirrorImage, paperFold, dice, countTriangles, overlap, missingFigure, venn];
  const MATHS_FIG = [circleAngles, coordFigure, triangleExterior];
  /* the four labelled Venn diagrams of a set, e.g. a previous-year paper's direction figure */
  const vennSet = (types) => compose(types.map((t, i) => ({ w: VD[t].w, h: 100, label: `(${i + 1})`, inner: `<g fill="none" stroke="#000" stroke-width="2">${VD[t].d}</g>` })), null);
  window.FIG = { src, toPng, size, MAT_FIG, MATHS_FIG, compose, svg, text: T, vennSet };
})();
