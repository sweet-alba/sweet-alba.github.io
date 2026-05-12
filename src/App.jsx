import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, addDoc, orderBy, query, limit } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { listenForegroundNotifications, registerNotificationToken } from './lib/notifications';
import { AlertTriangle } from 'lucide-react';
import { Button, AlertModal } from './components/ui';
import LoginScreen from './components/LoginScreen';
import StaffDashboard from './components/dashboard/staff/StaffDashboard';
import AdminDashboard from './components/dashboard/admin/AdminDashboard';

// App configuration
const APP_ID = 'sweet-alba-absensi';
const CLUSTER_LOCATION = { lat: -6.3854271, lng: 107.038834 }; // Sweet Alba Harvest City
const MAX_RADIUS_METERS = 1000; // Jarak maksimal dalam meter

// Helper: Calculate distance between two coordinates in meters (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

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

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'warning'
  });

  const showAlert = (title, message, variant = 'warning') => {
    setAlertConfig({ isOpen: true, title, message, variant });
  };

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
    
    // Minta izin notifikasi tepat saat klik LOGIN (User Gesture)
    if (user.role !== 'admin') {
      registerNotificationToken(user).catch(err => console.warn("Permission denied or skipped:", err));
    }
  };

  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin' || !firebaseUser) return;

    registerNotificationToken(currentUser).catch((err) => {
      console.warn("Notification setup skipped:", err);
    });
  }, [currentUser, firebaseUser]);

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

  // 5. Client-Side Notification Fallback (for Spark Plan)
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin') return;

    const logsRef = collection(db, 'apps', APP_ID, 'announcementLogs');
    const q = query(logsRef, orderBy('createdAt', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const logDoc = snapshot.docs[0];
        const log = logDoc.data();
        const lastSeenId = localStorage.getItem('last_announcement_id');
        
        console.log("🔔 Cek Pengumuman:", log.text.substring(0, 20) + "...", "Last Seen:", lastSeenId);

        if (lastSeenId && lastSeenId !== logDoc.id) {
          console.log("🚀 Memicu Notifikasi...");
          
          // 1. In-App Alert (Modal) - Lebih handal karena tidak bisa diblokir OS
          showAlert('Pengumuman Baru', log.text, 'warning');

          // 2. Browser Push Notification
          if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification('Pengumuman Baru', {
                body: log.text,
                icon: '/vite.svg',
                badge: '/vite.svg',
                tag: 'announcement',
                renotify: true
              });
            }).catch(() => {
              new Notification('Pengumuman Baru', {
                body: log.text,
                icon: '/vite.svg',
                tag: 'announcement'
              });
            });
          }
        }
        localStorage.setItem('last_announcement_id', logDoc.id);
      }
    }, (err) => console.error("Notification listener error:", err));

    return () => unsubscribe();
  }, [currentUser]);

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
      showAlert("Gagal Kelola Akun", err.message, 'danger');
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

      // 2. Geofence Check
      const distance = calculateDistance(
        location.lat,
        location.lng,
        CLUSTER_LOCATION.lat,
        CLUSTER_LOCATION.lng
      );

      if (distance > MAX_RADIUS_METERS) {
        showAlert(
          "Diluar Jangkauan", 
          `Anda berada ${Math.round(distance)}m dari Cluster. Maksimal radius adalah ${MAX_RADIUS_METERS}m.`,
          'danger'
        );
        return;
      }
    } catch (err) {
      console.warn('Geolocation error:', err);
      showAlert(
        "Lokasi Tidak Ditemukan",
        "Pastikan GPS aktif dan izinkan akses lokasi untuk melakukan absensi.",
        'danger'
      );
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
      showAlert("Gagal Absen", error?.message?.replace('Firebase: ', '') || 'Gagal melakukan absensi. Silakan coba lagi.', 'danger');
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

      // Geofence Check for Clock Out
      const distance = calculateDistance(
        location.lat,
        location.lng,
        CLUSTER_LOCATION.lat,
        CLUSTER_LOCATION.lng
      );

      if (distance > MAX_RADIUS_METERS) {
        showAlert(
          "Diluar Jangkauan",
          `Anda berada ${Math.round(distance)}m dari Cluster. Anda harus berada di area cluster untuk mengakhiri shift.`,
          'danger'
        );
        return;
      }
    } catch {
      showAlert("Lokasi Tidak Ditemukan", "Gagal memverifikasi lokasi. Pastikan GPS aktif.", 'danger');
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
      showAlert("Gagal Absen Pulang", error?.message?.replace('Firebase: ', '') || 'Gagal melakukan absensi pulang.', 'danger');
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

      <AlertModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
      />
    </>
  );
}
