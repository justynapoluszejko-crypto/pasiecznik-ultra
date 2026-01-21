const CACHE_NAME = 'pasiecznik-ultra-v4-mapa'; // Zmieniłem wersję, aby wymusić aktualizację

// Lista plików do zapisania w pamięci telefonu (Offline)
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  // Jeśli masz ikony, odkomentuj poniższe linie (usuń // na początku):
  // './icon-192.png',
  // './icon-512.png'
];

// 1. Instalacja: Pobiera pliki do pamięci
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Wymusza natychmiastowe przejęcie kontroli przez nowy SW
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Otwarto cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Aktywacja: Usuwa stare wersje aplikacji (sprzątanie)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Usuwanie starego cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Przejmuje kontrolę nad wszystkimi otwartymi kartami
});

// 3. Pobieranie (Fetch): Działa offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jeśli plik jest w cache (np. w lesie), zwróć go
        if (response) {
          return response;
        }
        // Jeśli nie, pobierz z internetu
        return fetch(event.request);
      })
  );
});
