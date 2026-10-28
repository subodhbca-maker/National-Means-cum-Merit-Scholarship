/* Basic Pathshala - NMMS : OMR answer sheet (UP NMMS style, 180 questions) — print + camera scan.
   All geometry is in millimetres on an A4 page; the same layout drives drawing and reading. */
(function () {
  const W = 210, H = 297;
  const MARK = 7; // corner marker size (mm)
  const MARKERS = [[6, 6], [W - 6 - MARK, 6], [6, 286], [W - 6 - MARK, 286]]; // TL, TR, BL, BR
  const MC = MARKERS.map(([x, y]) => [x + MARK / 2, y + MARK / 2]);
  const ROLL_DIGITS = 7;
  const ROWS = 45, COLS = 4, Q_MAX = ROWS * COLS;
  const BUB_R = 1.45;
  const ORIENT = [15, 8, 12, 3]; // x, y, w, h of a solid bar next to the top-left marker, tells which way up the sheet is

  function layout() {
    const roll = [];
    for (let c = 0; c < ROLL_DIGITS; c++) {
      roll.push([]);
      for (let d = 0; d < 10; d++) roll[c].push([14.5 + c * 6.6, 70 + d * 3.55]);
    }
    const q = [];
    for (let n = 0; n < Q_MAX; n++) {
      const c = Math.floor(n / ROWS), r = n % ROWS;
      const x0 = 10 + c * 47.6, y = 120 + r * 3.48;
      q.push({ no: n + 1, x0, y, b: [0, 1, 2, 3].map((k) => [x0 + 13 + k * 8.6, y]) });
    }
    return { roll, q };
  }
  const LAYOUT = layout();

  /* ---------------- drawing ---------------- */
  function svg(opts) {
    opts = opts || {};
    const ink = opts.ink || '#c2185b';
    const L = LAYOUT;
    const t = (x, y, s, size, extra) => `<text x="${x}" y="${y}" font-size="${size}" fill="${ink}" ${extra || ''}>${U.esc(s)}</text>`;
    const bub = (x, y, label) => `<circle cx="${x}" cy="${y}" r="${BUB_R}" fill="none" stroke="${ink}" stroke-width="0.28"/>${label != null ? `<text x="${x}" y="${y + 0.75}" font-size="2.1" text-anchor="middle" fill="${ink}">${label}</text>` : ''}`;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" font-family="'Noto Sans Devanagari','Nirmala UI',Arial,sans-serif">`;
    s += `<rect width="${W}" height="${H}" fill="#fff"/>`;
    MARKERS.forEach(([x, y]) => { s += `<rect x="${x}" y="${y}" width="${MARK}" height="${MARK}" fill="#000"/>`; });
    s += `<rect x="${ORIENT[0]}" y="${ORIENT[1]}" width="${ORIENT[2]}" height="${ORIENT[3]}" fill="#000"/>`;
    // header
    s += t(W / 2, 11, 'राष्ट्रीय आय एवं योग्यता आधारित छात्रवृत्ति परीक्षा', 4.6, 'text-anchor="middle" font-weight="700"');
    s += t(W / 2, 17, 'NATIONAL MEANS-CUM-MERIT SCHOLARSHIP EXAMINATION', 4.2, 'text-anchor="middle" font-weight="700"');
    s += t(W / 2, 22.5, 'ANSWER SHEET (OMR) · ' + (opts.school || 'Basic Pathshala'), 3.3, 'text-anchor="middle"');
    if (opts.title) s += t(W / 2, 27.5, opts.title, 3, 'text-anchor="middle" fill-opacity="0.85"');
    const line = (y, label) => `${t(10, y, label, 3.2, 'font-weight="600"')}<line x1="70" y1="${y + 0.6}" x2="160" y2="${y + 0.6}" stroke="${ink}" stroke-width="0.25"/>`;
    s += line(35, "Centre Name / केन्द्र का नाम :");
    s += line(42, "Candidate's Name / अभ्यर्थी का नाम :");
    s += line(49, "Father's Name / पिता का नाम :");
    s += t(164, 35, 'Time Allowed', 3, 'font-weight="600"') + t(164, 41, 'MAT - 90 minutes', 3) + t(164, 47, 'SAT - 90 minutes', 3);
    // roll number
    s += `<rect x="9" y="55" width="${ROLL_DIGITS * 6.6 + 4}" height="51" fill="none" stroke="${ink}" stroke-width="0.5"/>`;
    s += t(10.5, 59, '1. Roll Number / अनुक्रमांक', 2.8, 'font-weight="600"');
    for (let c = 0; c < ROLL_DIGITS; c++) {
      s += `<rect x="${11.6 + c * 6.6}" y="61" width="5.8" height="5" fill="none" stroke="${ink}" stroke-width="0.25"/>`;
      for (let d = 0; d < 10; d++) s += bub(L.roll[c][d][0], L.roll[c][d][1], d);
    }
    // personal details (printed only)
    const box = (x, w, title, items) => {
      let o = `<rect x="${x}" y="55" width="${w}" height="51" fill="none" stroke="${ink}" stroke-width="0.5"/>` + t(x + 2, 59, title, 2.8, 'font-weight="600"');
      items.forEach((it, i) => { o += t(x + 2, 66 + i * 7, it, 2.7) + bub(x + w - 4, 65 + i * 7, i + 1); });
      return o;
    };
    s += box(60, 36, '2. Sex / लिंग  ·  3. Area / क्षेत्र', ['Male / छात्र', 'Female / छात्रा', 'Urban / शहरी', 'Rural / ग्रामीण']);
    s += box(99, 48, '4. Caste / जाति', ['General / सामान्य', 'SC / अनुसूचित जाति', 'ST / अनुसूचित जनजाति', 'OBC / अन्य पिछड़ा वर्ग']);
    s += box(150, 51, '5. Disability / चुनौती ग्रस्तता', ['Orthopedic / चलन क्रिया', 'Hearing / श्रवण दोष', 'Blind / पूर्ण दृष्टि दोष', 'Low Vision / अल्प दृष्टि', 'None / कोई नहीं']);
    // answer area
    s += `<rect x="8" y="109" width="96" height="${ROWS * 3.48 + 9}" fill="none" stroke="${ink}" stroke-width="0.5"/>`;
    s += `<rect x="103.2" y="109" width="98" height="${ROWS * 3.48 + 9}" fill="none" stroke="${ink}" stroke-width="0.5"/>`;
    s += t(56, 113, 'प्रश्न पत्र I – बौद्धिक परीक्षा · Part I : MAT', 2.9, 'text-anchor="middle" font-weight="700"');
    s += t(152, 113, 'प्रश्न पत्र II – शैक्षिक परीक्षा · Part II : SAT', 2.9, 'text-anchor="middle" font-weight="700"');
    s += t(56, 116.4, 'Mark correct answer. Only one answer allowed', 2.3, 'text-anchor="middle"');
    s += t(152, 116.4, 'Mark correct answer. Only one answer allowed', 2.3, 'text-anchor="middle"');
    L.q.forEach((q) => {
      s += t(q.x0 + 1.5, q.y + 0.95, String(q.no).padStart(2, '0') + '.', 2.6, 'font-weight="600"');
      q.b.forEach(([x, y], k) => { s += bub(x, y, k + 1); });
      if (q.no % 5 === 0 && q.no % ROWS) s += `<line x1="${q.x0 + 1}" y1="${q.y + 1.74}" x2="${q.x0 + 45}" y2="${q.y + 1.74}" stroke="${ink}" stroke-width="0.12" stroke-dasharray="0.6 0.6"/>`;
    });
    const fy = 120 + ROWS * 3.48 + 1.5;
    s += t(10, fy + 4.5, 'Sign. of Candidate / अभ्यर्थी के हस्ताक्षर', 2.5) + t(78, fy + 4.5, 'Sign. of Invigilator / कक्ष निरीक्षक', 2.5) + t(146, fy + 4.5, 'Seal of Centre / केन्द्र की मुहर', 2.5);
    s += `<image href="${BRAND.logo}" x="16" y="${fy + 7}" width="5" height="5"/>`;
    s += `<text x="22.5" y="${fy + 10.6}" font-size="2.4" fill="#444">${U.esc(BRAND.footer)}</text>`;
    s += '</svg>';
    return s;
  }

  async function printSheets(opts) {
    opts = opts || {};
    const sch = await EXPORT.school();
    const copies = Math.max(1, Math.min(200, opts.copies || 1));
    const one = svg({ school: sch.name, title: opts.title, ink: opts.ink });
    const pages = Array.from({ length: copies }, () => `<div class="page">${one}</div>`).join('');
    EXPORT.openDoc(`<!doctype html><html><head><meta charset="utf-8"><title>OMR Sheet</title>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
      <style>@page{size:A4;margin:0}body{margin:0}.page{width:210mm;height:297mm;page-break-after:always;overflow:hidden}.page svg{display:block}
      .noprint{position:fixed;top:8px;right:8px;background:#fffbe6;border:1px solid #f0d36b;padding:8px 12px;font-family:sans-serif}@media print{.noprint{display:none}}</style></head>
      <body><div class="noprint"><button onclick="window.print()">🖨️ Print OMR</button> A4 · Scale 100% (Actual size)</div>${pages}</body></html>`);
  }

  /* ---------------- reading ---------------- */
  function loadImage(src) {
    return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
  }

  // solve 8x8 for homography mapping (x,y)mm -> (u,v)px
  function homography(src, dst) {
    const A = [], b = [];
    for (let i = 0; i < 4; i++) {
      const [x, y] = src[i], [u, v] = dst[i];
      A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
      A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
    }
    const n = 8;
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = 0; r < n; r++) {
        if (r === c) continue;
        const f = A[r][c] / A[c][c];
        for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    const h = b.map((v, i) => v / A[i][i]);
    return (x, y) => { const d = h[6] * x + h[7] * y + 1; return [(h[0] * x + h[1] * y + h[2]) / d, (h[3] * x + h[4] * y + h[5]) / d]; };
  }

  /* dark-blob candidates for the corner markers (adaptive threshold, so grey or faded print still counts) */
  function blobs(gray, w, h) {
    const I = new Float64Array((w + 1) * (h + 1));
    for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += gray[y * w + x]; I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + row; } }
    const R = Math.max(8, Math.round(Math.min(w, h) / 14));
    const dark = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - R), y1 = Math.min(h, y + R + 1);
      for (let x = 0; x < w; x++) {
        const x0 = Math.max(0, x - R), x1 = Math.min(w, x + R + 1);
        const mean = (I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]) / ((x1 - x0) * (y1 - y0));
        dark[y * w + x] = gray[y * w + x] < mean * 0.8 && gray[y * w + x] < 215 ? 1 : 0;
      }
    }
    const lab = new Int32Array(w * h), stack = new Int32Array(w * h), comps = [];
    const minSide = Math.min(w, h) * 0.011, maxSide = Math.min(w, h) * 0.09;
    let id = 0;
    for (let i = 0; i < w * h; i++) {
      if (!dark[i] || lab[i]) continue;
      id++;
      let sp = 0; stack[sp++] = i; lab[i] = id;
      let area = 0, minx = w, maxx = 0, miny = h, maxy = 0, sx = 0, sy = 0;
      while (sp) {
        const p = stack[--sp], px = p % w, py = (p - px) / w;
        area++; sx += px; sy += py;
        if (px < minx) minx = px; if (px > maxx) maxx = px; if (py < miny) miny = py; if (py > maxy) maxy = py;
        if (px > 0 && dark[p - 1] && !lab[p - 1]) { lab[p - 1] = id; stack[sp++] = p - 1; }
        if (px < w - 1 && dark[p + 1] && !lab[p + 1]) { lab[p + 1] = id; stack[sp++] = p + 1; }
        if (py > 0 && dark[p - w] && !lab[p - w]) { lab[p - w] = id; stack[sp++] = p - w; }
        if (py < h - 1 && dark[p + w] && !lab[p + w]) { lab[p + w] = id; stack[sp++] = p + w; }
      }
      const bw = maxx - minx + 1, bh = maxy - miny + 1, side = Math.sqrt(area);
      if (side < minSide || side > maxSide) continue;
      const fill = area / (bw * bh), asp = bw / bh;
      if (fill > 0.6 && asp > 0.6 && asp < 1.65) comps.push({ area, cx: sx / area, cy: sy / area, fill });
    }
    return comps;
  }

  /* pick the 4 blobs that form the sheet's marker rectangle (height : width ≈ 280 : 191).
     Returns the corners in clockwise order starting anywhere; orientation is decided later. */
  function findMarkers(gray, w, h) {
    const comps = blobs(gray, w, h).sort((a, b) => b.area - a.area).slice(0, 16);
    if (comps.length < 3) return null;
    const RATIO = (MC[2][1] - MC[0][1]) / (MC[1][0] - MC[0][0]);
    const d = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy);
    const order = (ps) => { const cx = ps.reduce((s, p) => s + p.cx, 0) / ps.length, cy = ps.reduce((s, p) => s + p.cy, 0) / ps.length; return ps.slice().sort((a, b) => Math.atan2(a.cy - cy, a.cx - cx) - Math.atan2(b.cy - cy, b.cx - cx)); };
    const score = (q) => {
      const areas = q.map((p) => p.area), amin = Math.min(...areas), amax = Math.max(...areas);
      if (amin / amax < 0.2) return -1;
      const s = [d(q[0], q[1]), d(q[1], q[2]), d(q[2], q[3]), d(q[3], q[0])];
      if (Math.abs(s[0] - s[2]) / Math.max(s[0], s[2]) > 0.3 || Math.abs(s[1] - s[3]) / Math.max(s[1], s[3]) > 0.3) return -1;
      const a = (s[0] + s[2]) / 2, b = (s[1] + s[3]) / 2, r = Math.max(a, b) / Math.min(a, b);
      if (r < 1.2 || r > 1.85 || Math.max(a, b) < Math.min(w, h) * 0.45) return -1;
      // convex and roughly right-angled: diagonals cut each other near their middles
      const mid1 = [(q[0].cx + q[2].cx) / 2, (q[0].cy + q[2].cy) / 2], mid2 = [(q[1].cx + q[3].cx) / 2, (q[1].cy + q[3].cy) / 2];
      if (Math.hypot(mid1[0] - mid2[0], mid1[1] - mid2[1]) > 0.12 * Math.max(a, b)) return -1;
      return (amin / amax) * (1 - Math.abs(r - RATIO) / RATIO) * Math.sqrt(amin) * (a * b);
    };
    let best = null, bestS = 0;
    const n = comps.length;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) for (let l = k + 1; l < n; l++) {
      const q = order([comps[i], comps[j], comps[k], comps[l]]), sc = score(q);
      if (sc > bestS) { bestS = sc; best = q; }
    }
    // only three markers visible (one faded / covered): complete the rectangle
    if (!best) {
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
        const t = [comps[i], comps[j], comps[k]];
        for (let c = 0; c < 3; c++) {
          const B = t[c], A = t[(c + 1) % 3], C = t[(c + 2) % 3];
          const D = { cx: A.cx + C.cx - B.cx, cy: A.cy + C.cy - B.cy, area: (A.area + C.area) / 2 };
          if (D.cx < 0 || D.cy < 0 || D.cx > w || D.cy > h) continue;
          const q = order([A, B, C, D]), sc = score(q) * 0.5;
          if (sc > bestS) { bestS = sc; best = q; }
        }
      }
    }
    return best ? best.map((p) => [p.cx, p.cy]) : null;
  }

  /* read a sheet image. returns { ok, roll, answers[180] (-1 blank, -2 multiple, 0..3), canvas(overlay), threshold } */
  async function read(src) {
    const img = await loadImage(src);
    const maxD = 2000;
    const s = Math.min(1, maxD / Math.max(img.width, img.height));
    const w = Math.round(img.width * s), h = Math.round(img.height * s);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0, w, h);
    const px = g.getImageData(0, 0, w, h).data;
    // luminance finds the black markers; the red channel reads the bubbles, because the printed
    // pink/red outlines and digits almost vanish in it while pen and pencil marks stay dark
    const gray = new Float32Array(w * h), red = new Float32Array(w * h);
    for (let i = 0, j = 0; i < px.length; i += 4, j++) { gray[j] = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]; red[j] = Math.max(px[i], gray[j]); }
    const quad = findMarkers(gray, w, h);
    if (!quad) return { ok: false, error: 'कोने के काले निशान नहीं मिले। पूरी शीट (चारों कोने) फ्रेम में रखें, रोशनी अच्छी हो और फोटो ऊपर से सीधी लें। / Could not find the corner markers.' };
    const sample = (arr, x, y) => { const xi = Math.min(w - 1, Math.max(0, Math.round(x))), yi = Math.min(h - 1, Math.max(0, Math.round(y))); return arr[yi * w + xi]; };
    // try the four ways the corners can map to the sheet; the right one has the short side on top
    // and the solid orientation bar next to the top-left marker
    const sideLen = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let H = null, pts = null, bestBar = Infinity;
    for (let k = 0; k < 4; k++) {
      const c = [0, 1, 2, 3].map((i) => quad[(k + i) % 4]); // TL, TR, BR, BL (clockwise)
      if (sideLen(c[0], c[1]) > sideLen(c[1], c[2])) continue;
      const cand = [c[0], c[1], c[3], c[2]];
      const Hm = homography(MC, cand);
      let ink = 0, n = 0, paper = 0, m = 0;
      for (let dx = 1; dx < ORIENT[2]; dx += 1) for (let dy = 0.75; dy < ORIENT[3]; dy += 0.75) { const [u, v] = Hm(ORIENT[0] + dx, ORIENT[1] + dy); ink += sample(gray, u, v); n++; }
      for (let dx = 1; dx < ORIENT[2]; dx += 1) { const [u, v] = Hm(ORIENT[0] + dx, ORIENT[1] + ORIENT[3] + 3); paper += sample(gray, u, v); m++; }
      const ratio = (ink / n) / Math.max(1, paper / m);
      if (ratio < bestBar) { bestBar = ratio; H = Hm; pts = cand; }
    }
    if (!H) return { ok: false, error: 'शीट की दिशा तय नहीं हो सकी। फोटो फिर से लें। / Could not work out the sheet orientation.' };
    const pxPerMm = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) / (MC[1][0] - MC[0][0]);

    // mean of a disc (inside the bubble) and of a ring (the printed outline), in sheet mm
    const disc = (arr, cx, cy, r) => {
      let sum = 0, n = 0;
      for (let dy = -r; dy <= r + 1e-6; dy += r / 3) for (let dx = -r; dx <= r + 1e-6; dx += r / 3) {
        if (dx * dx + dy * dy > r * r) continue;
        const [u, v] = H(cx + dx, cy + dy); sum += sample(arr, u, v); n++;
      }
      return sum / n;
    };
    const ring = (cx, cy) => { let sum = 0; for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8; const [u, v] = H(cx + BUB_R * Math.cos(a), cy + BUB_R * Math.sin(a)); sum += sample(gray, u, v); } return sum / 16; };
    /* Phone photos and scanner apps are never perfectly flat, so the printed circles can sit a couple of mm
       away from where the markers alone put them. For each block of rows, find a smooth path of (dx, dy)
       offsets (dynamic programming, ±2.5 mm) that lands every row on its printed circles. */
    const STEP = 0.25, RANGE = 10; // offsets -2.5 … +2.5 mm
    const ringScore = (cx, cy) => {
      let r = 0, gap = 0;
      for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; const [u, v] = H(cx + BUB_R * Math.cos(a), cy + BUB_R * Math.sin(a)); r += sample(gray, u, v); }
      for (const gx of [-3.2, 3.2]) { const [u, v] = H(cx + gx, cy); gap += sample(gray, u, v); }
      return r / 12 - gap / 2; // more negative = ring darker than the white gap beside it
    };
    const fitBlock = (rows) => {
      const N = 2 * RANGE + 1, S = N * N;
      const cost = rows.map((bubbles) => {
        const c = new Float32Array(S);
        for (let iy = 0; iy < N; iy++) for (let ix = 0; ix < N; ix++) {
          const ox = (ix - RANGE) * STEP, oy = (iy - RANGE) * STEP;
          c[iy * N + ix] = bubbles.reduce((t, [x, y]) => t + ringScore(x + ox, y + oy), 0) / bubbles.length;
        }
        return c;
      });
      // smoothness: neighbouring rows may differ by at most one step in each direction
      const acc = [Float32Array.from(cost[0])], back = [null];
      for (let r = 1; r < rows.length; r++) {
        const a2 = new Float32Array(S), bk = new Int32Array(S);
        for (let iy = 0; iy < N; iy++) for (let ix = 0; ix < N; ix++) {
          let best = Infinity, bi = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
            const jy = iy + dy, jx = ix + dx;
            if (jy < 0 || jy >= N || jx < 0 || jx >= N) continue;
            const v = acc[r - 1][jy * N + jx] + (dx || dy ? 0.5 : 0);
            if (v < best) { best = v; bi = jy * N + jx; }
          }
          a2[iy * N + ix] = best + cost[r][iy * N + ix]; bk[iy * N + ix] = bi;
        }
        acc.push(a2); back.push(bk);
      }
      let cur = 0, bestV = Infinity;
      acc[rows.length - 1].forEach((v, i) => { if (v < bestV) { bestV = v; cur = i; } });
      const out = new Array(rows.length);
      for (let r = rows.length - 1; r >= 0; r--) { out[r] = [((cur % N) - RANGE) * STEP, (Math.floor(cur / N) - RANGE) * STEP]; if (r) cur = back[r][cur]; }
      return out;
    };
    const L = LAYOUT;
    let qOff = [];
    for (let c = 0; c < COLS; c++) qOff = qOff.concat(fitBlock(L.q.slice(c * ROWS, (c + 1) * ROWS).map((q) => q.b)));
    const rollRows = [...Array(10).keys()].map((d) => L.roll.map((col) => col[d]));
    const rOff = fitBlock(rollRows);

    const paperRef = (cx, cy) => {
      const ps = [[cx - 3.2, cy], [cx + 3.2, cy], [cx, cy - 1.75], [cx, cy + 1.75]];
      const vals = ps.map(([x, y]) => { const [u, v] = H(x, y); return sample(red, u, v); }).sort((a, b) => b - a);
      return (vals[0] + vals[1]) / 2;
    };
    const darkness = (x, y) => { const p = Math.max(60, paperRef(x, y)); return Math.max(0, Math.min(1, 1 - disc(red, x, y, 0.9) / p)); };
    const qd = L.q.map((q, i) => q.b.map(([x, y]) => darkness(x + qOff[i][0], y + qOff[i][1])));
    const rd = L.roll.map((col) => col.map(([x, y], d) => darkness(x + rOff[d][0], y + rOff[d][1])));

    // threshold between "empty" and "filled" found from this sheet's own values (Otsu), within sane limits
    const vals = qd.flat().concat(rd.flat());
    let TH = 0.4, bestVar = -1;
    for (let t = 0.15; t <= 0.75; t += 0.01) {
      const lo = vals.filter((v) => v < t), hi = vals.filter((v) => v >= t);
      if (!lo.length || !hi.length) continue;
      const m0 = lo.reduce((a, b) => a + b, 0) / lo.length, m1 = hi.reduce((a, b) => a + b, 0) / hi.length;
      const bv = (lo.length * hi.length) * (m1 - m0) * (m1 - m0);
      if (bv > bestVar) { bestVar = bv; TH = t; }
    }
    TH = Math.min(0.6, Math.max(0.25, TH));
    const pickRow = (row) => {
      const sorted = row.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
      if (sorted[0][0] < TH) return -1;
      // two marks: only "multiple" when the second is nearly as dark as the first (an erased mark stays lighter)
      if (sorted[1][0] >= TH && sorted[1][0] > sorted[0][0] * 0.75) return -2;
      return sorted[0][1];
    };
    const answers = qd.map(pickRow);
    const rollDigits = rd.map((col) => { const r = pickRow(col); return r >= 0 ? String(r) : r === -2 ? '*' : ''; });

    // overlay for the teacher to check
    g.lineWidth = Math.max(1.5, pxPerMm * 0.35);
    L.q.forEach((q, i) => q.b.forEach(([x, y], k) => {
      if (answers[i] === k || (answers[i] === -2 && qd[i][k] >= TH)) {
        const [u, v] = H(x + qOff[i][0], y + qOff[i][1]);
        g.strokeStyle = answers[i] === -2 ? '#ff9800' : '#00c853';
        g.beginPath(); g.arc(u, v, pxPerMm * 1.9, 0, Math.PI * 2); g.stroke();
      }
    }));
    L.roll.forEach((col, c) => col.forEach(([x, y], d) => {
      if (rollDigits[c] === String(d)) { const [u, v] = H(x + rOff[d][0], y + rOff[d][1]); g.strokeStyle = '#2962ff'; g.beginPath(); g.arc(u, v, pxPerMm * 1.9, 0, Math.PI * 2); g.stroke(); }
    }));
    pts.forEach(([u, v]) => { g.strokeStyle = '#2962ff'; g.strokeRect(u - pxPerMm * 4, v - pxPerMm * 4, pxPerMm * 8, pxPerMm * 8); });
    return { ok: true, roll: rollDigits.join(''), answers, canvas: cv, threshold: TH, darkness: qd };
  }

  /* answers for a paper from a 180-slot sheet */
  function answersForPaper(paper, sheetAnswers) {
    return paper.questions.map((_, i) => {
      const slot = paper.startNo - 1 + i;
      return slot < sheetAnswers.length ? sheetAnswers[slot] : -1;
    });
  }

  window.OMR = { svg, printSheets, read, answersForPaper, LAYOUT, Q_MAX };
})();
