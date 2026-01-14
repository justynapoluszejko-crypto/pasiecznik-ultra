/* Pasiecznik ULTRA – Service Worker (always-fresh)
   Cel: telefon/PWA ma zawsze brać najnowszą wersję, nie trzymać starych plików.
*/

'use strict';

const CACHE_PREFIX = 'pasiecznik-ultra-runtime';
const RUNTIME_CACHE = `${CACHE_PREFIX}`;

// 1) Instalacja: od razu aktywuj nowego SW
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2) Aktywacja: przejmij kontrolę + usuń WSZYSTKIE stare cache
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k))); // kasuje wszystkie cache
    await self.clients.claim();
  })());
});

// 3) Fetch: NETWORK FIRST + cache runtime jako fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // tylko GET
  if (req.method !== 'GET') return;

  // tylko te same origin (Twoja domena GitHub Pages)
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    // NETWORK FIRST: zawsze próbuj pobrać świeże z sieci
    try {
      // no-store pomaga uniknąć HTTP cache w przeglądarce
      const fresh = await fetch(req, { cache: 'no-store' });

      // Zapisz kopię do cache runtime (dla awaryjnego offline)
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(req, fresh.clone());

      return fresh;
    } catch (err) {
      // offline / błąd sieci -> spróbuj z cache
      const cached = await caches.match(req);
      if (cached) return cached;

      // jeśli to nawigacja (index.html), a nie ma cache -> zwróć zwykły błąd
      return new Response('Brak połączenia i brak cache.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});

// 4) Opcjonalnie: pozwala stronie wysłać message "SKIP_WAITING"
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
