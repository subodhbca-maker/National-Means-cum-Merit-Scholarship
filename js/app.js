/* Basic Pathshala - NMMS : app shell, router, first-run seeding */
(function () {
  const SEED_VERSION = 3;
  const view = document.getElementById('view');
  const PAGES = window.PAGES;

  async function seed() {
    const v = await DB.getSetting('seedVersion', 0);
    if (v >= SEED_VERSION) return;
    const existing = new Set((await DB.all('questions')).map((q) => q.id));
    const base = [].concat(window.PYQ_UP_2023 || [], window.PYQ_UP_2024 || [], window.PYQ_UP_2025 || [], window.PYQ_FIGURES || [], window.SAT_BANK || [], window.SAT_BANK_2 || [])
      .filter((q) => !existing.has(q.id)).map(U.normQuestion);
    const gen = [];
    if (!v) {
      const m = U.splitDifficulty(120), s = U.splitDifficulty(60);
      ['easy', 'moderate', 'hard'].forEach((d) => { gen.push(...GEN.many('mat', d, m[d]), ...GEN.many('maths', d, s[d])); });
    }
    await DB.putMany('questions', base.concat(gen));
    await DB.setSetting('seedVersion', SEED_VERSION);
    if (!v) U.toast(`प्रश्न बैंक तैयार: ${base.length + gen.length} प्रश्न (UP PYQ 2023–2025 सहित)`, 'ok');
    else if (base.length) U.toast(`${base.length} नए प्रश्न जोड़े गए (प्रश्न बैंक अपडेट)`, 'ok');
  }

  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const [name, ...rest] = h.split('/');
    return { name: name || 'home', params: rest.map(decodeURIComponent) };
  }

  let current = null;
  async function route() {
    const { name, params } = parse();
    const page = PAGES[name] || PAGES.home;
    document.body.classList.remove('menu-open');
    U.$$('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.r === (page.nav || name)));
    document.getElementById('pageTitle').textContent = page.title || 'Basic Pathshala - NMMS';
    document.getElementById('topRight').innerHTML = '';
    if (current && current.leave) try { current.leave(); } catch (e) { /* ignore */ }
    current = page;
    // a fresh host per page, so listeners from the previous page never pile up
    const host = document.createElement('div');
    host.innerHTML = '<div class="loading"><span class="spin"></span> लोड हो रहा है…</div>';
    view.replaceChildren(host);
    try { await page.render(host, params); } catch (e) {
      console.error(e);
      host.innerHTML = `<div class="card"><h2>⚠️ त्रुटि / Error</h2><p class="mono">${U.esc(e.message || e)}</p></div>`;
    }
    window.scrollTo(0, 0);
  }

  document.getElementById('menuBtn').onclick = () => document.body.classList.toggle('menu-open');
  document.addEventListener('click', (e) => {
    if (document.body.classList.contains('menu-open') && !e.target.closest('#sidebar') && !e.target.closest('#menuBtn')) document.body.classList.remove('menu-open');
  });
  window.addEventListener('hashchange', route);

  if (window.pdfjsLib) pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

  window.APP = { route, go: (h) => { if (location.hash === h) route(); else location.hash = h; } };
  seed().then(route).catch((e) => { console.error(e); route(); });
})();
