/*
 * کوچ‌نشین — Service Worker (conservative, dev-safe)
 * Strategy:
 *  - Precache: /offline.html + brand icons (install)
 *  - Navigations (HTML): network-first → fallback to cached /offline.html
 *  - Images: stale-while-revalidate (small, immutable-ish)
 *  - NEVER cache: JS, CSS, JSON, API, manifest (keeps Turbopack HMR safe)
 */
const VERSION = "koch-sw-v5-brand-mark";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/logo.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

const IMG_RE = /\.(?:png|jpe?g|gif|webp|svg|ico|avif)$/i;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 1) Page navigations → network-first, offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(async () => {
          const cache = await caches.open(VERSION);
          const cached = await cache.match(OFFLINE_URL);
          return (
            cached ||
            new Response("آفلاین", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        })
    );
    return;
  }

  // 2) Images → stale-while-revalidate (cap the cache).
  if (IMG_RE.test(url.pathname)) {
    event.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              cache.keys().then((keys) => {
                if (keys.length > 120) cache.delete(keys[0]);
              });
              cache.put(req, res.clone());
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // 3) Everything else (JS/CSS/JSON/API/manifest) → pass through untouched.
});
