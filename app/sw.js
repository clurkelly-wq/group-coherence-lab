
// v10.6.3 service worker — stale-while-revalidate for index
const CACHE = 'gclab-v1063';
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(['./','./index.html'])));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=> Promise.all(keys.map(k=> k===CACHE?null:caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e)=>{
  const url = new URL(e.request.url);
  if (url.origin === location.origin && (url.pathname === '/' || url.pathname.endsWith('/index.html'))){
    e.respondWith(
      caches.match('./index.html').then(cached => {
        const fetcher = fetch(e.request).then(resp => {
          caches.open(CACHE).then(c=> c.put('./index.html', resp.clone()));
          return resp;
        }).catch(()=> cached);
        return cached || fetcher;
      })
    );
  }
});
