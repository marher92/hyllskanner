// Offline: allt sparas i telefonen efter första besöket. Byt VERSION när filer ändras.
const VERSION = 'hyllskanner-v4';
const FILES = ['./', 'index.html', 'app.js', 'engine.js', 'map.js', 'data.js', 'prefixes.js', 'glossary.js',
  'manifest.webmanifest', 'logo.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'vendor/tesseract.min.js', 'vendor/worker.min.js', 'vendor/tesseract-core-lstm.wasm.js',
  'vendor/tesseract-core-simd-lstm.wasm.js', 'vendor/lang/eng.traineddata.gz'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
