/* Basic Pathshala - NMMS : import any PDF / image / text → review → bank, paper, PPT, Google Form */
(function () {
  const { esc } = U;
  const PAGES = (window.PAGES = window.PAGES || {});
  const state = { list: [], files: [], title: '' };

  PAGES.import = {
    title: 'PDF से आयात · Import',
    async render(v) {
      const key = await AI.hasKey();
      v.innerHTML = `<div class="card"><h2>📥 कोई भी प्रश्न-पत्र लाएँ <small>PDF · फ़ोटो · टेक्स्ट, किसी भी परीक्षा का</small></h2>
        <div class="sub">प्रश्न निकलकर हिंदी + English में बनेंगे, उत्तर व कठिनाई (सरल/मध्यम/कठिन) के साथ। फिर एक क्लिक में PPT, Google Form, OMR या मॉक टेस्ट बनाएँ।</div>
        <div style="margin-bottom:12px">${UI.seg('mode', [['ai', '✨ Gemini AI (स्कैन PDF भी)'], ['text', '📄 टेक्स्ट PDF (ऑफ़लाइन)'], ['paste', '📋 टेक्स्ट paste']], key ? 'ai' : 'text')}</div>
        <div id="m_ai_note" class="note ${key ? 'hide' : ''}">Gemini key नहीं है। स्कैन किए गए / हिंदी PDF के लिए <a href="#/settings">Settings</a> में key डालें। तब तक टेक्स्ट वाले PDF ऑफ़लाइन पढ़ सकते हैं।</div>
        <div id="dropBox" class="drop"><i>📄</i><b>PDF या फ़ोटो यहाँ छोड़ें, या क्लिक करें</b><span class="muted">एक साथ कई फ़ाइलें · अधिकतम 19 MB प्रति फ़ाइल</span>
          <input type="file" id="fin" accept="application/pdf,image/*" multiple hidden></div>
        <div id="pasteBox" class="hide"><textarea id="ptxt" rows="10" placeholder="1. प्रश्न…\n(1) विकल्प (2) विकल्प (3) विकल्प (4) विकल्प\nउत्तर: 2"></textarea><div class="btns" style="margin-top:8px"><button class="btn primary" id="pgo">प्रश्न निकालें</button></div></div>
        <label class="check" id="trBox" style="margin-top:12px"><input type="checkbox" id="tr" checked> जो भाषा न हो उसका अनुवाद करें (हिंदी ↔ English)</label>
        <div id="prog" class="hide" style="margin-top:14px"><div class="btns" style="margin-bottom:6px"><span class="spin"></span><span id="ptext">पढ़ रहे हैं…</span></div><div class="progress"><i id="pbar"></i></div></div>
      </div><div id="rev"></div>`;
      const drop = v.querySelector('#dropBox'), fin = v.querySelector('#fin');
      const setMode = (m) => {
        drop.classList.toggle('hide', m === 'paste');
        v.querySelector('#pasteBox').classList.toggle('hide', m !== 'paste');
        v.querySelector('#m_ai_note').classList.toggle('hide', m !== 'ai' || key);
        v.querySelector('#trBox').classList.toggle('hide', m !== 'ai');
      };
      UI.bindSeg(v, 'mode', setMode); setMode(UI.segVal(v, 'mode'));
      drop.onclick = () => fin.click();
      drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
      drop.ondragleave = () => drop.classList.remove('over');
      drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); handle(Array.from(e.dataTransfer.files)); };
      fin.onchange = () => handle(Array.from(fin.files));
      v.querySelector('#pgo').onclick = () => {
        const qs = AI.parseText('\n' + v.querySelector('#ptxt').value);
        if (!qs.length) return U.toast('कोई प्रश्न पहचान में नहीं आया। प्रारूप देखें।', 'err');
        state.list = qs; state.files = []; state.title = 'आयातित प्रश्न';
        review(v.querySelector('#rev'));
      };

      async function handle(files) {
        files = files.filter((f) => /pdf|image/.test(f.type) || /\.pdf$/i.test(f.name));
        if (!files.length) return;
        const mode = UI.segVal(v, 'mode');
        const prog = v.querySelector('#prog'), ptext = v.querySelector('#ptext'), pbar = v.querySelector('#pbar');
        prog.classList.remove('hide');
        const out = [];
        state.files = files;
        state.title = files[0].name.replace(/\.[^.]+$/, '');
        try {
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            ptext.textContent = `${f.name} (${i + 1}/${files.length}) पढ़ रहे हैं…`;
            pbar.style.width = Math.round((i / files.length) * 100) + '%';
            if (mode === 'ai') {
              const qs = await AI.extractFromFile(f, { translate: v.querySelector('#tr').checked }, (n) => { ptext.textContent = `${f.name}: ${n} प्रश्न मिले… (बड़े पेपर में 1–3 मिनट लग सकते हैं)`; });
              qs.forEach((q) => { q.fileIndex = i; });
              out.push(...qs);
            } else {
              if (!/pdf/i.test(f.type) && !/\.pdf$/i.test(f.name)) { U.toast(f.name + ': फ़ोटो के लिए Gemini AI मोड चाहिए', 'err'); continue; }
              const text = await AI.pdfText(f);
              if (text.replace(/\s/g, '').length < 50) { U.toast(f.name + ': इसमें टेक्स्ट नहीं है (स्कैन PDF)। Gemini AI मोड चुनें।', 'err'); continue; }
              const qs = AI.parseText(text);
              qs.forEach((q) => { q.fileIndex = i; });
              out.push(...qs);
            }
          }
          pbar.style.width = '100%';
          if (!out.length) { U.toast('कोई प्रश्न नहीं मिला', 'err'); prog.classList.add('hide'); return; }
          state.list = out;
          U.toast(`${out.length} प्रश्न निकाले गए ✔`, 'ok');
          review(v.querySelector('#rev'));
        } catch (e) { console.error(e); U.toast(e.message, 'err'); }
        prog.classList.add('hide');
      }
      if (state.list.length) review(v.querySelector('#rev'));
    }
  };

  function review(box) {
    let lang = 'bi';
    const draw = () => {
      const st = PAPER.stats(state.list);
      const noAns = state.list.filter((q) => q.answer < 0).length;
      const fig = state.list.filter((q) => q.hasFigure && !q.image).length;
      box.innerHTML = `<div class="card"><h2>🔍 समीक्षा <small>${state.list.length} प्रश्न</small></h2>
        ${UI.distBar(st)}
        ${noAns ? `<div class="note" style="margin-top:12px">⚠ ${noAns} प्रश्नों का उत्तर तय नहीं है। नीचे "उत्तर" में चुनें।</div>` : ''}
        ${fig ? `<div class="note" style="margin-top:12px">🖼️ ${fig} प्रश्न चित्र पर आधारित हैं। "✂️ चित्र" से PDF पेज से चित्र काटकर जोड़ें।</div>` : ''}
        <div class="row" style="margin-top:12px">
          <label class="f">पेपर का नाम<input type="text" id="rt" value="${esc(state.title)}"></label>
          <label class="f">सभी का विषय बदलें<select id="rsub"><option value="">— न बदलें —</option>${UI.subjOptions('')}</select></label>
          <div>${UI.seg('rl', UI.LANGS, lang)}</div></div>
        <div class="btns" style="margin-top:14px">
          <button class="btn primary" id="mkAs">📄 पेपर बनाएँ (जैसा है)</button>
          <button class="btn saff" id="mkBal">⚖️ संतुलित पेपर (40/40/20)</button>
          <button class="btn" id="svB">💾 सिर्फ़ बैंक में सेव</button>
          <button class="btn danger" id="clr">✕ साफ़ करें</button></div>
        <div class="muted" style="font-size:12.5px;margin-top:8px">पेपर बनने के बाद वहीं से PPT, Google Form, OMR, प्रिंट और मॉक टेस्ट मिलेंगे।</div></div>
        <div id="rlist">${state.list.map((q, i) => UI.qCard(q, { no: i + 1, lang, actions: `
          <select data-f="subject" data-i="${i}" style="width:auto;padding:4px 6px;font-size:12.5px">${UI.subjOptions(q.subject)}</select>
          <select data-f="difficulty" data-i="${i}" style="width:auto;padding:4px 6px;font-size:12.5px">${UI.diffOptions(q.difficulty)}</select>
          <select data-f="answer" data-i="${i}" style="width:auto;padding:4px 6px;font-size:12.5px"><option value="-1">उत्तर ?</option>${[0, 1, 2, 3].map((k) => `<option value="${k}" ${q.answer === k ? 'selected' : ''}>उत्तर ${k + 1}</option>`).join('')}</select>
          ${state.files[q.fileIndex] && /pdf/i.test(state.files[q.fileIndex].type) ? `<button class="btn sm" data-crop="${i}">✂️ चित्र</button>` : ''}
          <button class="btn sm" data-ed="${i}">✏️</button><button class="btn sm danger" data-rm="${i}">✕</button>` })).join('')}</div>`;
      UI.bindSeg(box, 'rl', (l) => { lang = l; draw(); });
      box.querySelector('#rt').oninput = (e) => { state.title = e.target.value; };
      box.querySelector('#rsub').onchange = (e) => { if (e.target.value) { state.list.forEach((q) => { q.subject = e.target.value; q.paper = U.SUBJECTS[q.subject].paper; }); draw(); } };
      box.querySelector('#clr').onclick = () => { state.list = []; box.innerHTML = ''; };
      box.querySelector('#svB').onclick = async () => { await DB.putMany('questions', state.list.map(clean)); U.toast(`${state.list.length} प्रश्न बैंक में सेव हुए`, 'ok'); };
      box.querySelector('#mkAs').onclick = async () => {
        await DB.putMany('questions', state.list.map(clean));
        const p = PAPER.makePaper({ title: state.title || 'आयातित पेपर', kind: 'IMPORT', questions: orderBySubject(state.list), lang, durationMin: Math.max(10, state.list.length) });
        await DB.put('papers', p); APP.go('#/paper/' + p.id);
      };
      box.querySelector('#mkBal').onclick = () => balancedDialog(lang);
    };
    box.onchange = (e) => {
      const s = e.target.closest('[data-f]'); if (!s) return;
      const q = state.list[+s.dataset.i];
      if (s.dataset.f === 'answer') q.answer = +s.value;
      else q[s.dataset.f] = s.value;
      if (s.dataset.f === 'subject') q.paper = U.SUBJECTS[q.subject].paper;
      if (s.dataset.f !== 'answer') draw();
    };
    box.onclick = async (e) => {
      const rm = e.target.closest('[data-rm]');
      if (rm) { state.list.splice(+rm.dataset.rm, 1); draw(); return; }
      const ed = e.target.closest('[data-ed]');
      if (ed) { const i = +ed.dataset.ed; const n = await UI.editQuestion(state.list[i]); if (n) { n.fileIndex = state.list[i].fileIndex; state.list[i] = n; draw(); } return; }
      const cr = e.target.closest('[data-crop]');
      if (cr) { const i = +cr.dataset.crop; const img = await cropFromPdf(state.files[state.list[i].fileIndex]); if (img) { state.list[i].image = img; draw(); } }
    };
    draw();
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const clean = (q) => { const c = Object.assign({}, q); delete c.fileIndex; return c; };
  const ORDER = { mat: 0, science: 1, sst: 2, maths: 3, other: 4 };
  const orderBySubject = (list) => list.map((q, i) => [q, i]).sort((a, b) => ORDER[a[0].subject] - ORDER[b[0].subject] || a[1] - b[1]).map((x) => clean(x[0]));

  async function balancedDialog(lang) {
    const key = await AI.hasKey();
    const n0 = Math.min(state.list.length, 50);
    const r = await U.modal('संतुलित पेपर (40% सरल · 40% मध्यम · 20% कठिन)', `<p>आयात किए गए प्रश्नों से चुने गए अनुपात में पेपर बनेगा। किसी स्तर में प्रश्न कम हों तो ${key ? 'Gemini AI उसी विषय के नए प्रश्न बनाकर पूरा करेगा।' : 'MAT/गणित में generator से, बाकी में दूसरे स्तर से पूरे होंगे (AI के लिए Settings में Gemini key डालें)।'}</p>
      <div class="row"><label class="f">कुल प्रश्न<input type="number" id="bn" value="${n0}" min="5" max="180"></label><label class="f">सरल %<input type="number" id="be" value="40"></label><label class="f">मध्यम %<input type="number" id="bm" value="40"></label><label class="f">कठिन %<input type="number" id="bh" value="20"></label></div>
      ${key ? '<label class="check" style="margin-top:10px"><input type="checkbox" id="bai" checked> कमी होने पर AI से नए प्रश्न बनाएँ</label>' : ''}`,
    [{ label: 'रद्द', value: null }, { label: '⚖️ बनाएँ', cls: 'saff', value: 'go', onClick: (w) => {
      balancedDialog._o = { n: +w.querySelector('#bn').value || n0, ratio: { easy: +w.querySelector('#be').value, moderate: +w.querySelector('#bm').value, hard: +w.querySelector('#bh').value }, ai: key && w.querySelector('#bai').checked };
    } }]);
    if (r !== 'go') return;
    const o = balancedDialog._o;
    const need = U.splitDifficulty(o.n, o.ratio);
    const chosen = [], warn = [];
    const used = new Set();
    const subjCount = {}; state.list.forEach((q) => { subjCount[q.subject] = (subjCount[q.subject] || 0) + 1; });
    const mainSubj = Object.keys(subjCount).sort((a, b) => subjCount[b] - subjCount[a])[0] || 'other';
    U.toast('पेपर बन रहा है…');
    for (const d of ['easy', 'moderate', 'hard']) {
      const pool = state.list.filter((q) => q.difficulty === d && !used.has(q));
      const pick = PAPER.pickSpread(pool, need[d]);
      pick.forEach((q) => used.add(q));
      chosen.push(...pick);
      let short = need[d] - pick.length;
      if (short > 0 && o.ai) {
        try {
          const mix = { easy: d === 'easy' ? 100 : 0, moderate: d === 'moderate' ? 100 : 0, hard: d === 'hard' ? 100 : 0 };
          const extra = (await AI.generate({ subject: mainSubj, count: short, mix, similarTo: state.list.filter((q) => q.subject === mainSubj) })).slice(0, short);
          extra.forEach((q) => { q.difficulty = d; });
          chosen.push(...extra); short -= extra.length;
        } catch (e) { warn.push('AI: ' + e.message); }
      }
      if (short > 0 && (mainSubj === 'mat' || mainSubj === 'maths')) { chosen.push(...GEN.many(mainSubj, d, short)); short = 0; }
      if (short > 0) {
        const rest = state.list.filter((q) => !used.has(q));
        const ex = PAPER.pickSpread(rest, short); ex.forEach((q) => used.add(q)); chosen.push(...ex);
        warn.push(`${U.DIFF[d].hi}: ${short} प्रश्न कम थे — दूसरे स्तर से लिए गए`);
      }
    }
    await DB.putMany('questions', chosen.map(clean));
    const p = PAPER.makePaper({ title: (state.title || 'आयातित पेपर') + ' (संतुलित)', kind: 'IMPORT', questions: orderBySubject(chosen), lang, durationMin: Math.max(10, chosen.length), ratio: o.ratio });
    await DB.put('papers', p);
    if (warn.length) sessionStorage.setItem('bp_warn_' + p.id, JSON.stringify(warn));
    APP.go('#/paper/' + p.id);
  }

  /* render a PDF page and let the user drag a rectangle to cut out a figure */
  async function cropFromPdf(file) {
    if (!file || !window.pdfjsLib) return null;
    const pdf = await pdfjsLib.getDocument({ data: await U.readFile(file, 'buffer') }).promise;
    let pageNo = 1, rect = null, canvas = null;
    const html = `<div class="btns" style="margin-bottom:8px"><button class="btn sm" id="cpv">‹</button><span>पेज <input type="number" id="cpn" value="1" min="1" max="${pdf.numPages}" style="width:70px;display:inline-block"> / ${pdf.numPages}</span><button class="btn sm" id="cnx">›</button><span class="muted">चित्र के चारों ओर माउस/उँगली से खींचें</span></div>
      <div class="crop-wrap" id="cw"><canvas id="cc"></canvas><div class="crop-box hide" id="cb"></div></div>`;
    const res = await U.modal('PDF से चित्र काटें', html, [{ label: 'रद्द', value: null }, { label: '✂️ जोड़ें', cls: 'primary', value: 'ok', onClick: () => { if (!rect) { U.toast('पहले एक हिस्सा चुनें'); return false; } } }], { wide: true, onOpen: (w) => {
      canvas = w.querySelector('#cc');
      const box = w.querySelector('#cb'), wrap = w.querySelector('#cw');
      const render = async () => {
        const page = await pdf.getPage(pageNo);
        const vp = page.getViewport({ scale: 2 });
        canvas.width = vp.width; canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        rect = null; box.classList.add('hide');
      };
      const go = (n) => { pageNo = Math.min(pdf.numPages, Math.max(1, n)); w.querySelector('#cpn').value = pageNo; render(); };
      w.querySelector('#cpv').onclick = () => go(pageNo - 1);
      w.querySelector('#cnx').onclick = () => go(pageNo + 1);
      w.querySelector('#cpn').onchange = (e) => go(+e.target.value);
      let start = null;
      const pt = (e) => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return [Math.max(0, Math.min(r.width, p.clientX - r.left)), Math.max(0, Math.min(r.height, p.clientY - r.top))]; };
      const show = (a, b) => { const x = Math.min(a[0], b[0]), y = Math.min(a[1], b[1]), ww = Math.abs(a[0] - b[0]), hh = Math.abs(a[1] - b[1]); Object.assign(box.style, { left: x + 'px', top: y + 'px', width: ww + 'px', height: hh + 'px' }); box.classList.remove('hide'); const s = canvas.width / canvas.getBoundingClientRect().width; rect = ww > 5 && hh > 5 ? [x * s, y * s, ww * s, hh * s] : null; };
      const down = (e) => { e.preventDefault(); start = pt(e); };
      const move = (e) => { if (start) { e.preventDefault(); show(start, pt(e)); } };
      const up = () => { start = null; };
      wrap.addEventListener('mousedown', down); wrap.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
      wrap.addEventListener('touchstart', down, { passive: false }); wrap.addEventListener('touchmove', move, { passive: false }); wrap.addEventListener('touchend', up);
      render();
    } });
    if (res !== 'ok' || !rect) return null;
    const c = document.createElement('canvas');
    c.width = Math.round(rect[2]); c.height = Math.round(rect[3]);
    c.getContext('2d').drawImage(canvas, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]);
    return U.shrinkImage(c.toDataURL('image/png'), 900);
  }
})();
