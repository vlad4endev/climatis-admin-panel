// Service Worker for static asset caching
const CACHE_NAME = 'climatis-static-v1';

// Static assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// File extensions to cache on fetch
const CACHEABLE_EXTENSIONS = ['.js', '.css', '.woff', '.woff2', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.svg', '.ico'];

function isCacheableRequest(url) {
  // Don't cache API calls, Supabase requests, or data fetches
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) return false;
  
  // Cache static assets by extension
  return CACHEABLE_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
}

// Install: pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (!isCacheableRequest(url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse); // Fallback to cache if offline

        return cachedResponse || fetchPromise;
      })
    )
  );
});
