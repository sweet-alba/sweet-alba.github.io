import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import LoginScreen from './components/LoginScreen';
import StaffDashboard from './components/StaffDashboard';
import AdminDashboard from './components/AdminDashboard';

// App configuration (could be moved to env)
const APP_ID = 'sweet-alba-absensi';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Initialize Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth error:", error);
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

  const handleLogin = (user) => {
    setCurrentUser(user);
    // Persist login state in session if needed
    sessionStorage.setItem('absensi_user', JSON.stringify(user));
  };

  // Restore session
  useEffect(() => {
    const savedUser = sessionStorage.getItem('absensi_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('absensi_user');
  };

  const handleClockIn = async (shiftConfig) => {
    if (!firebaseUser || !currentUser) return;
    
    const now = new Date();
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
      checkIn: now.getTime(),
      checkOut: null,
      latenessMins: lateness
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
    const now = new Date();
    
    const docRef = doc(db, 'apps', APP_ID, 'attendances', recordId);
    try {
      await updateDoc(docRef, { checkOut: now.getTime() });
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

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentUser.role === 'admin') {
    return (
      <AdminDashboard 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        attendances={attendances} 
      />
    );
  }

  return (
    <StaffDashboard 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      attendances={attendances}
      onClockIn={handleClockIn}
      onClockOut={handleClockOut}
    />
  );
}
