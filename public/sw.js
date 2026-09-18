const CACHE = "pixco-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const response = await fetch("./index.html", { cache: "no-cache" });
      if (!response.ok) throw new Error("App shell unavailable");
      const html = await response.text();
      const assets = [
        ...html.matchAll(/(?:src|href)="(\.\/assets\/[^\"]+)"/g),
      ].map((match) => match[1]);
      await cache.addAll([
        "./",
        "./index.html",
        "./icon.svg",
        "./manifest.webmanifest",
        ...assets,
      ]);
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith("pixco-") && name !== CACHE)
          await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (event.request.mode === "navigate") {
        try {
          const response = await fetch(event.request);
          if (response.ok) await cache.put("./index.html", response.clone());
          return response;
        } catch {
          return (await cache.match("./index.html")) || Response.error();
        }
      }
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put(event.request, response.clone());
        return response;
      } catch {
        return Response.error();
      }
    })(),
  );
});
