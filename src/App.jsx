import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, addDoc, orderBy, query } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { listenForegroundNotifications, registerNotificationToken } from './lib/notifications';
import { AlertTriangle } from 'lucide-react';
import { Button } from './components/ui';
import LoginScreen from './components/LoginScreen';
import StaffDashboard from './components/StaffDashboard';
import AdminDashboard from './components/AdminDashboard';

// App configuration
const APP_ID = 'sweet-alba-absensi';
export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = sessionStorage.getItem('absensi_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [attendances, setAttendances] = useState([]);
  const [users, setUsers] = useState([]);
  const [announcementLogs, setAnnouncementLogs] = useState([]);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('absensi_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('absensi_theme', theme);
  }, [theme]);

  // 1. Initialize Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error('Auth error:', err);
        setError('Gagal terhubung ke layanan Firebase: ' + err.message);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Attendances from Firestore
  useEffect(() => {
    if (!firebaseUser) return;

    const attendancesRef = collection(db, 'apps', APP_ID, 'attendances');
    const unsubscribe = onSnapshot(attendancesRef, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      data.sort((a, b) => b.checkIn - a.checkIn);
      setAttendances(data);
    }, (error) => {
      console.error('Firestore error:', error);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // 3. Fetch Users from Firestore (for Admin & Login)
  useEffect(() => {
    if (!firebaseUser) return;

    const usersRef = collection(db, 'apps', APP_ID, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setUsers(data);
    }, (err) => {
      console.error('Users snapshot error:', err);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const handleLogin = async ({ username, password }) => {
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      throw new Error('Nomor HP atau password salah!');
    }

    setCurrentUser(user);
    sessionStorage.setItem('absensi_user', JSON.stringify(user));
  };

  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    registerNotificationToken(currentUser).catch((err) => {
      console.warn("Notification setup skipped:", err);
    });
  }, [currentUser]);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    listenForegroundNotifications((payload) => {
      const notification = payload.notification || {};

      if (Notification.permission === 'granted' && notification.title) {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/vite.svg'
        });
      }
    }).then((listener) => {
      if (cancelled) {
        listener?.();
        return;
      }
      unsubscribe = listener;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // 4. Admin Logic: User Management
  const handleUserAction = async (action, userData) => {
    try {
      if (action === 'delete') {
        const docRef = doc(db, 'apps', APP_ID, 'users', userData.id);
        await deleteDoc(docRef);
      } else {
        // For add/update, ensure we have an ID
        const userId = userData.id || `user_${Date.now()}`;
        const docRef = doc(db, 'apps', APP_ID, 'users', userId);

        // Include the ID inside the data for easier reference
        const finalData = { ...userData, id: userId };
        await setDoc(docRef, finalData, { merge: true });
      }
    } catch (err) {
      console.error("User action error:", err);
      alert("Gagal memproses data akun: " + err.message);
    }
  };

  const [announcement, setAnnouncement] = useState('');

  // 4. Fetch Global Settings (Announcement)
  useEffect(() => {
    if (!firebaseUser) return;
    const settingsRef = doc(db, 'apps', APP_ID, 'config', 'global');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setAnnouncement(snapshot.data().announcement || '');
      }
    });
    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;

    const logsRef = collection(db, 'apps', APP_ID, 'announcementLogs');
    const logsQuery = query(logsRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const data = [];
      snapshot.forEach((item) => {
        data.push({ id: item.id, ...item.data() });
      });
      setAnnouncementLogs(data);
    }, (err) => {
      console.error('Announcement logs snapshot error:', err);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const handleUpdateAnnouncement = async (text) => {
    try {
      const settingsRef = doc(db, 'apps', APP_ID, 'config', 'global');
      await setDoc(settingsRef, { announcement: text }, { merge: true });

      await addDoc(collection(db, 'apps', APP_ID, 'announcementLogs'), {
        text,
        createdAt: serverTimestamp(),
        createdBy: currentUser?.name || 'Administrator',
        createdByRole: currentUser?.role || 'admin'
      });
    } catch (err) {
      console.error("Failed to update announcement:", err);
    }
  };

  const handleLogout = () => {
    signOut(auth).catch((err) => console.warn('Sign out error:', err));
    setCurrentUser(null);
    sessionStorage.removeItem('absensi_user');
  };

  const handleClockIn = async (shiftConfig) => {
    if (!firebaseUser || !currentUser) return;

    const now = new Date();

    // 1. Check Geolocation & Geofence
    let location;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch (err) {
      console.warn('Geolocation error:', err);
      alert('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi untuk melakukan absensi.');
      return;
    }

    const expectedTime = new Date(now);
    expectedTime.setHours(shiftConfig.expectedInHour, shiftConfig.expectedInMinute, 0, 0);

    let lateness = 0;
    const diffMs = now.getTime() - expectedTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins > 0) {
      lateness = diffMins;
    }

    const newRecordId = Date.now().toString();
    const newRecord = {
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      shift: shiftConfig.name,
      date: now.toLocaleDateString('id-ID'),
      checkIn: serverTimestamp(),
      checkOut: null,
      latenessMins: lateness,
      locationIn: location,
    };

    const docRef = doc(db, 'apps', APP_ID, 'attendances', newRecordId);
    try {
      await setDoc(docRef, newRecord);
    } catch (error) {
      console.error('Error clocking in:', error);
      alert(error?.message?.replace('Firebase: ', '') || 'Gagal melakukan absensi. Silakan coba lagi.');
    }
  };

  const handleClockOut = async (recordId) => {
    if (!firebaseUser) return;

    let location;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };

    } catch {
      alert('Gagal memverifikasi lokasi. Pastikan GPS aktif.');
      return;
    }

    const docRef = doc(db, 'apps', APP_ID, 'attendances', recordId);
    try {
      await updateDoc(docRef, {
        checkOut: serverTimestamp(),
        locationOut: location
      });
    } catch (error) {
      console.error('Error clocking out:', error);
      alert(error?.message?.replace('Firebase: ', '') || 'Gagal melakukan absensi pulang.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
          <p className="type-overline text-slate-500 dark:text-slate-400">Memuat Sistem...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-rose-100 text-center dark:bg-slate-900 dark:border-rose-500/20">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="type-section-title text-slate-900 mb-2 dark:text-white">Konfigurasi Diperlukan</h2>
          <p className="type-body text-slate-600 mb-6 dark:text-slate-300">{error}</p>
          <div className="bg-slate-50 p-4 rounded-xl text-left type-caption text-slate-500 mb-6 dark:bg-slate-950 dark:text-slate-400">
            <p className="font-semibold mb-1">Cara memperbaiki:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Buka Firebase Console</li>
              <li>Aktifkan Anonymous Auth</li>
              <li>Pastikan Firestore rules mengizinkan akses app</li>
            </ol>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">
            Refresh Halaman
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} dbUsers={users} theme={theme} onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} />;
  }

  return (
    <>
      {currentUser.role === 'admin' ? (
        <AdminDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          theme={theme}
          onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          attendances={attendances}
          users={users}
          onUserAction={handleUserAction}
          announcement={announcement}
          announcementLogs={announcementLogs}
          onUpdateAnnouncement={handleUpdateAnnouncement}
        />
      ) : (
        <StaffDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          theme={theme}
          onThemeToggle={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          attendances={attendances}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          announcement={announcement}
        />
      )}
    </>
  );
}
