import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { db, getFirebaseMessaging } from './firebase';

const APP_ID = 'sweet-alba-absensi';

function isNotificationAvailable() {
  return typeof window !== 'undefined'
    && 'Notification' in window
    && 'serviceWorker' in navigator;
}

export async function registerNotificationToken(currentUser) {
  if (!currentUser || currentUser.role === 'admin' || !isNotificationAvailable()) {
    return { ok: false, reason: 'unsupported-or-admin' };
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('VITE_FIREBASE_VAPID_KEY belum diisi. Push notification belum aktif.');
    return { ok: false, reason: 'missing-vapid-key' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'permission-denied' };
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = await getFirebaseMessaging();
  if (!messaging) return { ok: false, reason: 'messaging-unsupported' };

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration
  });

  if (!token) return { ok: false, reason: 'empty-token' };

  await setDoc(doc(db, 'apps', APP_ID, 'notificationTokens', token), {
    token,
    userId: currentUser.id,
    userName: currentUser.name,
    role: currentUser.role,
    updatedAt: serverTimestamp(),
    userAgent: navigator.userAgent
  }, { merge: true });

  return { ok: true, token };
}

export async function listenForegroundNotifications(onNotification) {
  if (!isNotificationAvailable()) return () => {};

  const messaging = await getFirebaseMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    onNotification?.(payload);
  });
}
