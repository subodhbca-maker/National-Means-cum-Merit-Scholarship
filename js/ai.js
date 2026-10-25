/* Basic Pathshala - NMMS : Google Gemini integration + offline text parser for imports */
(function () {
  const DEFAULT_MODEL = 'gemini-2.5-flash';
  const API = 'https://generativelanguage.googleapis.com/v1beta/models/';

  const QUESTION_SCHEMA = {
    type: 'OBJECT',
    properties: {
      questions: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            number: { type: 'INTEGER' },
            subject: { type: 'STRING', enum: ['mat', 'science', 'sst', 'maths', 'other'] },
            topic: { type: 'STRING' },
            difficulty: { type: 'STRING', enum: ['easy', 'moderate', 'hard'] },
            q_hi: { type: 'STRING' }, q_en: { type: 'STRING' },
            options_hi: { type: 'ARRAY', items: { type: 'STRING' } },
            options_en: { type: 'ARRAY', items: { type: 'STRING' } },
            answer: { type: 'INTEGER' },
            explanation_hi: { type: 'STRING' }, explanation_en: { type: 'STRING' },
            has_figure: { type: 'BOOLEAN' }
          },
          required: ['subject', 'difficulty', 'q_hi', 'q_en', 'options_hi', 'options_en', 'answer']
        }
      },
      last_number: { type: 'INTEGER' },
      has_more: { type: 'BOOLEAN' }
    },
    required: ['questions', 'has_more']
  };

  const DIFF_RULES = `Difficulty must reflect a Class 8 NMMS candidate:
- easy: one-step recall or a direct pattern (about 40% of a good paper)
- moderate: two steps, application or a less obvious pattern (about 40%)
- hard: multi-step reasoning, tricky distractors or above-syllabus facts (about 20%)`;

  async function settings() {
    return { key: await DB.getSetting('geminiKey', ''), model: await DB.getSetting('geminiModel', DEFAULT_MODEL) };
  }
  async function hasKey() { return !!(await settings()).key; }

  async function call(parts, opts) {
    const { key, model } = await settings();
    if (!key) throw new Error('Gemini API key सेट नहीं है। Settings में key डालें। / Add your Gemini API key in Settings.');
    const body = {
      contents: [{ role: 'user', parts }],
      generationConfig: Object.assign({ temperature: 0.4, responseMimeType: 'application/json' }, opts && opts.schema ? { responseSchema: opts.schema } : {}, opts && opts.gen)
    };
    let res, lastErr;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        res = await fetch(API + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(key), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: opts && opts.signal
        });
        if (res.status === 429 || res.status >= 500) { lastErr = new Error('Gemini busy (' + res.status + ')'); await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); continue; }
        break;
      } catch (e) { if (e.name === 'AbortError') throw e; lastErr = e; await new Promise((r) => setTimeout(r, 1500)); }
    }
    if (!res) throw lastErr || new Error('Network error');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data.error && data.error.message) || ('Gemini error ' + res.status));
    const cand = data.candidates && data.candidates[0];
    const text = cand && cand.content && cand.content.parts && cand.content.parts.map((p) => p.text || '').join('');
    if (!text) throw new Error('Gemini ने खाली उत्तर दिया (' + ((cand && cand.finishReason) || 'no candidates') + ')');
    try { return JSON.parse(text); } catch (e) {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      throw new Error('Gemini का उत्तर JSON नहीं था');
    }
  }

  function toQuestion(x, extra) {
    const oh = (x.options_hi || []).slice(0, 4), oe = (x.options_en || []).slice(0, 4);
    const opts = [0, 1, 2, 3].map((i) => ({ hi: String(oh[i] || oe[i] || '').replace(/^\s*\(?[1-4a-dA-Dक-घ][\).]\s*/, ''), en: String(oe[i] || oh[i] || '').replace(/^\s*\(?[1-4a-dA-D][\).]\s*/, '') }));
    let ans = Number(x.answer);
    ans = ans >= 1 && ans <= 4 ? ans - 1 : -1; // model returns 1-4
    return U.normQuestion(Object.assign({
      subject: x.subject, difficulty: x.difficulty, topic: x.topic || '',
      q: { hi: x.q_hi || x.q_en || '', en: x.q_en || x.q_hi || '' },
      options: opts, answer: ans,
      explanation: { hi: x.explanation_hi || '', en: x.explanation_en || '' },
      hasFigure: !!x.has_figure, source: 'import'
    }, extra || {}));
  }

  /* Extract MCQs from a PDF or image file. Large papers are read in chunks of ~25 questions. */
  async function extractFromFile(file, opts, onProgress) {
    opts = opts || {};
    const b64 = await fileToBase64(file);
    const mime = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    if (b64.length > 19 * 1024 * 1024 * 1.37) throw new Error('फ़ाइल 19 MB से बड़ी है — छोटे भागों में बाँटकर अपलोड करें।');
    const all = [];
    let from = 1, guard = 0;
    while (guard++ < 15) {
      const prompt = `You are an expert NMMS (National Means-cum-Merit Scholarship) paper setter for Uttar Pradesh.
The attached file is an exam paper / question booklet (it may be scanned, bilingual Hindi + English, or in any language and any exam).
Extract the multiple-choice questions in order, starting from question number ${from}, at most 25 questions in this reply.
For each question:
- q_hi and q_en: the question text in Hindi and in English. If the paper has only one language, ${opts.translate === false ? 'copy the same text into both fields' : 'translate faithfully into the other language (keep numbers, symbols, formulas and letter-codes unchanged)'}.
- options_hi / options_en: exactly 4 options without their "1)" / "(A)" labels.
- answer: the number (1-4) of the correct option. Use the answer key if the file has one; otherwise solve the question carefully yourself.
- subject: "mat" for mental ability / reasoning, "science", "sst" (history, geography, civics, economics), "maths", or "other".
- topic: short English topic name (e.g. "Number Series", "Coding-Decoding", "Acids & Bases").
- difficulty: ${DIFF_RULES}
- explanation_hi / explanation_en: one short line of solution.
- has_figure: true if the question depends on a figure/diagram that is not captured in text. Still describe the figure in words when possible.
Include passage / direction text inside each question that needs it. Skip instructions, cover pages and non-MCQ content.
Set "last_number" to the number of the last question you returned and "has_more" to true if more questions remain after it.`;
      const out = await call([{ inline_data: { mime_type: mime, data: b64 } }, { text: prompt }], { schema: QUESTION_SCHEMA, gen: { maxOutputTokens: 60000 } });
      const qs = (out.questions || []).map((x) => toQuestion(x, { origin: file.name }));
      all.push(...qs);
      if (onProgress) onProgress(all.length);
      if (!out.has_more || !qs.length) break;
      from = (out.last_number || from + qs.length - 1) + 1;
    }
    return dedupe(all);
  }

  /* Generate fresh questions with Gemini */
  async function generate(opts) {
    // opts: { subject, topic, count, mix:{easy,moderate,hard}, lang, similarTo:[questions] }
    const split = U.splitDifficulty(opts.count, opts.mix);
    const sample = (opts.similarTo || []).slice(0, 6).map((q) => '- ' + U.txt(q.q, 'en') + ' | ' + q.options.map((o) => U.txt(o, 'en')).join(' / ')).join('\n');
    const subj = U.SUBJECTS[opts.subject] ? U.SUBJECTS[opts.subject].en : opts.subject;
    const prompt = `Create ${opts.count} new, original, error-free multiple-choice questions for the NMMS (Uttar Pradesh) exam, Class 8 level.
Subject: ${subj}${opts.topic ? '. Topic: ' + opts.topic : ''}.
Exactly ${split.easy} easy, ${split.moderate} moderate and ${split.hard} hard questions.
${DIFF_RULES}
Rules: 4 options each, exactly one correct, plausible distractors, no "all of the above" unless natural, facts must be correct and current, UP Board / NCERT syllabus.
Write every question and option in both Hindi (q_hi, options_hi) and English (q_en, options_en). answer is 1-4. Give a one-line explanation in both languages.
${sample ? 'Match the style of these sample questions (do not copy them):\n' + sample : ''}
Return has_more = false.`;
    const out = await call([{ text: prompt }], { schema: QUESTION_SCHEMA, gen: { temperature: 0.8, maxOutputTokens: 60000 } });
    return dedupe((out.questions || []).map((x) => toQuestion(Object.assign({ subject: opts.subject }, x), { source: 'ai', subject: opts.subject })));
  }

  /* Re-check difficulty / answers of a list of questions */
  async function review(questions) {
    const list = questions.map((q, i) => `${i + 1}. ${U.txt(q.q, 'en')} | ${q.options.map((o, k) => (k + 1) + ') ' + U.txt(o, 'en')).join(' ')}`).join('\n');
    const schema = { type: 'OBJECT', properties: { items: { type: 'ARRAY', items: { type: 'OBJECT', properties: { n: { type: 'INTEGER' }, answer: { type: 'INTEGER' }, difficulty: { type: 'STRING', enum: ['easy', 'moderate', 'hard'] } }, required: ['n', 'answer', 'difficulty'] } } }, required: ['items'] };
    const out = await call([{ text: `For each NMMS (Class 8) question below give the correct option number (1-4) and its difficulty.\n${DIFF_RULES}\n\n${list}` }], { schema });
    return out.items || [];
  }

  function dedupe(qs) {
    const seen = new Set();
    return qs.filter((q) => { const k = U.qKey(q); if (seen.has(k)) return false; seen.add(k); return true; });
  }

  function fileToBase64(file) {
    return U.readFile(file).then((d) => String(d).split(',')[1] || '');
  }

  /* ---------- offline parsing (text PDFs or pasted text) ---------- */
  async function pdfText(file) {
    if (!window.pdfjsLib) throw new Error('PDF library load नहीं हुई');
    const buf = await U.readFile(file, 'buffer');
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    let text = '';
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      let lastY = null;
      tc.items.forEach((it) => {
        const y = Math.round(it.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 4) text += '\n';
        text += it.str + ' ';
        lastY = y;
      });
      text += '\n';
    }
    return text;
  }

  function parseText(text) {
    const clean = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ');
    const blocks = clean.split(/\n\s*(?:Q\.?\s*|प्रश्न\s*)?(\d{1,3})\s*[\).:।]\s+/i);
    const out = [];
    for (let i = 1; i < blocks.length; i += 2) {
      const body = (blocks[i + 1] || '').trim();
      const parts = body.split(/\s*\(?\b([1-4]|[A-Da-d]|[कखगघ])\s*[\).]\s+/);
      if (parts.length < 9) continue;
      const qtext = parts[0].replace(/\s+/g, ' ').trim();
      const opts = [];
      for (let k = 1; k < parts.length && opts.length < 4; k += 2) opts.push(parts[k + 1].replace(/\s+/g, ' ').trim());
      let answer = -1;
      const am = body.match(/(?:Ans(?:wer)?|उत्तर)\s*[:\-–]?\s*\(?([1-4A-Da-d])\)?/i);
      if (am) answer = '1234'.indexOf(am[1]) >= 0 ? '1234'.indexOf(am[1]) : 'abcd'.indexOf(am[1].toLowerCase());
      if (opts.length === 4 && qtext) {
        const hi = /[ऀ-ॿ]/.test(qtext);
        const guessDiff = qtext.length + opts.join('').length > 220 ? 'hard' : qtext.length > 90 ? 'moderate' : 'easy';
        out.push(U.normQuestion({
          q: hi ? { hi: qtext, en: '' } : { hi: '', en: qtext },
          options: opts.map((o) => (hi ? { hi: o, en: '' } : { hi: '', en: o })),
          answer, difficulty: guessDiff, subject: 'other', source: 'import', topic: 'Imported'
        }));
      }
    }
    return dedupe(out);
  }

  window.AI = { DEFAULT_MODEL, hasKey, call, extractFromFile, generate, review, pdfText, parseText };
})();
