// v10.6.1 service worker — offline cache (stale-while-revalidate)
const CACHE='gclab-v10.6.1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html'])).catch(()=>null));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;e.respondWith(caches.match(req).then(cached=>{const fetchPromise=fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});return res}).catch(()=>cached||Promise.reject('offline'));return cached||fetchPromise}))});