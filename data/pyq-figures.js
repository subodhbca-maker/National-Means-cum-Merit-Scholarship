/* UP NMMS 2023–2025 previous-year questions that need a figure: Venn diagram sets, letter gap series,
   numbers in overlapping figures and missing-number figures. Figures are redrawn as clean SVG from the
   scanned booklets; every answer below was checked (letter gaps by brute force, regions by point-in-shape tests). */
(function () {
  const { bi } = U;
  const T = FIG.text;
  const opt = (arr) => arr.map((o) => (Array.isArray(o) ? { hi: o[0], en: o[1] } : { hi: String(o), en: String(o) }));
  const out = [];
  const add = (year, no, cat, difficulty, q, options, answer, extra) => out.push(Object.assign({
    id: `pyq_up${year}_${no}`, subject: 'mat', difficulty, cat, topic: `UP NMMS ${year} · Q${no}`, q, options: opt(options), answer: answer - 1,
    source: 'pyq', year, explanation: { hi: '', en: '' }
  }, extra || {}));

  /* ---------- Venn diagram sets (direction figure redrawn, questions as in the booklet) ---------- */
  const VQ = ['नीचे दिए गए आरेखों में से कौन-सा आरेख इन तीन शब्दों के संबंध को दर्शाता है?', 'Which of the diagrams shows the relationship among these three words?'];
  const venn = (year, set, rows) => {
    const fig = FIG.vennSet(set);
    rows.forEach(([no, hi, en, options, ans, d]) => add(year, no, 'venn', d || 'easy', bi(`${VQ[0]}\n${hi}`, `${VQ[1]}\n${en}`), options, ans, { figure: fig }));
  };
  venn(2023, ['two_in_one', 'chain3', 'nest2_sep1', 'int2_in_one'], [
    [78, 'हिरण, खरगोश, स्तनीय जन्तु', 'Deer, Rabbit, Mammal', [3, 1, 4, 2], 2],
    [79, 'मानव, शिक्षक, स्नातक', 'Human beings, Teachers, Graduates', [2, 3, 4, 1], 3, 'moderate'],
    [80, 'बाघ, लोमड़ी, मांसाहारी', 'Tiger, Fox, Carnivorous', [2, 3, 4, 1], 4],
    [81, 'फूल, कपड़ा, सफ़ेद', 'Flowers, Cloth, White', [4, 1, 2, 3], 3, 'hard'],
    [82, 'इंजीनियर, डॉक्टर, लोग', 'Engineer, Doctor, People', [3, 4, 2, 1], 4],
    [85, 'कुत्ता, जानवर, पालतू', 'Dog, Animal, Pet', [3, 4, 1, 2], 2, 'moderate']
  ]);
  venn(2024, ['nest3', 'two_in_one', 'nest2_sep1', 'sep3tri'], [
    [78, 'सप्ताह, दिन, वर्ष', 'Week, Day, Year', [3, 2, 1, 4], 3],
    [79, 'वाहन, बस, कार', 'Vehicle, Bus, Car', [2, 1, 4, 3], 1],
    [80, 'न्यायाधीश, चोर, अपराधी', 'Judge, Thief, Criminal', [2, 3, 4, 1], 2, 'moderate'],
    [81, 'सरसों, जौ, आलू', 'Mustard, Barley, Potato', [4, 3, 2, 1], 1, 'moderate'],
    [82, 'गुलदस्ता, फूल, पंखुड़ी', 'Bouquet, Flowers, Petals', [2, 1, 4, 3], 2],
    [83, 'अणु, प्रोटॉन, इलेक्ट्रॉन', 'Atom, Proton, Electron', [4, 1, 2, 3], 3, 'moderate'],
    [85, 'टीचर, कॉलेज, स्टूडेंट', 'Teacher, College, Student', [1, 2, 3, 4], 2]
  ]);
  venn(2025, ['nest3', 'two_in_one', 'int2_in_one', 'nest2_sep1'], [
    [71, 'आलूबुखारा, आलू, फल', 'Plums, Potato, Fruits', [2, 4, 3, 1], 2, 'moderate'],
    [72, 'लोग, इंजीनियर, डॉक्टर', 'People, Engineer, Doctor', [3, 4, 2, 1], 3],
    [74, 'ग्रह, बुध, मंगल', 'Planets, Mercury, Mars', [2, 1, 4, 3], 1],
    [75, 'गुलदस्ता, फूल, पंखुड़ी', 'Bouquet, Flowers, Petals', [3, 1, 4, 2], 2],
    [76, 'चना, फली, मटर', 'Grams, Legume, Peas', [2, 4, 1, 3], 1, 'moderate'],
    [77, 'पृथ्वी, पर्वत, जंगल', 'Earth, Mountains, Forests', [1, 3, 4, 2], 2, 'hard'],
    [78, 'जीवविज्ञान, वनस्पति विज्ञान, जन्तु विज्ञान', 'Biology, Botany, Zoology', [4, 1, 2, 3], 3]
  ]);

  /* ---------- letter gap series (text) ---------- */
  const GQ = ['श्रेणी के रिक्त स्थानों में क्रम से कौन-से अक्षर आएँगे?', 'Which letters, in order, complete the series?'];
  [
    [2023, 72, 'gfe_ig_eii_fei_gf_ii', ['eifgi', 'figie', 'ifgie', 'ifige'], 3, 'moderate'],
    [2023, 73, 'b_b_bb__bbb_bb_b', ['bbbbba', 'bbaaab', 'ababab', 'aabaab'], 3, 'hard'],
    [2023, 74, 'c_bba_cab_ac_ab_ac', ['abcbc', 'acbcb', 'babcc', 'bcacb'], 2, 'moderate'],
    [2023, 75, 'a_bbc_aab_cca_bbcc', ['bacb', 'acba', 'abba', 'caba'], 2, 'moderate'],
    [2023, 77, 'bc_b_c_b_ccb', ['cbcb', 'bbcb', 'cbbc', 'bcbc'], 1, 'easy'],
    [2024, 70, '_ _ aba _ _ ba _ ab', ['abbba', 'abbab', 'baabb', 'bbaba'], 2, 'easy'],
    [2024, 71, 'ab _ _ baa _ _ ab _', ['aaaaa', 'aabaa', 'aabab', 'baabb'], 2, 'easy'],
    [2024, 72, 'm _ nm _ n _ an _ a _ ma _', ['aamnan', 'ammanm', 'aammnn', 'amammn'], 3, 'moderate'],
    [2024, 73, 'a _ ba _ b _ b _ a _ b', ['abaab', 'abbab', 'aabba', 'bbabb'], 4, 'moderate'],
    [2024, 74, '_ stt _ tt _ tts _', ['tsts', 'ttst', 'sstt', 'tsst'], 4, 'easy'],
    [2024, 75, '_ op _ mo _ n _ _ pnmop _', ['mnpmon', 'mpnmop', 'mnompn', 'mnpomn'], 1, 'hard'],
    [2024, 76, '_ nmmn _ mmnn _ mnnm _', ['nmmn', 'mnnm', 'nnmm', 'nmnm'], 3, 'moderate'],
    [2024, 77, '_ tu _ rt _ s _ _ usrtu _', ['rtusru', 'rsutrr', 'rsurtr', 'rsurts'], 4, 'hard'],
    [2025, 48, 'c_baa_aca_cacab_acac_bca', ['acbaa', 'bbcaa', 'bccab', 'cbaac'], 1, 'hard']
  ].forEach(([y, no, s, o, a, d]) => add(y, no, 'gap', d, bi(`${GQ[0]}\n${s}`, `${GQ[1]}\n${s}`), o, a));

  /* ---------- 2024 Q62–64: numbers in a triangle, a parallelogram and a square ---------- */
  const f24 = FIG.svg(330, 310, '<g fill="none" stroke="#000" stroke-width="2.4" transform="translate(-40 -125)"><polygon points="170,135 355,425 170,425"/><polygon points="125,210 283,215 220,425 60,425"/><rect x="80" y="265" width="125" height="115"/></g>' +
    [[2, 180, 190], [1, 140, 240], [4, 200, 240], [3, 258, 240], [5, 88, 285], [6, 140, 330], [7, 185, 322], [8, 232, 320], [5, 278, 383], [9, 72, 408], [2, 150, 410]].map(([n, x, y]) => T(x - 40, y - 125 + 7, n, 19, 'font-weight="bold"')).join(''));
  const D24 = ['नीचे दिए गए आरेख का अध्ययन कीजिए।', 'Study the diagram given below.'];
  [
    [62, 'कौन-सा नंबर तीनों आकृतियों के अंदर है?', 'Which number is inside all the three figures?', [2, 6, 7, 8], 3, 'easy'],
    [63, 'उन संख्याओं का योग क्या है जो केवल दो आकृतियों से सम्बन्धित हैं?', 'What is the sum of the numbers which belong to two figures only?', [10, 14, 18, 16], 3, 'moderate'],
    [64, 'तीनों आकृतियों से सम्बन्धित संख्या को केवल त्रिभुज से सम्बन्धित संख्याओं के योग से गुणा करो। परिणाम क्या होगा?', 'Multiply the number which belongs to all three figures by the sum of the numbers which belong to the triangle only. What is the result?', [14, 35, 49, 29], 3, 'hard']
  ].forEach(([no, hi, en, o, a, d]) => add(2024, no, 'figurenum', d, bi(`${D24[0]} ${hi}`, `${D24[1]} ${en}`), o, a, { figure: f24 }));

  /* ---------- 2025 Q61–65: wheat (rectangle), gram (square), maize (circle), rice (triangle) ---------- */
  const N25 = [[3, 530, 285], [4, 452, 338], [8, 568, 350], [2, 622, 330], [1, 700, 315], [5, 375, 380], [7, 548, 382], [9, 612, 382], [6, 538, 430], [10, 608, 430], [11, 578, 505]];
  const f25 = FIG.svg(660, 400, '<g fill="none" stroke="#000" stroke-width="2.4" transform="translate(-275 -150)"><rect x="295" y="305" width="290" height="145"/><rect x="462" y="362" width="173" height="173"/><circle cx="534" cy="362" r="127"/><polygon points="735,170 915,400 480,400"/></g>' +
    N25.map(([n, x, y]) => T(x - 275, y - 150 + 7, n, 19, 'font-weight="bold"')).join(''));
  const D25 = ['आकृति में आयत, वर्ग, वृत्त और त्रिभुज क्रमशः गेहूँ, चना, मक्का और चावल की खेती के क्षेत्र दर्शाते हैं।', 'In the figure, the rectangle, square, circle and triangle represent the regions of wheat, gram, maize and rice cultivation respectively.'];
  [
    [61, 'चारों वस्तुओं की खेती किस क्षेत्र में की जाती है?', 'Which area is cultivated by all the four commodities?', [7, 8, 9, 2], 1, 'easy'],
    [62, 'किस क्षेत्र में गेहूँ और मक्का (केवल) की खेती की जाती है?', 'Which area is cultivated by wheat and maize only?', [8, 6, 4, 5], 3, 'moderate'],
    [63, 'किस क्षेत्र में केवल चावल की खेती की जाती है?', 'Which area is cultivated by rice only?', [5, 1, 2, 11], 2, 'easy'],
    [64, 'किस क्षेत्र में केवल मक्का की खेती की जाती है?', 'Which area is cultivated by maize only?', [10, 2, 4, 3], 4, 'easy'],
    [65, 'किस क्षेत्र में चावल और मक्का की खेती होती है और कुछ नहीं?', 'Which area is cultivated by rice and maize and nothing else?', [9, 8, 2, 7], 3, 'hard']
  ].forEach(([no, hi, en, o, a, d]) => add(2025, no, 'figurenum', d, bi(`${D25[0]} ${hi}`, `${D25[1]} ${en}`), o, a, { figure: f25 }));

  /* ---------- 2025 Q69–70: missing number figures ---------- */
  const circ = (t, l, r, b, c) => ({ w: 120, h: 120, inner: '<circle cx="60" cy="60" r="27" fill="none" stroke="#000" stroke-width="2.2"/>' +
    T(60, 22, t, 17, 'font-weight="bold"') + T(16, 66, l, 17, 'font-weight="bold"') + T(104, 66, r, 17, 'font-weight="bold"') + T(60, 112, b, 17, 'font-weight="bold"') + T(60, 66, c, 17, 'font-weight="bold"') });
  const f69 = FIG.compose([circ(8, 2, 6, 6, 36), circ(7, 2, 5, 8, 46), circ(7, 4, 6, 10, '?')].map((c) => Object.assign(c, { noFrame: true })), null);
  add(2025, 69, 'figurenum', 'moderate', bi('आकृतियों में संख्याएँ एक विशेष नियम से दी गई हैं। प्रश्नचिह्न (?) के स्थान पर कौन-सी संख्या आएगी?', 'Numbers in the figures follow a certain rule. Which number replaces the question mark (?)?'), [42, 46, 48, 50], 2,
    { figure: f69, explanation: bi('ऊपर × नीचे − बाएँ × दाएँ: 8×6 − 2×6 = 36, 7×8 − 2×5 = 46, 7×10 − 4×6 = 46', 'Top × bottom − left × right: 8×6 − 2×6 = 36, 7×8 − 2×5 = 46, 7×10 − 4×6 = 46') });
  const cross = (a, b, c, d, m) => ({ w: 130, h: 110, noFrame: true, inner: '<g fill="none" stroke="#000" stroke-width="2.2"><ellipse cx="65" cy="55" rx="60" ry="26" transform="rotate(35 65 55)"/><ellipse cx="65" cy="55" rx="60" ry="26" transform="rotate(-35 65 55)"/></g>' +
    T(33, 30, a, 15, 'font-weight="bold"') + T(97, 30, b, 15, 'font-weight="bold"') + T(33, 92, c, 15, 'font-weight="bold"') + T(97, 92, d, 15, 'font-weight="bold"') + T(65, 61, m, 16, 'font-weight="bold"') });
  const f70 = FIG.compose([cross(56, 22, 15, 8, 41), cross(46, 10, 9, 6, 39), cross(34, 14, 11, 6, '?')], null);
  add(2025, 70, 'figurenum', 'hard', bi('आकृतियों में संख्याएँ एक विशेष नियम से दी गई हैं। प्रश्नचिह्न (?) के स्थान पर कौन-सी संख्या आएगी?', 'Numbers in the figures follow a certain rule. Which number replaces the question mark (?)?'), [12, 25, 48, 52], 2,
    { figure: f70, explanation: bi('(ऊपर-बाएँ − ऊपर-दाएँ) + (नीचे-बाएँ − नीचे-दाएँ): (56−22)+(15−8) = 41, (34−14)+(11−6) = 25', '(top-left − top-right) + (bottom-left − bottom-right): (56−22)+(15−8) = 41, (34−14)+(11−6) = 25') });

  window.PYQ_FIGURES = out;
})();
