/* Basic Pathshala - NMMS : reasoning passage sets (MAT Q86–90 style).
   A hidden arrangement is drawn at random, true clues are added until a brute-force search finds exactly one
   arrangement, redundant clues are dropped, and five linked questions are asked from the solved arrangement.
   Kinds: row seating, ranking (height / marks / age / weight), grouping (profession / city / subject + gender). */
(function () {
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const perms = (arr) => (arr.length <= 1 ? [arr] : arr.flatMap((x, i) => perms(arr.slice(0, i).concat(arr.slice(i + 1))).map((p) => [x].concat(p))));
  const T = (hi, en) => ({ hi, en });
  const NUM_HI = ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात'];
  const NUM_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
  const ORD_HI = ['', 'पहले', 'दूसरे', 'तीसरे', 'चौथे', 'पाँचवें', 'छठे'];
  const ORD_EN = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth'];
  const NAME_SETS = [
    ['A', 'B', 'C', 'D', 'E', 'F'], ['P', 'Q', 'R', 'S', 'T', 'U'], ['K', 'L', 'M', 'N', 'O', 'P'],
    [['अमन', 'Aman'], ['बबलू', 'Bablu'], ['चेतन', 'Chetan'], ['दीपक', 'Deepak'], ['ईशान', 'Ishan'], ['फ़ैज़', 'Faiz']],
    [['रीना', 'Reena'], ['सीमा', 'Seema'], ['तनु', 'Tanu'], ['उषा', 'Usha'], ['वंदना', 'Vandana'], ['नेहा', 'Neha']]
  ];
  const people = (n, letters) => {
    const sets = letters ? NAME_SETS.slice(0, 3) : NAME_SETS;
    return pick(sets).slice(0, n).map((x) => (Array.isArray(x) ? T(x[0], x[1]) : T(x, x)));
  };
  const listOf = (ps) => T(ps.slice(0, -1).map((p) => p.hi).join(', ') + ' और ' + ps[ps.length - 1].hi, ps.slice(0, -1).map((p) => p.en).join(', ') + ' and ' + ps[ps.length - 1].en);

  /* keep adding true clues until one solution is left, then drop clues that are not needed */
  function solveClues(space, cands) {
    const count = (cl) => { let c = 0; for (const s of space) if (cl.every((x) => x.ok(s))) { if (++c > 1) return c; } return c; };
    const chosen = [];
    for (const c of cands) { chosen.push(c); if (count(chosen) === 1) break; }
    if (count(chosen) !== 1) return null;
    for (const c of shuffle(chosen.slice())) {
      const rest = chosen.filter((x) => x !== c);
      if (count(rest) === 1) chosen.splice(chosen.indexOf(c), 1);
    }
    return shuffle(chosen);
  }

  /* four distinct options with the answer among them; returns {options, answer} */
  function opts(right, wrongs) {
    const key = (o) => o.en;
    const seen = new Set([key(right)]), w = [];
    for (const o of shuffle(wrongs)) { if (!seen.has(key(o))) { seen.add(key(o)); w.push(o); } if (w.length === 3) break; }
    if (w.length < 3) return null;
    const all = shuffle([right].concat(w));
    return { options: all, answer: all.findIndex((o) => key(o) === key(right)) };
  }
  const numOpts = (n, lo, hi) => { const w = []; for (let k = lo; k <= hi; k++) if (k !== n) w.push(T(String(k), String(k))); const o = opts(T(String(n), String(n)), w); if (o) { const s = o.options.slice().sort((a, b) => +a.en - +b.en); return { options: s, answer: s.findIndex((x) => +x.en === n) }; } return null; };

  /* ---------- 1. row seating (all facing north, positions 0..n-1 from left) ---------- */
  function seating() {
    const n = 6, P = people(n);
    const hidden = shuffle([...Array(n).keys()]); // hidden[person] = position
    const space = perms([...Array(n).keys()]);
    const pos = (s, i) => s[i];
    const who = (s, p) => s.indexOf(p);
    const nm = (i) => P[i];
    const cands = [];
    const pairs = [];
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (a !== b) pairs.push([a, b]);
    shuffle(pairs).forEach(([a, b]) => {
      const d = hidden[a] - hidden[b];
      if (d === 1) cands.push({ w: 2, ok: (s) => pos(s, a) - pos(s, b) === 1, t: T(`${nm(a).hi} का स्थान ${nm(b).hi} के ठीक दाईं ओर है।`, `${nm(a).en} sits immediately to the right of ${nm(b).en}.`) });
      if (d === 2) cands.push({ w: 2, ok: (s) => pos(s, a) - pos(s, b) === 2, t: T(`${nm(a).hi}, ${nm(b).hi} के दाईं ओर दूसरे स्थान पर है।`, `${nm(a).en} sits second to the right of ${nm(b).en}.`) });
      if (d === -2) cands.push({ w: 2, ok: (s) => pos(s, a) - pos(s, b) === -2, t: T(`${nm(a).hi}, ${nm(b).hi} के बाईं ओर दूसरे स्थान पर है।`, `${nm(a).en} sits second to the left of ${nm(b).en}.`) });
      if (d < -1) cands.push({ w: 1, ok: (s) => pos(s, a) < pos(s, b), t: T(`${nm(a).hi}, ${nm(b).hi} के बाईं ओर कहीं है।`, `${nm(a).en} sits somewhere to the left of ${nm(b).en}.`) });
      if (a < b && Math.abs(d) > 1) cands.push({ w: 1, ok: (s) => Math.abs(pos(s, a) - pos(s, b)) > 1, t: T(`${nm(a).hi} और ${nm(b).hi} पड़ोसी नहीं हैं।`, `${nm(a).en} and ${nm(b).en} are not neighbours.`) });
    });
    for (let x = 0; x < n; x++) {
      const p = hidden[x];
      if (p === 0 || p === n - 1) cands.push({ w: 1, ok: (s) => s[x] === 0 || s[x] === n - 1, t: T(`${nm(x).hi} का स्थान किसी एक सिरे पर है।`, `${nm(x).en} sits at one of the extreme ends.`) });
      else cands.push({ w: 1, ok: (s) => s[x] !== 0 && s[x] !== n - 1, t: T(`${nm(x).hi} का स्थान किसी भी सिरे पर नहीं है।`, `${nm(x).en} does not sit at either end.`) });
      if (p > 0 && p < n - 1) {
        const l = hidden.indexOf(p - 1), r = hidden.indexOf(p + 1);
        cands.push({ w: 2, ok: (s) => Math.abs(s[l] - s[x]) === 1 && Math.abs(s[r] - s[x]) === 1, t: T(`${nm(x).hi} का स्थान ${nm(l).hi} और ${nm(r).hi} के ठीक बीच में है।`, `${nm(x).en} sits between ${nm(l).en} and ${nm(r).en}.`) });
      }
      cands.push({ w: 3, ok: (s) => s[x] === p, t: T(`${nm(x).hi} का स्थान बाएँ सिरे से ${ORD_HI[p + 1]} है।`, `${nm(x).en} is ${ORD_EN[p + 1]} from the left end.`) });
    }
    const clues = solveClues(space, shuffle(cands).sort((a, b) => a.w - b.w));
    if (!clues || clues.length < 4) return null;
    const at = (p) => hidden.indexOf(p);
    const row = [...Array(n).keys()].map(at);
    const intro = T(`${NUM_HI[n]} मित्र ${listOf(P).hi} एक पंक्ति में उत्तर की ओर मुख करके बैठे हैं।`, `${NUM_EN[n][0].toUpperCase() + NUM_EN[n].slice(1)} friends ${listOf(P).en} are sitting in a row facing north.`);
    const others = (i) => P.filter((_, k) => k !== i);
    const Q = [];
    const end = pick([0, n - 1]);
    Q.push(['moderate', T(`${end ? 'दाएँ' : 'बाएँ'} सिरे पर कौन बैठा है?`, `Who sits at the extreme ${end ? 'right' : 'left'} end?`), opts(nm(at(end)), others(at(end)))]);
    const x1 = at(1 + rnd(n - 2));
    Q.push(['moderate', T(`${nm(x1).hi} के ठीक दाईं ओर कौन बैठा है?`, `Who sits immediately to the right of ${nm(x1).en}?`), opts(nm(at(hidden[x1] + 1)), others(at(hidden[x1] + 1)).filter((p) => p !== nm(x1)))]);
    const [u, v] = shuffle([...Array(n).keys()]).slice(0, 2);
    Q.push(['moderate', T(`${nm(u).hi} और ${nm(v).hi} के बीच कितने व्यक्ति बैठे हैं?`, `How many persons sit between ${nm(u).en} and ${nm(v).en}?`), numOpts(Math.abs(hidden[u] - hidden[v]) - 1, 0, 4)]);
    const pairT = (a, b) => T(`${nm(a).hi}, ${nm(b).hi}`, `${nm(a).en}, ${nm(b).en}`);
    const ends = pairT(at(0), at(n - 1));
    const wrongPairs = [];
    for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (!((hidden[a] === 0 || hidden[a] === n - 1) && (hidden[b] === 0 || hidden[b] === n - 1))) wrongPairs.push(pairT(a, b));
    Q.push(['moderate', T('दोनों सिरों पर कौन-से दो मित्र बैठे हैं?', 'Which two friends sit at the two ends?'), opts(ends, wrongPairs)]);
    // hard: one true statement among three false ones
    const stmt = (a, b) => T(`${nm(a).hi} का स्थान ${nm(b).hi} के ठीक बाईं ओर है।`, `${nm(a).en} sits immediately to the left of ${nm(b).en}.`);
    const tp = 1 + rnd(n - 1), tr = stmt(at(tp - 1), at(tp));
    const fs = pairs.filter(([a, b]) => hidden[b] - hidden[a] !== 1).map(([a, b]) => stmt(a, b));
    Q.push(['hard', T('निम्नलिखित में से कौन-सा कथन सही है?', 'Which of the following statements is true?'), opts(tr, fs)]);
    const expl = T('बाएँ से दाएँ क्रम: ' + row.map((i) => nm(i).hi).join(' – '), 'Order from left to right: ' + row.map((i) => nm(i).en).join(' – '));
    return { kind: 'seating', intro, clues, Q, expl };
  }

  /* ---------- 2. ranking ---------- */
  const ATTR = [
    { more: (a, b) => T(`${a.hi} की लंबाई ${b.hi} से अधिक है।`, `${a.en} is taller than ${b.en}.`), less: (a, b) => T(`${a.hi} की लंबाई ${b.hi} से कम है।`, `${a.en} is shorter than ${b.en}.`),
      top: T('किसकी लंबाई सबसे अधिक है?', 'Who is the tallest?'), bottom: T('किसकी लंबाई सबसे कम है?', 'Who is the shortest?'),
      kth: (k) => T(`लंबाई के क्रम में (सबसे लंबे से) ${ORD_HI[k]} स्थान पर कौन है?`, `Who is ${ORD_EN[k]} tallest?`), cnt: (a) => T(`कितने व्यक्तियों की लंबाई ${a.hi} से अधिक है?`, `How many persons are taller than ${a.en}?`), btw: (a, b, c) => T(`${a.hi} की लंबाई ${b.hi} से अधिक परंतु ${c.hi} से कम है।`, `${a.en} is taller than ${b.en} but shorter than ${c.en}.`),
      only: (k, a) => T(`केवल ${NUM_HI[k]} ${k === 1 ? 'व्यक्ति की' : 'व्यक्तियों की'} लंबाई ${a.hi} से अधिक है।`, `Only ${NUM_EN[k]} ${k === 1 ? 'person is' : 'persons are'} taller than ${a.en}.`), w: T('लंबाई', 'height'), ord: T('सबसे लंबे से सबसे छोटे तक', 'tallest to shortest') },
    { more: (a, b) => T(`${a.hi} के अंक ${b.hi} से अधिक हैं।`, `${a.en} scored more marks than ${b.en}.`), less: (a, b) => T(`${a.hi} के अंक ${b.hi} से कम हैं।`, `${a.en} scored fewer marks than ${b.en}.`),
      top: T('किसके अंक सबसे अधिक हैं?', 'Who scored the highest marks?'), bottom: T('किसके अंक सबसे कम हैं?', 'Who scored the lowest marks?'),
      kth: (k) => T(`अंकों के क्रम में (सबसे अधिक से) ${ORD_HI[k]} स्थान पर कौन है?`, `Who is ${ORD_EN[k]} in order of marks (highest first)?`), cnt: (a) => T(`कितने विद्यार्थियों के अंक ${a.hi} से अधिक हैं?`, `How many students scored more than ${a.en}?`), btw: (a, b, c) => T(`${a.hi} के अंक ${b.hi} से अधिक परंतु ${c.hi} से कम हैं।`, `${a.en} scored more than ${b.en} but less than ${c.en}.`),
      only: (k, a) => T(`केवल ${NUM_HI[k]} ${k === 1 ? 'व्यक्ति के' : 'व्यक्तियों के'} अंक ${a.hi} से अधिक हैं।`, `Only ${NUM_EN[k]} ${k === 1 ? 'person' : 'persons'} scored more marks than ${a.en}.`), w: T('अंक', 'marks'), ord: T('सबसे अधिक से सबसे कम अंक', 'highest to lowest marks') },
    { more: (a, b) => T(`${a.hi} की आयु ${b.hi} से अधिक है।`, `${a.en} is older than ${b.en}.`), less: (a, b) => T(`${a.hi} की आयु ${b.hi} से कम है।`, `${a.en} is younger than ${b.en}.`),
      top: T('सबसे अधिक आयु किसकी है?', 'Who is the oldest?'), bottom: T('सबसे कम आयु किसकी है?', 'Who is the youngest?'),
      kth: (k) => T(`आयु के क्रम में (सबसे बड़े से) ${ORD_HI[k]} स्थान पर कौन है?`, `Who is ${ORD_EN[k]} oldest?`), cnt: (a) => T(`कितने व्यक्तियों की आयु ${a.hi} से अधिक है?`, `How many persons are older than ${a.en}?`), btw: (a, b, c) => T(`${a.hi} की आयु ${b.hi} से अधिक परंतु ${c.hi} से कम है।`, `${a.en} is older than ${b.en} but younger than ${c.en}.`),
      only: (k, a) => T(`केवल ${NUM_HI[k]} ${k === 1 ? 'व्यक्ति की' : 'व्यक्तियों की'} आयु ${a.hi} से अधिक है।`, `Only ${NUM_EN[k]} ${k === 1 ? 'person is' : 'persons are'} older than ${a.en}.`), w: T('आयु', 'age'), ord: T('सबसे बड़े से सबसे छोटे तक', 'oldest to youngest') },
    { more: (a, b) => T(`${a.hi} का भार ${b.hi} से अधिक है।`, `${a.en} is heavier than ${b.en}.`), less: (a, b) => T(`${a.hi} का भार ${b.hi} से कम है।`, `${a.en} is lighter than ${b.en}.`),
      top: T('सबसे अधिक भार किसका है?', 'Who is the heaviest?'), bottom: T('सबसे कम भार किसका है?', 'Who is the lightest?'),
      kth: (k) => T(`भार के क्रम में (सबसे भारी से) ${ORD_HI[k]} स्थान पर कौन है?`, `Who is ${ORD_EN[k]} heaviest?`), cnt: (a) => T(`कितने व्यक्तियों का भार ${a.hi} से अधिक है?`, `How many persons are heavier than ${a.en}?`), btw: (a, b, c) => T(`${a.hi} का भार ${b.hi} से अधिक परंतु ${c.hi} से कम है।`, `${a.en} is heavier than ${b.en} but lighter than ${c.en}.`),
      only: (k, a) => T(`केवल ${NUM_HI[k]} ${k === 1 ? 'व्यक्ति का' : 'व्यक्तियों का'} भार ${a.hi} से अधिक है।`, `Only ${NUM_EN[k]} ${k === 1 ? 'person is' : 'persons are'} heavier than ${a.en}.`), w: T('भार', 'weight'), ord: T('सबसे भारी से सबसे हल्के तक', 'heaviest to lightest') }
  ];
  function ranking() {
    const n = 6, P = people(n), A = pick(ATTR);
    const hidden = shuffle([...Array(n).keys()]); // hidden[person] = rank (0 = most)
    const space = perms([...Array(n).keys()]);
    const nm = (i) => P[i];
    const cands = [];
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      if (a === b) continue;
      if (hidden[a] < hidden[b]) cands.push({ w: 1, ok: (s) => s[a] < s[b], t: rnd(2) ? A.more(nm(a), nm(b)) : A.less(nm(b), nm(a)) });
      for (let c = 0; c < n; c++) if (c !== a && c !== b && hidden[c] < hidden[a] && hidden[a] < hidden[b]) {
        cands.push({ w: 1, ok: (s) => s[c] < s[a] && s[a] < s[b], t: A.btw(nm(a), nm(b), nm(c)) });
      }
    }
    for (let x = 0; x < n; x++) {
      const r = hidden[x];
      if (r > 0 && r < n - 1) cands.push({ w: 2, ok: (s) => s[x] === r, t: A.only(r, nm(x)) });
    }
    const clues = solveClues(space, shuffle(cands).sort((a, b) => a.w - b.w));
    if (!clues || clues.length < 4) return null;
    const at = (r) => hidden.indexOf(r);
    const order = [...Array(n).keys()].map(at);
    const others = (i) => P.filter((_, k) => k !== i);
    const intro = T(`${NUM_HI[n]} व्यक्ति ${listOf(P).hi} हैं। सभी की ${A.w.hi} अलग-अलग है।`, `There are ${NUM_EN[n]} persons ${listOf(P).en}. Each has a different ${A.w.en}.`);
    const Q = [];
    Q.push(['moderate', A.top, opts(nm(at(0)), others(at(0)))]);
    Q.push(['moderate', A.bottom, opts(nm(at(n - 1)), others(at(n - 1)))]);
    const k = 2 + rnd(n - 3);
    Q.push(['moderate', A.kth(k + 1), opts(nm(at(k)), others(at(k)))]);
    const x = at(1 + rnd(n - 2));
    Q.push(['moderate', A.cnt(nm(x)), numOpts(hidden[x], 0, 5)]);
    // hard: who is ranked between two given persons with exactly one place between them
    const r0 = rnd(n - 2), hi1 = at(r0), lo1 = at(r0 + 2), mid = at(r0 + 1);
    Q.push(['hard', T(`${A.w.hi} के क्रम में ${nm(hi1).hi} और ${nm(lo1).hi} के ठीक बीच में कौन है?`, `In order of ${A.w.en}, who is exactly between ${nm(hi1).en} and ${nm(lo1).en}?`), opts(nm(mid), others(mid).filter((p) => p !== nm(hi1) && p !== nm(lo1)))]);
    const expl = T(`क्रम (${A.ord.hi}): ` + order.map((i) => nm(i).hi).join(' > '), `Order (${A.ord.en}): ` + order.map((i) => nm(i).en).join(' > '));
    return { kind: 'ranking', intro, clues, Q, expl };
  }

  /* ---------- 3. grouping: three values, two persons each, plus gender ---------- */
  const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w.toLowerCase();
  const GROUPS = [
    { vals: [T('डॉक्टर', 'Doctor'), T('इंजीनियर', 'Engineer'), T('शिक्षक', 'Teacher')], is: (p, v) => T(`${p.hi} ${v.hi} है।`, `${p.en} is ${an(v.en)}.`), not: (p, v) => T(`${p.hi} ${v.hi} नहीं है।`, `${p.en} is not ${an(v.en)}.`),
      same: (a, b) => T(`${a.hi} और ${b.hi} का व्यवसाय एक ही है।`, `${a.en} and ${b.en} have the same profession.`), diff: (a, b) => T(`${a.hi} और ${b.hi} के व्यवसाय अलग-अलग हैं।`, `${a.en} and ${b.en} have different professions.`),
      intro: T('इनमें दो डॉक्टर, दो इंजीनियर और दो शिक्षक हैं।', 'Among them there are two doctors, two engineers and two teachers.'), ask: (p) => T(`${p.hi} का व्यवसाय क्या है?`, `What is ${p.en}'s profession?`), plural: (v) => T(`दो ${v.hi} कौन हैं?`, `Who are the two ${v.en.toLowerCase()}s?`), noLady: (v) => T(`कोई भी महिला ${v.hi} नहीं है।`, `No lady is ${an(v.en)}.`), bothLady: (v) => T(`दोनों ${v.hi} महिलाएँ हैं।`, `Both the ${v.en.toLowerCase()}s are ladies.`), w: T('व्यवसाय', 'profession') },
    { vals: [T('लखनऊ', 'Lucknow'), T('कानपुर', 'Kanpur'), T('आगरा', 'Agra')], is: (p, v) => T(`${p.hi} ${v.hi} से है।`, `${p.en} is from ${v.en}.`), not: (p, v) => T(`${p.hi} ${v.hi} से नहीं है।`, `${p.en} is not from ${v.en}.`),
      same: (a, b) => T(`${a.hi} और ${b.hi} एक ही शहर से हैं।`, `${a.en} and ${b.en} are from the same city.`), diff: (a, b) => T(`${a.hi} और ${b.hi} अलग-अलग शहरों से हैं।`, `${a.en} and ${b.en} are from different cities.`),
      intro: T('इनमें से दो-दो व्यक्ति लखनऊ, कानपुर और आगरा से हैं।', 'Two of them each are from Lucknow, Kanpur and Agra.'), ask: (p) => T(`${p.hi} किस शहर से है?`, `Which city is ${p.en} from?`), plural: (v) => T(`${v.hi} से कौन-से दो व्यक्ति हैं?`, `Which two persons are from ${v.en}?`), noLady: (v) => T(`कोई भी महिला ${v.hi} से नहीं है।`, `No lady is from ${v.en}.`), bothLady: (v) => T(`${v.hi} से दोनों व्यक्ति महिलाएँ हैं।`, `Both persons from ${v.en} are ladies.`), w: T('शहर', 'city') },
    { vals: [T('गणित', 'Maths'), T('विज्ञान', 'Science'), T('हिंदी', 'Hindi')], is: (p, v) => T(`${p.hi} का प्रिय विषय ${v.hi} है।`, `${p.en}'s favourite subject is ${v.en}.`), not: (p, v) => T(`${p.hi} का प्रिय विषय ${v.hi} नहीं है।`, `${p.en}'s favourite subject is not ${v.en}.`),
      same: (a, b) => T(`${a.hi} और ${b.hi} का प्रिय विषय एक ही है।`, `${a.en} and ${b.en} have the same favourite subject.`), diff: (a, b) => T(`${a.hi} और ${b.hi} के प्रिय विषय अलग-अलग हैं।`, `${a.en} and ${b.en} have different favourite subjects.`),
      intro: T('गणित, विज्ञान और हिंदी — प्रत्येक विषय दो-दो विद्यार्थियों का प्रिय विषय है।', 'Maths, Science and Hindi are each the favourite subject of two students.'), ask: (p) => T(`${p.hi} का प्रिय विषय क्या है?`, `What is ${p.en}'s favourite subject?`), plural: (v) => T(`किन दो विद्यार्थियों का प्रिय विषय ${v.hi} है?`, `Which two students like ${v.en} the most?`), noLady: (v) => T(`किसी भी महिला का प्रिय विषय ${v.hi} नहीं है।`, `${v.en} is not the favourite subject of any lady.`), bothLady: (v) => T(`जिनका प्रिय विषय ${v.hi} है, वे दोनों महिलाएँ हैं।`, `Both persons whose favourite subject is ${v.en} are ladies.`), w: T('प्रिय विषय', 'favourite subject') }
  ];
  function grouping() {
    const n = 6, P = people(n, true), G = pick(GROUPS);
    const vals = G.vals;
    const hg = shuffle([0, 0, 1, 1, 2, 2]);
    const nF = 2 + rnd(2);
    const hs = shuffle([...Array(n).keys()].map((i) => (i < nF ? 1 : 0))); // 1 = lady
    const space = [];
    perms([0, 0, 1, 1, 2, 2]).forEach((g) => { const k = g.join(''); if (!space.some((x) => x.k === k)) space.push({ k, g }); });
    const full = [];
    space.forEach(({ g }) => { for (let m = 0; m < 64; m++) { const s = [...Array(n).keys()].map((i) => (m >> i) & 1); if (s.filter(Boolean).length === nF) full.push({ g, s }); } });
    const nm = (i) => P[i];
    const cands = [];
    for (let a = 0; a < n; a++) {
      cands.push({ w: 3, ok: (x) => x.g[a] === hg[a], t: G.is(nm(a), vals[hg[a]]) });
      const nv = pick([0, 1, 2].filter((v) => v !== hg[a]));
      cands.push({ w: 1, ok: (x) => x.g[a] !== nv, t: G.not(nm(a), vals[nv]) });
      cands.push({ w: 2, ok: (x) => x.s[a] === hs[a], t: hs[a] ? T(`${nm(a).hi} एक महिला है।`, `${nm(a).en} is a lady.`) : T(`${nm(a).hi} एक पुरुष है।`, `${nm(a).en} is a man.`) });
      for (let b = a + 1; b < n; b++) {
        if (hg[a] === hg[b]) cands.push({ w: 1, ok: (x) => x.g[a] === x.g[b], t: G.same(nm(a), nm(b)) });
        else cands.push({ w: 1, ok: (x) => x.g[a] !== x.g[b], t: G.diff(nm(a), nm(b)) });
        if (hs[a] !== hs[b]) cands.push({ w: 1, ok: (x) => x.s[a] !== x.s[b], t: T(`${nm(a).hi} और ${nm(b).hi} में से एक पुरुष और एक महिला है।`, `Of ${nm(a).en} and ${nm(b).en}, one is a man and the other a lady.`) });
      }
    }
    vals.forEach((v, vi) => {
      const g = [...Array(n).keys()].filter((i) => hg[i] === vi), f = g.filter((i) => hs[i]).length;
      if (f === 0) cands.push({ w: 1, ok: (x) => x.g.every((gg, i) => gg !== vi || !x.s[i]), t: G.noLady(v) });
      if (f === 2) cands.push({ w: 1, ok: (x) => x.g.every((gg, i) => gg !== vi || x.s[i]), t: G.bothLady(v) });
    });
    const clues = solveClues(full, shuffle(cands).sort((a, b) => a.w - b.w));
    if (!clues || clues.length < 5) return null;
    const intro = T(`छह व्यक्ति ${listOf(P).hi} हैं, जिनमें ${NUM_HI[nF]} महिलाएँ हैं। ${G.intro.hi}`, `There are six persons ${listOf(P).en}, of whom ${NUM_EN[nF]} are ladies. ${G.intro.en}`);
    const Q = [];
    const x = rnd(n);
    Q.push(['moderate', G.ask(nm(x)), opts(vals[hg[x]], vals.filter((_, i) => i !== hg[x]).concat([T('निश्चित नहीं', 'Cannot be determined')]))]);
    const v = rnd(3), two = [...Array(n).keys()].filter((i) => hg[i] === v);
    const pairT = (a, b) => T(`${nm(a).hi}, ${nm(b).hi}`, `${nm(a).en}, ${nm(b).en}`);
    const wp = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (!(hg[a] === v && hg[b] === v)) wp.push(pairT(a, b));
    Q.push(['moderate', G.plural(vals[v]), opts(pairT(two[0], two[1]), wp)]);
    const ladies = [...Array(n).keys()].filter((i) => hs[i]);
    const groupT = (ids) => T(ids.map((i) => nm(i).hi).join(', '), ids.map((i) => nm(i).en).join(', '));
    const wl = []; for (let t = 0; t < 30; t++) { const ids = shuffle([...Array(n).keys()]).slice(0, nF).sort(); if (ids.join() !== ladies.join()) wl.push(groupT(ids)); }
    Q.push(['moderate', T('महिलाएँ कौन-कौन हैं?', 'Who are the ladies?'), opts(groupT(ladies), wl)]);
    const y = pick([...Array(n).keys()].filter((i) => i !== x)), partner = [...Array(n).keys()].find((i) => i !== y && hg[i] === hg[y]);
    Q.push(['moderate', T(`${nm(y).hi} के समान ${G.w.hi} किसका है?`, `Who has the same ${G.w.en} as ${nm(y).en}?`), opts(nm(partner), P.filter((_, i) => i !== partner && i !== y))]);
    const sx = (i) => (hs[i] ? T('महिला', 'Lady') : T('पुरुष', 'Man'));
    const line = (i, g, s) => T(`${nm(i).hi} – ${s.hi} – ${vals[g].hi}`, `${nm(i).en} – ${s.en} – ${vals[g].en}`);
    const wrongI = rnd(n), wrong = rnd(2) ? line(wrongI, (hg[wrongI] + 1 + rnd(2)) % 3, sx(wrongI)) : line(wrongI, hg[wrongI], hs[wrongI] ? T('पुरुष', 'Man') : T('महिला', 'Lady'));
    const rights = shuffle([...Array(n).keys()].filter((i) => i !== wrongI)).slice(0, 3).map((i) => line(i, hg[i], sx(i)));
    const all = shuffle(rights.concat([wrong]));
    Q.push(['hard', T('निम्नलिखित में से कौन-सा सही नहीं है?', 'Which of the following is not correct?'), { options: all, answer: all.indexOf(wrong) }]);
    const expl = T('हल: ' + P.map((p, i) => `${p.hi} – ${sx(i).hi} – ${vals[hg[i]].hi}`).join('; '), 'Solution: ' + P.map((p, i) => `${p.en} – ${sx(i).en} – ${vals[hg[i]].en}`).join('; '));
    return { kind: 'grouping', intro, clues, Q, expl };
  }

  const KINDS = { seating, ranking, grouping };
  /* five linked MAT questions sharing one passage; returns [] if no set could be made */
  function passageSet(kind) {
    const k = kind || pick(Object.keys(KINDS));
    for (let t = 0; t < 60; t++) {
      const s = KINDS[k]();
      if (!s || s.Q.some((q) => !q[2])) continue;
      const head = T(s.intro.hi + ' ' + s.clues.map((c) => c.t.hi).join(' '), s.intro.en + ' ' + s.clues.map((c) => c.t.en).join(' '));
      const setId = 'pas_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      return s.Q.map(([difficulty, q, o], i) => U.normQuestion({
        id: setId + '_' + (i + 1), setId, subject: 'mat', difficulty, topic: 'Reasoning passage · ' + k, cat: 'passage', gen: 'passage', source: 'generated',
        q: T(head.hi + '\n' + q.hi, head.en + '\n' + q.en), options: o.options, answer: o.answer, explanation: s.expl
      }));
    }
    return [];
  }

  window.PASSAGE = { passageSet, kinds: Object.keys(KINDS) };
})();
