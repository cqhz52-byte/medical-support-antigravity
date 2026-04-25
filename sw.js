const CACHE_NAME = 'clinical-support-v6.3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './hospitals.json',
  './logo-curaway.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
    // 注意：这里不再调用 self.skipWaiting()
    // 等待用户点击"立即更新"按钮后，通过 message 事件手动触发 skipWaiting
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
  }
});

// V3.0 热更新侦听
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ====== Web Push 后台推送处理 ======

// 收到后台推送时（即使 App 在后台/锁屏也会触发）
self.addEventListener('push', (event) => {
  let data = { title: '🚨 新的跟台派单', body: '您收到一条新的手术调度指令' };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '您收到一条新的手术调度指令',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    tag: 'dispatch-alert',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'view', title: '👁️ 查看详情' },
      { action: 'confirm', title: '✅ 我已收到' }
    ],
    data: {
      url: self.registration.scope
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || '🚨 新的跟台派单', options)
  );
});

// 用户点击通知时，打开或聚焦到 App
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || self.registration.scope;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 如果已经有窗口打开了，聚焦它
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      // 否则打开新窗口
      return self.clients.openWindow(targetUrl);
    })
  );
});
