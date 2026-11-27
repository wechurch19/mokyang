/* 홈 화면 설치용 서비스 워커. 서버(구글 스크립트) 요청은 건드리지 않습니다. */
var CACHE = 'pastoral-shell-v13';
var FILES = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/icon.svg'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // 인터넷이 되면 항상 최신 파일(수정한 내용이 바로 반영), 안 되거나 2초 넘게 느리면 저장해 둔 파일로 바로 시작
  e.respondWith(caches.open(CACHE).then(function (c) {
    var net = fetch(req).then(function (res) { if (res && res.ok) c.put(req, res.clone()); return res; });
    var slow = new Promise(function (resolve) {
      setTimeout(function () { c.match(req, { ignoreSearch: true }).then(function (h) { if (h) resolve(h); }); }, 2000);
    });
    return Promise.race([net.catch(function () { return c.match(req, { ignoreSearch: true }).then(function (h) { return h || Promise.reject(); }); }), slow]);
  }));
});

/* 알림을 누르면 앱을 열어 줍니다 */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow('./');
  }));
});
