import admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();

const db = admin.firestore();
const APP_ID_FALLBACK = 'sweet-alba-absensi';
const CLUSTER_LOCATION = { lat: -6.3854271, lng: 107.038834 };
const MAX_RADIUS_METERS = 1000;

const SHIFTS = {
  sec1: { role: 'security', name: 'Shift 1 (08:00 - 20:00)', expectedInHour: 8, expectedInMinute: 0 },
  sec2: { role: 'security', name: 'Shift 2 (20:00 - 08:00)', expectedInHour: 20, expectedInMinute: 0 },
  cln1: { role: 'cleaner', name: 'Shift 1 (08:00 - 20:00)', expectedInHour: 8, expectedInMinute: 0 },
  cln2: { role: 'cleaner', name: 'Shift 2 (20:00 - 08:00)', expectedInHour: 20, expectedInMinute: 0 }
};

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(dPhi / 2) * Math.sin(dPhi / 2)
    + Math.cos(phi1) * Math.cos(phi2)
    * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function ensureValidLocation(location) {
  if (!location || typeof location !== 'object') {
    throw new HttpsError('invalid-argument', 'Lokasi tidak valid.');
  }

  const lat = Number(location.lat);
  const lng = Number(location.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new HttpsError('invalid-argument', 'Koordinat lokasi tidak valid.');
  }

  return { lat, lng };
}

function getJakartaClock(nowDate) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(nowDate);

  const lookup = {};
  for (const part of parts) {
    lookup[part.type] = part.value;
  }

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute)
  };
}

function getIdDate(nowDate) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  }).format(nowDate);
}

function ensureAuthenticated(request) {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Anda harus login.');
  }

  return {
    uid: request.auth.uid,
    token: request.auth.token || {}
  };
}

function ensureAppAccess(requestedAppId, tokenAppId) {
  const appId = requestedAppId || APP_ID_FALLBACK;
  if (!tokenAppId || tokenAppId !== appId) {
    throw new HttpsError('permission-denied', 'Akses aplikasi tidak valid.');
  }
  return appId;
}

