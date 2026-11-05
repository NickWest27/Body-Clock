/* BC New moved to the main address. This retires the old preview's offline copy: it clears its cache,
   removes itself and reloads open pages, so they show the moved notice. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k.indexOf('bc2-next-') === 0; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.registration.unregister(); })
      .then(function(){ return self.clients.matchAll({type:'window'}); })
      .then(function(list){ list.forEach(function(c){ try{ c.navigate(c.url); }catch(err){} }); })
  );
});
