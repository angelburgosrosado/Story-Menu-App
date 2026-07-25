/**
 * Service Worker — Task 7.12 (PWA)
 * Cache-first strategy for static assets, network-first for API calls.
 */

const CACHE_NAME = 'story-menu-v1';
const STATIC_CACHE = 'story-menu-static-v1';
const API_CACHE = 'story-menu-api-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

const API_ROUTES = ['/api/v1/', '/api/public/'];

// Install: cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
                    .map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch: cache strategy based on request type
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip Chrome extension requests
    if (!url.protocol.startsWith('http')) return;

    // API requests: network-first with cache fallback
    if (API_ROUTES.some(route => url.pathname.startsWith(route))) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(API_CACHE).then((cache) => {
                        cache.put(request, clone);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );
        return;
    }

    // Static assets: cache-first
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((response) => {
                // Don't cache non-success responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const clone = response.clone();
                caches.open(STATIC_CACHE).then((cache) => {
                    cache.put(request, clone);
                });

                return response;
            });
        })
    );
});

// Listen for messages from main thread
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