export const loginWithCredentials = onCall({ region: 'asia-southeast1' }, async (request) => {
  const username = String(request.data?.username || '').trim();
  const password = String(request.data?.password || '').trim();
  const appId = String(request.data?.appId || APP_ID_FALLBACK);

  if (!username || !password) {
    throw new HttpsError('invalid-argument', 'Username dan password wajib diisi.');
  }

  const usersRef = db.collection('apps').doc(appId).collection('users');
  const userSnapshot = await usersRef.where('username', '==', username).limit(1).get();

  if (userSnapshot.empty) {
    throw new HttpsError('permission-denied', 'Username atau password salah.');
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();

  if (userData.password !== password) {
    throw new HttpsError('permission-denied', 'Username atau password salah.');
  }

  if (!['admin', 'security', 'cleaner'].includes(userData.role)) {
    throw new HttpsError('failed-precondition', 'Role pengguna tidak valid.');
  }

  const claims = {
    appId,
    role: userData.role,
    userName: String(userData.name || 'Tanpa Nama'),
    username: String(userData.username || '')
  };

  const customToken = await admin.auth().createCustomToken(userDoc.id, claims);
  return { customToken };
});

export const clockInAttendance = onCall({ region: 'asia-southeast1' }, async (request) => {
  const { uid, token } = ensureAuthenticated(request);
  const appId = ensureAppAccess(String(request.data?.appId || APP_ID_FALLBACK), token.appId);
  const location = ensureValidLocation(request.data?.location);

  const role = String(token.role || '');
  if (!['security', 'cleaner'].includes(role)) {
    throw new HttpsError('permission-denied', 'Role tidak diizinkan melakukan absensi.');
  }

  const shiftId = String(request.data?.shiftId || '').trim();
  const shift = SHIFTS[shiftId];

  if (!shift) {
    throw new HttpsError('invalid-argument', 'Shift tidak valid.');
  }

  if (shift.role !== role) {
    throw new HttpsError('permission-denied', 'Shift tidak sesuai role akun.');
  }

  const distance = getDistanceMeters(location.lat, location.lng, CLUSTER_LOCATION.lat, CLUSTER_LOCATION.lng);
  if (distance > MAX_RADIUS_METERS) {
    throw new HttpsError('failed-precondition', `Di luar area absensi (${Math.round(distance)}m).`);
  }

  const attendancesRef = db.collection('apps').doc(appId).collection('attendances');
  const openRecordSnapshot = await attendancesRef
    .where('userId', '==', uid)
    .where('checkOut', '==', null)
    .limit(1)
    .get();

  if (!openRecordSnapshot.empty) {
    throw new HttpsError('failed-precondition', 'Masih ada absensi aktif yang belum clock out.');
  }

  const now = new Date();
  const jakartaClock = getJakartaClock(now);
  const nowMins = (jakartaClock.hour * 60) + jakartaClock.minute;
  const expectedMins = (shift.expectedInHour * 60) + shift.expectedInMinute;
  const latenessMins = Math.max(0, nowMins - expectedMins);

  await attendancesRef.doc().set({
    userId: uid,
    userName: String(token.userName || 'Tanpa Nama'),
    role,
    shift: shift.name,
    date: getIdDate(now),
    checkIn: admin.firestore.FieldValue.serverTimestamp(),
    checkOut: null,
    latenessMins,
    locationIn: location,
    locationRisk: distance > 200 ? 'high' : 'normal',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true };
});

export const clockOutAttendance = onCall({ region: 'asia-southeast1' }, async (request) => {
  const { uid, token } = ensureAuthenticated(request);
  const appId = ensureAppAccess(String(request.data?.appId || APP_ID_FALLBACK), token.appId);
  const location = ensureValidLocation(request.data?.location);
  const recordId = String(request.data?.recordId || '').trim();

  if (!recordId) {
    throw new HttpsError('invalid-argument', 'recordId wajib diisi.');
  }

  const distance = getDistanceMeters(location.lat, location.lng, CLUSTER_LOCATION.lat, CLUSTER_LOCATION.lng);
  if (distance > MAX_RADIUS_METERS) {
    throw new HttpsError('failed-precondition', `Di luar area absensi (${Math.round(distance)}m).`);
  }

  const attendanceRef = db.collection('apps').doc(appId).collection('attendances').doc(recordId);
  const attendanceSnap = await attendanceRef.get();

  if (!attendanceSnap.exists) {
    throw new HttpsError('not-found', 'Data absensi tidak ditemukan.');
  }

  const attendance = attendanceSnap.data();
  if (attendance.userId !== uid) {
    throw new HttpsError('permission-denied', 'Absensi bukan milik akun ini.');
  }

  if (attendance.checkOut) {
    throw new HttpsError('failed-precondition', 'Absensi sudah ditutup sebelumnya.');
  }

  await attendanceRef.update({
    checkOut: admin.firestore.FieldValue.serverTimestamp(),
    locationOut: location,
    locationRiskOut: distance > 200 ? 'high' : 'normal',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ok: true };
});

export const onAnnouncementCreated = onDocumentCreated({
  document: 'apps/{appId}/announcementLogs/{logId}',
  region: 'asia-southeast1'
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  const appId = event.params.appId;
  const messageText = data.text || 'Ada pengumuman baru';

  // Fetch all tokens
  const tokensSnapshot = await db.collection('apps').doc(appId).collection('notificationTokens').get();
  const tokens = tokensSnapshot.docs.map(doc => doc.id);

  if (tokens.length === 0) return;

  const message = {
    notification: {
      title: 'Pengumuman Baru',
      body: messageText.length > 100 ? messageText.substring(0, 97) + '...' : messageText
    },
    data: {
      url: '/announcement'
    },
    tokens: tokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`${response.successCount} messages were sent successfully`);

    // Clean up failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      const batch = db.batch();
      failedTokens.forEach(t => {
        batch.delete(db.collection('apps').doc(appId).collection('notificationTokens').doc(t));
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error sending multicast message:', error);
  }
});
