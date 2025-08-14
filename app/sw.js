
// Simple SW: cache index for offline, stale-while-revalidate
const CACHE = 'gclab-v1';
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=> c.addAll(['./','./index.html'])));
});
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  if(req.method!=='GET') return;
  e.respondWith(
    caches.match(req).then(cached=>{
      const fetchP = fetch(req).then(res=>{
        if(res && res.status===200 && res.type==='basic'){
          const copy = res.clone();
          caches.open(CACHE).then(c=> c.put(req, copy));
        }
        return res;
      }).catch(()=> cached);
      return cached || fetchP;
    })
  );
});
