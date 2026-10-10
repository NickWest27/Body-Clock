/* Offline cache for Body Clock. Serves the saved copy immediately and refreshes it in the background,
   so an update arrives the next time the app is opened. Change VERSION when you ship a new build. */
const VERSION = '2026-10-10.3';
const CACHE = 'body-clock-' + VERSION;
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k.indexOf('body-clock-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;
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
