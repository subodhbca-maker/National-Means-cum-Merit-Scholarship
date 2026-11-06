/* UP NMMS 2023–2025: the questions that were missing from the first transcription (mostly figure questions),
   added so the previous-year papers are complete. Figures are redrawn as clean SVG. A few 2023 figure series
   were too faint in the scanned booklet to copy line for line; those are redrawn on the same idea, with the
   answer worked out for the redrawn figures. Questions with no correct option keep answer −1 and a note. */
(function () {
  const T = FIG.text;
  const S = 'fill="none" stroke="#000" stroke-width="2.4"';
  const out = [];
  const opt = (arr) => arr.map((o) => (Array.isArray(o) ? { hi: o[0], en: o[1] } : { hi: String(o), en: String(o) }));
  const add = (year, no, subject, difficulty, hi, en, options, answer, xh, xe, extra) => out.push(Object.assign({
    id: `pyq_up${year}_${no}`, subject, difficulty, topic: `UP NMMS ${year} · Q${no}`, q: { hi, en }, options: opt(options), answer: answer - 1,
    source: 'pyq', year, explanation: { hi: xh || '', en: xe || '' }
  }, extra || {}));

  /* drawing helpers (100 × 100 cells) */
  const cell = (inner) => ({ w: 100, h: 100, inner });
  const QM = cell(T(50, 66, '?', 46, 'font-weight="bold"'));
  const FT = [0, 1, 2, 3].map((i) => [`आकृति ${i + 1}`, `Figure ${i + 1}`]);
  const SERQ = ['प्रश्न आकृतियों के क्रम में प्रश्नचिह्न (?) के स्थान पर कौन-सी उत्तर आकृति आएगी?', 'Which answer figure will replace the question mark (?) in the series of problem figures?'];
  const series = (year, no, d, probs, answers, ans, xh, xe) => add(year, no, 'mat', d, SERQ[0], SERQ[1], FT, ans, xh, xe,
    { cat: 'figure', figOpts: true, figure: FIG.compose(probs.map(cell).concat([QM]), answers.map(cell)) });
  const line = (x1, y1, x2, y2, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="${w || 2.4}"/>`;
  const poly = (n, r, rot, cx, cy) => Array.from({ length: n }, (_, i) => { const a = ((rot || 0) - 90 + (360 / n) * i) * Math.PI / 180; return `${((cx || 50) + r * Math.cos(a)).toFixed(1)},${((cy || 50) + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const pg = (pts, fill) => `<polygon points="${pts}" fill="${fill || 'none'}" stroke="#000" stroke-width="2.4"/>`;
  const rot = (deg, inner) => `<g transform="rotate(${deg} 50 50)">${inner}</g>`;
  const dot = (x, y, r, f) => `<circle cx="${x}" cy="${y}" r="${r || 3.5}" fill="${f === false ? '#fff' : '#000'}" stroke="#000" stroke-width="1.6"/>`;
  const NQ = ['आकृतियों में संख्याएँ एक विशेष नियम से दी गई हैं। प्रश्नचिह्न (?) के स्थान पर कौन-सी संख्या आएगी?', 'Numbers in the figures follow a certain rule. Which number replaces the question mark (?)?'];
  const nfig = (year, no, d, cells, opts, ans, xh, xe, w, h) => add(year, no, 'mat', d, NQ[0], NQ[1], opts, ans, xh, xe,
    { cat: 'figurenum', figure: FIG.compose(cells.map((inner) => ({ w: w || 120, h: h || 110, noFrame: true, inner })), null) });
  const B = 'font-weight="bold"';

  /* ================= 2023 ================= */
  const SW = ['चिह्नों के गलत क्रम के कारण समीकरण गलत हो गया है। सही क्रम वाले चिह्न (विकल्प) चुनिए जिनको आपस में बदलने से समीकरण सही हो जाए।', 'The equation has become wrong due to a wrong order of signs. Choose the pair of signs which, when interchanged, makes the equation right.'];
  const sw = (no, d, e, o, a, x) => add(2023, no, 'mat', d, `${SW[0]}\n${e}`, `${SW[1]}\n${e}`, o.map(([p, q]) => [`${p} और ${q}`, `${p} and ${q}`]), a, `चिह्न बदलने पर: ${x}`, `After interchanging: ${x}`, { cat: 'ops' });
  sw(25, 'moderate', '5 + 3 × 8 − 12 ÷ 4 = 3', [['+', '−'], ['−', '÷'], ['+', '×'], ['+', '÷']], 2, '5 + 3 × 8 ÷ 12 − 4 = 3');
  sw(26, 'moderate', '5 + 6 ÷ 3 − 12 × 2 = 17', [['÷', '×'], ['+', '×'], ['+', '÷'], ['+', '−']], 1, '5 + 6 × 3 − 12 ÷ 2 = 17');
  sw(27, 'moderate', '2 × 3 + 6 − 12 ÷ 4 = 17', [['×', '+'], ['+', '−'], ['+', '÷'], ['−', '÷']], 1, '2 + 3 × 6 − 12 ÷ 4 = 17');
  sw(28, 'moderate', '16 − 8 ÷ 4 + 5 × 2 = 8', [['÷', '×'], ['−', '÷'], ['÷', '+'], ['−', '×']], 2, '16 ÷ 8 − 4 + 5 × 2 = 8');
  sw(29, 'hard', '9 + 5 ÷ 4 × 3 − 6 = 12', [['+', '×'], ['÷', '×'], ['÷', '−'], ['+', '−']], 3, '9 + 5 − 4 × 3 ÷ 6 = 12');
  add(2023, 31, 'mat', 'moderate', 'यदि ÷ का अर्थ ×, × का अर्थ +, + का अर्थ − और − का अर्थ ÷ है तो 16 × 3 + 5 − 2 ÷ 4 का मान ज्ञात कीजिए।', 'If ÷ means ×, × means +, + means − and − means ÷, find the value of 16 × 3 + 5 − 2 ÷ 4.', ['9', '10', '19', '16'], 1,
    '16 + 3 − 5 ÷ 2 × 4 = 19 − 10 = 9', '16 + 3 − 5 ÷ 2 × 4 = 19 − 10 = 9', { cat: 'ops' });

  // Q44–53 figure series
  const gridL = (v, h) => `<rect x="14" y="14" width="72" height="72" ${S}/>` + Array.from({ length: v }, (_, i) => line(14 + (72 / (v + 1)) * (i + 1), 14, 14 + (72 / (v + 1)) * (i + 1), 86, 2)).join('') + Array.from({ length: h }, (_, i) => line(14, 14 + (72 / (h + 1)) * (i + 1), 86, 14 + (72 / (h + 1)) * (i + 1), 2)).join('');
  series(2023, 44, 'easy', [gridL(4, 3), gridL(3, 2), gridL(2, 1)], [gridL(0, 1), gridL(3, 2), gridL(1, 0), gridL(1, 1)], 3,
    'हर बार एक खड़ी और एक आड़ी रेखा कम होती है: (4, 3) → (3, 2) → (2, 1) → (1, 0)।', 'One vertical and one horizontal line less each time: (4, 3) → (3, 2) → (2, 1) → (1, 0).');
  const starPts = (r1, r2) => Array.from({ length: 10 }, (_, i) => { const a = (-90 + 36 * i) * Math.PI / 180, r = i % 2 ? r2 : r1; return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const house = pg('50,14 84,38 84,86 16,86 16,38'), star = pg(starPts(38, 16));
  series(2023, 45, 'moderate', [house + dot(50, 58), rot(180, house) + dot(50, 42), star + dot(50, 52)], [star + dot(50, 52), rot(180, star) + dot(50, 48), rot(180, star), rot(36, star) + dot(30, 50)], 2,
    'आकृति एक बार सीधी, फिर उलटी (180° घूमी) आती है और बिन्दु बीच में रहता है; अतः उलटा तारा, बिन्दु सहित।', 'Each shape appears upright and then upside down (turned 180°) with the dot in the middle; so the upside-down star with the dot.');
  const yfig = `${line(50, 54, 50, 88)}${line(50, 54, 22, 26)}${line(50, 54, 78, 26)}<circle cx="18" cy="22" r="6" ${S.replace('2.4', '2')}/>${pg('78,14 88,24 78,34 68,24')}${dot(50, 90, 4.5)}`;
  series(2023, 46, 'moderate', [yfig, rot(90, yfig), rot(180, yfig)], [rot(90, yfig), rot(270, yfig), rot(0, yfig), `<g transform="translate(100 0) scale(-1 1)">${rot(270, yfig)}</g>`], 2,
    'आकृति हर बार 90° घड़ी की दिशा में घूमती है।', 'The figure turns 90° clockwise each time.');
  const ngon = (n, f) => pg(poly(n, 36, n % 2 ? 0 : 180 / n), f ? '#9aa0a6' : 'none');
  series(2023, 47, 'easy', [ngon(3), ngon(5, 1), ngon(4)], [ngon(5, 1), ngon(4, 1), ngon(6, 1), ngon(8, 1)], 3,
    'भुजाएँ 3, 5, 4, 6 (+2, −1, +2) और खाली-भरी आकृति बारी-बारी से आती है; अतः भरा हुआ षट्भुज।', 'Sides go 3, 5, 4, 6 (+2, −1, +2) and empty/shaded alternate; so a shaded hexagon.');
  series(2023, 48, 'moderate', [`<rect x="18" y="18" width="64" height="64" ${S}/>`, line(50, 14, 50, 86) + line(14, 50, 86, 50), pg('30,28 90,28 70,72 10,72')],
    [line(14, 50, 86, 50) + line(64, 16, 36, 84), line(18, 18, 82, 82) + line(82, 18, 18, 82), line(14, 40, 86, 60) + line(20, 30, 80, 70), line(50, 14, 50, 86) + line(14, 50, 86, 50)], 1,
    'वर्ग की भुजाओं की दिशा में रेखाएँ = + (आड़ी और खड़ी)। समान्तर चतुर्भुज की भुजाएँ आड़ी और तिरछी हैं, अतः एक आड़ी और एक तिरछी रेखा।', 'The + has lines along the square’s sides (horizontal and vertical). The parallelogram has horizontal and slanting sides, so one horizontal and one slanting line.');
  const hexW = (k) => { const v = poly(6, 34, 30).split(' ')[k].split(',').map(Number), dx = (v[0] - 50) / 34, dy = (v[1] - 50) / 34; return pg(poly(6, 34, 30)) + `<rect x="${(v[0] + dx * 7 - 6).toFixed(1)}" y="${(v[1] + dy * 7 - 6).toFixed(1)}" width="12" height="12" fill="#fff" stroke="#000" stroke-width="2"/>`; };
  series(2023, 49, 'hard', [hexW(0), hexW(2), hexW(4)], [hexW(3), hexW(1), hexW(0), hexW(5)], 3,
    'छोटा वर्ग हर बार षट्भुज के दो कोने आगे (घड़ी की दिशा में) खिसकता है: 0 → 2 → 4 → 0।', 'The small square moves two corners clockwise each time: 0 → 2 → 4 → back to 0.');
  series(2023, 50, 'easy', [ngon(3), ngon(4), ngon(5)], [ngon(6), ngon(3) + line(44, 60, 44, 80, 2) + line(50, 60, 50, 80, 2) + line(56, 60, 56, 80, 2), ngon(4) + line(40, 40, 40, 62, 2) + line(50, 40, 50, 62, 2) + line(60, 40, 60, 62, 2), ngon(5) + line(50, 50, 50, 72, 2)], 1,
    'भुजाएँ एक-एक बढ़ती हैं: 3, 4, 5, 6 — षट्भुज।', 'One more side each time: 3, 4, 5, 6 — a hexagon.');
  const stemArc = `${line(14, 50, 58, 50)}${line(14, 42, 14, 58)}<path d="M58 26 Q86 50 58 74" ${S}/>`;
  const loops = `${line(50, 14, 50, 54)}<circle cx="38" cy="68" r="13" ${S}/><circle cx="62" cy="68" r="13" ${S}/>`;
  series(2023, 51, 'hard', [stemArc, rot(90, stemArc), loops], [rot(90, loops), rot(90, loops) + line(86, 42, 86, 58), rot(90, `${line(50, 14, 50, 86)}<circle cx="38" cy="50" r="13" ${S}/><circle cx="62" cy="50" r="13" ${S}/>`), rot(45, loops)], 1,
    'पहली से दूसरी आकृति 90° घड़ी की दिशा में घूमी है; इसी प्रकार तीसरी आकृति 90° घूमकर चौथी बनेगी।', 'The second figure is the first turned 90° clockwise; likewise the fourth is the third turned 90° clockwise.');
  const L = `${line(34, 18, 34, 80, 4)}${line(32, 80, 74, 80, 4)}`;
  series(2023, 52, 'moderate', [L, rot(90, L), rot(180, L)], [rot(270, L), `<g transform="translate(100 0) scale(-1 1)">${rot(270, L)}</g>`, rot(45, L), rot(0, L)], 1,
    'आकृति हर बार 90° घड़ी की दिशा में घूमती है।', 'The figure turns 90° clockwise each time.');
  const ell = (v) => (v ? `<ellipse cx="50" cy="54" rx="9" ry="26" ${S.replace('2.4', '2')}/>` + dot(50, 72, 3, false) : `<ellipse cx="50" cy="60" rx="28" ry="9" ${S.replace('2.4', '2')}/>` + dot(30, 60, 3, false));
  series(2023, 53, 'hard', [ngon(6) + ell(1), house + ell(1), house + ell(0)], [`<rect x="16" y="16" width="68" height="68" ${S}/>` + ell(0), pg('50,10 90,50 50,90 10,50') + ell(1), `<circle cx="50" cy="50" r="38" ${S}/>` + ell(0), ngon(6) + ell(0)], 1,
    'बारी-बारी से बाहरी आकृति की एक भुजा कम होती है (6 → 5) और फिर अंदर का दीर्घवृत्त लेट जाता है; अब फिर एक भुजा कम (5 → 4) — लेटे दीर्घवृत्त वाला वर्ग।', 'Alternately the outer shape loses a side (6 → 5) and then the ellipse lies down; next the outer shape loses a side again (5 → 4) — a square with a lying ellipse.');

  // Q54–60 numbers
  const ckRows = [['CK', '16', '9', 'JR'], ['OS', '24', '19', 'TX'], ['KM', '?', '?', 'PV']];
  const ckTable = FIG.svg(260, 110, ckRows.map((r, i) => r.map((v, j) => `<rect x="${10 + j * 60}" y="${8 + i * 32}" width="60" height="32" fill="none" stroke="#000" stroke-width="1.6"/>` + T(40 + j * 60, 30 + i * 32, v, 17, B)).join('')).join(''));
  add(2023, 54, 'mat', 'hard', NQ[0], NQ[1], ['14, 21', '21, 14', '56, 84', '84, 56'], 0,
    'त्रुटिपूर्ण प्रश्न: पहली दो पंक्तियों पर कोई एक ही नियम लागू नहीं होता जो तीसरी पंक्ति में किसी विकल्प तक पहुँचाए।', 'Faulty question: no single rule fits the first two rows and leads to any option in the third row.', { cat: 'figurenum', figure: ckTable });
  const yNum = (a, b, c, m) => `${line(60, 66, 60, 96, 2)}${line(60, 66, 30, 32, 2)}${line(60, 66, 90, 32, 2)}` + T(24, 22, a, 16, B) + T(60, 22, b, 16, B) + T(96, 22, c, 16, B) + T(60, 112, m, 16, B);
  nfig(2023, 55, 'easy', [yNum(12, 18, 30, 6), yNum(16, 32, 40, 8), yNum(36, 18, 27, '?')], ['6', '9', '12', '18'], 2, 'ऊपर की तीनों संख्याओं का म.स.: (12, 18, 30) → 6, (16, 32, 40) → 8, (36, 18, 27) → 9', 'HCF of the three top numbers: 6, 8, (36, 18, 27) → 9', 120, 118);
  const tri2 = (top, a, b) => pg('60,6 112,96 8,96') + line(34, 60, 86, 60, 2) + line(60, 60, 60, 96, 2) + T(60, 50, top, 15, B) + T(44, 84, a, 16, B) + T(76, 84, b, 16, B);
  nfig(2023, 56, 'easy', [tri2(916, 3, 4), tri2(49, 2, 3), tri2('?', 1, 5)], ['125', '215', '251', '512'], 1, 'नीचे की संख्याओं के वर्ग साथ-साथ लिखे गए हैं: 3² 4² = 916, 2² 3² = 49, 1² 5² = 125', 'Squares of the bottom numbers written side by side: 916, 49, 1² 5² = 125');
  const y3 = (a, b, c) => `<circle cx="60" cy="55" r="48" ${S}/>` + line(60, 55, 60, 7, 2) + line(60, 55, 18.4, 79, 2) + line(60, 55, 101.6, 79, 2) + T(38, 48, a, 18, B) + T(82, 48, b, 18, B) + T(60, 92, c, 18, B);
  nfig(2023, 57, 'hard', [y3(25, 17, 6), y3(38, 18, 8), y3(89, 16, '?')], ['13', '15', '17', '19'], 2, 'ऊपर की दोनों संख्याओं का योग ÷ 7: (25 + 17) ÷ 7 = 6, (38 + 18) ÷ 7 = 8, (89 + 16) ÷ 7 = 15', 'Sum of the two top numbers ÷ 7: 42 ÷ 7 = 6, 56 ÷ 7 = 8, 105 ÷ 7 = 15');
  const ring = (t, l, r, b, c) => `<circle cx="60" cy="55" r="30" ${S.replace('2.4', '2.2')}/>` + T(60, 18, t, 16, B) + T(16, 61, l, 16, B) + T(104, 61, r, 16, B) + T(60, 106, b, 16, B) + T(60, 62, c, 17, B);
  nfig(2023, 58, 'easy', [ring(2, 2, 3, 4, 48), ring(2, 4, 6, 8, 384), ring(2, 3, 4, 2, '?')], ['42', '44', '46', '48'], 4, 'चारों बाहरी संख्याओं का गुणनफल: 2×2×3×4 = 48, 2×4×6×8 = 384, 2×3×4×2 = 48', 'Product of the four outer numbers: 48, 384, 2×3×4×2 = 48');
  const plus = (t, l, c, r, b) => [[40, 4], [4, 40], [40, 40], [76, 40], [40, 76]].map(([x, y]) => `<rect x="${x}" y="${y}" width="36" height="34" fill="none" stroke="#000" stroke-width="2"/>`).join('') +
    [[t, 58, 27], [l, 22, 63], [c, 58, 63], [r, 94, 63], [b, 58, 99]].map(([v, x, y]) => T(x, y, v, 16, B)).join('');
  nfig(2023, 60, 'moderate', [plus(5, 6, 93, 15, 3), plus(7, 9, '?', 5, 6), plus(18, 4, 50, 1, 8)], ['5', '19', '27', '89'], 4, 'ऊपर × दाएँ + बाएँ × नीचे: 5×15 + 6×3 = 93, 18×1 + 4×8 = 50, 7×5 + 9×6 = 89', 'Top × right + left × bottom: 93, 50, 7×5 + 9×6 = 89');

  // Q62–64 circle, triangle, rectangle
  const f62 = FIG.svg(260, 170, `<g ${S}><circle cx="100" cy="58" r="46"/><polygon points="96,8 170,160 24,160"/><rect x="88" y="66" width="152" height="54"/></g>` +
    [[5, 84, 46], [3, 118, 34], [2, 98, 86], [8, 135, 80], [1, 108, 112], [4, 200, 98], [9, 66, 140]].map(([n, x, y]) => T(x, y, n, 18, B)).join(''));
  const D62 = ['नीचे दिए गए आरेख का अध्ययन कीजिए (वृत्त, त्रिभुज और आयत)।', 'Study the diagram given below (circle, triangle and rectangle).'];
  [[62, 'वह संख्या ज्ञात कीजिए जो सभी आकृतियों के अंदर स्थित है-', 'Find out the number that lies inside all the figures:', ['2', '5', '9', '8'], 1, 'easy', '2 वृत्त, त्रिभुज और आयत तीनों में है।', '2 is inside the circle, the triangle and the rectangle.'],
    [63, 'वे संख्याएँ कौन-सी हैं जो केवल किन्हीं दो आकृतियों के अंदर स्थित हैं-', 'Which numbers lie inside any two figures only:', ['2, 1', '5, 1', '5, 9', '9, 1'], 2, 'moderate', '5 (वृत्त + त्रिभुज) और 1 (त्रिभुज + आयत) दो-दो आकृतियों में हैं (8 भी, पर वह विकल्प में नहीं)।', '5 (circle + triangle) and 1 (triangle + rectangle) are in exactly two figures (so is 8, which is not offered).'],
    [64, 'उस संख्या का मान बताइए जो केवल त्रिभुज के अंदर स्थित है-', 'Find out the number that lies only inside the triangle:', ['2', '1', '5', '9'], 4, 'easy', '9 केवल त्रिभुज में है।', '9 is only inside the triangle.']]
    .forEach(([no, hi, en, o, a, d, xh, xe]) => add(2023, no, 'mat', d, `${D62[0]}\n${hi}`, `${D62[1]}\n${en}`, o, a, xh, xe, { cat: 'figurenum', figure: f62 }));

  // Q69–71, 76 letter gaps
  const GQ = ['श्रेणी के रिक्त स्थानों में क्रम से कौन-से अक्षर आएँगे?', 'Which letters, in order, complete the series?'];
  const gap = (no, d, s, o, a, xh, xe) => add(2023, no, 'mat', d, `${GQ[0]}\n${s}`, `${GQ[1]}\n${s}`, o, a, xh, xe, { cat: 'gap' });
  gap(69, 'hard', '_aaba_bba_bba_abaa_b', ['aabab', 'ababa', 'baaba', 'bbaba'], 1, 'aaab aabb abbb | aaab aabb … — 12 अक्षरों का समूह दोहराया जाता है।', 'aaab aabb abbb | aaab aabb … — a block of 12 letters repeats.');
  gap(70, 'hard', 'ab_bbc_c_ab_ab_b', ['ccaac', 'cbabc', 'cacac', 'bccab'], 0, 'त्रुटिपूर्ण प्रश्न: कोई भी विकल्प भरने पर नियमित (दोहराने वाली) श्रेणी नहीं बनती।', 'Faulty question: no option makes a regular repeating series.');
  gap(71, 'hard', 'b_ac_cc_cb_ab_ac', ['cbaba', 'bbaac', 'abbbc', 'aabba'], 0, 'त्रुटिपूर्ण प्रश्न: कोई भी विकल्प भरने पर नियमित (दोहराने वाली) श्रेणी नहीं बनती।', 'Faulty question: no option makes a regular repeating series.');
  gap(76, 'moderate', 'aab_aa_bbb_aaa_bbba', ['abba', 'baab', 'aaab', 'abab'], 2, 'aabb, aaabbb, aaaabbbb … — हर बार a और b एक-एक बढ़ते हैं।', 'aabb, aaabbb, aaaabbbb … — one more a and b each time.');

  // Q83–84 circle sets (diagrams 1–4 as in Q78–85)
  const VQ = ['नीचे दिए गए आरेखों में से कौन-सा आरेख इन तीन शब्दों के संबंध को दर्शाता है?', 'Which of the diagrams shows the relationship among these three words?'];
  const v23 = FIG.vennSet(['two_in_one', 'chain3', 'nest2_sep1', 'int2_in_one']);
  add(2023, 83, 'mat', 'moderate', `${VQ[0]}\nचोर, वकील, अपराधी`, `${VQ[1]}\nThieves, Lawyers, Criminals`, ['3', '4', '1', '2'], 1, 'सभी चोर अपराधी हैं (वृत्त के अंदर वृत्त) और वकील अलग समूह हैं — आरेख 3।', 'All thieves are criminals (circle inside circle) and lawyers are a separate group — diagram 3.', { cat: 'venn', figure: v23 });
  add(2023, 84, 'mat', 'hard', `${VQ[0]}\nसागर, द्वीप, पहाड़`, `${VQ[1]}\nSea, Island, Mountain`, ['2', '4', '1', '3'], 0, 'विवादित प्रश्न: द्वीप सागर के अंदर है और कुछ पहाड़ द्वीपों पर हैं, कुछ नहीं — यह संबंध किसी भी दिए गए आरेख से ठीक मेल नहीं खाता।', 'Disputed question: islands lie in the sea and some mountains are on islands, some are not — no given diagram matches exactly.', { cat: 'venn', figure: v23 });

  // SAT
  add(2023, 141, 'sst', 'moderate', 'अधिक उष्ण कटिबन्धीय चक्रवात निम्न अक्षांशों के बीच आते हैं-', 'Most tropical cyclones are witnessed between the following latitudes-', [['5° से 20° अक्षांश', '5° to 20° latitudes'], ['20° से 30° अक्षांश', '20° to 30° latitudes'], ['10° से 35° अक्षांश', '10° to 35° latitudes'], ['30° से 60° अक्षांश', '30° to 60° latitudes']], 1,
    'उष्ण कटिबन्धीय चक्रवात प्रायः 5° से 20° अक्षांशों के बीच गर्म समुद्रों पर बनते हैं।', 'Tropical cyclones mostly form over warm seas between about 5° and 20° latitude.');
  add(2023, 145, 'sst', 'moderate', 'जीवन निर्वाह कृषि का सम्बन्ध है-', 'Subsistence farming is associated with-', [['व्यापारिक कृषि से', 'Commercial agriculture'], ['मिश्रित कृषि से', 'Mixed agriculture'], ['बागाती कृषि से', 'Plantation agriculture'], ['इनमें से कोई नहीं', 'None of the above']], 0,
    'विवादित प्रश्न: जीवन निर्वाह कृषि में किसान अपने परिवार के लिए उगाता है; इसमें अक्सर फसल और पशुपालन साथ होते हैं (मिश्रित), पर पुस्तिका से एक पक्का उत्तर तय नहीं होता।', 'Disputed question: subsistence farmers grow for their own family, often with crops and animals together (mixed), but the booklet does not fix one sure answer.');
  const f169 = FIG.svg(200, 190, `<g ${S}><circle cx="100" cy="92" r="72"/><polyline points="38,128 100,20 162,128"/><polyline points="38,128 100,164 162,128"/><polyline points="38,128 100,92 162,128"/></g>` +
    T(100, 14, 'A', 16) + T(26, 134, 'B', 16) + T(174, 134, 'D', 16) + T(100, 182, 'C', 16) + T(100, 88, 'O', 15) + T(100, 120, '130°', 12));
  add(2023, 169, 'maths', 'moderate', 'दिए गए चित्र में ‘O’ वृत्त का केन्द्र है और ∠BOD = 130° तो ∠BCD का मान है-', 'In the given figure ‘O’ is the centre of the circle and ∠BOD = 130°. Then the value of ∠BCD is-', ['90°', '65°', '115°', '120°'], 3,
    '∠BAD = ½ × 130° = 65°; चक्रीय चतुर्भुज में ∠BCD = 180° − 65° = 115°', '∠BAD = ½ × 130° = 65°; in the cyclic quadrilateral ∠BCD = 180° − 65° = 115°', { figure: f169 });
  add(2023, 171, 'maths', 'hard', 'यदि किसी आयत का क्षेत्रफल x⁴ + x²/4 − x³ + (x² − 1)(1 − x²) और उसकी लम्बाई (2x² − x/2 − 1) हो तो उसकी चौड़ाई होगी-', 'If the area of a rectangle is x⁴ + x²/4 − x³ + (x² − 1)(1 − x²) and its length is (2x² − x/2 − 1), then its breadth is-', ['x/2 − 1', '1 − x/2', 'x/2 + 1', '2x + 1'], 2,
    'क्षेत्रफल = (x² − x/2)² − (x² − 1)² = (1 − x/2)(2x² − x/2 − 1), अतः चौड़ाई = 1 − x/2', 'Area = (x² − x/2)² − (x² − 1)² = (1 − x/2)(2x² − x/2 − 1), so breadth = 1 − x/2');

  /* ================= 2024 ================= */
  const ODD = ['प्रत्येक प्रश्न में चार पद हैं। तीन पद किसी न किसी रूप में एक-से हैं और एक पद भिन्न है। भिन्न पद चुनिए।', 'Each question has four terms. Three terms are alike in some way and one is different. Choose the different term.'];
  const AN = [':: के बायीं ओर के दो पदों में जो सम्बन्ध है वही सम्बन्ध दायीं ओर के दो पदों में है। लुप्त पद ज्ञात कीजिए:', 'The terms on the left of :: have the same relationship as the terms on the right. Find the missing term:'];
  const odd = (y, no, d, o, a, xh, xe) => add(y, no, 'mat', d, ODD[0], ODD[1], o, a, xh, xe, { cat: 'odd' });
  const an = (y, no, d, item, o, a, xh, xe) => { const [ih, ie] = Array.isArray(item) ? item : [item, item]; add(y, no, 'mat', d, `${AN[0]}\n${ih}`, `${AN[1]}\n${ie}`, o, a, xh, xe, { cat: 'analogy' }); };
  odd(2024, 2, 'hard', ['50 − 56', '32 − 38', '64 − 80', '63 − 77'], 0, 'विवादित प्रश्न: कोई एक साफ़ नियम नहीं बनता (अन्तर 6, 6, 16, 14; 63 − 77 दोनों 7 के गुणज), इसलिए एक पक्का उत्तर तय नहीं होता।', 'Disputed question: no single clear rule (differences 6, 6, 16, 14; 63 − 77 are both multiples of 7), so no one answer is certain.');
  odd(2024, 5, 'hard', ['OUST', 'PIGS', 'TEPJ', 'XLPA'], 0, 'विवादित प्रश्न: अक्षरों में कोई एक साफ़ नियम नहीं मिलता जिससे केवल एक पद अलग हो।', 'Disputed question: no clear letter rule makes exactly one term different.');
  odd(2024, 8, 'moderate', [['बाँसुरी', 'Flute'], ['गिटार', 'Guitar'], ['वायलिन', 'Violin'], ['हारमोनियम', 'Harmonium']], 0, 'विवादित प्रश्न: गिटार व वायलिन तार वाले हैं, बाँसुरी व हारमोनियम हवा से बजते हैं — दो-दो के समूह बनते हैं, एक भिन्न पद तय नहीं होता।', 'Disputed question: guitar and violin are string instruments, flute and harmonium are wind instruments — two pairs, no single odd one.');
  an(2024, 22, 'easy', [['धकेलना : खींचना :: फेंकना : ?', 'PUSH : PULL :: THROW : ?']], [['कूदना', 'Jump'], ['इकट्ठा करना', 'Collect'], ['उठाना', 'Pick'], ['खेल', 'Game']], 2, 'विपरीतार्थक: फेंकना ↔ इकट्ठा करना।', 'Opposites: throw ↔ collect.');
  add(2024, 32, 'mat', 'moderate', `${SW[0]}\n15 ÷ 9 × 3 − 74 + 2 = 5`, `${SW[1]}\n15 ÷ 9 × 3 − 74 + 2 = 5`, [['+ और −', '+ and −'], ['÷ और ×', '÷ and ×'], ['+ और ÷', '+ and ÷'], ['− और ÷', '− and ÷']], 3,
    'चिह्न बदलने पर: 15 + 9 × 3 − 74 ÷ 2 = 15 + 27 − 37 = 5', 'After interchanging: 15 + 9 × 3 − 74 ÷ 2 = 15 + 27 − 37 = 5', { cat: 'ops' });
  const sub = (no, d, hi, en, o, a, x) => add(2024, no, 'mat', d, hi, en, o, a, x, x, { cat: 'ops' });
  sub(34, 'moderate', 'यदि ‘+’ का अर्थ ‘−’, ‘×’ का अर्थ ‘÷’, ‘÷’ का अर्थ ‘+’ और ‘−’ का अर्थ ‘×’ है तो 252 × 9 − 5 + 32 ÷ 92 का मान होगा?', 'If ‘+’ means ‘−’, ‘×’ means ‘÷’, ‘÷’ means ‘+’ and ‘−’ means ‘×’, then what is the value of 252 × 9 − 5 + 32 ÷ 92?', ['95', '168', '192', '200'], 4, '252 ÷ 9 × 5 − 32 + 92 = 140 − 32 + 92 = 200');
  sub(37, 'moderate', 'यदि + का अर्थ −, − का अर्थ ×, ÷ का अर्थ + और × का अर्थ ÷ है तब 15 − 3 + 10 × 5 ÷ 5 = ?', 'If + means −, − means ×, ÷ means + and × means ÷, then 15 − 3 + 10 × 5 ÷ 5 = ?', ['5', '22', '48', '52'], 3, '15 × 3 − 10 ÷ 5 + 5 = 45 − 2 + 5 = 48');
  sub(38, 'hard', 'यदि × का अर्थ ÷, − का अर्थ ×, ÷ का अर्थ + और + का अर्थ − है तब (3 − 15 ÷ 19) × 8 + 6 = ?', 'If × means ÷, − means ×, ÷ means + and + means −, then (3 − 15 ÷ 19) × 8 + 6 = ?', ['−1', '8', '4', '2'], 4, '(3 × 15 + 19) ÷ 8 − 6 = 64 ÷ 8 − 6 = 2');
  sub(39, 'hard', 'यदि × का अर्थ +, + का अर्थ ÷, − का अर्थ × और ÷ का अर्थ − है तब 8 × 7 − 8 + 40 ÷ 2 = ?', 'If × means +, + means ÷, − means × and ÷ means −, then 8 × 7 − 8 + 40 ÷ 2 = ?', ['44', '7 2/5', '8 3/5', '1'], 2, '8 + 7 × 8 ÷ 40 − 2 = 8 + 1.4 − 2 = 7.4 = 7 2/5');
  add(2024, 44, 'mat', 'easy', 'यदि E = 5, PEN = 35 है तब PAGE = ?', 'If E = 5, PEN = 35, then PAGE = ?', ['27', '28', '29', '36'], 3, 'अक्षरों की स्थान-संख्या का योग: P16 + E5 + N14 = 35; P16 + A1 + G7 + E5 = 29', 'Sum of letter positions: 16 + 5 + 14 = 35; 16 + 1 + 7 + 5 = 29', { cat: 'coding' });
  add(2024, 48, 'mat', 'hard', `${SW[0]}\n9 + 7 ÷ 3 × 2 − 22 = −1`, `${SW[1]}\n9 + 7 ÷ 3 × 2 − 22 = −1`, [['× और −', '× and −'], ['+ और +', '+ and +'], ['÷ और ×', '÷ and ×'], ['+ और ÷', '+ and ÷']], 0,
    'त्रुटिपूर्ण प्रश्न: किसी भी विकल्प के चिह्न बदलने पर उत्तर −1 नहीं आता।', 'Faulty question: no option gives −1 after interchanging.', { cat: 'ops' });
  an(2024, 52, 'moderate', '7 : 32 :: 8 : ?', ['33', '34', '35', '36'], 0, 'विवादित प्रश्न: दो नियम बराबर ठीक बैठते हैं — 7 + 25 = 32 (तो 33) और 4 × (7 + 1) = 32 (तो 36)।', 'Disputed question: two rules fit equally well — 7 + 25 = 32 (giving 33) and 4 × (7 + 1) = 32 (giving 36).');
  add(2024, 65, 'mat', 'hard', 'श्रेणी में प्रश्नचिह्न (?) के स्थान पर क्या आएगा?\n2, 5, 19, 37, ?', 'What will come in place of the question mark (?)?\n2, 5, 19, 37, ?', ['73', '75', '76', '78'], 0, 'विवादित प्रश्न: अन्तर 3, 14, 18 में कोई नियमित क्रम नहीं है, इसलिए एक पक्का उत्तर नहीं निकलता।', 'Disputed question: the differences 3, 14, 18 follow no regular pattern, so no certain answer.', { cat: 'series' });
  add(2024, 67, 'mat', 'moderate', 'श्रेणी में प्रश्नचिह्न (?) के स्थान पर क्या आएगा?\n3F, 6G, 11I, 18L, ?', 'What will come in place of the question mark (?)?\n3F, 6G, 11I, 18L, ?', ['21Q', '25N', '25P', '27P'], 4, 'संख्याएँ +3, +5, +7, +9 → 27; अक्षर +1, +2, +3, +4 → P', 'Numbers +3, +5, +7, +9 → 27; letters +1, +2, +3, +4 → P', { cat: 'series' });
  const v24 = FIG.vennSet(['nest3', 'two_in_one', 'nest2_sep1', 'sep3tri']);
  add(2024, 84, 'mat', 'hard', `${VQ[0]}\nईमानदारी, बुद्धि, अभिक्षमता`, `${VQ[1]}\nHonesty, Intelligence, Aptitude`, ['4', '3', '2', '1'], 1, 'तीनों अलग-अलग गुण हैं, कोई एक-दूसरे में शामिल नहीं — आरेख 4 (तीन अलग वृत्त)।', 'Three separate qualities, none contains another — diagram 4 (three separate circles).', { cat: 'venn', figure: v24 });
  add(2024, 108, 'maths', 'moderate', 'यदि x² + 1/x² = 6 तो x³ − 1/x³ का मान होगा-', 'If x² + 1/x² = 6 then the value of x³ − 1/x³ will be-', ['10', '12', '14', '16'], 3, '(x − 1/x)² = 6 − 2 = 4 ⇒ x − 1/x = 2; x³ − 1/x³ = 2³ + 3 × 2 = 14', '(x − 1/x)² = 4 ⇒ x − 1/x = 2; x³ − 1/x³ = 8 + 6 = 14');
  const bat = FIG.svg(220, 60, `${line(10, 30, 70, 30)}${line(70, 12, 70, 48)}${line(84, 20, 84, 40, 4)}${line(98, 12, 98, 48)}${line(112, 20, 112, 40, 4)}${line(112, 30, 210, 30)}` + T(66, 10, '+', 16, B) + T(118, 14, '−', 18, B));
  add(2024, 135, 'science', 'easy', 'नीचे दिया गया चिह्न किसका प्रतीक है?', 'The symbol given below is the symbol of-', [['बैटरी', 'Battery'], ['प्रतिरोध', 'Resistance'], ['कुंजी', 'Key'], ['अमीटर', 'Ammeter']], 1, 'कई सेलों का क्रम = बैटरी।', 'Several cells in series = battery.', { figure: bat });
  add(2024, 154, 'sst', 'moderate', 'जैन धर्म का संस्थापक कौन था?', 'Who was the founder of Jainism?', [['महावीर स्वामी', 'Mahavir Swami'], ['ऋषभदेव', 'Rishabhdev'], ['पार्श्वनाथ', 'Parshvanath'], ['महात्मा बुद्ध', 'Mahatma Buddha']], 2, 'जैन परम्परा में प्रथम तीर्थंकर ऋषभदेव को संस्थापक माना जाता है (महावीर 24वें तीर्थंकर थे)।', 'In Jain tradition the first Tirthankara, Rishabhdev, is regarded as the founder (Mahavira was the 24th).');
  add(2024, 172, 'sst', 'easy', 'उत्तर प्रदेश के राज्यपाल हैं? (परीक्षा वर्ष 2024 के अनुसार)', 'Who is the Governor of Uttar Pradesh? (as in the exam year 2024)', [['द्रौपदी मुर्मू', 'Draupadi Murmu'], ['रमेश भण्डारी', 'Ramesh Bhandari'], ['आनन्दी बेन पटेल', 'Anandiben Patel'], ['स्वतन्त्र सिंह', 'Swatantra Singh']], 3);
  add(2024, 180, 'sst', 'moderate', 'राज्य के नीति-निदेशक तत्व में क्या शामिल नहीं है?', 'What is not included in the Directive Principles of State Policy?', [['कुटीर उद्योग', 'Cottage industry'], ['जीव-जन्तुओं की रक्षा', 'Protection of animals'], ['उपाधियों का अन्त', 'End of titles'], ['झण्डे का सम्मान', 'Respect for the flag']], 0, 'विवादित प्रश्न: कुटीर उद्योग (अनु. 43) और पशु/वन्यजीव संरक्षण (अनु. 48, 48A) नीति-निदेशक तत्व हैं; पर ‘उपाधियों का अन्त’ (मौलिक अधिकार, अनु. 18) और ‘झण्डे का सम्मान’ (मौलिक कर्तव्य) दोनों शामिल नहीं हैं — दो विकल्प सही बनते हैं।', 'Disputed question: cottage industry (Art. 43) and protection of animals (Arts. 48, 48A) are Directive Principles; but both ‘end of titles’ (Fundamental Right, Art. 18) and ‘respect for the flag’ (Fundamental Duty) are not — two options are correct.');

  /* ================= 2025 ================= */
  an(2025, 13, 'moderate', 'T/J : 2 :: X/H : ?', ['2', '3', '4', '7'], 2, 'T = 20, J = 10 ⇒ 20 ÷ 10 = 2; X = 24, H = 8 ⇒ 24 ÷ 8 = 3', 'T = 20, J = 10 ⇒ 2; X = 24, H = 8 ⇒ 3');
  an(2025, 19, 'moderate', ['स्पर्श : महसूस :: नमस्कार : ?', 'Touch : Feel :: Greet : ?'], [['मुस्कुराओ', 'Smile'], ['शिष्टाचार', 'Manners'], ['स्वीकार करें', 'Acknowledge'], ['सफलता', 'Success']], 0, 'विवादित प्रश्न: ‘स्वीकार करना’ और ‘मुस्कुराना’ दोनों तर्कसंगत लगते हैं; पुस्तिका से एक पक्का उत्तर तय नहीं होता।', 'Disputed question: both ‘acknowledge’ and ‘smile’ can be argued; the booklet does not fix one answer.');
  add(2025, 23, 'mat', 'moderate', 'एक निश्चित कोड में FIRE को QHDE और MOVE को ZMWE लिखा जाता है। कोडिंग के समान नियम का पालन करते हुए OVER शब्द के लिए कोड क्या होना चाहिए?', 'In a certain code, FIRE is written as QHDE and MOVE as ZMWE. Following the same rule of coding, what should be the code for the word OVER?', ['MWED', 'MWEO', 'MWDE', 'MWZD'], 1,
    'अक्षर-कोड: O = M, V = W, E = E, R = D ⇒ MWED', 'Letter codes: O = M, V = W, E = E, R = D ⇒ MWED', { cat: 'coding' });
  const G25 = (no, d, str, o, a, xh, xe) => add(2025, no, 'mat', d, `${GQ[0]}\n${str}`, `${GQ[1]}\n${str}`, o, a, xh, xe, { cat: 'gap' });
  G25(46, 'hard', 'abca_bcaab_ca_bbc_a', ['ccaa', 'bbaa', 'abac', 'abba'], 2, 'abca | bbcaa | bbcaa | bbcaa — ‘bbcaa’ दोहराया जाता है।', 'abca | bbcaa | bbcaa | bbcaa — ‘bbcaa’ repeats.');
  G25(47, 'hard', '_bbca_bcca_ac_a_cb', ['abcba', 'acbab', 'bacab', 'bcaab'], 0, 'त्रुटिपूर्ण प्रश्न: कोई भी विकल्प भरने पर नियमित (दोहराने वाली) श्रेणी नहीं बनती।', 'Faulty question: no option makes a regular repeating series.');
  G25(49, 'moderate', 'a_bc_a_bcda_ccd_bcd_', ['abddbd', 'acbdbb', 'adbbad', 'adbcad'], 3, 'aabcd, abbcd, abccd, abcdd — हर समूह में अगला अक्षर दोहराया जाता है।', 'aabcd, abbcd, abccd, abcdd — the next letter doubles in each group.');
  G25(50, 'easy', 'mnonopqopqrs_____', ['mnopq', 'oqrst', 'pqrst', 'qrstu'], 3, 'mno, nopq, opqrs, pqrst… — हर समूह एक अक्षर आगे से शुरू होता है।', 'mno, nopq, opqrs, pqrst… — each group starts one letter later.');
  const OP = ['अक्षरों को पुनर्व्यवस्थित कर बने सार्थक शब्द के अर्थ के लगभग विपरीत शब्द चुनिए:', 'Rearrange the letters into a meaningful word and choose the word nearly opposite in meaning:'];
  add(2025, 56, 'mat', 'moderate', `${OP[0]} YPCUIAT`, `${OP[1]} YPCUIAT`, [['अधिशेष', 'Surplus'], ['कमी', 'Scarcity'], ['उपस्थिति', 'Presence'], ['समृद्धि', 'Richness']], 1, 'YPCUIAT → PAUCITY (कमी), विपरीत: अधिशेष', 'YPCUIAT → PAUCITY, opposite: surplus', { cat: 'analogy' });
  add(2025, 57, 'mat', 'hard', `${OP[0]} QHNASVUI`, `${OP[1]} QHNASVUI`, [['जीत', 'Win'], ['नीचा दिखाना', 'Debase'], ['नष्ट करना', 'Destroy'], ['बर्बाद करना', 'Ruin']], 0, 'विवादित प्रश्न: QHNASVUI → VANQUISH (हराना); सभी विकल्प इसके समान या निकट अर्थ के हैं, कोई स्पष्ट विपरीत शब्द नहीं।', 'Disputed question: QHNASVUI → VANQUISH; every option is close in meaning, none is a clear opposite.', { cat: 'analogy' });
  add(2025, 66, 'mat', 'hard', NQ[0], NQ[1], ['14, 21', '21, 14', '56, 84', '84, 56'], 0, 'त्रुटिपूर्ण प्रश्न: पहली दो पंक्तियों पर कोई एक ही नियम लागू नहीं होता जो तीसरी पंक्ति में किसी विकल्प तक पहुँचाए (यही प्रश्न 2023 में भी था)।', 'Faulty question: no single rule fits the first two rows and leads to any option (the same question appeared in 2023).', { cat: 'figurenum', figure: ckTable });
  const trig = (l, r, b, c) => pg('60,8 104,88 16,88') + T(14, 54, l, 18, B) + T(106, 54, r, 18, B) + T(60, 108, b, 18, B) + T(60, 66, c, 18, B);
  nfig(2025, 67, 'hard', [trig(5, 6, 4, 12), trig(6, 7, 5, 21), trig(4, 8, 10, '?')], ['22', '30', '32', ['इनमें से कोई नहीं', 'None of these']], 2, 'बाएँ × नीचे − दाएँ − 2: 5×4 − 6 − 2 = 12, 6×5 − 7 − 2 = 21, 4×10 − 8 − 2 = 30', 'Left × bottom − right − 2: 12, 21, 4×10 − 8 − 2 = 30');
  const yN = (a, b, m) => `${line(60, 58, 60, 92, 2)}${line(60, 58, 28, 26, 2)}${line(60, 58, 92, 26, 2)}` + T(22, 20, a, 16, B) + T(98, 20, b, 16, B) + T(60, 108, m, 16, B);
  nfig(2025, 68, 'moderate', [yN(13, 19, 4), yN(71, 9, 10), yN(128, 32, '?')], ['10', '15', '20', '25'], 3, 'ऊपर की संख्याओं का योग ÷ 8: (13 + 19) ÷ 8 = 4, (71 + 9) ÷ 8 = 10, (128 + 32) ÷ 8 = 20', 'Sum of the top numbers ÷ 8: 4, 10, 160 ÷ 8 = 20', 120, 114);
  const v25 = FIG.vennSet(['nest3', 'two_in_one', 'int2_in_one', 'nest2_sep1']);
  add(2025, 73, 'mat', 'hard', `${VQ[0]}\nसमुद्र, टापू, पर्वत`, `${VQ[1]}\nSea, Island, Mountain`, ['4', '1', '3', '2'], 0, 'विवादित प्रश्न: टापू समुद्र में है और कुछ पर्वत टापू पर हैं, कुछ नहीं — कोई भी आरेख ठीक मेल नहीं खाता (यही प्रश्न 2023 में भी था)।', 'Disputed question: islands are in the sea and some mountains are on islands, some are not — no diagram matches exactly (the same question appeared in 2023).', { cat: 'venn', figure: v25 });
  add(2025, 79, 'mat', 'easy', `${VQ[0]}\nकारखाना, उपकरण, उत्पाद`, `${VQ[1]}\nFactory, Machinery, Product`, ['2', '4', '1', '3'], 1, 'कारखाने के अंदर उपकरण और उत्पाद, दोनों अलग-अलग — आरेख 2।', 'Machinery and products are both inside the factory and separate from each other — diagram 2.', { cat: 'venn', figure: v25 });
  add(2025, 80, 'mat', 'easy', `${VQ[0]}\nसूर्य, तारा, चन्द्रमा`, `${VQ[1]}\nSun, Star, Moon`, ['4', '3', '2', '1'], 1, 'सूर्य एक तारा है (वृत्त के अंदर वृत्त) और चन्द्रमा अलग है — आरेख 4।', 'The Sun is a star (circle inside circle) and the Moon is separate — diagram 4.', { cat: 'venn', figure: v25 });
  add(2025, 134, 'sst', 'moderate', 'कोलम्बस किस देश का निवासी था?', 'Columbus was a resident of which country?', [['पुर्तगाल', 'Portugal'], ['स्पेन', 'Spain'], ['मारीशस', 'Mauritius'], ['अमेरिका', 'America']], 0, 'विवादित प्रश्न: कोलम्बस का जन्म जेनोआ (इटली) में हुआ था; उसकी यात्राएँ स्पेन की ओर से हुईं और वह पहले पुर्तगाल में रहा — इटली विकल्प में नहीं है।', 'Disputed question: Columbus was born in Genoa (Italy); he sailed for Spain and earlier lived in Portugal — Italy is not an option.');
  add(2025, 172, 'maths', 'moderate', '1 ÷ [1 + 1 ÷ {1 + 1 ÷ (1 ÷ 1)}] = ?', '1 ÷ [1 + 1 ÷ {1 + 1 ÷ (1 ÷ 1)}] = ?', ['5/3', '4/3', '2/3', '1/3'], 3, '1 ÷ 1 = 1; 1 + 1 ÷ 1 = 2; 1 + 1 ÷ 2 = 3/2; 1 ÷ 3/2 = 2/3', '1 ÷ 1 = 1; 1 + 1 = 2; 1 + 1/2 = 3/2; 1 ÷ 3/2 = 2/3');
  const f175 = FIG.svg(200, 160, `<polygon points="40,40 110,10 170,120 80,140" ${S}/>` + T(28, 42, 'A', 15) + T(112, 8, 'D', 15) + T(182, 126, 'C', 15) + T(78, 156, 'B', 15) + T(62, 48, '100°', 12) + T(94, 128, '112°', 12) + T(148, 112, '67°', 12));
  add(2025, 175, 'maths', 'moderate', 'चतुर्भुज ABCD में ∠ADC के कोटिपूरक कोण का सम्पूरक कोण है-', 'In the quadrilateral ABCD, the supplementary angle of the complementary angle of ∠ADC is-', ['81°', '109°', '171°', '105°'], 3,
    '∠ADC = 360° − 100° − 112° − 67° = 81°; कोटिपूरक = 9°; सम्पूरक = 171°', '∠ADC = 360° − 100° − 112° − 67° = 81°; complement 9°; supplement 171°', { figure: f175 });
  const f176 = FIG.svg(200, 190, `<circle cx="100" cy="90" r="70" ${S}/><polyline points="34,112 100,90 166,112" ${S}/><polyline points="34,112 100,160 166,112" ${S}/>` + T(22, 118, 'A', 15) + T(178, 118, 'C', 15) + T(100, 182, 'B', 15) + T(100, 80, 'O', 15) + T(100, 144, '100°', 12));
  add(2025, 176, 'maths', 'moderate', 'चित्र में तीन बिन्दु A, B तथा C एक वृत्त पर स्थित हैं। बिन्दु O वृत्त का केन्द्र है। यदि ∠ABC = 100° तो ∠AOC का मान है-', 'In the figure, three points A, B and C lie on a circle and O is the centre. If ∠ABC = 100°, then the value of ∠AOC is-', ['120°', '160°', '110°', '130°'], 2,
    'बड़े चाप पर कोण = 180° − 100° = 80°, अतः ∠AOC = 2 × 80° = 160°', 'The angle on the major arc = 180° − 100° = 80°, so ∠AOC = 2 × 80° = 160°', { figure: f176 });

  window.PYQ_EXTRA = out;
})();
