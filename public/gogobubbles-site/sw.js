const CACHE_NAME = 'gogobubbles-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/website_hero.png',
  '/mobilecarwash.png',
  '/homecleaning.png',
  '/laundry.png',
  '/service_icon.png',
  '/how_it_works_icon.png',
  '/faq_icon.png',
  '/review_icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});