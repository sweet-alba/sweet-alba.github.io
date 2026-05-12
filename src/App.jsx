import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { AlertTriangle } from 'lucide-react';
import { Button } from './components/ui';
import LoginScreen from './components/LoginScreen';
import StaffDashboard from './components/StaffDashboard';
import AdminDashboard from './components/AdminDashboard';

// App configuration
const APP_ID = 'sweet-alba-absensi';
const CLUSTER_LOCATION = { lat: -6.3854271, lng: 107.038834 }; // Sweet Alba Harvest City
const MAX_RADIUS_METERS = 1000; // Jarak maksimal dalam meter

// Helper: Calculate distance between two coordinates in meters (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
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
  const [currentUser, setCurrentUser] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [users, setUsers] = useState([]);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Initialize Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
        if (err.code === 'auth/configuration-not-found') {
          setError("Fitur 'Anonymous Auth' belum diaktifkan di Firebase Console.");
        } else {
          setError("Gagal terhubung ke layanan keamanan: " + err.message);
        }
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
      // Sort by checkIn descending
      data.sort((a, b) => b.checkIn - a.checkIn);
      setAttendances(data);
    }, (error) => {
      console.error("Firestore error:", error);
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
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    sessionStorage.setItem('absensi_user', JSON.stringify(user));
  };

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

  // Restore session
  useEffect(() => {
    const savedUser = sessionStorage.getItem('absensi_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const handleUpdateAnnouncement = async (text) => {
    try {
      const settingsRef = doc(db, 'apps', APP_ID, 'config', 'global');
      await setDoc(settingsRef, { announcement: text }, { merge: true });
    } catch (err) {
      console.error("Failed to update announcement:", err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('absensi_user');
  };

  const handleClockIn = async (shiftConfig) => {
    if (!firebaseUser || !currentUser) return;

    const now = new Date();

    // 1. Check Geolocation & Geofence
    let location = null;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      const distance = calculateDistance(
        location.lat,
        location.lng,
        CLUSTER_LOCATION.lat,
        CLUSTER_LOCATION.lng
      );

      if (distance > MAX_RADIUS_METERS) {
        alert(`Anda berada di luar area Cluster (${Math.round(distance)}m). Silakan mendekat ke area tugas untuk melakukan absensi.`);
        return;
      }
    } catch (err) {
      console.warn("Geolocation error:", err);
      alert("Gagal mendapatkan lokasi. Pastikan GPS aktif dan izinkan akses lokasi untuk melakukan absensi.");
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
      checkIn: serverTimestamp(), // Use Server Time
      checkOut: null,
      latenessMins: lateness,
      locationIn: location,
    };

    const docRef = doc(db, 'apps', APP_ID, 'attendances', newRecordId);
    try {
      await setDoc(docRef, newRecord);
    } catch (error) {
      console.error("Error clocking in:", error);
      alert("Gagal melakukan absensi. Silakan coba lagi.");
    }
  };

  const handleClockOut = async (recordId) => {
    if (!firebaseUser) return;

    let location = null;
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      const distance = calculateDistance(
        location.lat,
        location.lng,
        CLUSTER_LOCATION.lat,
        CLUSTER_LOCATION.lng
      );

      if (distance > MAX_RADIUS_METERS) {
        alert(`Anda berada di luar area Cluster (${Math.round(distance)}m). Absensi pulang hanya bisa dilakukan di dalam area.`);
        return;
      }
    } catch (err) {
      alert("Gagal memverifikasi lokasi. Pastikan GPS aktif.");
      return;
    }

    const docRef = doc(db, 'apps', APP_ID, 'attendances', recordId);
    try {
      await updateDoc(docRef, {
        checkOut: serverTimestamp(), // Use Server Time
        locationOut: location
      });
    } catch (error) {
      console.error("Error clocking out:", error);
      alert("Gagal melakukan absensi pulang.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Memuat Sistem...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-rose-100 text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Konfigurasi Diperlukan</h2>
          <p className="text-slate-600 mb-6 text-sm">{error}</p>
          <div className="bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-500 mb-6">
            <p className="font-bold mb-1">Cara memperbaiki:</p>
            <ol className="list-decimal ml-4 space-y-1">
              <li>Buka Firebase Console</li>
              <li>Authentication &gt; Sign-in method</li>
              <li>Aktifkan <strong>Anonymous</strong></li>
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
    return <LoginScreen onLogin={handleLogin} dbUsers={users} />;
  }

  return (
    <>
      {currentUser.role === 'admin' ? (
        <AdminDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          attendances={attendances}
          users={users}
          onUserAction={handleUserAction}
          announcement={announcement}
          onUpdateAnnouncement={handleUpdateAnnouncement}
        />
      ) : (
        <StaffDashboard
          currentUser={currentUser}
          onLogout={handleLogout}
          attendances={attendances}
          onClockIn={handleClockIn}
          onClockOut={handleClockOut}
          announcement={announcement}
        />
      )}
    </>
  );
}
