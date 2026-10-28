/* Offline cache for Body Clock. Serves the saved copy immediately and refreshes it in the background,
   so an update arrives the next time the app is opened. Change VERSION when you ship a new build.
   The classic app under classic/ has its own service worker and cache, which this one leaves alone. */
const VERSION = '2026-10-28.40';
/* one cache per install location, so a preview copy under next/ and the main app never touch each other */
const PREFIX = 'bc2-' + (self.registration.scope.indexOf('/next/') >= 0 ? 'next-' : 'main-');
const CACHE = PREFIX + VERSION;
const ASSETS = ['./', './index.html', './crew-rest.html', './engine.js', './airports.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      /* only our own older builds; the classic app's caches are left alone */
      return Promise.all(keys.filter(function(k){ return k.indexOf(PREFIX) === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
  if(url.pathname.indexOf('/classic/') >= 0) return;
  if(url.searchParams.has('check')) return;
  e.respondWith(
    caches.open(CACHE).then(function(cache){
      return cache.match(req, {ignoreSearch:true}).then(function(cached){
        var net = fetch(req, {cache:'no-cache'}).then(function(res){
          if(res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function(){
          return cached || (req.mode === 'navigate' ? cache.match('./index.html') : Response.error());
        });
        return cached || net;
      });
    })
  );
});
