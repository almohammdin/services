const PREFIX='tarjuman-shell-'+new URL(self.registration.scope).pathname;
const CACHE=PREFIX+'v2';
const urls=['./','./app.js','./service.js','./style.css','./icon.svg','./capture-worklet.js'].map(p=>new URL(p,self.location.href).href);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(urls)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||!urls.includes(u.href)||e.request.headers.has('Authorization'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(e.request,r.clone()));return r;}).catch(()=>caches.match(e.request)));});
