/* Pasiecznik ULTRA – Service Worker (GitHub Pages friendly)
   - względne ścieżki (./)
   - usuwa stare cache
   - nawigacja (HTML) = network-first (zawsze próbuje pobrać najnowszą wersję)
*/

const CACHE_VERSION = "v11"; // <- zwiększaj, gdy chcesz wymusić odświeżenie na wszystkich
const CACHE_NAME = `pasiecznik-ultra-${CACHE_VERSION}`;

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim();
    })()
  );
});

// Network-first dla nawigacji (index.html), cache-first dla reszty
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ignoruj inne domeny
  if (url.origin !== self.location.origin) return;

  // NAWIGACJA (otwieranie aplikacji / przełączanie widoków)
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req, { cache: "no-store" });
          const cache = await caches.open(CACHE_NAME);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match("./index.html");
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // ASSETY: cache-first (szybko), a w tle aktualizacja gdy się uda
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;

      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch (e) {
        return cached || Response.error();
      }
    })()
  );
});
