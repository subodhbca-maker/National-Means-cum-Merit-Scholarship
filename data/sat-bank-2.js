/* Helper for the second practice bank (data/sat-bank-2*.js). Rows are written with the correct option
   first; options are placed in a fixed pseudo-random order (seeded by the row id) so answers are spread
   over 1–4 and stay the same on every load. */
(function () {
  function seeded(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; };
  }
  window.BANK2_ROWS = (prefix, rows) => rows.map(([subject, difficulty, topic, hi, en, opts, ans, xh, xe], i) => {
    const id = prefix + '_' + i;
    const rnd = seeded(id + en);
    let options = opts.map((o) => (Array.isArray(o) ? { hi: o[0], en: o[1] } : { hi: o, en: o }));
    const correct = options[ans - 1];
    // purely numeric options (years, counts) are printed in ascending order, others in shuffled order
    const num = (o) => parseFloat(o.en.replace(/,/g, '').replace('−', '-'));
    if (options.every((o) => /^[\d.,\s/:°−-]+$/.test(o.en) && !isNaN(num(o)))) options.sort((a, b) => num(a) - num(b));
    else for (let k = options.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [options[k], options[j]] = [options[j], options[k]]; }
    return { id, subject, difficulty, topic, q: { hi, en }, options, answer: options.indexOf(correct), source: 'bank', explanation: { hi: xh || '', en: xe || '' } };
  });
})();
