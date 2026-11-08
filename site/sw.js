const CACHE = 'neon-orbit-mobile-v51';
const FILES = [
  './', './index.html', './mobile.css?v=75', './manifest.webmanifest',
  './styles.css?v=75', './core.js?v=75', './game.js?v=75', './audio.js?v=75', './voices.js?v=75',
  './assets/vega.webp', './assets/wayfarer.webp', './assets/wayfarer-volumetric.png', './assets/sentinel.webp',
  './assets/interceptor.webp', './assets/sentry.webp', './assets/heavy.webp',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('neon-orbit-mobile-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(new Request(event.request, {cache:'no-store'})).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(() => Response.error())));
});
