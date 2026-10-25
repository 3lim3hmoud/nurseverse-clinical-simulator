/* NurseVerse service worker: the whole app is stored on the phone after the first visit, so it opens without internet.
   The version and the file list below are filled in by the build (see vite.config.ts). */
const VERSION = '__VERSION__';
const CACHE = 'nurseverse-' + VERSION;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // one missing file must not stop the whole install
      Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })))),
    ),
  );
  // the new version waits until the player taps "Reload" (the page sends 'skip-waiting')
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('nurseverse-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // the AI server and anything else outside: straight to the network

  // opening the app: the newest page if there is internet, the stored one if not
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./'))),
    );
    return;
  }

  // everything else: the stored copy first (built files have a hash in their name, so they never go stale)
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
