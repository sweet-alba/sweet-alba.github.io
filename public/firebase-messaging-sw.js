/* global firebase, importScripts, clients */

importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBJ_8_eZLE4MsMDKSiOsDWk1F5xd570mxg',
  authDomain: 'sweet-alba.firebaseapp.com',
  projectId: 'sweet-alba',
  storageBucket: 'sweet-alba.firebasestorage.app',
  messagingSenderId: '12921503035',
  appId: '1:12921503035:web:e0f6360862fe9d33700b1e'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(notification.title || 'Pengumuman Baru', {
    body: notification.body || 'Ada pengumuman baru dari admin.',
    icon: '/vite.svg',
    badge: '/vite.svg',
    data: {
      url: data.url || '/'
    }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
      return undefined;
    })
  );
});
