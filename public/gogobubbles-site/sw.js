const CACHE_NAME = 'gogobubbles-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/booking.html',
  '/manifest.json',
  '/website_hero.webp',
  '/website_hero.png',
  '/mobilecarwash.webp',
  '/mobilecarwash.png',
  '/homecleaning.webp',
  '/homecleaning.png',
  '/laundry.webp',
  '/laundry.png',
  '/service_icon.png',
  '/how_it_works_icon.png',
  '/review_icon.png',
  '/faq_icon.png',
  '/favicon.ico',
  '/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@400;600;700;800&display=swap'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache failed:', error);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync for offline bookings
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New booking confirmation from GoGoBubbles!',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Booking',
        icon: '/android-chrome-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/android-chrome-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('GoGoBubbles', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/booking.html')
    );
  }
});

// Background sync function
async function doBackgroundSync() {
  try {
    // Get offline bookings from IndexedDB or localStorage
    const offlineBookings = await getOfflineBookings();
    
    for (let booking of offlineBookings) {
      // Send booking to server
      await sendBookingToServer(booking);
    }
    
    // Clear offline bookings after successful sync
    await clearOfflineBookings();
    
    // Show success notification
    self.registration.showNotification('GoGoBubbles', {
      body: 'Offline bookings synced successfully!',
      icon: '/android-chrome-192x192.png'
    });
    
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for background sync
async function getOfflineBookings() {
  // This would typically use IndexedDB
  // For now, we'll simulate getting from localStorage
  return [];
}

async function sendBookingToServer(booking) {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Sending booking to server:', booking);
      resolve();
    }, 1000);
  });
}

async function clearOfflineBookings() {
  // Clear offline bookings after successful sync
  console.log('Clearing offline bookings');
} 