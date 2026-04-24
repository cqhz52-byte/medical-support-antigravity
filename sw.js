const CACHE_NAME = 'clinical-support-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon.svg',
  './hospitals.json'
];

// 1. 安装阶段：强行缓存所有系统核心资产
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching Application Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. 激活阶段：清理旧版本尸库，腾出空间
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// 3. 拦截请求：断网兜底降级防御策略
self.addEventListener('fetch', (event) => {
  // 除了 API 请求外，所有静态资产走“网络优先，缓存兜底”策略
  if (!event.request.url.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.warn('[Service Worker] Offline fallback for', event.request.url);
        return caches.match(event.request);
      })
    );
  }
});
