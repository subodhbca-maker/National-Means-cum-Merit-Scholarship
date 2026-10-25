/* Basic Pathshala - NMMS : procedural bilingual question generators
   Every generator(diff) returns { topic, q:{hi,en}, options:[{hi,en}x4], answer, explanation:{hi,en} }
   so MAT and Maths papers can always be filled with fresh questions at any difficulty. */
(function () {
  const { rand, pick, shuffle, bi } = U;
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const L = (i) => ABC[((i % 26) + 26) % 26];

  /* build 4 options with the correct one at a random slot */
  function finish(topic, q, correct, distractors, explanation) {
    const seen = new Set([key(correct)]);
    const ds = [];
    for (const d of distractors) {
      const k = key(d);
      if (!seen.has(k) && ds.length < 3) { seen.add(k); ds.push(d); }
    }
    if (ds.length < 3) return null;
    const opts = shuffle([correct, ...ds]);
    const answer = opts.findIndex((o) => key(o) === key(correct));
    return { topic, q, options: opts.map(asBi), answer, explanation: asBi(explanation || '') };
  }
  function key(o) { return typeof o === 'object' ? o.en + '|' + o.hi : String(o); }
  function asBi(o) { return typeof o === 'object' ? o : bi(o, o); }
  function nearNums(c, spread, extra) {
    const out = (extra || []).slice();
    let tries = 0;
    while (out.length < 12 && tries++ < 60) {
      const d = rand(1, spread) * (Math.random() < 0.5 ? -1 : 1);
      if (c + d > 0) out.push(c + d);
    }
    return shuffle(out.filter((x) => x !== c && x > 0 && Number.isFinite(x)));
  }

  /* ---------------- MAT ---------------- */

  function numberSeries(diff) {
    let terms, ans, rule;
    if (diff === 'easy') {
      const t = rand(0, 2);
      if (t === 0) { const a = rand(2, 30), d = rand(3, 12); terms = [0, 1, 2, 3, 4].map((i) => a + i * d); ans = a + 5 * d; rule = bi(`प्रत्येक पद में ${d} जोड़ा गया है।`, `Each term increases by ${d}.`); }
      else if (t === 1) { const a = rand(2, 5), r = rand(2, 3); terms = [0, 1, 2, 3].map((i) => a * r ** i); ans = a * r ** 4; rule = bi(`प्रत्येक पद को ${r} से गुणा किया गया है।`, `Each term is multiplied by ${r}.`); }
      else { const a = rand(60, 120), d = rand(4, 9); terms = [0, 1, 2, 3, 4].map((i) => a - i * d); ans = a - 5 * d; rule = bi(`प्रत्येक पद में से ${d} घटाया गया है।`, `Each term decreases by ${d}.`); }
    } else if (diff === 'moderate') {
      const t = rand(0, 3);
      if (t === 0) { let a = rand(2, 10), d = rand(1, 4), s = rand(1, 3); terms = [a]; for (let i = 0; i < 4; i++) { a += d; d += s; terms.push(a); } ans = a + d; rule = bi(`क्रमागत पदों का अंतर ${s} के क्रम से बढ़ रहा है।`, `Differences increase by ${s} each time.`); }
      else if (t === 1) { const m = rand(2, 3), c = pick([1, -1, 2]); let a = rand(2, 6); terms = [a]; for (let i = 0; i < 4; i++) { a = a * m + c; terms.push(a); } ans = a * m + c; rule = bi(`अगला पद = पिछला पद × ${m} ${c > 0 ? '+' : '−'} ${Math.abs(c)}`, `Next = previous × ${m} ${c > 0 ? '+' : '−'} ${Math.abs(c)}`); }
      else if (t === 2) { const s = rand(1, 4); terms = [0, 1, 2, 3, 4].map((i) => (i + s) ** 2); ans = (5 + s) ** 2; rule = bi(`पद क्रमागत संख्याओं के वर्ग हैं (${s}², ${s + 1}², …)।`, `Terms are squares of consecutive numbers (${s}², ${s + 1}², …).`); }
      else { const a = rand(2, 9), b = rand(20, 40), d1 = rand(2, 5), d2 = rand(2, 5); terms = [a, b, a + d1, b - d2, a + 2 * d1, b - 2 * d2]; ans = a + 3 * d1; rule = bi(`दो वैकल्पिक श्रेणियाँ: ${a}, ${a + d1}, … (+${d1}) तथा ${b}, ${b - d2}, … (−${d2})`, `Two alternate series: ${a}, ${a + d1}, … (+${d1}) and ${b}, ${b - d2}, … (−${d2})`); }
    } else {
      const t = rand(0, 3);
      if (t === 0) { const s = rand(0, 2); terms = [1, 2, 3, 4, 5].map((i) => (i + s) ** 3 - (i + s)); ans = (6 + s) ** 3 - (6 + s); rule = bi('पद = n³ − n', 'Term = n³ − n'); }
      else if (t === 1) { const s = rand(1, 3); terms = [0, 1, 2, 3, 4].map((i) => (i + s) * (i + s + 1)); terms.unshift(0); terms = terms.slice(1); ans = (5 + s) * (6 + s); rule = bi('पद = n × (n+1)', 'Term = n × (n+1)'); }
      else if (t === 2) { let a = rand(1, 4), b = rand(2, 5); terms = [a, b]; for (let i = 0; i < 4; i++) { const c = terms[terms.length - 1] + terms[terms.length - 2]; terms.push(c); } ans = terms[terms.length - 1] + terms[terms.length - 2]; rule = bi('प्रत्येक पद पिछले दो पदों का योग है।', 'Each term is the sum of the previous two terms.'); }
      else { let a = rand(2, 5); terms = [a]; const ops = [[2, 1], [3, -1]]; for (let i = 0; i < 4; i++) { const [m, c] = ops[i % 2]; a = a * m + c; terms.push(a); } const [m, c] = ops[4 % 2]; ans = a * m + c; rule = bi('बारी-बारी से ×2+1 तथा ×3−1', 'Alternately ×2+1 and ×3−1'); }
    }
    const series = terms.join(', ') + ', ?';
    const diffs = [ans + 1, ans - 1, ans + 2, ans - 2, ans + (terms[1] - terms[0]), ans + 10, ans - 10];
    return finish('Number Series', bi(`श्रेणी में प्रश्नचिह्न (?) के स्थान पर क्या आएगा? ${series}`, `What will come in place of the question mark (?) in the series? ${series}`),
      ans, nearNums(ans, 6, diffs), rule);
  }

  function alphaSeries(diff) {
    let parts, ans, rule;
    if (diff === 'easy') {
      const s = rand(0, 12), d = rand(2, 4);
      parts = [0, 1, 2, 3, 4].map((i) => L(s + i * d)); ans = L(s + 5 * d);
      rule = bi(`प्रत्येक अक्षर ${d} स्थान आगे है।`, `Each letter moves ${d} places forward.`);
    } else if (diff === 'moderate') {
      const s = rand(0, 6), g = rand(1, 2);
      parts = [0, 1, 2, 3].map((i) => L(s + i * (3 + g)) + L(s + i * (3 + g) + 1) + L(s + i * (3 + g) + 2));
      const i = 4; ans = L(s + i * (3 + g)) + L(s + i * (3 + g) + 1) + L(s + i * (3 + g) + 2);
      rule = bi(`तीन-तीन क्रमागत अक्षरों के समूह, बीच में ${g} अक्षर छोड़कर।`, `Groups of three consecutive letters, skipping ${g} letter(s) between groups.`);
    } else {
      const s = rand(6, 12), d1 = rand(2, 3), d2 = rand(2, 4), n = rand(2, 6), dn = rand(2, 4);
      parts = [0, 1, 2, 3].map((i) => L(s - i * d1) + L(s + 2 + i * d2) + (n + i * dn));
      ans = L(s - 4 * d1) + L(s + 2 + 4 * d2) + (n + 4 * dn);
      rule = bi(`पहला अक्षर ${d1} पीछे, दूसरा अक्षर ${d2} आगे, संख्या +${dn}`, `First letter −${d1}, second letter +${d2}, number +${dn}`);
    }
    const wrong = [];
    for (let k = 1; wrong.length < 6; k++) {
      const w = ans.replace(/[A-Z]/, (c) => L(ABC.indexOf(c) + (k % 2 ? k : -k)));
      wrong.push(w);
      const w2 = ans.replace(/[A-Z](?=[^A-Z]*$)/, (c) => L(ABC.indexOf(c) + (k % 2 ? -k : k)));
      wrong.push(w2);
      if (/\d/.test(ans)) wrong.push(ans.replace(/\d+/, (x) => String(+x + (k % 2 ? k : -k))));
    }
    return finish('Alphabet Series', bi(`अक्षर श्रेणी में अगला पद ज्ञात कीजिए: ${parts.join(', ')}, ?`, `Find the next term in the series: ${parts.join(', ')}, ?`), ans, shuffle(wrong), rule);
  }

  const WORDS = ['CAT', 'DOG', 'SUN', 'PEN', 'BOOK', 'TREE', 'FISH', 'GOAT', 'BIRD', 'MILK', 'ROSE', 'KING', 'LAMP', 'DESK', 'HOME', 'GOLD', 'RAIN', 'STAR', 'FARM', 'SHIP', 'WATER', 'PLANT', 'CHAIR', 'TABLE', 'RIVER', 'HOUSE', 'TRAIN', 'MOUSE', 'TIGER', 'APPLE', 'BREAD', 'CLOUD', 'SCHOOL', 'MARKET', 'GARDEN', 'FRIEND', 'MOTHER', 'PENCIL', 'SPRING'];
  function coding(diff) {
    let enc, desc;
    if (diff === 'easy') { const k = pick([1, 2]); enc = (w) => w.split('').map((c) => L(ABC.indexOf(c) + k)).join(''); desc = bi(`प्रत्येक अक्षर को ${k} स्थान आगे लिखा गया है।`, `Each letter is shifted ${k} place(s) forward.`); }
    else if (diff === 'moderate') {
      const t = rand(0, 1);
      if (t === 0) { const k = rand(1, 3); enc = (w) => w.split('').reverse().map((c) => L(ABC.indexOf(c) + k)).join(''); desc = bi(`शब्द को उल्टा लिखकर प्रत्येक अक्षर ${k} स्थान आगे किया गया है।`, `Word is reversed and each letter shifted ${k} forward.`); }
      else { enc = (w) => w.split('').map((c, i) => L(ABC.indexOf(c) + (i % 2 ? -1 : 1))).join(''); desc = bi('अक्षरों को बारी-बारी से +1 और −1 किया गया है।', 'Letters are alternately shifted +1 and −1.'); }
    } else {
      const t = rand(0, 1);
      if (t === 0) { enc = (w) => w.split('').map((c) => L(25 - ABC.indexOf(c))).join(''); desc = bi('प्रत्येक अक्षर को उसके विपरीत अक्षर (A↔Z, B↔Y…) से बदला गया है।', 'Each letter is replaced by its opposite letter (A↔Z, B↔Y…).'); }
      else { enc = (w) => w.split('').map((c, i) => L(ABC.indexOf(c) + i + 1)).join(''); desc = bi('पहला अक्षर +1, दूसरा +2, तीसरा +3 … आगे किया गया है।', 'Letters are shifted +1, +2, +3 … by position.'); }
    }
    const pool = shuffle(WORDS.filter((w) => (diff === 'easy' ? w.length <= 4 : w.length >= 4)));
    const w1 = pool[0], w2 = pool.find((w) => w.length === w1.length && w !== w1) || pool[1];
    const ans = enc(w2);
    const wrong = [];
    for (let k = 0; k < ans.length; k++) {
      wrong.push(ans.slice(0, k) + L(ABC.indexOf(ans[k]) + 1) + ans.slice(k + 1));
      wrong.push(ans.slice(0, k) + L(ABC.indexOf(ans[k]) - 1) + ans.slice(k + 1));
    }
    wrong.push(ans.split('').reverse().join(''));
    return finish('Coding-Decoding', bi(`किसी कूट भाषा में ${w1} को ${enc(w1)} लिखा जाता है। उसी भाषा में ${w2} को कैसे लिखा जाएगा?`, `In a certain code language ${w1} is written as ${enc(w1)}. How will ${w2} be written in that code?`), ans, shuffle(wrong), desc);
  }

  function numberAnalogy(diff) {
    const fns = {
      easy: [[(x) => x * x, 'x²'], [(x) => x * 3, '3x'], [(x) => x + 9, 'x + 9']],
      moderate: [[(x) => x ** 3, 'x³'], [(x) => x * x + 1, 'x² + 1'], [(x) => x * (x + 1), 'x(x + 1)']],
      hard: [[(x) => x ** 3 + x, 'x³ + x'], [(x) => x * x * 2 - 1, '2x² − 1'], [(x) => (x + 1) ** 2 - x, '(x+1)² − x']]
    }[diff];
    const [f, name] = pick(fns);
    const a = rand(2, diff === 'hard' ? 7 : 9);
    let b = rand(2, diff === 'hard' ? 8 : 12); if (b === a) b = a + 1;
    const ans = f(b);
    return finish('Number Analogy', bi(`${a} : ${f(a)} :: ${b} : ?`, `${a} : ${f(a)} :: ${b} : ?`), ans,
      nearNums(ans, 5, [ans + b, ans - b, f(b + 1), f(b - 1), ans + 1, ans - 1]), bi(`नियम: ${name}`, `Rule: ${name}`));
  }

  const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
  function oddOneNumber(diff) {
    let set, odd, why;
    if (diff === 'easy') {
      const k = pick([3, 4, 5, 6, 7, 9]);
      set = shuffle([...Array(12).keys()].map((i) => (i + 2) * k)).slice(0, 3);
      do { odd = rand(10, 80); } while (odd % k === 0);
      why = bi(`शेष सभी ${k} के गुणज हैं।`, `All others are multiples of ${k}.`);
    } else if (diff === 'moderate') {
      if (Math.random() < 0.5) {
        set = shuffle(PRIMES.filter((p) => p > 10)).slice(0, 3);
        odd = pick([21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91]);
        why = bi('शेष सभी अभाज्य संख्याएँ हैं।', 'All others are prime numbers.');
      } else {
        set = shuffle([16, 25, 36, 49, 64, 81, 100, 121, 144, 169]).slice(0, 3);
        odd = pick([18, 27, 48, 72, 99, 125, 150]);
        why = bi('शेष सभी पूर्ण वर्ग संख्याएँ हैं।', 'All others are perfect squares.');
      }
    } else {
      const k = rand(6, 14);
      const ns = shuffle([...Array(10).keys()].map((i) => i + 9)).slice(0, 4);
      set = ns.slice(0, 3).map((n) => `${n}-${n * k}`);
      odd = `${ns[3]}-${ns[3] * k + pick([-2, -1, 1, 2, k - 1])}`;
      why = bi(`शेष सभी युग्मों में दूसरी संख्या = पहली × ${k}`, `In all other pairs, second number = first × ${k}`);
    }
    const opts = shuffle([...set.map(String), String(odd)]);
    return { topic: 'Odd One Out', q: bi('निम्नलिखित में से भिन्न पद को चुनिए।', 'Choose the odd one out.'), options: opts.map((o) => bi(o, o)), answer: opts.indexOf(String(odd)), explanation: why };
  }

  function oddOneLetters(diff) {
    const gap = diff === 'easy' ? 1 : rand(2, 3);
    const len = diff === 'hard' ? 4 : 3;
    const mk = (s, g) => Array.from({ length: len }, (_, i) => L(s + i * g)).join('');
    const starts = shuffle([...Array(18).keys()]).slice(0, 4);
    const set = starts.slice(0, 3).map((s) => mk(s, gap));
    const odd = diff === 'hard'
      ? Array.from({ length: len }, (_, i) => L(starts[3] + i * gap + (i === 2 ? 1 : 0))).join('')
      : mk(starts[3], gap + 1);
    const opts = shuffle([...set, odd]);
    return { topic: 'Odd One Out (Letters)', q: bi('निम्नलिखित अक्षर-समूहों में से भिन्न को चुनिए।', 'Choose the odd letter-group.'), options: opts.map((o) => bi(o, o)), answer: opts.indexOf(odd),
      explanation: bi(`शेष समूहों में अक्षरों के बीच ${gap - 1} अक्षर का अंतर है।`, `Other groups have a gap of ${gap - 1} letter(s) between letters.`) };
  }

  const DIRS = {
    N: bi('उत्तर', 'North'), S: bi('दक्षिण', 'South'), E: bi('पूर्व', 'East'), W: bi('पश्चिम', 'West'),
    NE: bi('उत्तर-पूर्व', 'North-East'), NW: bi('उत्तर-पश्चिम', 'North-West'), SE: bi('दक्षिण-पूर्व', 'South-East'), SW: bi('दक्षिण-पश्चिम', 'South-West')
  };
  /* male names only, since the Hindi verb forms below (चलता है, हो जाता है) are masculine */
  const NAMES = [['राम', 'Ram'], ['मोहन', 'Mohan'], ['अमन', 'Aman'], ['सोहन', 'Sohan'], ['राहुल', 'Rahul'], ['कुणाल', 'Kunal'], ['रवि', 'Ravi'], ['अजय', 'Ajay'], ['विकास', 'Vikas'], ['सुरेश', 'Suresh'], ['दीपक', 'Deepak'], ['अंकित', 'Ankit']];
  function dirName(dx, dy) { return (dy > 0 ? 'N' : dy < 0 ? 'S' : '') + (dx > 0 ? 'E' : dx < 0 ? 'W' : ''); }
  function direction(diff) {
    const [nh, ne] = pick(NAMES);
    const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5], [12, 5, 13]];
    if (diff === 'easy') {
      const a = rand(3, 12), b = rand(3, 12);
      const first = pick(['N', 'S', 'E', 'W']);
      const turn = pick(['right', 'left']);
      const order = ['N', 'E', 'S', 'W'];
      const second = order[(order.indexOf(first) + (turn === 'right' ? 1 : 3)) % 4];
      const v = { N: [0, 1], S: [0, -1], E: [1, 0], W: [-1, 0] };
      const dx = v[first][0] * a + v[second][0] * b, dy = v[first][1] * a + v[second][1] * b;
      const ans = DIRS[dirName(dx, dy)];
      const wrongs = Object.keys(DIRS).filter((k) => k !== dirName(dx, dy)).map((k) => DIRS[k]);
      return finish('Direction Sense', bi(`${nh} ${a} किमी ${DIRS[first].hi} की ओर चलता है, फिर ${turn === 'right' ? 'दाएँ' : 'बाएँ'} मुड़कर ${b} किमी चलता है। अब वह अपने प्रारंभिक बिंदु से किस दिशा में है?`,
        `${ne} walks ${a} km towards ${DIRS[first].en}, then turns ${turn} and walks ${b} km. In which direction is he now from the starting point?`), ans, shuffle(wrongs),
        bi(`अंतिम स्थिति प्रारंभ से ${ans.hi} दिशा में है।`, `Final position is ${ans.en} of the start.`));
    }
    const [x, y, h] = pick(triples);
    const up = rand(y + 2, y + 10);
    const ex = pick([1, -1]);
    if (diff === 'moderate') {
      const ans = bi(`${h} किमी ${DIRS[dirName(ex, 1)].hi}`, `${h} km ${DIRS[dirName(ex, 1)].en}`);
      const wr = [bi(`${h} किमी ${DIRS[dirName(-ex, 1)].hi}`, `${h} km ${DIRS[dirName(-ex, 1)].en}`), bi(`${x + y} किमी ${DIRS[dirName(ex, 1)].hi}`, `${x + y} km ${DIRS[dirName(ex, 1)].en}`), bi(`${h} किमी ${DIRS[dirName(ex, -1)].hi}`, `${h} km ${DIRS[dirName(ex, -1)].en}`), bi(`${up + x} किमी ${DIRS.N.hi}`, `${up + x} km ${DIRS.N.en}`)];
      return finish('Direction Sense', bi(`${nh} ${up} किमी उत्तर की ओर चलता है। वहाँ से ${up - y} किमी दक्षिण की ओर चलता है। फिर ${x} किमी ${ex > 0 ? 'पूर्व' : 'पश्चिम'} की ओर चलता है। अब वह प्रारंभिक बिंदु से कितनी दूर और किस दिशा में है?`,
        `${ne} walks ${up} km towards North. From there he walks ${up - y} km towards South. Then he walks ${x} km towards ${ex > 0 ? 'East' : 'West'}. How far and in which direction is he from the starting point?`), ans, wr,
        bi(`उत्तर में शुद्ध दूरी = ${y} किमी, ${ex > 0 ? 'पूर्व' : 'पश्चिम'} में = ${x} किमी; दूरी = √(${y}²+${x}²) = ${h} किमी`, `Net North = ${y} km, ${ex > 0 ? 'East' : 'West'} = ${x} km; distance = √(${y}²+${x}²) = ${h} km`));
    }
    // hard: turns described relative to facing direction
    const a = up, b = x + rand(2, 6), c = up - y, d = b - x;
    // N a, right -> E b, right -> S c, right -> W d  => (x, y)
    const ans = bi(`${h} किमी`, `${h} km`);
    return finish('Direction Sense', bi(`${nh} उत्तर की ओर ${a} मीटर चलता है, फिर दाएँ मुड़कर ${b} मीटर, फिर दाएँ मुड़कर ${c} मीटर और फिर दाएँ मुड़कर ${d} मीटर चलता है। वह प्रारंभिक बिंदु से कितनी दूरी पर है?`.replace(/किमी/g, 'मीटर'),
      `${ne} walks ${a} m North, turns right and walks ${b} m, turns right again and walks ${c} m, then turns right and walks ${d} m. How far is he from the starting point?`),
      bi(`${h} मीटर`, `${h} m`), [bi(`${x + y} मीटर`, `${x + y} m`), bi(`${h + 2} मीटर`, `${h + 2} m`), bi(`${a - c + b} मीटर`, `${a - c + b} m`), bi(`${Math.abs(h - 3)} मीटर`, `${Math.abs(h - 3)} m`), bi(`${x} मीटर`, `${x} m`)],
      bi(`उत्तर में शुद्ध = ${a} − ${c} = ${y}, पूर्व में शुद्ध = ${b} − ${d} = ${x}; दूरी = ${h} मीटर`, `Net North = ${a} − ${c} = ${y}, net East = ${b} − ${d} = ${x}; distance = ${h} m`));
  }

  function ranking(diff) {
    const [nh, ne] = pick(NAMES);
    if (diff === 'easy') {
      const t = rand(5, 25), b = rand(5, 25), ans = t + b - 1;
      return finish('Ranking', bi(`एक पंक्ति में ${nh} ऊपर से ${t}वें तथा नीचे से ${b}वें स्थान पर है। पंक्ति में कुल कितने विद्यार्थी हैं?`, `In a row, ${ne} is ${t}th from the top and ${b}th from the bottom. How many students are there in the row?`),
        ans, nearNums(ans, 3, [t + b, t + b + 1, ans - 1]), bi(`कुल = ${t} + ${b} − 1 = ${ans}`, `Total = ${t} + ${b} − 1 = ${ans}`));
    }
    if (diff === 'moderate') {
      const n = rand(30, 60), l = rand(8, n - 8), ans = n - l + 1;
      return finish('Ranking', bi(`${n} विद्यार्थियों की कक्षा में ${nh} का स्थान ऊपर से ${l}वाँ है। नीचे से उसका स्थान क्या है?`, `In a class of ${n} students, ${ne} ranks ${l}th from the top. What is the rank from the bottom?`),
        ans, nearNums(ans, 3, [n - l, n - l + 2, ans + 1]), bi(`नीचे से स्थान = ${n} − ${l} + 1 = ${ans}`, `Rank from bottom = ${n} − ${l} + 1 = ${ans}`));
    }
    const [n2h, n2e] = pick(NAMES.filter((x) => x[0] !== nh));
    const a = rand(6, 15), b = rand(8, 18), newA = a + rand(5, 12), ans = newA + b - 1;
    return finish('Ranking', bi(`एक पंक्ति में ${nh} बाएँ से ${a}वें तथा ${n2h} दाएँ से ${b}वें स्थान पर है। दोनों अपना स्थान आपस में बदल लेते हैं, तब ${nh} बाएँ से ${newA}वें स्थान पर हो जाता है। पंक्ति में कितने व्यक्ति हैं?`,
      `In a row, ${ne} is ${a}th from the left and ${n2e} is ${b}th from the right. They interchange positions and now ${ne} is ${newA}th from the left. How many persons are in the row?`),
      ans, nearNums(ans, 4, [a + b - 1, newA + b, ans - 2]), bi(`${n2h} का पुराना स्थान बाएँ से ${newA}वाँ; कुल = ${newA} + ${b} − 1 = ${ans}`, `${n2e}'s old position = ${newA}th from left; total = ${newA} + ${b} − 1 = ${ans}`));
  }

  function clock(diff) {
    let h, m;
    if (diff === 'easy') { h = rand(1, 11); m = 0; }
    else if (diff === 'moderate') { h = rand(1, 11); m = 30; }
    else { h = rand(1, 11); m = pick([10, 20, 40, 50, 15, 45]); }
    let ang = Math.abs(30 * h - 5.5 * m); if (ang > 180) ang = 360 - ang;
    const show = (v) => (Number.isInteger(v) ? v : v.toFixed(1)) + '°';
    const t = `${h}:${String(m).padStart(2, '0')}`;
    return finish('Clock', bi(`घड़ी में ${t} बजे घंटे और मिनट की सुई के बीच का कोण कितना होगा?`, `What is the angle between the hour and minute hands of a clock at ${t}?`),
      show(ang), shuffle([ang + 15, ang - 15, ang + 30, ang - 30, Math.abs(30 * h - 6 * m) % 360, ang + 5, ang - 5].filter((x) => x > 0 && x <= 180 && x !== ang)).map(show),
      bi(`कोण = |30×${h} − 5.5×${m}| = ${show(ang)}`, `Angle = |30×${h} − 5.5×${m}| = ${show(ang)}`));
  }

  const DAYS = [bi('रविवार', 'Sunday'), bi('सोमवार', 'Monday'), bi('मंगलवार', 'Tuesday'), bi('बुधवार', 'Wednesday'), bi('गुरुवार', 'Thursday'), bi('शुक्रवार', 'Friday'), bi('शनिवार', 'Saturday')];
  const MONTHS = [['जनवरी', 'January', 31], ['फरवरी', 'February', 28], ['मार्च', 'March', 31], ['अप्रैल', 'April', 30], ['मई', 'May', 31], ['जून', 'June', 30], ['जुलाई', 'July', 31], ['अगस्त', 'August', 31]];
  function calendar(diff) {
    const d0 = rand(0, 6);
    let n, q, why;
    if (diff === 'easy') {
      n = rand(8, 30);
      q = bi(`यदि आज ${DAYS[d0].hi} है, तो ${n} दिन बाद कौन-सा दिन होगा?`, `If today is ${DAYS[d0].en}, what day will it be after ${n} days?`);
      why = bi(`${n} ÷ 7 का शेषफल ${n % 7}`, `Remainder of ${n} ÷ 7 = ${n % 7}`);
    } else if (diff === 'moderate') {
      n = rand(60, 200);
      q = bi(`यदि आज ${DAYS[d0].hi} है, तो ${n} दिन बाद कौन-सा दिन होगा?`, `If today is ${DAYS[d0].en}, what day of the week will it be after ${n} days?`);
      why = bi(`${n} ÷ 7 का शेषफल ${n % 7}, अतः ${n % 7} दिन आगे`, `${n} ÷ 7 leaves remainder ${n % 7}, so ${n % 7} days ahead`);
    } else {
      const mi = rand(1, 7);
      n = MONTHS.slice(0, mi).reduce((s, x) => s + x[2], 0);
      q = bi(`यदि किसी साधारण (अधिवर्ष नहीं) वर्ष में 1 जनवरी को ${DAYS[d0].hi} है, तो उसी वर्ष 1 ${MONTHS[mi][0]} को कौन-सा दिन होगा?`, `If 1st January of a non-leap year is ${DAYS[d0].en}, what day will 1st ${MONTHS[mi][1]} of the same year be?`);
      why = bi(`बीच के दिन = ${n}; ${n} ÷ 7 का शेषफल ${n % 7}`, `Days in between = ${n}; ${n} mod 7 = ${n % 7}`);
    }
    const ans = DAYS[(d0 + n) % 7];
    return finish('Calendar', q, ans, shuffle(DAYS.filter((x) => x !== ans)), why);
  }

  function ages(diff) {
    const [nh, ne] = pick(NAMES), [mh, me] = pick(NAMES.filter((x) => x[0] !== nh));
    if (diff === 'easy') {
      const b = rand(8, 20), d = rand(2, 9), k = rand(2, 8), ans = b + d + k;
      return finish('Age', bi(`${nh}, ${mh} से ${d} वर्ष बड़ा है। ${mh} की आयु ${b} वर्ष है। ${k} वर्ष बाद ${nh} की आयु क्या होगी?`, `${ne} is ${d} years older than ${me}. ${me} is ${b} years old. What will be ${ne}'s age after ${k} years?`),
        ans, nearNums(ans, 4, [b + d, b + k, ans - d]), bi(`${b} + ${d} + ${k} = ${ans}`, `${b} + ${d} + ${k} = ${ans}`));
    }
    if (diff === 'moderate') {
      const [p, q] = pick([[2, 3], [3, 4], [3, 5], [4, 5], [5, 7]]), x = rand(2, 7), s = (p + q) * x, ans = q * x;
      return finish('Age', bi(`${nh} और ${mh} की आयु का अनुपात ${p} : ${q} है। उनकी आयु का योग ${s} वर्ष है। ${mh} की आयु कितनी है?`, `The ratio of ages of ${ne} and ${me} is ${p} : ${q}. The sum of their ages is ${s} years. What is ${me}'s age?`),
        ans, nearNums(ans, 5, [p * x, ans + x, ans - x]), bi(`${q}/${p + q} × ${s} = ${ans}`, `${q}/${p + q} × ${s} = ${ans}`));
    }
    const [p, q] = pick([[3, 4], [2, 3], [4, 5], [5, 6], [3, 5]]), x = rand(3, 8), k = x;
    // with k = x the ratio after k years becomes (p+1) : (q+1)
    const A = p * x, B = q * x, gA = A + k, gB = B + k, g = gcd(gA, gB);
    const ans = B;
    return finish('Age', bi(`दो व्यक्तियों की वर्तमान आयु का अनुपात ${p} : ${q} है। ${k} वर्ष बाद यह अनुपात ${gA / g} : ${gB / g} हो जाएगा। बड़े व्यक्ति की वर्तमान आयु कितनी है?`, `The present ages of two persons are in the ratio ${p} : ${q}. After ${k} years the ratio will be ${gA / g} : ${gB / g}. What is the present age of the elder person?`),
      ans, nearNums(ans, 6, [A, B + k, ans + q, ans - q]), bi(`माना आयु ${p}x, ${q}x; हल करने पर x = ${x}; बड़े की आयु = ${ans}`, `Let ages be ${p}x and ${q}x; solving gives x = ${x}; elder = ${ans}`));
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }

  function letterPosition(diff) {
    let ans, q, why;
    if (diff === 'easy') {
      const n = rand(4, 15), k = rand(2, 8); ans = L(n - 1 + k);
      q = bi(`अंग्रेज़ी वर्णमाला में बाएँ से ${n}वें अक्षर के दाएँ ${k}वाँ अक्षर कौन-सा है?`, `In the English alphabet, which letter is ${k}th to the right of the ${n}th letter from the left?`);
      why = bi(`${n} + ${k} = ${n + k}वाँ अक्षर = ${ans}`, `${n} + ${k} = ${n + k}th letter = ${ans}`);
    } else if (diff === 'moderate') {
      const n = rand(5, 15), k = rand(3, 8); ans = L(26 - n - k);
      q = bi(`अंग्रेज़ी वर्णमाला में दाएँ से ${n}वें अक्षर के बाएँ ${k}वाँ अक्षर कौन-सा है?`, `In the English alphabet, which letter is ${k}th to the left of the ${n}th letter from the right?`);
      why = bi(`दाएँ से ${n + k}वाँ = बाएँ से ${27 - n - k}वाँ = ${ans}`, `${n + k}th from right = ${27 - n - k}th from left = ${ans}`);
    } else {
      const n = rand(3, 10), k = rand(3, 9); ans = L(25 - (n - 1 + k));
      q = bi(`यदि अंग्रेज़ी वर्णमाला को उल्टे क्रम में लिखा जाए, तो बाएँ से ${n}वें अक्षर के दाएँ ${k}वाँ अक्षर कौन-सा होगा?`, `If the English alphabet is written in reverse order, which letter will be ${k}th to the right of the ${n}th letter from the left?`);
      why = bi(`उल्टे क्रम में ${n + k}वाँ अक्षर = ${ans}`, `${n + k}th letter in reverse order = ${ans}`);
    }
    const i = ABC.indexOf(ans);
    return finish('Alphabet Position', q, ans, shuffle([L(i + 1), L(i - 1), L(i + 2), L(i - 2), L(25 - i)]), why);
  }

  function countPattern(diff) {
    const len = diff === 'easy' ? 18 : diff === 'moderate' ? 24 : 28;
    const digits = Array.from({ length: len }, () => pick([3, 5, 7, 8, 5, 3, 2]));
    let cnt = 0, q, why;
    if (diff === 'hard') {
      for (let i = 1; i < len - 1; i++) if (digits[i] === 5 && digits[i + 1] === 3 && digits[i - 1] !== 7) cnt++;
      q = bi(`नीचे दी गई श्रेणी में ऐसे कितने 5 हैं जिनके तुरंत बाद 3 है परंतु तुरंत पहले 7 नहीं है?\n${digits.join(' ')}`, `How many 5s are immediately followed by 3 but not immediately preceded by 7?\n${digits.join(' ')}`);
    } else {
      for (let i = 0; i < len - 1; i++) if (digits[i] === 5 && digits[i + 1] === 3) cnt++;
      q = bi(`नीचे दी गई श्रेणी में ऐसे कितने 5 हैं जिनके तुरंत बाद 3 आता है?\n${digits.join(' ')}`, `How many 5s are immediately followed by 3 in the series below?\n${digits.join(' ')}`);
    }
    why = bi(`गिनने पर ${cnt}`, `Counting gives ${cnt}`);
    return finish('Counting Pattern', q, String(cnt), shuffle([cnt + 1, cnt + 2, Math.max(0, cnt - 1), cnt + 3, cnt === 0 ? 4 : 0].filter((x) => x !== cnt)).map(String), why);
  }

  function missingGrid(diff) {
    const rule = {
      easy: [(a, b) => a + b, 'तीसरा = पहला + दूसरा', 'Third = first + second'],
      moderate: [(a, b) => a * b - a, 'तीसरा = पहला × दूसरा − पहला', 'Third = first × second − first'],
      hard: [(a, b) => a * a + b * b, 'तीसरा = पहले का वर्ग + दूसरे का वर्ग', 'Third = first² + second²']
    }[diff];
    const rows = [0, 1, 2].map(() => [rand(2, diff === 'hard' ? 9 : 15), rand(2, diff === 'hard' ? 9 : 12)]);
    const ans = rule[0](rows[2][0], rows[2][1]);
    const grid = rows.map((r, i) => `${r[0]}  ${r[1]}  ${i === 2 ? '?' : rule[0](r[0], r[1])}`).join('  |  ');
    return finish('Missing Number', bi(`प्रत्येक पंक्ति एक ही नियम का पालन करती है। प्रश्नचिह्न के स्थान पर संख्या ज्ञात कीजिए:\n${grid}`, `Each row follows the same rule. Find the missing number:\n${grid}`),
      ans, nearNums(ans, 6, [ans + rows[2][0], ans - rows[2][1], ans + 1, ans - 1]), bi(rule[1], rule[2]));
  }

  function operators(diff) {
    // symbol substitution with BODMAS
    const syms = { '+': '×', '−': '+', '×': '÷', '÷': '−' };
    const swap = pick([
      { map: { '+': '×', '×': '+', '−': '÷', '÷': '−' }, hi: '+ का अर्थ ×, × का अर्थ +, − का अर्थ ÷ तथा ÷ का अर्थ −', en: "'+' means '×', '×' means '+', '−' means '÷' and '÷' means '−'" },
      { map: { '+': '−', '−': '+', '×': '÷', '÷': '×' }, hi: '+ का अर्थ −, − का अर्थ +, × का अर्थ ÷ तथा ÷ का अर्थ ×', en: "'+' means '−', '−' means '+', '×' means '÷' and '÷' means '×'" }
    ]);
    void syms;
    let expr, real, ans;
    for (let tries = 0; tries < 50; tries++) {
      const nTerms = diff === 'easy' ? 3 : diff === 'moderate' ? 4 : 5;
      const nums = Array.from({ length: nTerms }, () => rand(2, 20));
      const ops = Array.from({ length: nTerms - 1 }, () => pick(['+', '−', '×', '÷']));
      expr = nums.map((n, i) => (i ? ops[i - 1] + ' ' : '') + n).join(' ');
      real = nums.map((n, i) => (i ? swap.map[ops[i - 1]] + ' ' : '') + n).join(' ');
      const js = real.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      try { ans = Function('return ' + js)(); } catch (e) { ans = NaN; }
      if (Number.isInteger(ans) && Math.abs(ans) < 500) break;
      ans = NaN;
    }
    if (!Number.isInteger(ans)) return numberSeries(diff);
    return finish('Mathematical Operations', bi(`यदि ${swap.hi} हो, तो ${expr} = ?`, `If ${swap.en}, then ${expr} = ?`), ans,
      shuffle([ans + 2, ans - 2, ans + 5, ans - 5, ans + 10, -ans]), bi(`प्रतिस्थापन के बाद: ${real} = ${ans}`, `After substitution: ${real} = ${ans}`));
  }

  const REL = [
    { d: 'easy', hi: 'A, B का पिता है। C, A की माता है। C का B से क्या संबंध है?', en: 'A is the father of B. C is the mother of A. How is C related to B?', a: ['दादी', 'Grandmother'], w: [['माता', 'Mother'], ['नानी', 'Maternal grandmother'], ['बुआ', 'Aunt'], ['बहन', 'Sister']] },
    { d: 'easy', hi: 'P, Q का भाई है। R, Q की माता है। P का R से क्या संबंध है?', en: 'P is the brother of Q. R is the mother of Q. How is P related to R?', a: ['पुत्र', 'Son'], w: [['भाई', 'Brother'], ['पिता', 'Father'], ['पति', 'Husband'], ['भतीजा', 'Nephew']] },
    { d: 'moderate', hi: 'एक फोटो की ओर इशारा करते हुए एक व्यक्ति ने कहा, "इसकी माँ मेरी माँ की इकलौती पुत्री है।" फोटो वाला व्यक्ति उस व्यक्ति का कौन है?', en: 'Pointing to a photograph a man said, "His mother is the only daughter of my mother." How is the person in the photograph related to the man?', a: ['भांजा', 'Nephew'], w: [['पुत्र', 'Son'], ['भाई', 'Brother'], ['चचेरा भाई', 'Cousin'], ['पिता', 'Father']] },
    { d: 'moderate', hi: 'एक महिला की ओर इशारा करते हुए एक व्यक्ति ने कहा, "उसकी माँ तुम्हारे पिता की इकलौती बेटी है।" महिला उस व्यक्ति से किस प्रकार संबंधित है?', en: 'Pointing towards a woman, a man said, "Her mother is the only daughter of your father." How is the woman related to the person spoken to?', a: ['पुत्री', 'Daughter'], w: [['बहन', 'Sister'], ['माँ', 'Mother'], ['पत्नी', 'Wife'], ['भतीजी', 'Niece']] },
    { d: 'moderate', hi: 'M, N की बहन है। N, O का पुत्र है। O, P का पुत्र है। M का P से क्या संबंध है?', en: 'M is the sister of N. N is the son of O. O is the son of P. How is M related to P?', a: ['पोती', 'Granddaughter'], w: [['पुत्री', 'Daughter'], ['बहन', 'Sister'], ['भतीजी', 'Niece'], ['माँ', 'Mother']] },
    { d: 'hard', hi: 'राहुल ने अमन से कहा, "कल मैंने अपनी दादी की बेटी के इकलौते भाई को हराया।" राहुल ने किसे हराया?', en: 'Rahul told Aman, "Yesterday I defeated the only brother of the daughter of my grandmother." Whom did Rahul defeat?', a: ['पिता', 'Father'], w: [['पुत्र', 'Son'], ['भाई', 'Brother'], ['ससुर', 'Father-in-law'], ['चाचा', 'Uncle']] },
    { d: 'hard', hi: 'A, B की बहन है। C, B की माँ है। D, C का पिता है। E, D की माँ है। A का D से क्या संबंध है?', en: 'A is the sister of B. C is the mother of B. D is the father of C. E is the mother of D. How is A related to D?', a: ['नातिन', 'Granddaughter'], w: [['पुत्री', 'Daughter'], ['दादी', 'Grandmother'], ['पोता', 'Grandson'], ['बहन', 'Sister']] },
    { d: 'hard', hi: 'एक लड़के का परिचय कराते हुए एक लड़की ने कहा, "यह मेरे चाचा के इकलौते भाई का पुत्र है।" लड़का, लड़की से किस प्रकार संबंधित है?', en: 'Introducing a boy, a girl said, "He is the son of the only brother of my uncle." How is the boy related to the girl?', a: ['भाई', 'Brother'], w: [['चचेरा भाई', 'Cousin'], ['भतीजा', 'Nephew'], ['चाचा', 'Uncle'], ['पुत्र', 'Son']] }
  ];
  function bloodRelation(diff) {
    const list = REL.filter((r) => r.d === diff);
    const r = pick(list.length ? list : REL);
    return finish('Blood Relation', bi(r.hi, r.en), bi(r.a[0], r.a[1]), r.w.map((w) => bi(w[0], w[1])), bi('संबंध-वृक्ष बनाकर हल करें।', 'Solve by drawing a family tree.'));
  }

  /* ---------------- SAT Mathematics ---------------- */

  function percentage(diff) {
    if (diff === 'easy') {
      const p = pick([10, 20, 25, 40, 50, 75, 15]), n = rand(2, 20) * 20, ans = (p * n) / 100;
      return finish('Percentage', bi(`${n} का ${p}% कितना है?`, `What is ${p}% of ${n}?`), ans, nearNums(ans, 10, [ans * 2, ans / 2, ans + 10]), bi(`${n} × ${p}/100 = ${ans}`, `${n} × ${p}/100 = ${ans}`));
    }
    if (diff === 'moderate') {
      const old = rand(4, 20) * 25, p = pick([10, 20, 25, 40]), now = old * (1 + p / 100);
      return finish('Percentage', bi(`किसी वस्तु का मूल्य ₹${old} से बढ़कर ₹${now} हो गया। मूल्य में कितने प्रतिशत की वृद्धि हुई?`, `The price of an article increased from ₹${old} to ₹${now}. What is the percentage increase?`),
        p + '%', [p + 5, p - 5, p * 2, 100 - p].filter((x) => x > 0).map((x) => x + '%'), bi(`(${now - old}/${old}) × 100 = ${p}%`, `(${now - old}/${old}) × 100 = ${p}%`));
    }
    const p = pick([10, 20, 25]), net = -(p * p) / 100;
    return finish('Percentage', bi(`किसी वस्तु का मूल्य पहले ${p}% बढ़ाया गया और फिर ${p}% घटाया गया। मूल्य में कुल कितने प्रतिशत परिवर्तन हुआ?`, `The price of an item is first increased by ${p}% and then decreased by ${p}%. What is the net percentage change?`),
      bi(`${-net}% की कमी`, `${-net}% decrease`), [bi('कोई परिवर्तन नहीं', 'No change'), bi(`${-net}% की वृद्धि`, `${-net}% increase`), bi(`${p}% की कमी`, `${p}% decrease`), bi(`${2 * p}% की कमी`, `${2 * p}% decrease`)],
      bi(`शुद्ध परिवर्तन = −(${p}×${p})/100 = ${net}%`, `Net change = −(${p}×${p})/100 = ${net}%`));
  }

  function simpleInterest(diff) {
    const P = rand(2, 20) * 500, R = pick([4, 5, 6, 8, 10, 12]), T = rand(2, 5), SI = (P * R * T) / 100;
    if (diff === 'easy') return finish('Simple Interest', bi(`₹${P} का ${R}% वार्षिक दर से ${T} वर्ष का साधारण ब्याज कितना होगा?`, `Find the simple interest on ₹${P} at ${R}% per annum for ${T} years.`),
      '₹' + SI, nearNums(SI, 100, [SI + P / 10, (P * R) / 100, SI * 2]).map((x) => '₹' + x), bi(`SI = P×R×T/100 = ${SI}`, `SI = P×R×T/100 = ${SI}`));
    if (diff === 'moderate') return finish('Simple Interest', bi(`₹${P} पर ${T} वर्ष में साधारण ब्याज ₹${SI} मिलता है। वार्षिक ब्याज दर कितनी है?`, `Simple interest on ₹${P} for ${T} years is ₹${SI}. What is the rate of interest per annum?`),
      R + '%', [R + 1, R + 2, R - 1, R * 2].filter((x) => x > 0 && x !== R).map((x) => x + '%'), bi(`R = SI×100/(P×T) = ${R}%`, `R = SI×100/(P×T) = ${R}%`));
    const r = pick([5, 8, 10, 12.5, 20]), t = 100 / r;
    return finish('Simple Interest', bi(`साधारण ब्याज की किस वार्षिक दर से कोई धन ${t} वर्ष में दोगुना हो जाएगा?`, `At what rate of simple interest per annum will a sum double itself in ${t} years?`),
      r + '%', [r * 2, r / 2, r + 5, 100 / (t + 1)].map((x) => +x.toFixed(2) + '%'), bi(`दोगुना ⇒ SI = P; R = 100/T = ${r}%`, `Doubling ⇒ SI = P; R = 100/T = ${r}%`));
  }

  function hcfLcm(diff) {
    if (diff === 'easy') {
      const h = rand(2, 12), a = h * rand(2, 6); let b = h * rand(2, 7); if (gcd(a, b) !== h) b = h * (a / h + 1);
      const g = gcd(a, b);
      return finish('HCF & LCM', bi(`${a} और ${b} का म.स. (HCF) ज्ञात कीजिए।`, `Find the HCF of ${a} and ${b}.`), g, nearNums(g, 4, [g * 2, Math.max(1, g / 2), (a * b) / g]), bi(`HCF = ${g}`, `HCF = ${g}`));
    }
    const lcm = (a, b) => (a * b) / gcd(a, b);
    if (diff === 'moderate') {
      const ns = shuffle([4, 6, 8, 9, 10, 12, 15, 16, 18, 20]).slice(0, 3), l = ns.reduce(lcm);
      return finish('HCF & LCM', bi(`${ns.join(', ')} का ल.स. (LCM) ज्ञात कीजिए।`, `Find the LCM of ${ns.join(', ')}.`), l, nearNums(l, 30, [l * 2, l / 2, ns[0] * ns[1] * ns[2]]).filter((x) => Number.isInteger(x)), bi(`LCM = ${l}`, `LCM = ${l}`));
    }
    const ns = shuffle([6, 8, 9, 10, 12, 15, 18]).slice(0, 3), l = ns.reduce(lcm), r = rand(1, Math.min(...ns) - 1), ans = l + r;
    return finish('HCF & LCM', bi(`वह छोटी से छोटी संख्या ज्ञात कीजिए जिसे ${ns.join(', ')} से भाग देने पर प्रत्येक दशा में ${r} शेष बचे।`, `Find the least number which when divided by ${ns.join(', ')} leaves remainder ${r} in each case.`),
      ans, nearNums(ans, 12, [l, l - r, ans + l, ans + 1]), bi(`LCM(${ns.join(', ')}) + ${r} = ${l} + ${r} = ${ans}`, `LCM(${ns.join(', ')}) + ${r} = ${l} + ${r} = ${ans}`));
  }

  function linearEq(diff) {
    const x = rand(2, 15);
    if (diff === 'easy') { const a = rand(3, 30); return finish('Linear Equation', bi(`यदि x + ${a} = ${x + a}, तो x का मान क्या है?`, `If x + ${a} = ${x + a}, what is the value of x?`), x, nearNums(x, 4, [x + a, x + 2 * a, a]), bi(`x = ${x + a} − ${a} = ${x}`, `x = ${x + a} − ${a} = ${x}`)); }
    if (diff === 'moderate') { const a = rand(2, 9), b = rand(1, 20); return finish('Linear Equation', bi(`यदि ${a}x − ${b} = ${a * x - b}, तो x = ?`, `If ${a}x − ${b} = ${a * x - b}, then x = ?`), x, nearNums(x, 4, [x + 1, (a * x) / a + b, a * x]), bi(`${a}x = ${a * x} ⇒ x = ${x}`, `${a}x = ${a * x} ⇒ x = ${x}`)); }
    const [p, q] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5]]), X = p * q * rand(1, 4), s = X / p + X / q;
    return finish('Linear Equation', bi(`यदि x/${p} + x/${q} = ${s}, तो x का मान ज्ञात कीजिए।`, `If x/${p} + x/${q} = ${s}, find the value of x.`), X, nearNums(X, 6, [s, X / 2, X + p, X - q]), bi(`x(${p}+${q})/${p * q} = ${s} ⇒ x = ${X}`, `x(${p}+${q})/${p * q} = ${s} ⇒ x = ${X}`));
  }

  function mensuration(diff) {
    if (diff === 'easy') {
      const l = rand(5, 25), b = rand(3, 15);
      return finish('Mensuration', bi(`एक आयत की लंबाई ${l} सेमी तथा चौड़ाई ${b} सेमी है। इसका परिमाप कितना है?`, `A rectangle has length ${l} cm and breadth ${b} cm. What is its perimeter?`),
        `${2 * (l + b)} cm`, [l * b, l + b, 2 * (l + b) + 2, 4 * l].map((x) => x + ' cm'), bi(`2(l + b) = ${2 * (l + b)} सेमी`, `2(l + b) = ${2 * (l + b)} cm`));
    }
    if (diff === 'moderate') {
      const r = 7 * rand(1, 4), A = (22 / 7) * r * r;
      return finish('Mensuration', bi(`${r} सेमी त्रिज्या वाले वृत्त का क्षेत्रफल कितना होगा? (π = 22/7)`, `Find the area of a circle of radius ${r} cm. (π = 22/7)`),
        `${A} cm²`, [2 * (22 / 7) * r, A / 2, A * 2, A + 22].map((x) => x + ' cm²'), bi(`πr² = 22/7 × ${r} × ${r} = ${A}`, `πr² = 22/7 × ${r} × ${r} = ${A}`));
    }
    const l = rand(10, 30), b = rand(8, 20), w = rand(1, 3), A = (l + 2 * w) * (b + 2 * w) - l * b;
    return finish('Mensuration', bi(`${l} मी × ${b} मी के एक आयताकार मैदान के चारों ओर बाहर की ओर ${w} मी चौड़ा रास्ता है। रास्ते का क्षेत्रफल ज्ञात कीजिए।`, `A ${l} m × ${b} m rectangular field has a ${w} m wide path all around it on the outside. Find the area of the path.`),
      `${A} m²`, [2 * w * (l + b), A + 4 * w * w, A - 4 * w * w, (l + w) * (b + w) - l * b].map((x) => x + ' m²'), bi(`(${l + 2 * w}×${b + 2 * w}) − (${l}×${b}) = ${A}`, `(${l + 2 * w}×${b + 2 * w}) − (${l}×${b}) = ${A}`));
  }

  function profitLoss(diff) {
    const cp = rand(4, 30) * 25;
    if (diff === 'easy') { const sp = cp + rand(2, 10) * 10; return finish('Profit & Loss', bi(`एक वस्तु ₹${cp} में खरीदकर ₹${sp} में बेची गई। लाभ कितना हुआ?`, `An article bought for ₹${cp} is sold for ₹${sp}. What is the profit?`), '₹' + (sp - cp), nearNums(sp - cp, 20, [sp + cp, cp - (sp - cp)]).map((x) => '₹' + x), bi(`लाभ = SP − CP`, `Profit = SP − CP`)); }
    if (diff === 'moderate') { const p = pick([10, 20, 25, 30]), sp = cp * (1 + p / 100); return finish('Profit & Loss', bi(`एक वस्तु ₹${cp} में खरीदकर ₹${sp} में बेची गई। लाभ प्रतिशत ज्ञात कीजिए।`, `An article bought for ₹${cp} is sold for ₹${sp}. Find the profit percent.`), p + '%', [p + 5, p - 5, p * 2, +((sp - cp) / sp * 100).toFixed(1)].filter((x) => x > 0).map((x) => x + '%'), bi(`(${sp - cp}/${cp}) × 100 = ${p}%`, `(${sp - cp}/${cp}) × 100 = ${p}%`)); }
    const l = pick([10, 20]), g = pick([10, 20, 25]), CP = rand(4, 20) * 100, sp1 = CP * (1 - l / 100), sp2 = CP * (1 + g / 100);
    return finish('Profit & Loss', bi(`एक वस्तु को ₹${sp1} में बेचने पर ${l}% हानि होती है। ${g}% लाभ कमाने के लिए उसे कितने में बेचना चाहिए?`, `By selling an article for ₹${sp1}, a man loses ${l}%. At what price should he sell it to gain ${g}%?`),
      '₹' + sp2, [sp1 * (1 + g / 100), CP, sp2 + 100, sp1 + (g * sp1) / 100 + 50].map((x) => '₹' + Math.round(x)), bi(`CP = ${sp1}/(1 − ${l}/100) = ${CP}; SP = ${CP} × ${1 + g / 100} = ${sp2}`, `CP = ${sp1}/(1 − ${l}/100) = ${CP}; SP = ${CP} × ${1 + g / 100} = ${sp2}`));
  }

  function exponents(diff) {
    if (diff === 'easy') { const a = rand(2, 5), n = rand(2, 4), ans = a ** n; return finish('Exponents', bi(`${a}^${n} का मान क्या है?`, `What is the value of ${a}^${n}?`), ans, nearNums(ans, 6, [a * n, a ** (n + 1), ans + a]), bi(`${a}^${n} = ${ans}`, `${a}^${n} = ${ans}`)); }
    if (diff === 'moderate') { const a = rand(2, 5), m = rand(3, 7), n = rand(2, 6), p = rand(2, m + n - 1), e = m + n - p, ans = a ** e; return finish('Exponents', bi(`(${a}^${m} × ${a}^${n}) ÷ ${a}^${p} = ?`, `(${a}^${m} × ${a}^${n}) ÷ ${a}^${p} = ?`), ans, nearNums(ans, 8, [a ** (e + 1), a ** Math.max(0, e - 1), a * e]), bi(`${a}^(${m}+${n}−${p}) = ${a}^${e} = ${ans}`, `${a}^(${m}+${n}−${p}) = ${a}^${e} = ${ans}`)); }
    const x = rand(2, 6), base = pick([2, 3]), k = rand(1, 3), v = base ** (x + k);
    return finish('Exponents', bi(`यदि ${base}^(x + ${k}) = ${v}, तो x का मान ज्ञात कीजिए।`, `If ${base}^(x + ${k}) = ${v}, find x.`), x, nearNums(x, 3, [x + k, x + 1, x - 1]).filter((n) => n > 0), bi(`${v} = ${base}^${x + k} ⇒ x = ${x}`, `${v} = ${base}^${x + k} ⇒ x = ${x}`));
  }

  function roots(diff) {
    if (diff === 'easy') { const n = rand(11, 30), s = n * n; return finish('Squares & Roots', bi(`√${s} का मान क्या है?`, `What is √${s}?`), n, nearNums(n, 3, [n + 1, n - 1, n + 2]), bi(`${n} × ${n} = ${s}`, `${n} × ${n} = ${s}`)); }
    if (diff === 'moderate') { const n = rand(4, 15), c = n ** 3; return finish('Squares & Roots', bi(`${c} का घनमूल ज्ञात कीजिए।`, `Find the cube root of ${c}.`), n, nearNums(n, 3, [n + 1, n - 1, n * 2]), bi(`${n}³ = ${c}`, `${n}³ = ${c}`)); }
    const k = pick([2, 3, 5, 6, 7]), s = rand(2, 9), n = k * s * s;
    return finish('Squares & Roots', bi(`${n} को किस छोटी से छोटी संख्या से गुणा करें कि गुणनफल एक पूर्ण वर्ग बन जाए?`, `By what smallest number should ${n} be multiplied to make it a perfect square?`),
      k, shuffle([2, 3, 5, 6, 7, 10, 11].filter((x) => x !== k)), bi(`${n} = ${k} × ${s}²; अतः ${k} से गुणा करें`, `${n} = ${k} × ${s}²; so multiply by ${k}`));
  }

  function average(diff) {
    if (diff === 'easy') { const ns = Array.from({ length: 5 }, () => rand(10, 60)); const s = ns.reduce((a, b) => a + b, 0); const ext = 5 - (s % 5 || 5); ns[4] += ext === 5 ? 0 : ext; const tot = ns.reduce((a, b) => a + b, 0), ans = tot / 5; return finish('Average', bi(`${ns.join(', ')} का औसत ज्ञात कीजिए।`, `Find the average of ${ns.join(', ')}.`), ans, nearNums(ans, 5, [ans + 1, ans - 1, tot / 4]).filter(Number.isInteger), bi(`योग ${tot} ÷ 5 = ${ans}`, `Sum ${tot} ÷ 5 = ${ans}`)); }
    if (diff === 'moderate') { const n = rand(5, 25); return finish('Average', bi(`प्रथम ${n} प्राकृत संख्याओं का औसत कितना है?`, `What is the average of the first ${n} natural numbers?`), (n + 1) / 2, [n / 2, n + 1, (n - 1) / 2, n, (n + 3) / 2].filter((x) => x !== (n + 1) / 2), bi(`(n + 1)/2 = ${(n + 1) / 2}`, `(n + 1)/2 = ${(n + 1) / 2}`)); }
    const n = rand(10, 30), a = rand(30, 50), inc = rand(1, 3), w = a + inc * (n + 1);
    return finish('Average', bi(`${n} विद्यार्थियों का औसत भार ${a} किग्रा है। शिक्षक का भार जोड़ने पर औसत ${inc} किग्रा बढ़ जाता है। शिक्षक का भार कितना है?`, `The average weight of ${n} students is ${a} kg. When the teacher's weight is included, the average increases by ${inc} kg. What is the teacher's weight?`),
      w + ' kg', [a + inc * n, a + inc, w + inc, w - inc].map((x) => x + ' kg'), bi(`${a} + ${inc} × ${n + 1} = ${w}`, `${a} + ${inc} × ${n + 1} = ${w}`));
  }

  function angles(diff) {
    if (diff === 'easy') { const a = rand(30, 80), b = rand(30, 80), c = 180 - a - b; return finish('Geometry', bi(`किसी त्रिभुज के दो कोण ${a}° और ${b}° हैं। तीसरा कोण कितना है?`, `Two angles of a triangle are ${a}° and ${b}°. Find the third angle.`), c + '°', [c + 10, c - 10, 360 - a - b, 90].map((x) => x + '°'), bi(`180 − ${a} − ${b} = ${c}°`, `180 − ${a} − ${b} = ${c}°`)); }
    if (diff === 'moderate') { const n = rand(5, 10), s = (n - 2) * 180; return finish('Geometry', bi(`${n} भुजाओं वाले बहुभुज के अंतः कोणों का योग कितना होता है?`, `What is the sum of the interior angles of a polygon with ${n} sides?`), s + '°', [n * 180, (n - 1) * 180, (n - 3) * 180, 360].map((x) => x + '°'), bi(`(n − 2) × 180 = ${s}°`, `(n − 2) × 180 = ${s}°`)); }
    const n = pick([5, 6, 8, 9, 10, 12, 15, 18, 20]), e = 360 / n;
    return finish('Geometry', bi(`एक समबहुभुज का प्रत्येक बाह्य कोण ${e}° है। उसकी भुजाओं की संख्या कितनी है?`, `Each exterior angle of a regular polygon is ${e}°. How many sides does it have?`), n, nearNums(n, 3, [n + 2, n - 2, 180 / e]).filter(Number.isInteger), bi(`n = 360/${e} = ${n}`, `n = 360/${e} = ${n}`));
  }

  function identities(diff) {
    if (diff === 'easy') { const a = rand(11, 99); return finish('Algebra', bi(`${a}² − ${a - 1}² = ?`, `${a}² − ${a - 1}² = ?`), 2 * a - 1, nearNums(2 * a - 1, 6, [1, 2 * a, a]), bi(`(a+b)(a−b) = ${2 * a - 1} × 1`, `(a+b)(a−b) = ${2 * a - 1} × 1`)); }
    if (diff === 'moderate') { const n = pick([101, 102, 103, 99, 98, 97, 51, 49]), ans = n * n; return finish('Algebra', bi(`सर्वसमिका का प्रयोग करके ${n}² का मान ज्ञात कीजिए।`, `Using identities, find the value of ${n}².`), ans, nearNums(ans, 20, [ans + 100, ans - 100, ans + 2 * n]), bi(`${n}² = ${ans}`, `${n}² = ${ans}`)); }
    const a = rand(2, 9), b = rand(2, 9), s = a + b, p = a * b, ans = a * a + b * b;
    return finish('Algebra', bi(`यदि a + b = ${s} तथा ab = ${p}, तो a² + b² का मान ज्ञात कीजिए।`, `If a + b = ${s} and ab = ${p}, find the value of a² + b².`), ans, nearNums(ans, 8, [s * s, s * s + 2 * p, s * s - p]), bi(`(a+b)² − 2ab = ${s * s} − ${2 * p} = ${ans}`, `(a+b)² − 2ab = ${s * s} − ${2 * p} = ${ans}`));
  }

  function proportion(diff) {
    if (diff === 'easy') { const n = rand(3, 9), c = rand(5, 20), m = rand(2, 12); return finish('Direct & Inverse Proportion', bi(`${n} पेन का मूल्य ₹${n * c} है। ${m} पेन का मूल्य कितना होगा?`, `The cost of ${n} pens is ₹${n * c}. What is the cost of ${m} pens?`), '₹' + m * c, nearNums(m * c, 15, [n * c + m, (m + 1) * c]).map((x) => '₹' + x), bi(`1 पेन = ₹${c}`, `1 pen = ₹${c}`)); }
    if (diff === 'moderate') { const w = rand(4, 12), d = rand(6, 20), w2 = pick([2, 3, 4, 6, 8, 12, 24].filter((x) => (w * d) % x === 0 && x !== w)); const ans = (w * d) / w2; return finish('Direct & Inverse Proportion', bi(`${w} मजदूर किसी काम को ${d} दिनों में पूरा करते हैं। ${w2} मजदूर उसी काम को कितने दिनों में पूरा करेंगे?`, `${w} workers complete a work in ${d} days. In how many days will ${w2} workers complete the same work?`), ans, nearNums(ans, 5, [(d * w2) / w, d + w - w2]).filter(Number.isInteger), bi(`${w} × ${d} = ${w2} × x ⇒ x = ${ans}`, `${w} × ${d} = ${w2} × x ⇒ x = ${ans}`)); }
    const a = pick([10, 12, 15, 20]), b = pick([15, 20, 30, 60].filter((x) => x !== a)), ans = (a * b) / (a + b);
    if (!Number.isInteger(ans)) return proportion('moderate');
    return finish('Direct & Inverse Proportion', bi(`A किसी काम को ${a} दिन में और B उसी काम को ${b} दिन में कर सकता है। दोनों मिलकर उसे कितने दिनों में करेंगे?`, `A can do a work in ${a} days and B in ${b} days. In how many days can they finish it together?`), ans, nearNums(ans, 4, [(a + b) / 2, a + b]).filter((x) => x > 0), bi(`1/${a} + 1/${b} = 1/${ans}`, `1/${a} + 1/${b} = 1/${ans}`));
  }

  /* UP SAT maths regularly goes a little beyond class 8 (CI, probability, quadratics, coordinates) */
  function compoundInterest(diff) {
    const P = pick([1000, 2000, 4000, 5000, 8000, 10000]), r = pick([5, 10, 20]);
    const amt = (n) => Math.round(P * (1 + r / 100) ** n * 100) / 100;
    if (diff === 'easy') { const A = amt(1); return finish('Compound Interest', bi(`₹${P} पर ${r}% वार्षिक चक्रवृद्धि ब्याज की दर से 1 वर्ष का मिश्रधन कितना होगा?`, `Find the amount on ₹${P} at ${r}% per annum compound interest for 1 year.`), '₹' + A, nearNums(A, 100, [P + r, A + P / 10, A - P / 20]).map((x) => '₹' + x), bi(`A = P(1 + r/100)`, `A = P(1 + r/100)`)); }
    if (diff === 'moderate') { const CI = Math.round((amt(2) - P) * 100) / 100, SI = (P * r * 2) / 100; return finish('Compound Interest', bi(`₹${P} पर ${r}% वार्षिक दर से 2 वर्ष का चक्रवृद्धि ब्याज ज्ञात कीजिए।`, `Find the compound interest on ₹${P} at ${r}% per annum for 2 years.`), '₹' + CI, ['₹' + SI, '₹' + (CI + P * 0.01), '₹' + amt(2), '₹' + (CI - r)], bi(`P(1 + r/100)² − P = ${CI}`, `P(1 + r/100)² − P = ${CI}`)); }
    const d = rand(1, 9) * 5, Pp = (d * 10000) / (r * r);
    return finish('Compound Interest', bi(`किसी धन पर ${r}% वार्षिक दर से 2 वर्ष के चक्रवृद्धि ब्याज और साधारण ब्याज का अंतर ₹${d} है। धन ज्ञात कीजिए।`, `The difference between compound interest and simple interest on a sum for 2 years at ${r}% per annum is ₹${d}. Find the sum.`),
      '₹' + Pp, nearNums(Pp, 400, [Pp + d, Pp * 2, Pp / 2]).filter(Number.isInteger).map((x) => '₹' + x), bi(`अंतर = P(r/100)² ⇒ P = ${Pp}`, `Difference = P(r/100)² ⇒ P = ${Pp}`));
  }

  function probability(diff) {
    if (diff === 'easy') { const n = pick([2, 3, 4, 5, 6]); return finish('Probability', bi(`एक पासा फेंकने पर ${n} से बड़ी संख्या आने की प्रायिकता है:`, `When a die is thrown, the probability of getting a number greater than ${n} is:`), frac(6 - n, 6), [frac(n, 6), frac(6 - n + 1, 6), frac(1, 6), frac(1, 2), frac(1, 3), frac(2, 3)], bi(`अनुकूल परिणाम ${6 - n}, कुल 6`, `Favourable ${6 - n}, total 6`)); }
    if (diff === 'moderate') { const r = rand(2, 7), b = rand(2, 7), g = rand(1, 5), t = r + b + g; return finish('Probability', bi(`एक थैले में ${r} लाल, ${b} नीली और ${g} हरी गेंदें हैं। एक गेंद यादृच्छया निकाली जाती है। उसके नीली होने की प्रायिकता है:`, `A bag has ${r} red, ${b} blue and ${g} green balls. One ball is drawn at random. The probability that it is blue is:`), frac(b, t), [frac(r, t), frac(g, t), frac(b, t - b), frac(b + 1, t), frac(t - b, t)], bi(`${b}/${t}`, `${b}/${t}`)); }
    const s = rand(5, 10); let fav = 0; for (let a = 1; a <= 6; a++) for (let c = 1; c <= 6; c++) if (a + c >= s) fav++;
    return finish('Probability', bi(`दो पासे एक साथ फेंके जाते हैं। अंकों का योग ${s} या अधिक आने की प्रायिकता है:`, `Two dice are thrown together. The probability that the sum is ${s} or more is:`), frac(fav, 36), [frac(36 - fav, 36), frac(fav + 1, 36), frac(fav - 1, 36), frac(fav, 30), frac(6, 36)], bi(`अनुकूल परिणाम ${fav}, कुल 36`, `Favourable outcomes ${fav}, total 36`));
  }
  function frac(a, b) { const g = gcd(a, b) || 1; return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`; }

  function quadratic(diff) {
    let p = rand(-6, 6) || 2, q = rand(-6, 6) || -3; if (p === q) q = p + 1;
    if (diff === 'easy') { p = Math.abs(p); q = Math.abs(q); if (p === q) q++; }
    const b = -(p + q), c = p * q;
    const term = (k, s) => (k === 0 ? '' : (k > 0 ? ' + ' : ' − ') + (Math.abs(k) === 1 && s ? '' : Math.abs(k)) + s);
    const eq = `x²${term(b, 'x')}${term(c, '')} = 0`;
    const show = (a, d) => `${a}, ${d}`;
    if (diff === 'hard') {
      return finish('Quadratic Equation', bi(`यदि समीकरण ${eq} के मूल α और β हों, तो α² + β² का मान है:`, `If α and β are the roots of ${eq}, then α² + β² is:`), p * p + q * q, nearNums(p * p + q * q, 6, [b * b, b * b + 2 * c, (p + q) ** 2]), bi(`(α+β)² − 2αβ = ${b * b} − ${2 * c}`, `(α+β)² − 2αβ = ${b * b} − ${2 * c}`));
    }
    return finish('Quadratic Equation', bi(`द्विघात समीकरण ${eq} के मूल हैं:`, `The roots of the quadratic equation ${eq} are:`), show(p, q), [show(-p, -q), show(p, -q), show(-p, q), show(p + 1, q - 1)], bi(`गुणनखण्ड: (x − ${p})(x − ${q})`, `Factorising: (x − ${p})(x − ${q})`));
  }

  function coordinates(diff) {
    const [a, b, h] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17]]);
    if (diff === 'easy') return finish('Coordinate Geometry', bi(`मूलबिन्दु से बिन्दु (${a}, ${b}) की दूरी है:`, `The distance of the point (${a}, ${b}) from the origin is:`), h, nearNums(h, 3, [a + b, b - a]), bi(`√(${a}² + ${b}²) = ${h}`, `√(${a}² + ${b}²) = ${h}`));
    const x1 = rand(-5, 5), y1 = rand(-5, 5);
    if (diff === 'moderate') { const x2 = x1 + a, y2 = y1 + b; return finish('Coordinate Geometry', bi(`बिन्दुओं (${x1}, ${y1}) और (${x2}, ${y2}) के बीच की दूरी है:`, `The distance between the points (${x1}, ${y1}) and (${x2}, ${y2}) is:`), h, nearNums(h, 4, [a + b, h * h]), bi(`√(${a}² + ${b}²) = ${h}`, `√(${a}² + ${b}²) = ${h}`)); }
    const x2 = x1 + 2 * rand(1, 5), y2 = y1 + 2 * rand(1, 5), m = `(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`;
    return finish('Coordinate Geometry', bi(`बिन्दुओं (${x1}, ${y1}) और (${x2}, ${y2}) को मिलाने वाले रेखाखण्ड का मध्यबिन्दु है:`, `The mid-point of the line segment joining (${x1}, ${y1}) and (${x2}, ${y2}) is:`), m, [`(${(x2 - x1) / 2}, ${(y2 - y1) / 2})`, `(${x1 + x2}, ${y1 + y2})`, `(${(y1 + y2) / 2}, ${(x1 + x2) / 2})`, `(${(x1 + x2) / 2 + 1}, ${(y1 + y2) / 2})`], bi('((x₁+x₂)/2, (y₁+y₂)/2)', '((x₁+x₂)/2, (y₁+y₂)/2)'));
  }

  function solids(diff) {
    if (diff === 'easy') { const a = rand(2, 12); return finish('Surface Area & Volume', bi(`${a} सेमी भुजा वाले घन का आयतन है:`, `The volume of a cube of side ${a} cm is:`), a ** 3 + ' cm³', [6 * a * a, a * a, 3 * a ** 2, a ** 3 + a].map((x) => x + ' cm³'), bi(`a³ = ${a ** 3}`, `a³ = ${a ** 3}`)); }
    if (diff === 'moderate') { const a = rand(3, 12), S = 6 * a * a; return finish('Surface Area & Volume', bi(`उस घन का आयतन ज्ञात कीजिए जिसका कुल पृष्ठीय क्षेत्रफल ${S} cm² है।`, `Find the volume of a cube whose total surface area is ${S} cm².`), a ** 3 + ' cm³', [a ** 2, (a + 1) ** 3, (a - 1) ** 3, S].map((x) => x + ' cm³'), bi(`6a² = ${S} ⇒ a = ${a}`, `6a² = ${S} ⇒ a = ${a}`)); }
    const r = 7 * rand(1, 2), h = rand(2, 10), V = (22 / 7) * r * r * h;
    return finish('Surface Area & Volume', bi(`एक बेलन की त्रिज्या ${r} सेमी और ऊँचाई ${h} सेमी है। इसका आयतन है: (π = 22/7)`, `A cylinder has radius ${r} cm and height ${h} cm. Its volume is: (π = 22/7)`), V + ' cm³', [2 * (22 / 7) * r * h, V / 2, V + 154, (22 / 7) * r * h * h].map((x) => Math.round(x) + ' cm³'), bi(`πr²h = ${V}`, `πr²h = ${V}`));
  }

  /* letter gap series (UP Q70–77 type): fill the blanks of a repeating pattern */
  function letterGap(diff) {
    const L = diff === 'easy' ? 3 : diff === 'moderate' ? 4 : 5;
    const letters = diff === 'easy' ? ['a', 'b'] : diff === 'moderate' ? shuffle(['a', 'b', 'c']).slice(0, rand(2, 3)) : ['a', 'b', 'c'];
    let unit;
    do { unit = Array.from({ length: L }, () => pick(letters)).join(''); } while (new Set(unit).size < Math.min(2, letters.length) || /^(.)\1+$/.test(unit) || isPeriodic(unit + unit + unit, L));
    const full = unit.repeat(diff === 'easy' ? 3 : 3);
    const nb = diff === 'easy' ? 4 : 5;
    const idx = shuffle([...Array(full.length).keys()]).slice(0, nb).sort((a, b) => a - b);
    const shown = full.split('').map((c, i) => (idx.includes(i) ? '_' : c)).join('');
    const ans = idx.map((i) => full[i]).join('');
    const fill = (opt) => { const a = full.split(''); idx.forEach((i, k) => { a[i] = opt[k]; }); return a.join(''); };
    const wrong = [];
    for (let t = 0; t < 60 && wrong.length < 6; t++) {
      const w = ans.split('').map((c, k) => (Math.random() < 0.45 ? pick(letters.concat(letters.length < 3 ? ['c'] : [])) : c)).join('');
      if (w !== ans && !wrong.includes(w) && !isPeriodic(fill(w), L)) wrong.push(w);
    }
    if (wrong.length < 3) return null;
    return finish('Letter Gap Series', bi(`नीचे दी गई श्रेणी के रिक्त स्थानों में क्रम से कौन-से अक्षर आएँगे?\n${shown}`, `Which letters, in order, fill the blanks of the series?\n${shown}`), ans, wrong,
      bi(`श्रेणी "${unit}" की पुनरावृत्ति है: ${full}`, `The series repeats "${unit}": ${full}`));
  }
  /* true if s repeats with some period p ≤ s.length / 2 (any such period makes a blank-fill valid) */
  function isPeriodic(s, notP) {
    for (let p = 1; p <= s.length / 2; p++) {
      if (p === notP) continue;
      let ok = true;
      for (let i = p; i < s.length; i++) if (s[i] !== s[i - p]) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  }

  const WORD_PAIRS = [
    ['डॉक्टर', 'अस्पताल', 'Doctor', 'Hospital', 'शिक्षक', 'विद्यालय', 'Teacher', 'School', 'easy'],
    ['पक्षी', 'घोंसला', 'Bird', 'Nest', 'मधुमक्खी', 'छत्ता', 'Bee', 'Hive', 'easy'],
    ['आँख', 'देखना', 'Eye', 'See', 'कान', 'सुनना', 'Ear', 'Hear', 'easy'],
    ['दूध', 'गाय', 'Milk', 'Cow', 'शहद', 'मधुमक्खी', 'Honey', 'Bee', 'easy'],
    ['बढ़ई', 'आरी', 'Carpenter', 'Saw', 'दर्ज़ी', 'सुई', 'Tailor', 'Needle', 'easy'],
    ['भारत', 'रुपया', 'India', 'Rupee', 'जापान', 'येन', 'Japan', 'Yen', 'easy'],
    ['थर्मामीटर', 'ताप', 'Thermometer', 'Temperature', 'बैरोमीटर', 'वायुदाब', 'Barometer', 'Air pressure', 'moderate'],
    ['लेखक', 'पुस्तक', 'Author', 'Book', 'मूर्तिकार', 'मूर्ति', 'Sculptor', 'Statue', 'moderate'],
    ['जहाज़', 'बंदरगाह', 'Ship', 'Harbour', 'हवाई जहाज़', 'हवाई अड्डा', 'Aeroplane', 'Airport', 'moderate'],
    ['घोड़ा', 'अस्तबल', 'Horse', 'Stable', 'गाय', 'गौशाला', 'Cow', 'Cowshed', 'moderate'],
    ['बीज', 'पौधा', 'Seed', 'Plant', 'अंडा', 'पक्षी', 'Egg', 'Bird', 'moderate'],
    ['विटामिन C', 'स्कर्वी', 'Vitamin C', 'Scurvy', 'विटामिन D', 'रिकेट्स', 'Vitamin D', 'Rickets', 'hard'],
    ['भूकंप', 'सीस्मोग्राफ़', 'Earthquake', 'Seismograph', 'वायु वेग', 'एनीमोमीटर', 'Wind speed', 'Anemometer', 'hard'],
    ['पत्रकारिता', 'समाचार पत्र', 'Journalism', 'Newspaper', 'ज्योतिष', 'जन्मपत्री', 'Astrology', 'Horoscope', 'hard'],
    ['मीटर', 'लम्बाई', 'Metre', 'Length', 'किलोग्राम', 'द्रव्यमान', 'Kilogram', 'Mass', 'hard']
  ];
  function wordAnalogy(diff) {
    const list = WORD_PAIRS.filter((w) => w[8] === diff);
    const w = pick(list.length ? list : WORD_PAIRS);
    const others = shuffle(WORD_PAIRS.filter((x) => x !== w)).slice(0, 3);
    return finish('Word Analogy', bi(`${w[0]} : ${w[1]} :: ${w[4]} : ?`, `${w[2]} : ${w[3]} :: ${w[6]} : ?`), bi(w[5], w[7]), others.map((x) => (Math.random() < 0.5 ? bi(x[5], x[7]) : bi(x[1], x[3]))).concat([bi(w[1], w[3])]),
      bi(`जो संबंध ${w[0]} और ${w[1]} में है, वही ${w[4]} और ${w[5]} में है।`, `${w[4]} relates to ${w[5]} as ${w[0]} relates to ${w[1]}.`));
  }

  const ODD_WORDS = [
    [['आम', 'केला', 'सेब', 'आलू'], ['Mango', 'Banana', 'Apple', 'Potato'], 'easy', ['आलू सब्ज़ी है, बाकी फल हैं।', 'Potato is a vegetable; others are fruits.']],
    [['लखनऊ', 'पटना', 'भोपाल', 'कानपुर'], ['Lucknow', 'Patna', 'Bhopal', 'Kanpur'], 'moderate', ['कानपुर राजधानी नहीं है।', 'Kanpur is not a state capital.']],
    [['मंगल', 'बुध', 'शुक्र', 'चंद्रमा'], ['Mars', 'Mercury', 'Venus', 'Moon'], 'easy', ['चंद्रमा ग्रह नहीं, उपग्रह है।', 'The Moon is a satellite, not a planet.']],
    [['लोहा', 'ताँबा', 'सोना', 'लकड़ी'], ['Iron', 'Copper', 'Gold', 'Wood'], 'easy', ['लकड़ी धातु नहीं है।', 'Wood is not a metal.']],
    [['गंगा', 'यमुना', 'गोमती', 'हिमालय'], ['Ganga', 'Yamuna', 'Gomti', 'Himalaya'], 'easy', ['हिमालय पर्वत है।', 'Himalaya is a mountain.']],
    [['त्रिभुज', 'वर्ग', 'आयत', 'घन'], ['Triangle', 'Square', 'Rectangle', 'Cube'], 'moderate', ['घन त्रिविमीय है, बाकी समतल आकृतियाँ हैं।', 'A cube is three-dimensional; the others are plane figures.']],
    [['आँख', 'कान', 'नाक', 'हृदय'], ['Eye', 'Ear', 'Nose', 'Heart'], 'moderate', ['हृदय ज्ञानेन्द्रिय नहीं है।', 'The heart is not a sense organ.']],
    [['ऑक्सीजन', 'नाइट्रोजन', 'हाइड्रोजन', 'पारा'], ['Oxygen', 'Nitrogen', 'Hydrogen', 'Mercury'], 'hard', ['पारा द्रव धातु है, बाकी गैसें हैं।', 'Mercury is a liquid metal; the others are gases.']],
    [['कबड्डी', 'खो-खो', 'हॉकी', 'शतरंज'], ['Kabaddi', 'Kho-kho', 'Hockey', 'Chess'], 'moderate', ['शतरंज मैदान का खेल नहीं है।', 'Chess is not a field game.']],
    [['व्हेल', 'डॉल्फ़िन', 'चमगादड़', 'शार्क'], ['Whale', 'Dolphin', 'Bat', 'Shark'], 'hard', ['शार्क मछली है, बाकी स्तनधारी हैं।', 'Shark is a fish; the others are mammals.']]
  ];
  function wordOdd(diff) {
    const list = ODD_WORDS.filter((w) => w[2] === diff);
    const [hi, en, , why] = pick(list.length ? list : ODD_WORDS);
    const order = shuffle([0, 1, 2, 3]);
    return { topic: 'Odd Word Out', q: bi('निम्नलिखित में से भिन्न शब्द चुनिए।', 'Choose the word which is different from the others.'), options: order.map((i) => bi(hi[i], en[i])), answer: order.indexOf(3), explanation: bi(why[0], why[1]) };
  }

  const MAT_GENS = [numberSeries, alphaSeries, coding, numberAnalogy, oddOneNumber, oddOneLetters, direction, ranking, clock, calendar, ages, letterPosition, countPattern, missingGrid, operators, bloodRelation, letterGap, wordAnalogy, wordOdd].concat(window.FIG ? FIG.MAT_FIG : []);
  /* where each generator sits in the UP MAT order (figure generators carry `cat` themselves) */
  const CAT = { numberSeries: 'series', alphaSeries: 'series', letterPosition: 'series', coding: 'coding', numberAnalogy: 'analogy', wordAnalogy: 'analogy', oddOneNumber: 'odd', oddOneLetters: 'odd', wordOdd: 'odd',
    direction: 'relation', ranking: 'relation', bloodRelation: 'relation', clock: 'arith', calendar: 'arith', ages: 'arith', countPattern: 'arith', missingGrid: 'figurenum', operators: 'ops', letterGap: 'gap',
    figSeries: 'figure', mirrorImage: 'figure', paperFold: 'figure', dice: 'figure', countTriangles: 'figure', figAnalogy: 'analogy', figOdd: 'odd', overlap: 'figurenum', missingFigure: 'figurenum', venn: 'venn' };
  const MATHS_GENS = [percentage, simpleInterest, hcfLcm, linearEq, mensuration, profitLoss, exponents, roots, average, angles, identities, proportion, compoundInterest, probability, quadratic, coordinates, solids].concat(window.FIG ? FIG.MATHS_FIG : []);

  const G = {
    MAT_GENS, MATHS_GENS, CAT,
    byName(name) { return MAT_GENS.concat(MATHS_GENS).find((f) => f.name === name); },
    ofCat(cat) { return MAT_GENS.filter((f) => (CAT[f.name] || 'arith') === cat); },
    topics(subject) { return (subject === 'mat' ? MAT_GENS : MATHS_GENS).map((f) => f.name); },
    /* generate one question for subject ('mat'|'maths') at difficulty */
    one(subject, diff, gen) {
      const list = subject === 'mat' ? MAT_GENS : MATHS_GENS;
      for (let i = 0; i < 20; i++) {
        const f = gen || pick(list);
        let r = null;
        try { r = f(diff); } catch (e) { r = null; }
        if (r && r.options.length === 4 && r.answer >= 0) {
          return U.normQuestion(Object.assign(r, { subject, difficulty: diff, source: 'generated', gen: f.name, cat: r.cat || CAT[f.name] || (subject === 'mat' ? 'arith' : 'maths') }));
        }
      }
      return null;
    },
    /* n questions spread evenly across generator types */
    many(subject, diff, n) {
      const list = U.shuffle(subject === 'mat' ? MAT_GENS : MATHS_GENS);
      const out = [], seen = new Set();
      let i = 0, guard = 0;
      while (out.length < n && guard++ < n * 10) {
        const q = G.one(subject, diff, list[i++ % list.length]);
        if (q && !seen.has(U.qKey(q))) { seen.add(U.qKey(q)); out.push(q); }
      }
      return out;
    }
  };
  window.GEN = G;
})();
