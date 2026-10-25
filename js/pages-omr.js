/* Basic Pathshala - NMMS : OMR print + camera scan with teacher review */
(function () {
  const { esc } = U;
  const PAGES = (window.PAGES = window.PAGES || {});

  PAGES.omr = {
    title: 'OMR शीट · Print & Scan',
    async render(v, [tab, paperId]) {
      tab = tab === 'scan' ? 'scan' : 'print';
      const papers = (await DB.all('papers')).sort((a, b) => b.createdAt - a.createdAt);
      const sch = await EXPORT.school();
      v.innerHTML = `<div style="margin-bottom:14px">${UI.seg('tab', [['print', '🖨️ OMR प्रिंट करें'], ['scan', '📷 OMR स्कैन / जाँचें']], tab)}</div><div id="tb"></div>`;
      UI.bindSeg(v, 'tab', (t) => APP.go('#/omr/' + t + (paperId ? '/' + paperId : '')));
      const tb = v.querySelector('#tb');
      if (tab === 'print') {
        tb.innerHTML = `<div class="grid g2"><div class="card"><h2>🖨️ OMR उत्तर पत्रक <small>UP NMMS प्रारूप · 180 प्रश्न</small></h2>
            <div class="sub">भाग I (MAT) 1–90, भाग II (SAT) 91–180 · अनुक्रमांक 7 अंक · चारों कोनों पर काले निशान (स्कैन के लिए ज़रूरी)।</div>
            <label class="f">शीर्षक (वैकल्पिक)<input type="text" id="ot" placeholder="जैसे: मॉडल टेस्ट – 1"></label>
            <div class="row" style="margin-top:10px"><label class="f">प्रतियाँ<input type="number" id="oc" value="1" min="1" max="200"></label>
              <label class="f">रंग<select id="oi"><option value="#c2185b">गुलाबी (UP जैसा)</option><option value="#1e2a78">नीला</option><option value="#000000">काला (B/W प्रिंटर)</option></select></label></div>
            <div class="btns" style="margin-top:14px"><button class="btn primary lg" id="op">🖨️ प्रिंट / PDF</button></div>
            <div class="note blue" style="margin-top:14px">प्रिंट करते समय <b>Scale: 100% / Actual size</b> और <b>A4</b> रखें। विद्यार्थी गोले <b>काले/नीले बॉल पेन</b> से पूरे भरें।</div></div>
          <div class="card"><h2>पूर्वावलोकन <small>Preview</small></h2><div class="omr-preview" id="opv"></div></div></div>`;
        const pv = () => { tb.querySelector('#opv').innerHTML = OMR.svg({ school: sch.name, title: tb.querySelector('#ot').value, ink: tb.querySelector('#oi').value }); };
        tb.querySelector('#ot').oninput = pv; tb.querySelector('#oi').onchange = pv; pv();
        tb.querySelector('#op').onclick = () => OMR.printSheets({ title: tb.querySelector('#ot').value, copies: +tb.querySelector('#oc').value || 1, ink: tb.querySelector('#oi').value });
        return;
      }
      if (!papers.length) { tb.innerHTML = '<div class="card empty"><i>📄</i>पहले एक पेपर बनाएँ (उत्तर कुंजी उसी से ली जाएगी)।<br><br><a class="btn primary" href="#/generate">⚡ पेपर बनाएँ</a></div>'; return; }
      const paper = papers.find((p) => p.id === paperId) || papers[0];
      tb.innerHTML = `<div class="card"><div class="row"><label class="f">किस पेपर की उत्तर कुंजी से जाँचें?<select id="sp">${papers.map((p) => `<option value="${p.id}" ${p.id === paper.id ? 'selected' : ''}>${esc(p.title)} (Q${p.startNo}–${p.startNo + p.questions.length - 1})</option>`).join('')}</select></label></div>
          <div class="btns" style="margin-top:14px"><label class="btn primary lg">📷 कैमरा से फ़ोटो<input type="file" accept="image/*" capture="environment" id="cam" hidden></label><label class="btn lg">🖼️ फ़ोटो/स्कैन चुनें (कई)<input type="file" accept="image/*" multiple id="gal" hidden></label></div>
          <div class="note blue" style="margin-top:14px;margin-bottom:0">📌 अच्छी फ़ोटो के लिए: शीट समतल रखें · चारों काले कोने दिखें · ऊपर से सीधी फ़ोटो · छाया न हो। हर फ़ोटो की जाँच करके सुधार सकते हैं, फिर सेव करें।</div></div>
        <div id="scans"></div>`;
      tb.querySelector('#sp').onchange = (e) => APP.go('#/omr/scan/' + e.target.value);
      const onFiles = async (files) => {
        for (const f of files) await scanOne(f, paper, tb.querySelector('#scans'));
      };
      tb.querySelector('#cam').onchange = (e) => onFiles(Array.from(e.target.files));
      tb.querySelector('#gal').onchange = (e) => onFiles(Array.from(e.target.files));
    }
  };

  async function scanOne(file, paper, host) {
    const card = document.createElement('div');
    card.className = 'card scan-card';
    card.innerHTML = `<div class="btns"><span class="spin"></span> ${esc(file.name)} जाँच रहे हैं…</div>`;
    host.prepend(card);
    let res;
    try { res = await OMR.read(await U.readFile(file)); } catch (e) { res = { ok: false, error: e.message }; }
    if (!res.ok) { card.innerHTML = `<div class="note" style="margin:0">❌ ${esc(file.name)}: ${esc(res.error)}</div>`; return; }
    const answers = OMR.answersForPaper(paper, res.answers);
    const draw = () => {
      const sc = PAPER.score(paper, answers);
      const multi = answers.filter((a) => a === -2).length;
      card.innerHTML = `<div class="grid g2"><div><img src="${res.canvas.toDataURL('image/jpeg', 0.8)}" alt="scan"></div>
        <div><h2 style="margin-bottom:6px">${sc.score} / ${sc.total} <small>${sc.percent}% · सही ${sc.correct} · गलत ${sc.wrong} · खाली ${sc.blank}${multi ? ` · ✱ एक से अधिक ${multi}` : ''}</small></h2>
          <div class="row"><label class="f">अनुक्रमांक<input type="text" class="sroll" value="${esc(res.roll.replace(/[^0-9]/g, '') === res.roll ? res.roll : res.roll)}"></label><label class="f">विद्यार्थी का नाम<input type="text" class="sname" placeholder="नाम लिखें"></label></div>
          <div class="muted" style="font-size:12.5px;margin:8px 0 4px">पढ़े गए उत्तर (हरा = सही, लाल = गलत, ✱ = कई गोले) — गलत पढ़ा हो तो बदलें:</div>
          <div class="ans-grid">${paper.questions.map((q, i) => { const a = answers[i]; const cls = a < 0 ? 'blank' : a === q.answer ? 'ok' : 'bad'; return `<div class="${cls}"><b>${paper.startNo + i}</b><select data-i="${i}"><option value="-1" ${a === -1 ? 'selected' : ''}>–</option><option value="-2" ${a === -2 ? 'selected' : ''}>✱</option>${[0, 1, 2, 3].map((k) => `<option value="${k}" ${a === k ? 'selected' : ''}>${k + 1}</option>`).join('')}</select></div>`; }).join('')}</div>
          <div class="btns" style="margin-top:12px"><button class="btn green sv">💾 परिणाम सेव करें</button><button class="btn danger sm rm">✕</button></div></div></div>`;
      card.querySelector('.sv').onclick = async () => {
        const r = await PAGES._saveResult(paper, { roll: card.querySelector('.sroll').value.trim(), name: card.querySelector('.sname').value.trim() }, answers, 'omr');
        card.innerHTML = `<div class="note green" style="margin:0">✅ सेव हुआ: ${esc(r.name || '(बिना नाम)')} · अनुक्रमांक ${esc(r.roll || '-')} · <b>${r.score}/${r.total}</b> · <a href="#/results/${paper.id}">रैंक सूची देखें</a></div>`;
      };
      card.querySelector('.rm').onclick = () => card.remove();
      card.querySelector('.ans-grid').onchange = (e) => { const s = e.target.closest('select'); if (s) { answers[+s.dataset.i] = +s.value; const nm = card.querySelector('.sname').value, rl = card.querySelector('.sroll').value; draw(); card.querySelector('.sname').value = nm; card.querySelector('.sroll').value = rl; } };
    };
    draw();
  }
})();
