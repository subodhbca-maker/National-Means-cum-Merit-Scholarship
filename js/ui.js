/* Basic Pathshala - NMMS : shared UI widgets */
(function () {
  const { esc, txt, DIFF, SUBJECTS } = U;

  function badges(q) {
    const s = SUBJECTS[q.section || q.subject] || SUBJECTS.other;
    let b = `<span class="badge">${esc(s.hi)}</span><span class="badge ${DIFF[q.difficulty].cls}">${DIFF[q.difficulty].hi} · ${DIFF[q.difficulty].en}</span>`;
    if (q.source === 'pyq') b += `<span class="badge b-pyq">PYQ ${q.year || ''}</span>`;
    if (q.source === 'ai') b += '<span class="badge b-ai">AI</span>';
    if (q.topic && q.source !== 'pyq') b += `<span class="badge">${esc(q.topic)}</span>`;
    if (q.hasFigure && !q.image) b += '<span class="badge b-hard">चित्र आवश्यक</span>';
    return b;
  }

  function biHtml(t, lang) {
    if (!t) return '';
    const hi = (t.hi || '').trim(), en = (t.en || '').trim();
    if (lang === 'hi') return esc(hi || en);
    if (lang === 'en') return esc(en || hi);
    return esc(hi || en) + (hi && en && hi !== en ? `<span class="en">${esc(en)}</span>` : '');
  }

  /* opts: { no, lang, showAnswer, actions:html, selectable } */
  function qCard(q, opts) {
    opts = opts || {};
    const lang = opts.lang || 'bi';
    const optsHtml = q.options.map((o, i) => `<div class="${opts.showAnswer !== false && i === q.answer ? 'ok' : ''}"><b>${i + 1})</b> ${biHtml(o, lang)}</div>`).join('');
    const ex = opts.showAnswer !== false && txt(q.explanation, lang === 'en' ? 'en' : 'hi') ? `<div class="ex">💡 ${esc(txt(q.explanation, lang === 'en' ? 'en' : 'hi'))}</div>` : '';
    return `<div class="qcard" data-id="${esc(q.id)}">
      <div class="qh">${opts.selectable ? `<input type="checkbox" class="qsel" data-id="${esc(q.id)}">` : ''}${opts.no != null ? `<span class="no">Q${opts.no}</span>` : ''}${badges(q)}<span class="sp"></span>${opts.actions || ''}</div>
      <div class="qt">${biHtml(q.q, lang)}</div>
      ${q.image ? `<img class="qimg" src="${q.image}" alt="">` : ''}
      <div class="opts">${optsHtml}</div>${q.answer < 0 ? '<div class="ex" style="color:#a52929">⚠ सही उत्तर सेट नहीं है</div>' : ''}${ex}
    </div>`;
  }

  function distBar(st) {
    const t = st.total || 1;
    const p = (n) => Math.round((n / t) * 100);
    return `<div class="dist"><i class="e" style="width:${(st.easy / t) * 100}%"></i><i class="m" style="width:${(st.moderate / t) * 100}%"></i><i class="h" style="width:${(st.hard / t) * 100}%"></i></div>
      <div class="legend"><span>🟢 सरल <b>${st.easy}</b> (${p(st.easy)}%)</span><span>🔵 मध्यम <b>${st.moderate}</b> (${p(st.moderate)}%)</span><span>🔴 कठिन <b>${st.hard}</b> (${p(st.hard)}%)</span></div>`;
  }

  function seg(name, items, value) {
    return `<div class="seg" data-seg="${name}">${items.map(([v, l]) => `<button type="button" data-v="${v}" class="${v === value ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  }
  function bindSeg(root, name, cb) {
    const el = root.querySelector(`[data-seg="${name}"]`);
    if (!el) return;
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      cb(b.dataset.v);
    });
  }
  function segVal(root, name) { const b = root.querySelector(`[data-seg="${name}"] button.on`); return b ? b.dataset.v : null; }

  const LANGS = [['bi', 'हिंदी + English'], ['hi', 'केवल हिंदी'], ['en', 'English only']];
  const subjOptions = (sel, withAll) => (withAll ? '<option value="">सभी विषय / All</option>' : '') + Object.keys(SUBJECTS).map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${SUBJECTS[k].hi} / ${SUBJECTS[k].en}</option>`).join('');
  const diffOptions = (sel, withAll) => (withAll ? '<option value="">सभी स्तर / All</option>' : '') + Object.keys(DIFF).map((k) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${DIFF[k].hi} / ${DIFF[k].en}</option>`).join('');

  /* full question editor; resolves to the edited question or null */
  async function editQuestion(q) {
    q = U.normQuestion(q || { subject: 'mat', difficulty: 'easy', source: 'manual' });
    let image = q.image || '';
    const optRow = (i) => `<div class="row" style="margin-bottom:6px"><label class="check" style="flex:0 0 auto"><input type="radio" name="ans" value="${i}" ${q.answer === i ? 'checked' : ''}> ${i + 1})</label>
      <input type="text" data-o="${i}" data-l="hi" placeholder="विकल्प ${i + 1} (हिंदी)" value="${esc(q.options[i].hi)}">
      <input type="text" data-o="${i}" data-l="en" placeholder="Option ${i + 1} (English)" value="${esc(q.options[i].en)}"></div>`;
    const html = `<div class="row" style="margin-bottom:10px">
        <label class="f">विषय / Subject<select id="e_sub">${subjOptions(q.subject)}</select></label>
        <label class="f">कठिनाई / Difficulty<select id="e_diff">${diffOptions(q.difficulty)}</select></label>
        <label class="f">टॉपिक / Topic<input type="text" id="e_topic" value="${esc(q.topic)}"></label></div>
      <label class="f">प्रश्न (हिंदी)<textarea id="e_qhi" rows="3">${esc(q.q.hi)}</textarea></label>
      <label class="f" style="margin-top:8px">Question (English)<textarea id="e_qen" rows="3">${esc(q.q.en)}</textarea></label>
      <div style="margin:12px 0 4px;font-weight:700;font-size:13px">विकल्प — सही उत्तर पर ● लगाएँ / Options — select the correct one</div>
      ${[0, 1, 2, 3].map(optRow).join('')}
      <div class="row" style="margin-top:8px"><label class="f">व्याख्या (हिंदी)<input type="text" id="e_xhi" value="${esc(q.explanation.hi)}"></label><label class="f">Explanation (English)<input type="text" id="e_xen" value="${esc(q.explanation.en)}"></label></div>
      <div style="margin-top:10px" class="btns"><label class="btn sm">🖼️ चित्र जोड़ें / Add figure<input type="file" accept="image/*" id="e_img" hidden></label><button type="button" class="btn sm danger ${image ? '' : 'hide'}" id="e_imgdel">चित्र हटाएँ</button></div>
      <img id="e_prev" src="${image}" style="max-height:160px;margin-top:8px;${image ? '' : 'display:none'}">`;
    const out = await U.modal(q.createdAt && q.q.hi + q.q.en ? 'प्रश्न संपादित करें / Edit question' : 'नया प्रश्न / New question', html, [
      { label: 'रद्द / Cancel', value: null },
      { label: 'सेव करें / Save', cls: 'primary', value: 'save', onClick: (w) => {
        const qhi = w.querySelector('#e_qhi').value.trim(), qen = w.querySelector('#e_qen').value.trim();
        if (!qhi && !qen) { U.toast('प्रश्न लिखें', 'err'); return false; }
        if (!w.querySelector('input[name=ans]:checked')) { U.toast('सही उत्तर चुनें', 'err'); return false; }
      } }
    ], { wide: true, onOpen: (w) => {
      w.querySelector('#e_img').onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        image = await U.shrinkImage(await U.readFile(f), 900);
        const p = w.querySelector('#e_prev'); p.src = image; p.style.display = '';
        w.querySelector('#e_imgdel').classList.remove('hide');
      };
      w.querySelector('#e_imgdel').onclick = () => { image = ''; w.querySelector('#e_prev').style.display = 'none'; w.querySelector('#e_imgdel').classList.add('hide'); };
      editQuestion._w = w;
    } });
    if (out !== 'save') return null;
    const w = editQuestion._w;
    const g = (s) => w.querySelector(s).value.trim();
    const res = Object.assign({}, q, {
      subject: g('#e_sub'), difficulty: g('#e_diff'), topic: g('#e_topic'),
      q: { hi: g('#e_qhi'), en: g('#e_qen') },
      options: [0, 1, 2, 3].map((i) => ({ hi: w.querySelector(`[data-o="${i}"][data-l="hi"]`).value.trim(), en: w.querySelector(`[data-o="${i}"][data-l="en"]`).value.trim() })),
      answer: Number(w.querySelector('input[name=ans]:checked').value),
      explanation: { hi: g('#e_xhi'), en: g('#e_xen') },
      image
    });
    if (!res.q.hi) res.q.hi = res.q.en; if (!res.q.en) res.q.en = res.q.hi;
    res.options.forEach((o) => { if (!o.hi) o.hi = o.en; if (!o.en) o.en = o.hi; });
    return U.normQuestion(res);
  }

  function pager(total, page, size) {
    const pages = Math.max(1, Math.ceil(total / size));
    if (pages <= 1) return '';
    return `<div class="btns" style="justify-content:center;margin-top:10px"><button class="btn sm" data-pg="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹ पिछला</button><span class="muted">पृष्ठ ${page} / ${pages}</span><button class="btn sm" data-pg="${page + 1}" ${page >= pages ? 'disabled' : ''}>अगला ›</button></div>`;
  }

  window.UI = { badges, biHtml, qCard, distBar, seg, bindSeg, segVal, LANGS, subjOptions, diffOptions, editQuestion, pager };
})();
