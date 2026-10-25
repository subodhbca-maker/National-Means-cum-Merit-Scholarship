/* Basic Pathshala - NMMS : offline cache (app shell). Bump VERSION when files change. */
const VERSION = 'bp-nmms-v5';
const FILES = [
  './', 'index.html', 'manifest.json', 'css/app.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/logo.jpg', 'js/brand.js',
  'lib/pdf.min.js', 'lib/pdf.worker.min.js', 'lib/pptxgen.bundle.js', 'lib/xlsx.full.min.js', 'lib/jspdf.umd.min.js', 'lib/html2canvas.min.js',
  'js/util.js', 'js/db.js', 'js/figures.js', 'js/generators.js', 'js/paper.js', 'js/exporters.js', 'js/omr.js', 'js/ai.js', 'js/ui.js',
  'js/pages-main.js', 'js/pages-paper.js', 'js/pages-import.js', 'js/pages-omr.js', 'js/pages-test.js', 'js/app.js',
  'data/sat-bank.js', 'data/pyq-up-2023.js', 'data/pyq-up-2024.js', 'data/pyq-up-2025.js', 'data/pyq-figures.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === location.origin) {
    // network first so updates show up, cache as offline fallback
    e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSION).then((cc) => cc.put(e.request, c)); return r; }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  } else if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => { const c = r.clone(); caches.open(VERSION).then((cc) => cc.put(e.request, c)); return r; })));
  }
});
