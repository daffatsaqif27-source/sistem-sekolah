const CACHE_NAME = 'agentix-ai-sekolah-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Cache-first untuk file HTML/manifest sendiri, tapi selalu ambil data terbaru (network) untuk panggilan ke webhook n8n.
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  const isApiCall = url.includes('/webhook/');

  if (isApiCall) {
    // Jangan cache data API - selalu ambil yang terbaru
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    )
  );
});
