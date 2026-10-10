const CACHE = "hanlu-v5";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const index = await fetch("/strokes/index.json").then((response) => response.json());
      const strokes = index.map((char) => `/strokes/${encodeURIComponent(char)}.json`);
      await cache.addAll(["/offline.html", "/offline-lesson.html", "/icons/icon-192.png", "/icons/icon-512.png", "/strokes/index.json", ...strokes]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/strokes/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.headers.get("rsc") === "1" || request.headers.get("next-router-prefetch") === "1" || request.headers.get("next-router-segment-prefetch") === "1") {
    return;
  }

  event.respondWith(networkFirstDocument(request));
});

function documentKey(url) {
  const clean = new URL(url);
  clean.searchParams.delete("_rsc");
  clean.hash = "";
  return new Request(clean.toString());
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirstDocument(request) {
  const cache = await caches.open(CACHE);
  const key = documentKey(request.url);
  try {
    const response = await fetch(key);
    const type = response.headers.get("content-type") ?? "";
    if (response.ok && !type.includes("text/x-component")) await cache.put(key, response.clone());
    return response;
  } catch {
    const cached = await cache.match(key);
    if (cached) return cached;
    const path = new URL(request.url).pathname;
    if (path.startsWith("/lesson/") || path.startsWith("/talk/")) {
      return (await cache.match("/offline-lesson.html")) || (await cache.match("/offline.html"));
    }
    return (await cache.match("/offline.html"));
  }
}
