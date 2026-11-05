/* Local media survive a reload without putting videos in localStorage. No credentials are stored here. */
(() => {
  'use strict';
  const open = () => new Promise((resolve, reject) => {
    const r = indexedDB.open('bca-editor-media', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  async function run(mode, work) {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('files', mode), request = work(tx.objectStore('files'));
        tx.oncomplete = () => resolve(request?.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Medya kaydedilemedi.'));
      });
    } finally { db.close(); }
  }
  window.BCA_ASSETS = {
    put: (path, file) => run('readwrite', s => s.put(file, path)),
    remove: path => run('readwrite', s => s.delete(path)),
    clear: () => run('readwrite', s => s.clear()),
    async all() {
      const db = await open();
      try { return await new Promise((resolve, reject) => {
        const tx = db.transaction('files'), s = tx.objectStore('files'), keys = s.getAllKeys(), values = s.getAll();
        tx.oncomplete = () => resolve(Object.fromEntries(keys.result.map((k,i) => [k, values.result[i]])));
        tx.onerror = () => reject(tx.error);
      }); } finally { db.close(); }
    }
  };
})();
