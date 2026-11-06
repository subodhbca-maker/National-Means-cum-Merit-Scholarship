/* Basic Pathshala - NMMS : small QR code encoder (byte mode, error correction level M, versions 1–10).
   QR.svg(text, px) returns an <svg> string; used to print the app link on every page. */
(function () {
  // [total codewords, ecc codewords per block, [[blocks, data codewords per block], …]] for level M
  const SPEC = [null,
    [26, 10, [[1, 16]]], [44, 16, [[1, 28]]], [70, 26, [[1, 44]]], [100, 18, [[2, 32]]], [134, 24, [[2, 43]]],
    [172, 16, [[4, 27]]], [196, 18, [[4, 31]]], [242, 22, [[2, 38], [2, 39]]], [292, 22, [[3, 36], [2, 37]]], [346, 26, [[4, 43], [1, 44]]]];
  const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

  // GF(256) arithmetic for Reed–Solomon
  const EXP = new Array(512), LOG = new Array(256);
  for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);
  function rsEcc(data, n) {
    let gen = [1];
    for (let i = 0; i < n; i++) {
      const next = new Array(gen.length + 1).fill(0);
      gen.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= mul(c, EXP[i]); });
      gen = next;
    }
    const res = new Array(n).fill(0);
    data.forEach((d) => {
      const f = d ^ res.shift(); res.push(0);
      if (f) for (let j = 0; j < n; j++) res[j] ^= mul(gen[j + 1], f);
    });
    return res;
  }

  function encode(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    let ver = 1;
    const dataCap = (v) => SPEC[v][2].reduce((s, [b, d]) => s + b * d, 0);
    while (ver <= 10 && 4 + (ver < 10 ? 8 : 16) + bytes.length * 8 > dataCap(ver) * 8) ver++;
    if (ver > 10) throw new Error('QR: text too long');
    // bit stream: mode 0100, length, data, terminator, pad
    const bits = [];
    const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach((b) => put(b, 8));
    const cap = dataCap(ver) * 8;
    put(0, Math.min(4, cap - bits.length));
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    for (let p = 0; data.length < cap / 8; p++) data.push(p % 2 ? 0x11 : 0xec);
    // split into blocks, add error correction, interleave
    const [, eccN, groups] = SPEC[ver];
    const blocks = [];
    let k = 0;
    groups.forEach(([n, d]) => { for (let i = 0; i < n; i++) { const b = data.slice(k, k + d); k += d; blocks.push({ d: b, e: rsEcc(b, eccN) }); } });
    const out = [];
    const maxD = Math.max(...blocks.map((b) => b.d.length));
    for (let i = 0; i < maxD; i++) blocks.forEach((b) => { if (i < b.d.length) out.push(b.d[i]); });
    for (let i = 0; i < eccN; i++) blocks.forEach((b) => out.push(b.e[i]));
    return { ver, codewords: out };
  }

  function matrix(text) {
    const { ver, codewords } = encode(text);
    const N = ver * 4 + 17;
    const m = Array.from({ length: N }, () => new Array(N).fill(null)); // null = free, true/false = set
    const fixed = Array.from({ length: N }, () => new Array(N).fill(false));
    const set = (r, c, v) => { m[r][c] = v; fixed[r][c] = true; };
    const finder = (r, c) => {
      for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) {
        const rr = r + i, cc = c + j;
        if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        const on = i >= 0 && i <= 6 && j >= 0 && j <= 6 && (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4));
        set(rr, cc, on);
      }
    };
    finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
    for (let i = 8; i < N - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const al = ALIGN[ver];
    const last = al.length - 1;
    al.forEach((r, i) => al.forEach((c, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return; // corners hold the finders
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) set(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1);
    }));
    // reserve format and version areas
    for (let i = 0; i < 9; i++) { if (!fixed[8][i]) set(8, i, false); if (!fixed[i][8]) set(i, 8, false); }
    for (let i = 0; i < 8; i++) { set(8, N - 1 - i, false); set(N - 1 - i, 8, false); }
    set(N - 8, 8, true); // dark module
    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >> 11) * 0x1f25);
      const vbits = (ver << 12) | rem;
      for (let i = 0; i < 18; i++) { const b = ((vbits >> i) & 1) === 1, a = Math.floor(i / 3), c = N - 11 + (i % 3); set(a, c, b); set(c, a, b); }
    }
    // place data bits in the zig-zag order
    const bits = [];
    codewords.forEach((w) => { for (let i = 7; i >= 0; i--) bits.push((w >> i) & 1); });
    let bi = 0;
    for (let right = N - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < N; vert++) for (let j = 0; j < 2; j++) {
        const c = right - j, up = ((right + 1) & 2) === 0, r = up ? N - 1 - vert : vert;
        if (!fixed[r][c]) { m[r][c] = bi < bits.length ? bits[bi] === 1 : false; bi++; }
      }
    }
    // try the 8 masks and keep the one with the lowest penalty
    const MASKS = [(r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
      (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
      (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0];
    const withFormat = (g, mask) => {
      const fdata = (0 << 3) | mask; // level M = 00
      let rem = fdata;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
      const f = ((fdata << 10) | rem) ^ 0x5412;
      const b = (i) => ((f >> i) & 1) === 1;
      for (let i = 0; i <= 5; i++) g[i][8] = b(i);
      g[7][8] = b(6); g[8][8] = b(7); g[8][7] = b(8);
      for (let i = 9; i < 15; i++) g[8][14 - i] = b(i);
      for (let i = 0; i < 8; i++) g[8][N - 1 - i] = b(i);
      for (let i = 8; i < 15; i++) g[N - 15 + i][8] = b(i);
      g[N - 8][8] = true;
      return g;
    };
    const penalty = (g) => {
      let p = 0;
      const lines = (get) => {
        for (let a = 0; a < N; a++) {
          let run = 1;
          for (let b = 1; b < N; b++) {
            if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
          }
          for (let b = 0; b + 10 < N; b++) {
            const s = Array.from({ length: 11 }, (_, k) => (get(a, b + k) ? 1 : 0)).join('');
            if (s === '10111010000' || s === '00001011101') p += 40;
          }
        }
      };
      lines((a, b) => g[a][b]); lines((a, b) => g[b][a]);
      for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) if (g[r][c] === g[r + 1][c] && g[r][c] === g[r][c + 1] && g[r][c] === g[r + 1][c + 1]) p += 3;
      const dark = g.reduce((s, row) => s + row.filter(Boolean).length, 0);
      p += Math.floor(Math.abs((dark * 100) / (N * N) - 50) / 5) * 10;
      return p;
    };
    let best = null;
    MASKS.forEach((fn, mask) => {
      const g = m.map((row, r) => row.map((v, c) => (fixed[r][c] ? v : v !== fn(r, c))));
      withFormat(g, mask);
      const p = penalty(g);
      if (!best || p < best.p) best = { g, p };
    });
    return best.g;
  }

  function svg(text, px) {
    const g = matrix(text), N = g.length, Q = 4, W = N + Q * 2;
    let d = '';
    g.forEach((row, r) => row.forEach((v, c) => { if (v) d += `M${c + Q} ${r + Q}h1v1h-1z`; }));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${W}" width="${px || W * 3}" height="${px || W * 3}" shape-rendering="crispEdges"><rect width="${W}" height="${W}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }

  window.QR = { matrix, svg };
})();
