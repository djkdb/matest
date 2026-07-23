/* 서비스워커 푸시 핸들러 — 생성된 워크박스 SW에 importScripts로 합쳐진다.
 * 백엔드 푸시 서버(web-push, VAPID)가 payload를 보내면 이 핸들러가 알림을 띄우고,
 * 클릭 시 앱 창을 포커스/오픈한다. (백엔드 없이도 로컬 showNotification은 별개로 동작) */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: '시험 마스터', body: event.data && event.data.text ? event.data.text() : '' };
  }
  const title = data.title || '시험 마스터';
  const options = {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag,
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) {
          if (client.navigate) {
            try {
              await client.navigate(url);
            } catch (e) {
              /* 무시 */
            }
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })()
  );
});
