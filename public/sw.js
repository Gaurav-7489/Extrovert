const CACHE_NAME = "extrovert-static-v2";
const STATIC_ASSETS = ["/icon-192.png", "/icon-512.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStaticAsset = url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon-192.png" ||
    url.pathname === "/icon-512.png" ||
    url.pathname === "/manifest.json";
  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || !response.ok || response.type !== "basic") return response;
        const copy = response.clone();
        void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { title: "Extrovert", body: event.data?.text() || "You have a new dating update." }; }
  const title = payload.title || "Extrovert";
  const options = {
    body: payload.body || "You have a new dating update.",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    image: payload.image,
    tag: payload.tag,
    data: payload.data || {},
    requireInteraction: Boolean(payload.requireInteraction),
    silent: Boolean(payload.silent),
    timestamp: payload.timestamp || Date.now()
  };
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const targetUrl = options.data?.url;
    let targetPath = null;
    if (typeof targetUrl === "string") {
      try { targetPath = new URL(targetUrl, self.location.origin).pathname; } catch {}
    }
    const focused = clients.find((client) => {
      if (!targetPath || !client.focused) return false;
      try { return new URL(client.url).pathname === targetPath; } catch { return false; }
    });
    if (focused) return undefined;
    return self.registration.showNotification(title, options);
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url;
  if (typeof targetUrl !== "string") return;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    let url;
    try { url = new URL(targetUrl, self.location.origin); } catch { return undefined; }
    if (url.origin !== self.location.origin) return undefined;
    const existing = clients.find((client) => {
      try { return new URL(client.url).pathname === url.pathname; } catch { return false; }
    });
    if (existing) return existing.focus();
    return self.clients.openWindow(url.href);
  }));
});
