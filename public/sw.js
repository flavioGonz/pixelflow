// Kill-switch for the old SW - unregister and take no other action
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => {
    e.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        const regs = await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) { client.postMessage({ type: "SW_KILLED" }); }
    })());
});
self.addEventListener("fetch", () => {});
