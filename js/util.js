/* Basic Pathshala - NMMS : shared helpers */
(function () {
  const U = {};

  U.uid = (p = 'id') => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  U.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.$ = (sel, root) => (root || document).querySelector(sel);
  U.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  U.fmtDate = (t) => new Date(t).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  U.SUBJECTS = {
    mat: { hi: 'मानसिक योग्यता', en: 'Mental Ability', paper: 'MAT' },
    science: { hi: 'विज्ञान', en: 'Science', paper: 'SAT' },
    sst: { hi: 'सामाजिक अध्ययन', en: 'Social Studies', paper: 'SAT' },
    maths: { hi: 'गणित', en: 'Mathematics', paper: 'SAT' },
    other: { hi: 'अन्य', en: 'Other', paper: 'OTHER' }
  };
  U.DIFF = {
    easy: { hi: 'सरल', en: 'Easy', cls: 'b-easy' },
    moderate: { hi: 'मध्यम', en: 'Moderate', cls: 'b-mod' },
    hard: { hi: 'कठिन', en: 'Hard', cls: 'b-hard' }
  };

  /* 40% easy, 40% moderate, 20% hard (configurable) */
  U.splitDifficulty = (n, ratio) => {
    ratio = ratio || { easy: 40, moderate: 40, hard: 20 };
    const tot = ratio.easy + ratio.moderate + ratio.hard || 100;
    const easy = Math.round((n * ratio.easy) / tot);
    const hard = Math.round((n * ratio.hard) / tot);
    return { easy, moderate: Math.max(0, n - easy - hard), hard };
  };

  /* bilingual text helpers. lang: 'bi' | 'hi' | 'en' */
  U.txt = (t, lang) => {
    if (t == null) return '';
    if (typeof t === 'string') return t;
    const hi = (t.hi || '').trim(), en = (t.en || '').trim();
    if (lang === 'hi') return hi || en;
    if (lang === 'en') return en || hi;
    if (hi && en && hi !== en) return hi + ' / ' + en;
    return hi || en;
  };
  U.txtLines = (t, lang) => {
    if (t == null) return [];
    if (typeof t === 'string') return [t];
    const hi = (t.hi || '').trim(), en = (t.en || '').trim();
    if (lang === 'hi') return [hi || en];
    if (lang === 'en') return [en || hi];
    if (hi && en && hi !== en) return [hi, en];
    return [hi || en];
  };
  U.bi = (hi, en) => ({ hi: String(hi), en: String(en == null ? hi : en) });

  /* toast + modal */
  U.toast = (msg, type) => {
    let box = U.$('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.classList.add('show'), 10);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, type === 'err' ? 6000 : 3200);
  };

  U.modal = (title, html, buttons, opts) => new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal ${opts && opts.wide ? 'wide' : ''}"><div class="modal-h"><h3>${U.esc(title)}</h3><button class="icon-btn" data-x>✕</button></div><div class="modal-b">${html}</div><div class="modal-f"></div></div>`;
    const f = wrap.querySelector('.modal-f');
    (buttons || [{ label: 'OK', value: true, cls: 'primary' }]).forEach((b) => {
      const btn = document.createElement('button');
      btn.className = 'btn ' + (b.cls || '');
      btn.textContent = b.label;
      btn.onclick = () => {
        if (b.onClick && b.onClick(wrap) === false) return;
        close(b.value);
      };
      f.appendChild(btn);
    });
    function close(v) { wrap.remove(); resolve(v); }
    wrap.querySelector('[data-x]').onclick = () => close(null);
    wrap.addEventListener('mousedown', (e) => { if (e.target === wrap) close(null); });
    document.body.appendChild(wrap);
    if (opts && opts.onOpen) opts.onOpen(wrap);
  });
  U.confirm = (msg) => U.modal('पुष्टि करें / Confirm', `<p>${U.esc(msg)}</p>`, [
    { label: 'रद्द / Cancel', value: false }, { label: 'हाँ / Yes', value: true, cls: 'danger' }]);

  U.download = (name, data, mime) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  U.safeName = (s) => String(s || 'file').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 80);

  U.readFile = (file, as) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(r.error);
    if (as === 'text') r.readAsText(file);
    else if (as === 'buffer') r.readAsArrayBuffer(file);
    else r.readAsDataURL(file);
  });

  /* shrink an image data URL so the DB / PPT / form stay small */
  U.shrinkImage = (dataUrl, maxW) => new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, (maxW || 900) / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => res(dataUrl);
    img.src = dataUrl;
  });

  /* light validation / normalisation of a question object */
  U.normQuestion = (q) => {
    const o = Object.assign({}, q);
    o.id = o.id || U.uid('q');
    o.subject = U.SUBJECTS[o.subject] ? o.subject : 'other';
    o.paper = U.SUBJECTS[o.subject].paper;
    o.difficulty = U.DIFF[o.difficulty] ? o.difficulty : 'moderate';
    if (typeof o.q === 'string') o.q = { hi: o.q, en: o.q };
    o.q = o.q || { hi: '', en: '' };
    o.options = (o.options || []).slice(0, 4).map((x) => (typeof x === 'string' ? { hi: x, en: x } : (x || { hi: '', en: '' })));
    while (o.options.length < 4) o.options.push({ hi: '', en: '' });
    o.answer = Number.isInteger(o.answer) && o.answer >= 0 && o.answer < 4 ? o.answer : -1;
    if (typeof o.explanation === 'string') o.explanation = { hi: o.explanation, en: o.explanation };
    o.topic = o.topic || '';
    o.source = o.source || 'manual';
    o.used = o.used || 0;
    o.createdAt = o.createdAt || Date.now();
    return o;
  };

  /* sameness key so we don't store the same question twice */
  U.qKey = (q) => (U.txt(q.q, 'en') + '|' + q.options.map((o) => U.txt(o, 'en')).join('|')).toLowerCase().replace(/\s+/g, ' ').trim();

  window.U = U;
})();
