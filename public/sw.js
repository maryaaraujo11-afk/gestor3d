const CACHE = 'gestor3d-v155';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isAppShell = req.mode === 'navigate' ||
    ['/','/index.html','/sw.js','/manifest.webmanifest','/version.json'].includes(url.pathname);

  if (isAppShell) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            // Clone synchronously, before any consumer can read the response body.
            const cacheCopy = response.clone();
            event.waitUntil(
              caches.open(CACHE).then(cache => cache.put(req, cacheCopy)).catch(() => {})
            );
          }
          return response;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (response.ok) {
          const cacheCopy = response.clone();
          event.waitUntil(
            caches.open(CACHE).then(cache => cache.put(req, cacheCopy)).catch(() => {})
          );
        }
        return response;
      });
    })
  );
});
