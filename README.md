# Sweet Alba Absensi

Aplikasi absensi staff berbasis React + Firebase untuk Firebase free tier.

Catatan penting:

- Tidak memakai Cloud Functions.
- Login dan absensi dilakukan dari client.
- Keamanan tetap mengandalkan Firebase Auth, Firestore rules, dan disiplin operasional.
- Untuk anti-spoofing GPS/backdate yang benar-benar kuat, tetap dibutuhkan backend server-side.

## Prasyarat

- Node.js 20+
- pnpm
- Firebase CLI (`npm i -g firebase-tools`)
- Project Firebase aktif (default app id: `sweet-alba-absensi`)

## Setup Frontend

1. Install dependency frontend:

```bash
pnpm install
```

2. Buat `.env` dari `.env.example`, lalu isi semua variabel Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
VITE_FIREBASE_FUNCTIONS_REGION=asia-southeast1
```

3. Jalankan frontend:

```bash
pnpm dev
```

## Setup Firebase Free Tier

1. Aktifkan Firebase Authentication:

```bash
Firebase Console > Authentication > Sign-in method > Anonymous
```

2. Pastikan Firestore aktif.

3. Deploy Firestore rules jika perlu:

```bash
firebase deploy --only firestore:rules
```

## Catatan Operasional

- Koleksi `apps/{appId}/users` dipakai sebagai sumber login oleh aplikasi.
- Password masih disimpan plain text mengikuti struktur data sekarang. Untuk produksi, sebaiknya migrasi ke hash password.
- Tanpa backend server-side, validasi lokasi dan waktu tetap bisa dimanipulasi di perangkat client.

## Validasi Cepat

```bash
pnpm build
pnpm exec eslint src/App.jsx src/components/LoginScreen.jsx src/lib/firebase.js public/firebase-messaging-sw.js
```
