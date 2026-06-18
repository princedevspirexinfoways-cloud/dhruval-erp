// Enhanced Service Worker for ERP System PWA
// Bhai, yeh service worker offline functionality ke liye hai

const CACHE_VERSION = '1.3.0';
const CACHE_NAME = `erp-system-v${CACHE_VERSION}`;
const STATIC_CACHE = `erp-static-v${CACHE_VERSION}`;
const API_CACHE = `erp-api-v${CACHE_VERSION}`;
const RUNTIME_CACHE = `erp-runtime-v${CACHE_VERSION}`;
const SERVER_BASE_URL = 'https://server.dhruvalexim.com';

// Critical assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/favicon-32x32.png',
  '/icons/favicon-16x16.png',
  '/icons/apple-touch-icon-180x180.png',
];

// API endpoints to cache for offline use
const CACHE_API_ENDPOINTS = [
  '/api/v1/dashboard/stats',
  '/api/v1/inventory',
  '/api/v1/sales/stats',
  '/api/v1/purchase/stats',
  '/api/v1/dashboard/activities',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  
  const currentCaches = [STATIC_CACHE, API_CACHE, RUNTIME_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests
  if (url.href.includes(SERVER_BASE_URL)) {
    // API requests
    event.respondWith(handleApiRequest(event.request));
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)$/)) {
    // Static assets
    event.respondWith(handleStaticAssets(event.request));
  } else {
    // Page requests
    event.respondWith(handlePageRequest(event.request));
  }
});

// Handle API requests with caching strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for critical endpoints
      if (CACHE_API_ENDPOINTS.some(endpoint => pathname.includes(endpoint))) {
        const cache = await caches.open(API_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    throw new Error(`Network response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('🔄 Service Worker: Network failed, trying cache for:', pathname);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📱 Service Worker: Serving from cache:', pathname);
      return cachedResponse;
    }
    
    // Return offline response for critical endpoints
    if (CACHE_API_ENDPOINTS.some(endpoint => pathname.includes(endpoint))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Offline',
        message: 'You are currently offline. Showing cached data when available.',
        cached: true,
        data: null
      }), {
        status: 503,
        headers: { 
          'Content-Type': 'application/json',
          'X-Served-By': 'ServiceWorker-Offline'
        }
      });
    }
    
    throw error;
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
  try {
    // Try cache first for static assets
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder for images
    if (request.url.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
      return new Response('', { status: 204 });
    }
    
    throw error;
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first for pages
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful page responses
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🔄 Service Worker: Page network failed, trying cache:', request.url);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
      
      // Fallback offline HTML
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Offline - ERP System</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-container { max-width: 400px; margin: 0 auto; }
            .offline-icon { font-size: 64px; margin-bottom: 20px; }
            h1 { color: #333; }
            p { color: #666; margin-bottom: 30px; }
            button { 
              background: #0ea5e9; color: white; border: none; 
              padding: 12px 24px; border-radius: 6px; cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">📱</div>
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Background sync for when connection returns
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(syncCriticalData());
  }
});

// Sync critical data when online
async function syncCriticalData() {
  console.log('📡 Service Worker: Syncing critical data...');
  
  const syncPromises = CACHE_API_ENDPOINTS.map(async (endpoint) => {
    try {
      const response = await fetch(`${SERVER_BASE_URL}${endpoint}`, {
        mode: 'cors',
        credentials: 'include'
      });
      
      if (response.ok) {
        const cache = await caches.open(API_CACHE);
        await cache.put(`${SERVER_BASE_URL}${endpoint}`, response.clone());
        console.log('✅ Service Worker: Synced', endpoint);
      }
    } catch (error) {
      console.log('❌ Service Worker: Sync failed for', endpoint, error);
    }
  });
  
  await Promise.allSettled(syncPromises);
  console.log('🎉 Service Worker: Background sync completed');
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('ERP System', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

console.log('🎉 Service Worker: Enhanced SW loaded successfully!');
