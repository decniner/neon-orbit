const CACHE = 'neon-orbit-mobile-v2';
const FILES = [
  './', './index.html', './mobile.css', './manifest.webmanifest',
  './styles.css', './core.js', './game.js', './audio.js', './voices.js',
  './assets/vega.webp', './assets/wayfarer.webp', './assets/sentinel.webp',
  './assets/interceptor.webp', './assets/sentry.webp', './assets/heavy.webp',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('neon-orbit-mobile-') && key !== CACHE).map(key => caches.delete(key))))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(event.request, copy)); }
    return response;
  }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
