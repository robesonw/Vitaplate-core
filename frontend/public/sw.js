// VitaPlate Service Worker
// Clears all old caches on install — forces fresh loads every time

const CACHE_VERSION = 'v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => {
        console.log('Clearing old cache:', key);
        return caches.delete(key);
      }))
    ).then(() => self.clients.claim())
  );
});

// Network-first for everything — no caching
self.addEventListener('fetch', (event) => {
  // Don't intercept non-GET or cross-origin requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Always go to network — let browser handle caching via headers
  event.respondWith(fetch(event.request));
});
