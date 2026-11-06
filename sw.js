/* Basic Pathshala - NMMS : offline cache (app shell). Bump VERSION when files change.
   Install reloads every file from the server, and pages are always revalidated, so an update never mixes old and new files. */
const VERSION = 'bp-nmms-v9';
const FILES = [
  './', 'index.html', 'manifest.json', 'css/app.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/logo.jpg', 'js/brand.js',
  'lib/pdf.min.js', 'lib/pdf.worker.min.js', 'lib/pptxgen.bundle.js', 'lib/xlsx.full.min.js', 'lib/jspdf.umd.min.js', 'lib/html2canvas.min.js',
  'js/util.js', 'js/db.js', 'js/figures.js', 'js/figures-pyq.js', 'js/generators.js', 'js/passage.js', 'js/paper.js', 'js/qr.js', 'js/exporters.js', 'js/omr.js', 'js/ai.js', 'js/ui.js',
  'js/pages-main.js', 'js/pages-paper.js', 'js/pages-pyq.js', 'js/pages-import.js', 'js/pages-omr.js', 'js/pages-test.js', 'js/app.js',
  'data/sat-bank.js', 'data/sat-bank-2.js', 'data/sat-bank-2a.js', 'data/sat-bank-2b.js', 'data/sat-bank-2c.js', 'data/sat-bank-2d.js', 'data/sat-bank-2e.js', 'data/sat-bank-2f.js',
  'data/pyq-up-2023.js', 'data/pyq-up-2024.js', 'data/pyq-up-2025.js', 'data/pyq-figures.js', 'data/pyq-up-2027.js', 'data/pyq-extra.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === location.origin) {
    // network first so updates show up, cache as offline fallback. 'no-cache' makes the browser ask the server
    // every time — otherwise its own HTTP cache (10 min on GitHub Pages) can mix old and new files after an update
    e.respondWith(fetch(new Request(e.request.url, { cache: 'no-cache', credentials: 'same-origin' })).then((r) => { const c = r.clone(); caches.open(VERSION).then((cc) => cc.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  } else if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSION).then((cc) => cc.put(e.request, c)); return r; })));
  }
});
