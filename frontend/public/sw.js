const CACHE_NAME = 'aumoha-static-v2';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico'
];

// Install Event - Pre-cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Handle caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip browser extensions or other protocols (like chrome-extension://)
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // Exclude Next.js dev server files and HMR streams to prevent rendering/reloading hangs in development
  if (url.pathname.startsWith('/_next') || url.pathname.includes('webpack-hmr')) {
    return;
  }

  // APIs, authenticated requests and page documents always use the network.
  // This also clears old v1 private-response caches on activation above.
  if (url.pathname.startsWith('/api/') || event.request.headers.has('Authorization') ||
      event.request.mode === 'navigate' || url.pathname.startsWith('/_next/')) return;
  if (!/\.(png|jpg|jpeg|webp|svg|ico|css|js|woff2?)$/i.test(url.pathname)) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, response.clone());
    }
    return response;
  })());
});
