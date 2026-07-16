/* ================================================================
   KIRANA BASKET – sw.js
   Minimal service worker: makes the app installable (PWA) and
   caches the basic app shell so it opens even on a flaky connection.
   Product/order data always comes fresh from Firestore, not cache.
   ================================================================ */

const CACHE_NAME = "kirana-basket-shell-v3";
const SHELL_FILES = [
  "./",
  "index.html",
  "manifest.json",
  "css/store.css",
  "js/core/config.js",
  "js/core/Db.js",
  "js/core/notifications.js",
  "js/store/state.js",
  "js/store/ui-core.js",
  "js/store/banners-categories.js",
  "js/store/products.js",
  "js/store/cart.js",
  "js/store/checkout.js",
  "js/store/main.js",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(SHELL_FILES.map((f) => cache.add(f).catch(() => {})))
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

/* Network-first for HTML/JS (so admin changes + code fixes show up),
   falling back to cache only when offline. */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Never intercept Firebase/Firestore calls — those must always hit the network.
  if (e.request.url.includes("firestore.googleapis.com") ||
      e.request.url.includes("firebaseio.com")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => {
          if (cached) return cached;
          // Offline + not cached: for page navigations, fall back to the app shell.
          if (e.request.mode === "navigate") return caches.match("index.html");
        })
      )
  );
});
