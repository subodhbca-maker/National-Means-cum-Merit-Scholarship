/* Basic Pathshala - NMMS : IndexedDB storage layer */
(function () {
  const DB_NAME = 'bp_nmms';
  const DB_VER = 1;
  const STORES = ['questions', 'papers', 'results', 'settings'];
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = () => {
        const db = req.result;
        STORES.forEach((s) => {
          if (!db.objectStoreNames.contains(s)) {
            const st = db.createObjectStore(s, { keyPath: 'id' });
            if (s === 'questions') { st.createIndex('subject', 'subject'); st.createIndex('difficulty', 'difficulty'); }
            if (s === 'results') st.createIndex('paperId', 'paperId');
          }
        });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbp;
  }

  function tx(store, mode, fn) {
    return open().then((db) => new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const st = t.objectStore(store);
      let out;
      Promise.resolve(fn(st)).then((v) => { out = v; });
      t.oncomplete = () => resolve(out);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }

  function reqP(r) {
    return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  }

  const DB = {
    all(store) { return tx(store, 'readonly', (st) => reqP(st.getAll())); },
    get(store, id) { return tx(store, 'readonly', (st) => reqP(st.get(id))); },
    put(store, obj) { return tx(store, 'readwrite', (st) => { st.put(obj); return obj; }); },
    putMany(store, arr) { return tx(store, 'readwrite', (st) => { arr.forEach((o) => st.put(o)); return arr.length; }); },
    del(store, id) { return tx(store, 'readwrite', (st) => { st.delete(id); }); },
    delMany(store, ids) { return tx(store, 'readwrite', (st) => { ids.forEach((id) => st.delete(id)); }); },
    clear(store) { return tx(store, 'readwrite', (st) => { st.clear(); }); },
    count(store) { return tx(store, 'readonly', (st) => reqP(st.count())); },
    byIndex(store, index, value) { return tx(store, 'readonly', (st) => reqP(st.index(index).getAll(value))); },

    async getSetting(key, def) {
      const r = await DB.get('settings', key);
      return r ? r.value : def;
    },
    setSetting(key, value) { return DB.put('settings', { id: key, value }); },

    async exportAll() {
      const out = { app: 'Basic Pathshala - NMMS', version: 1, exportedAt: new Date().toISOString() };
      for (const s of STORES) out[s] = await DB.all(s);
      out.settings = out.settings.filter((s) => s.id !== 'geminiKey');
      return out;
    },
    async importAll(data, merge) {
      for (const s of STORES) {
        if (!Array.isArray(data[s])) continue;
        if (!merge && s !== 'settings') await DB.clear(s);
        await DB.putMany(s, data[s]);
      }
    }
  };

  window.DB = DB;
})();
