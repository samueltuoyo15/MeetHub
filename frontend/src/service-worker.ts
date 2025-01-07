self.addEventListener('push', (event: any) => {
  const data = event.data?.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/path/to/icon.png', // Replace with your app's icon
  });
});

self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  event.waitUntil(
    (self as any).clients.openWindow(event.action === 'join' ? '/meet/room' : '/')
  );
});
