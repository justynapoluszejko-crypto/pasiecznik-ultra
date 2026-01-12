/* Pasiecznik ULTRA – sw.js (bez “wiecznego” cache index.html)
   Cel: GitHub Pages ma zawsze podawać nowy JS/HTML.
*/

const VERSION = "2026-01-12_1";
const CACHE = `pasiecznik-ultra-${VERSION}`;

// Cache tylko “stabilne” assety (bez index.html!)
const ASSETS = [
  "./",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // NAWIGACJA / index.html: zawsze network-first (żeby aktualizacje dochodziły)
  if (req.mode === "navigate" || url.pathname.endsWith("/index.html")) {
    event.respondWith((async () => {
      try {
        return await fetch(req, { cache: "no-store" });
      } catch {
        const cached = await caches.match("./");
        return cached || Response.error();
      }
    })());
    return;
  }

  // Reszta: stale-while-revalidate
  event.respondWith((async () => {
    const cached = await caches.match(req);
    const fetchPromise = fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached);

    return cached || fetchPromise;
  })());
});



