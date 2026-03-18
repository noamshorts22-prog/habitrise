// Install — cache shell for offline
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate — claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification
self.addEventListener('push', (event) => {
  let data = { title: 'HabitRise', body: '' };
  try { data = event.data.json(); } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/habitrise-logo.png',
      badge: '/habitrise-logo.png',
      vibrate: [200, 100, 200],
      data: { url: '/' },
    })
  );
});

// Click notification — open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('/') && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
