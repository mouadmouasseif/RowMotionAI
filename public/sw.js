const CACHE_VERSION = "rowmotion-shell-v2";
const OFFLINE_URL = "/offline";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Ne jamais intercepter Firebase, les API, les vidéos ou les routes d’administration serveur.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin/") || /\.(mp4|mov|webm|avi)$/i.test(url.pathname) || url.hostname.includes("firebasestorage") || url.hostname.includes("googleapis")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  const staticAsset = url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || /\.(css|js|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname);
  if (!staticAsset) return;
  event.respondWith(caches.match(request).then(async (cached) => {
    try { const response=await fetch(request); if(response.ok&&response.type==="basic"){const copy=response.clone();event.waitUntil(caches.open(CACHE_VERSION).then(cache=>cache.put(request,copy)));} return response; }
    catch(error){if(cached)return cached;throw error;}
  }));
});
