/**
 * NaijaNest service worker.
 *
 * Deliberately conservative. This app is the record of people's money, so the
 * one thing it must never do is show a stale balance as though it were current.
 *
 *   - The app shell is precached so it opens instantly offline.
 *   - Navigations use network-first, falling back to the cached shell.
 *   - API and auth calls are NEVER cached or intercepted. A cached ₦17,000
 *     when the real figure is ₦0 is worse than an error message.
 *
 * Bump CACHE_VERSION on any release that changes the shell.
 */

const CACHE_VERSION = 'naijanest-v3';
const SHELL = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/logo-192.jpg',
  '/favicon.jpg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // Individually, so one missing asset does not fail the whole install.
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/** Anything that could carry money or identity stays off the cache entirely. */
function isLiveData(url) {
  return (
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.pathname.includes('/functions/v1/') ||
    url.pathname.includes('/realtime/') ||
    url.pathname.includes('/storage/v1/')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Supabase and every other origin: let the network handle it untouched.
  if (url.origin !== self.location.origin || isLiveData(url)) return;

  // Navigations: try the network, fall back to the shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then((cached) => cached || Response.error())
      )
    );
    return;
  }

  // Build assets are content-hashed, so a cache hit is always correct.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && (url.pathname.startsWith('/assets/') || SHELL.includes(url.pathname))) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
