const CACHE_NAME = 'opstracka-v3';

const urlsToCache = [
  '/',
  '/index.html',
];

// ============================================================
// INSTALL
// ============================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing:', CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );

  // IMPORTANT:
  // Do NOT call self.skipWaiting() here.
  //
  // The new Service Worker must remain in the WAITING state
  // until the user clicks "Update App".
});

// ============================================================
// ACTIVATE
// ============================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating:', CACHE_NAME);

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );

  // Take control of open pages.
  self.clients.claim();
});

// ============================================================
// MESSAGE
// ============================================================

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] User requested app update.');

    self.skipWaiting();
  }
});

// ============================================================
// FETCH
// ============================================================

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests.
  if (request.method !== 'GET') {
    return;
  }

  // ==========================================================
  // NAVIGATION REQUESTS
  // ==========================================================
  //
  // Always try the network first.
  // This helps ensure users receive the latest index.html.
  //

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );

    return;
  }

  // ==========================================================
  // STATIC ASSETS
  // ==========================================================
  //
  // Cache first.
  // Vite-generated hashed assets are safe to cache because
  // a new deployment generates new filenames.
  //

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          // Only cache successful basic responses.
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          // If network fails and there is no cached version,
          // allow the request to fail normally.
          throw new Error(
            '[SW] Network request failed and no cached response exists.'
          );
        });
    })
  );
});