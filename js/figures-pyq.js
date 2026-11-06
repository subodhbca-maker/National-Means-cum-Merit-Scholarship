/* Basic Pathshala - NMMS : figure generators learnt from the UP NMMS papers 2023–2027.
   Each one copies a figure type that keeps coming back in the real booklets — numbers placed in a triangle,
   a ring, a Y-fork, a split circle, a plus or a wheel; four symbols turning round the corners; a letter
   square turning; polygons gaining sides while inner lines drop — with fresh numbers, shapes and rules every time.
   Loaded after figures.js and before generators.js: the generators are appended to FIG.MAT_FIG. */
(function () {
  const { rand, pick, shuffle, bi } = U;
  const T = FIG.text, compose = FIG.compose;
  const B = 'font-weight="bold"';
  const S = 'fill="none" stroke="#000" stroke-width="2.4"';
  const line = (x1, y1, x2, y2, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="${w || 2.2}"/>`;
  const figText = [0, 1, 2, 3].map((i) => bi(`आकृति ${i + 1}`, `Figure ${i + 1}`));
  const NQ = bi('आकृतियों में संख्याएँ एक विशेष नियम से दी गई हैं। प्रश्नचिह्न (?) के स्थान पर कौन-सी संख्या आएगी?', 'Numbers in the figures follow a certain rule. Which number replaces the question mark (?)?');
  const SQ = bi('प्रश्न आकृतियों के क्रम में प्रश्नचिह्न (?) के स्थान पर कौन-सी उत्तर आकृति आएगी?', 'Which answer figure will replace the question mark (?) in the series of problem figures?');
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  /* answer + 3 distinct positive wrong numbers, sorted like a booklet */
  function numOpts(ans, near) {
    const pool = shuffle([...new Set(near.filter((x) => Number.isInteger(x) && x > 0 && x !== ans))]).slice(0, 3);
    if (pool.length < 3) return null;
    const o = [ans, ...pool].sort((a, b) => a - b);
    return { options: o.map((x) => bi(String(x), String(x))), answer: o.indexOf(ans) };
  }
  const near = (a) => [a + 1, a - 1, a + 2, a - 2, a + 3, a + 4, a - 4, a + 5, a + 6, a - 6, a + 10, a - 10];

  /* ---------- 1. numbers in figures (UP 2023 Q55–60, 2025 Q67–70, 2027 Q62–66) ---------- */
  const SHAPES = {
    // three numbers around (left, right, bottom) a triangle, result inside
    tri: { n: 3, cell: (v, c) => `<polygon points="60,8 104,88 16,88" ${S}/>` + T(12, 56, v[0], 17, B) + T(108, 56, v[1], 17, B) + T(60, 108, v[2], 17, B) + T(60, 68, c, 17, B) },
    // four numbers round a circle (top, right, bottom, left), result in the middle
    ring: { n: 4, cell: (v, c) => `<circle cx="60" cy="55" r="28" ${S.replace('2.4', '2.2')}/>` + T(60, 18, v[0], 17, B) + T(104, 61, v[1], 17, B) + T(60, 106, v[2], 17, B) + T(16, 61, v[3], 17, B) + T(60, 62, c, String(c).length > 3 ? 13 : 17, B) },
    // two or three numbers on a Y-fork, result at the foot
    fork: { n: 3, cell: (v, c) => line(60, 62, 60, 92) + line(60, 62, 26, 28) + line(60, 62, 94, 28) + T(20, 20, v[0], 16, B) + T(60, 20, v[1], 16, B) + T(100, 20, v[2], 16, B) + T(60, 108, c, 16, B) },
    // circle cut in three, two numbers on top and the result below
    split: { n: 2, cell: (v, c) => `<circle cx="60" cy="55" r="48" ${S}/>` + line(60, 55, 60, 7) + line(60, 55, 18.4, 79) + line(60, 55, 101.6, 79) + T(38, 48, v[0], 17, B) + T(82, 48, v[1], 17, B) + T(60, 92, c, 17, B) },
    // plus made of five boxes: top, left, right, bottom round the centre
    plus: { n: 4, cell: (v, c) => [[42, 4], [6, 40], [42, 40], [78, 40], [42, 76]].map(([x, y]) => `<rect x="${x}" y="${y}" width="36" height="34" fill="none" stroke="#000" stroke-width="2"/>`).join('') +
      [[v[0], 60, 27], [v[3], 24, 63], [c, 60, 63], [v[1], 96, 63], [v[2], 60, 99]].map(([x, X, Y]) => T(X, Y, x, String(x).length > 2 ? 13 : 16, B)).join('') }
  };
  // rules by difficulty: [values → result, Hindi, English, which shapes fit, value range]
  const RULES = {
    easy: [
      [(v) => v.reduce((a, b) => a + b, 0), 'चारों/तीनों संख्याओं का योग', 'Sum of the numbers', ['ring', 'tri', 'plus', 'fork'], [1, 15]],
      [(v) => v[0] - v[1], 'ऊपर की दोनों संख्याओं का अन्तर', 'Difference of the two top numbers', ['split'], [10, 60], (v) => v[0] > v[1]],
      [(v) => v[0] * v[1] * v[2] * v[3], 'चारों संख्याओं का गुणनफल', 'Product of the four numbers', ['ring', 'plus'], [1, 5]]
    ],
    moderate: [
      [(v) => v[0] * v[2] + v[1] * v[3], 'ऊपर × नीचे + दाएँ × बाएँ', 'Top × bottom + right × left', ['ring', 'plus'], [1, 9]],
      [(v) => v[0] * v[2] - v[1] * v[3], 'ऊपर × नीचे − दाएँ × बाएँ', 'Top × bottom − right × left', ['ring', 'plus'], [2, 9], (v) => v[0] * v[2] > v[1] * v[3]],
      [(v) => gcd(gcd(v[0], v[1]), v[2]), 'ऊपर की तीनों संख्याओं का म.स.', 'HCF of the three top numbers', ['fork'], null],
      [(v) => (v[0] + v[1]) / 8, 'ऊपर की संख्याओं का योग ÷ 8', 'Sum of the top numbers ÷ 8', ['split'], null]
    ],
    hard: [
      [(v) => v[0] * v[2] - v[1] - 2, 'बाएँ × नीचे − दाएँ − 2', 'Left × bottom − right − 2', ['tri'], [3, 9], (v) => v[0] * v[2] - v[1] - 2 > 0],
      [(v) => (v[0] + v[1]) * v[2], '(बाएँ + दाएँ) × नीचे', '(Left + right) × bottom', ['tri'], [2, 9]],
      [(v) => (v[0] + v[2]) * (v[1] + v[3]), '(ऊपर + नीचे) × (दाएँ + बाएँ)', '(Top + bottom) × (right + left)', ['ring', 'plus'], [1, 9]],
      [(v) => v[0] * v[0] + v[1] * v[1], 'ऊपर की दोनों संख्याओं के वर्गों का योग', 'Sum of the squares of the two top numbers', ['split'], [2, 12]]
    ]
  };
  // values for rules that need special numbers
  const special = {
    'HCF of the three top numbers': () => { const h = rand(3, 12); return [h * rand(2, 5), h * rand(2, 5), h * rand(2, 5)]; },
    'Sum of the top numbers ÷ 8': () => { const t = 8 * rand(2, 20), a = rand(5, t - 5); return [a, t - a]; }
  };
  function numFigure(diff) {
    const rule = pick(RULES[diff]);
    const [fn, xh, xe, shapes, range, ok] = rule;
    const shape = SHAPES[pick(shapes)];
    const sets = [];
    for (let tries = 0; sets.length < 3 && tries < 200; tries++) {
      const v = special[xe] ? special[xe]() : Array.from({ length: shape.n }, () => rand(range[0], range[1]));
      if (v.length < shape.n) while (v.length < shape.n) v.push(rand(1, 9));
      if (ok && !ok(v)) continue;
      const r = fn(v);
      if (!Number.isInteger(r) || r <= 0 || r > 999) continue;
      if (sets.some((s) => s.v.join() === v.join())) continue;
      sets.push({ v, r });
    }
    if (sets.length < 3) return null;
    // HCF fork: the three top numbers only, so the third value is used
    const ans = sets[2].r;
    const o = numOpts(ans, near(ans).concat([sets[0].r, sets[1].r]));
    if (!o) return null;
    const shapeName = Object.keys(SHAPES).find((k) => SHAPES[k] === shape);
    const fig = compose(sets.map((s, i) => ({ w: 120, h: 112, noFrame: true, inner: shape.cell(s.v, i === 2 ? '?' : s.r) })), null);
    return Object.assign({ topic: 'Numbers in Figures', cat: 'figurenum', figure: fig, q: Object.assign({}, NQ),
      explanation: bi(`नियम: ${xh}। ${sets.map((s) => s.r).join(', ')} — अतः ? = ${ans}`, `Rule: ${xe}. ${sets.map((s) => s.r).join(', ')} — so ? = ${ans}`),
      tpl: `numfig:${shapeName}`, sig: `numfig:${shapeName}:${sets.map((s) => s.v.join('.')).join('|')}` }, o);
  }

  /* ---------- 2. four symbols turning round the corners (UP 2027 Q52) ---------- */
  const SYM = {
    o: (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="#000" stroke-width="2"/>`,
    s: (x, y) => `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" fill="none" stroke="#000" stroke-width="2"/>`,
    t: (x, y) => `<polygon points="${x},${y - 9} ${x + 9},${y + 7} ${x - 9},${y + 7}" fill="none" stroke="#000" stroke-width="2"/>`,
    x: (x, y) => line(x - 7, y - 7, x + 7, y + 7, 2) + line(x + 7, y - 7, x - 7, y + 7, 2),
    f: (x, y) => `<circle cx="${x}" cy="${y}" r="8" fill="#000"/>`,
    d: (x, y) => `<polygon points="${x},${y - 9} ${x + 9},${y} ${x},${y + 9} ${x - 9},${y}" fill="none" stroke="#000" stroke-width="2"/>`,
    p: (x, y) => line(x - 8, y, x + 8, y, 2) + line(x, y - 8, x, y + 8, 2),
    h: (x, y) => `<polygon points="${x},${y - 9} ${x + 9},${y + 7} ${x - 9},${y + 7}" fill="#000"/>`
  };
  const CORNERS = [[24, 26], [76, 26], [76, 74], [24, 74]]; // clockwise from top-left
  const quadCell = (a) => a.map((k, i) => SYM[k](...CORNERS[i])).join('');
  const turn = (a, k) => a.map((_, i) => a[(i - k + 4) % 4]); // k = steps clockwise
  function quadRotate(diff) {
    const syms = shuffle(Object.keys(SYM)).slice(0, 4);
    const step = diff === 'easy' ? pick([1, -1]) : diff === 'moderate' ? pick([1, -1, 2]) : null;
    // hard: two symbols move clockwise, the other two swap places each time
    const next = (a, i) => {
      if (step != null) return turn(a, step);
      const b = a.slice();
      [b[0], b[2]] = [a[2], a[0]];
      [b[1], b[3]] = [a[3], a[1]];
      return i % 2 ? turn(b, 1) : b;
    };
    const seq = [syms];
    for (let i = 0; i < 3; i++) seq.push(next(seq[i], i));
    const key = (a) => a.join('');
    const ans = seq[3];
    const wrongs = [turn(ans, 1), turn(ans, -1), turn(ans, 2), [ans[1], ans[0], ans[2], ans[3]], [ans[0], ans[1], ans[3], ans[2]], ans.slice().reverse()]
      .filter((w) => key(w) !== key(ans));
    const uniq = [];
    shuffle(wrongs).forEach((w) => { if (uniq.length < 3 && !uniq.some((u) => key(u) === key(w))) uniq.push(w); });
    if (uniq.length < 3) return null;
    const all = shuffle([ans, ...uniq]);
    const cell = (inner) => ({ w: 100, h: 100, inner });
    const fig = compose(seq.slice(0, 3).map((a) => cell(quadCell(a))).concat([cell(T(50, 66, '?', 46, B))]), all.map((a) => cell(quadCell(a))));
    const why = step == null ? bi('बारी-बारी से: पहले चिह्न आमने-सामने के कोनों से अदला-बदली करते हैं, फिर सभी एक कोना घड़ी की दिशा में बढ़ते हैं।', 'Alternately: the symbols swap with the opposite corner, then all move one corner clockwise.')
      : step === 2 ? bi('हर बार चिह्न दो कोने आगे (आमने-सामने) जाते हैं।', 'Each time the symbols move two corners (to the opposite corner).')
        : bi(`चारों चिह्न हर बार एक कोना ${step > 0 ? 'घड़ी की दिशा' : 'घड़ी की उल्टी दिशा'} में बढ़ते हैं।`, `All four symbols move one corner ${step > 0 ? 'clockwise' : 'anticlockwise'} each time.`);
    return { topic: 'Figure Series', cat: 'figure', figure: fig, figOpts: true, q: Object.assign({}, SQ), options: figText.map((o) => Object.assign({}, o)), answer: all.indexOf(ans), explanation: why,
      tpl: `quad:${step}`, sig: `quad:${syms.join('')}:${step}` };
  }

  /* ---------- 3. letter square turning (UP 2027 Q54) ---------- */
  function letterTurn(diff) {
    const L = shuffle('ABCDEFGHKLMNPRSTWXYZ'.split('')).slice(0, 4);
    const sq = (a) => `<rect x="16" y="16" width="68" height="68" ${S}/>` + T(33, 42, a[0], 20) + T(67, 42, a[1], 20) + T(67, 76, a[2], 20) + T(33, 76, a[3], 20); // TL, TR, BR, BL
    const dm = (a) => '<polygon points="50,6 94,50 50,94 6,50" fill="none" stroke="#000" stroke-width="2.4"/>' + T(50, 32, a[0], 19) + T(74, 57, a[1], 19) + T(50, 84, a[2], 19) + T(26, 57, a[3], 19); // top, right, bottom, left
    // 45° clockwise: square → diamond keeps the order (TL→top …); diamond → square moves one place
    const dir = diff === 'hard' ? pick([1, -1]) : 1;
    const seq = [{ k: 's', a: L }];
    for (let i = 0; i < 3; i++) {
      const p = seq[i];
      if (dir > 0) seq.push(p.k === 's' ? { k: 'd', a: p.a } : { k: 's', a: turn(p.a, 1) });
      else seq.push(p.k === 's' ? { k: 'd', a: turn(p.a, -1) } : { k: 's', a: p.a });
    }
    const ans = seq[3];
    const draw = (x) => (x.k === 's' ? sq(x.a) : dm(x.a));
    const kk = (x) => x.k + x.a.join('');
    const cands = [{ k: ans.k, a: turn(ans.a, 1) }, { k: ans.k, a: turn(ans.a, -1) }, { k: ans.k, a: turn(ans.a, 2) }, { k: ans.k, a: [ans.a[1], ans.a[0], ans.a[2], ans.a[3]] }, { k: ans.k, a: ans.a.slice().reverse() }];
    const uniq = [];
    shuffle(cands).forEach((w) => { if (uniq.length < 3 && kk(w) !== kk(ans) && !uniq.some((u) => kk(u) === kk(w))) uniq.push(w); });
    if (uniq.length < 3) return null;
    const all = shuffle([ans, ...uniq]);
    const cell = (inner) => ({ w: 100, h: 100, inner });
    const fig = compose(seq.slice(0, 3).map((x) => cell(draw(x))).concat([cell(T(50, 66, '?', 46, B))]), all.map((x) => cell(draw(x))));
    return { topic: 'Figure Series', cat: 'figure', figure: fig, figOpts: true, q: Object.assign({}, SQ), options: figText.map((o) => Object.assign({}, o)), answer: all.indexOf(ans),
      explanation: bi(`आकृति हर बार 45° ${dir > 0 ? 'घड़ी की दिशा' : 'घड़ी की उल्टी दिशा'} में घूमती है और अक्षर साथ घूमते हैं।`, `The figure turns 45° ${dir > 0 ? 'clockwise' : 'anticlockwise'} each time and the letters turn with it.`),
      tpl: 'letterturn', sig: `lt:${L.join('')}:${dir}` };
  }

  /* ---------- 4. polygons gaining sides while inner lines drop (UP 2023 Q47/50, 2027 Q48) ---------- */
  const ngon = (n, fill) => {
    const pts = Array.from({ length: n }, (_, i) => { const a = (-90 + (360 / n) * i + (n % 2 ? 0 : 180 / n)) * Math.PI / 180; return `${(50 + 37 * Math.cos(a)).toFixed(1)},${(52 + 37 * Math.sin(a)).toFixed(1)}`; }).join(' ');
    return `<polygon points="${pts}" fill="${fill ? '#9aa0a6' : 'none'}" stroke="#000" stroke-width="2.4"/>`;
  };
  // inner marks: short bars, dots, small circles or small crosses in a row
  const INNER = {
    bar: (x) => line(x, 46, x, 66, 2),
    dot: (x) => `<circle cx="${x}" cy="56" r="3" fill="#000"/>`,
    ring: (x) => `<circle cx="${x}" cy="56" r="3.2" fill="none" stroke="#000" stroke-width="1.6"/>`,
    cross: (x) => line(x - 3, 53, x + 3, 59, 1.6) + line(x + 3, 53, x - 3, 59, 1.6)
  };
  const marks = (n, kind) => Array.from({ length: n }, (_, i) => INNER[kind](50 - (n - 1) * 4 + i * 8)).join('');
  function sidesSeries(diff) {
    const d = diff === 'easy' ? 1 : pick([1, 1, 2]);
    const start = rand(3, d === 2 ? 4 : 6);
    const linesOn = diff !== 'easy' || Math.random() < 0.5;
    const shade = diff === 'hard' || (diff === 'moderate' && Math.random() < 0.3);
    const L0 = rand(3, 6), kind = pick(Object.keys(INNER));
    const item = (i) => ({ n: start + d * i, l: linesOn ? Math.max(0, L0 - i) : 0, f: shade ? i % 2 === 1 : false });
    const seq = [0, 1, 2, 3].map(item);
    if (seq[3].n > 10) return null;
    const ans = seq[3];
    const kk = (x) => `${x.n}:${x.l}:${x.f}`;
    const cands = [{ n: ans.n + 1, l: ans.l, f: ans.f }, { n: ans.n - 1, l: ans.l, f: ans.f }, { n: ans.n, l: ans.l + 1, f: ans.f }, { n: ans.n, l: ans.l + 2, f: ans.f }, { n: ans.n, l: ans.l, f: !ans.f }, { n: seq[2].n, l: ans.l, f: ans.f }]
      .filter((x) => x.n >= 3 && x.n <= 10 && (linesOn || x.l === 0) && (shade || !x.f));
    const uniq = [];
    shuffle(cands).forEach((w) => { if (uniq.length < 3 && kk(w) !== kk(ans) && !uniq.some((u) => kk(u) === kk(w))) uniq.push(w); });
    if (uniq.length < 3) return null;
    const all = shuffle([ans, ...uniq]);
    const draw = (x) => ngon(x.n, x.f) + marks(x.l, kind);
    const cell = (inner) => ({ w: 100, h: 100, inner });
    const fig = compose(seq.slice(0, 3).map((x) => cell(draw(x))).concat([cell(T(50, 66, '?', 46, B))]), all.map((x) => cell(draw(x))));
    const xh = `भुजाएँ हर बार ${d} बढ़ती हैं (${seq.map((x) => x.n).join(', ')})` + (linesOn ? `, अंदर की रेखाएँ एक-एक घटती हैं` : '') + (shade ? ', और खाली-भरी आकृति बारी-बारी से आती है' : '') + '।';
    const xe = `The sides go up by ${d} (${seq.map((x) => x.n).join(', ')})` + (linesOn ? ', the inner lines drop by one' : '') + (shade ? ', and empty/shaded alternate' : '') + '.';
    return { topic: 'Figure Series', cat: 'figure', figure: fig, figOpts: true, q: Object.assign({}, SQ), options: figText.map((o) => Object.assign({}, o)), answer: all.indexOf(ans), explanation: bi(xh, xe),
      tpl: 'sides', sig: `sides:${start}:${d}:${L0}:${linesOn}:${shade}:${kind}` };
  }

  FIG.MAT_FIG.push(numFigure, quadRotate, letterTurn, sidesSeries);
  FIG.PYQ_GENS = { numFigure, quadRotate, letterTurn, sidesSeries };
})();
