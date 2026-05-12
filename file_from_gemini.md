import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, Calendar, Download, User, CheckCircle, AlertTriangle, FileSpreadsheet, Users } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- MOCK DATA & CONFIGURATION ---
const SHIFTS = {
  SECURITY_1: { id: 'sec1', name: 'Shift 1 (08:00 - 20:00)', expectedInHour: 8, expectedInMinute: 0 },
  SECURITY_2: { id: 'sec2', name: 'Shift 2 (20:00 - 08:00)', expectedInHour: 20, expectedInMinute: 0 },
  CLEANER: { id: 'cln1', name: 'Shift Pagi (09:00 - 16:00)', expectedInHour: 9, expectedInMinute: 0 }
};

const USERS = [
  { id: 'admin', username: 'admin', password: '123', role: 'admin', name: 'Pengurus Cluster' },
  { id: 'sec_1', username: 'satpam1', password: '123', role: 'security', name: 'Satpam Andi' },
  { id: 'sec_2', username: 'satpam2', password: '123', role: 'security', name: 'Satpam Budi' },
  { id: 'sec_3', username: 'satpam3', password: '123', role: 'security', name: 'Satpam Cipto' },
  { id: 'sec_4', username: 'satpam4', password: '123', role: 'security', name: 'Satpam Dedi' },
  { id: 'sec_5', username: 'satpam5', password: '123', role: 'security', name: 'Satpam Eko' },
  { id: 'cln_1', username: 'bersih1', password: '123', role: 'cleaner', name: 'Petugas Siti' },
  { id: 'cln_2', username: 'bersih2', password: '123', role: 'cleaner', name: 'Petugas Joko' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Firebase Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Attendances from Firestore
  useEffect(() => {
    if (!firebaseUser) return;
    
    const attendancesRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendances');
    const unsubscribe = onSnapshot(attendancesRef, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // Sort by checkIn descending manually
      data.sort((a, b) => b.checkIn - a.checkIn);
      setAttendances(data);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleClockIn = async (shiftConfig) => {
    if (!firebaseUser) return;
    
    const now = new Date();
    
    // Calculate lateness
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

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'attendances', newRecordId);
    try {
      await setDoc(docRef, newRecord);
    } catch (error) {
      console.error("Error clocking in:", error);
    }
  };

  const handleClockOut = async (recordId) => {
    if (!firebaseUser) return;
    const now = new Date();
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'attendances', recordId);
    try {
      await updateDoc(docRef, { checkOut: now.getTime() });
    } catch (error) {
      console.error("Error clocking out:", error);
    }
  };

  // Main Render
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentUser.role === 'admin') {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} attendances={attendances} />;
  }

  return (
    <StaffDashboard 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      attendances={attendances}
      onClockIn={handleClockIn}
      onClockOut={handleClockOut}
      currentTime={currentTime}
    />
  );
}

// --- LOGIN COMPONENT ---
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Username atau password salah! (Hint: pass untuk semua user adalah "123")');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sistem Absensi</h1>
          <p className="text-slate-500">Cluster Sweet Alba</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-start">
            <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Masukkan username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center"
          >
            <LogIn size={20} className="mr-2" />
            Masuk
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 font-semibold mb-2">Panduan Login Demo:</p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li><strong>Admin:</strong> admin / 123</li>
            <li><strong>Satpam (5 org):</strong> satpam1 s/d satpam5 / 123</li>
            <li><strong>Kebersihan (2 org):</strong> bersih1, bersih2 / 123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- STAFF DASHBOARD COMPONENT ---
function StaffDashboard({ currentUser, onLogout, attendances, onClockIn, onClockOut, currentTime }) {
  const [showShiftSelect, setShowShiftSelect] = useState(false);
  
  const myRecords = attendances.filter(r => r.userId === currentUser.id);
  
  // Check if there is an active session (clocked in but not clocked out today)
  const todayStr = new Date().toLocaleDateString('id-ID');
  const activeRecord = myRecords.find(r => r.date === todayStr && !r.checkOut);
  const alreadyCompletedToday = myRecords.find(r => r.date === todayStr && r.checkOut);

  const formatTime = (dateObj) => {
    return dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleActionClick = () => {
    if (activeRecord) {
      onClockOut(activeRecord.id);
    } else {
      if (currentUser.role === 'security') {
        setShowShiftSelect(true);
      } else {
        // Cleaner only has 1 shift
        onClockIn(SHIFTS.CLEANER);
      }
    }
  };

  const confirmShift = (shiftKey) => {
    onClockIn(SHIFTS[shiftKey]);
    setShowShiftSelect(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-emerald-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <User size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg">{currentUser.name}</h1>
              <p className="text-emerald-100 text-sm">
                {currentUser.role === 'security' ? 'Petugas Keamanan' : 'Petugas Kebersihan'}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center px-3 py-2 bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} className="mr-2" />
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Action Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 text-center">
          <h2 className="text-slate-500 font-medium mb-2">Waktu Saat Ini</h2>
          <div className="text-5xl font-bold text-slate-800 mb-6 font-mono">
            {formatTime(currentTime)}
          </div>

          {alreadyCompletedToday && !activeRecord ? (
             <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-center justify-center mb-4">
               <CheckCircle className="mr-2" />
               Anda sudah menyelesaikan absensi hari ini. Terima kasih!
             </div>
          ) : (
            <>
              {showShiftSelect ? (
                <div className="animate-fade-in bg-slate-50 p-6 rounded-xl border border-slate-200 max-w-md mx-auto">
                  <h3 className="font-semibold text-slate-800 mb-4">Pilih Shift Anda Hari Ini:</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => confirmShift('SECURITY_1')}
                      className="w-full flex justify-between items-center px-4 py-3 bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-md rounded-lg transition-all"
                    >
                      <span className="font-medium text-slate-800">Shift 1</span>
                      <span className="text-sm text-slate-500">08:00 - 20:00</span>
                    </button>
                    <button 
                      onClick={() => confirmShift('SECURITY_2')}
                      className="w-full flex justify-between items-center px-4 py-3 bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-md rounded-lg transition-all"
                    >
                      <span className="font-medium text-slate-800">Shift 2</span>
                      <span className="text-sm text-slate-500">20:00 - 08:00</span>
                    </button>
                  </div>
                  <button onClick={() => setShowShiftSelect(false)} className="mt-4 text-sm text-slate-500 hover:text-slate-700">Batal</button>
                </div>
              ) : (
                <button
                  onClick={handleActionClick}
                  className={`px-8 py-4 rounded-full text-lg font-bold shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center mx-auto min-w-[250px]
                    ${activeRecord 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }
                  `}
                >
                  <Clock className="mr-3" size={24} />
                  {activeRecord ? 'ABSEN PULANG' : 'ABSEN MASUK'}
                </button>
              )}
            </>
          )}

          {activeRecord && (
            <p className="mt-4 text-emerald-600 font-medium">
              Anda sedang aktif di <strong>{activeRecord.shift}</strong> sejak {new Date(activeRecord.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
            </p>
          )}
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center">
            <Calendar className="text-slate-500 mr-2" size={20} />
            <h2 className="font-semibold text-slate-800">Riwayat Absensi Anda</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Shift</th>
                  <th className="p-4 font-medium">Jam Masuk</th>
                  <th className="p-4 font-medium">Jam Pulang</th>
                  <th className="p-4 font-medium">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {myRecords.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">Belum ada riwayat absensi.</td></tr>
                ) : (
                  myRecords.map(record => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800">{record.date}</td>
                      <td className="p-4 text-slate-600 text-sm">{record.shift}</td>
                      <td className="p-4 font-mono text-slate-700">
                        {new Date(record.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-4 font-mono text-slate-700">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : <span className="text-amber-500 text-sm italic">Belum Pulang</span>}
                      </td>
                      <td className="p-4">
                        {record.latenessMins > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                            Terlambat {record.latenessMins} menit
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Tepat Waktu
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

// --- ADMIN DASHBOARD COMPONENT ---
function AdminDashboard({ currentUser, onLogout, attendances }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredData = attendances.filter(record => {
    const matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || record.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const exportToCSV = () => {
    // Buat header CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tanggal,Nama Petugas,Peran,Shift,Jam Masuk,Jam Pulang,Status/Keterlambatan\n";

    // Isi baris data
    filteredData.forEach(row => {
      const date = row.date;
      const name = row.userName;
      const role = row.role === 'security' ? 'Keamanan' : 'Kebersihan';
      const shift = row.shift;
      const timeIn = new Date(row.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
      const timeOut = row.checkOut ? new Date(row.checkOut).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : 'Belum Pulang';
      const status = row.latenessMins > 0 ? ⁠ Terlambat ${row.latenessMins} menit ⁠ : 'Tepat Waktu';
      
      csvContent += ⁠ ${date},${name},${role},${shift},${timeIn},${timeOut},${status}\n ⁠;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", ⁠ Laporan_Absensi_SweetAlba_${new Date().getTime()}.csv ⁠);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-700 p-2 rounded-lg">
              <FileSpreadsheet size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Dashboard Pengurus</h1>
              <p className="text-slate-400 text-sm">Sistem Absensi Sweet Alba</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
             <div className="text-sm text-slate-300 hidden sm:block">
               Halo, <strong>{currentUser.name}</strong>
             </div>
            <button 
              onClick={onLogout}
              className="flex items-center px-3 py-2 bg-slate-700 hover:bg-rose-600 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={16} className="mr-2" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
             <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
               <Users size={28} />
             </div>
             <div>
               <p className="text-slate-500 text-sm font-medium">Total Absensi Bulan Ini</p>
               <p className="text-2xl font-bold text-slate-800">{attendances.length}</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
             <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mr-4">
               <AlertTriangle size={28} />
             </div>
             <div>
               <p className="text-slate-500 text-sm font-medium">Total Keterlambatan</p>
               <p className="text-2xl font-bold text-slate-800">
                 {attendances.filter(a => a.latenessMins > 0).length}
               </p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
             <div>
               <p className="text-slate-500 text-sm font-medium mb-1">Export Laporan Data</p>
               <p className="text-xs text-slate-400">Unduh ke Excel/CSV</p>
             </div>
             <button 
                onClick={exportToCSV}
                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 p-3 rounded-xl transition-colors"
                title="Download Excel/CSV"
             >
               <Download size={24} />
             </button>
          </div>
        </div>

        {/* Data Table Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Controls */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-slate-800 flex items-center">
              <Calendar className="mr-2 text-slate-500" size={20} /> Rekapitulasi Data
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Cari nama petugas..." 
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Semua Peran</option>
                <option value="security">Keamanan (Satpam)</option>
                <option value="cleaner">Kebersihan</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Nama Petugas</th>
                  <th className="p-4 font-medium">Peran</th>
                  <th className="p-4 font-medium">Shift</th>
                  <th className="p-4 font-medium text-center">Masuk</th>
                  <th className="p-4 font-medium text-center">Pulang</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-500">Tidak ada data ditemukan.</td></tr>
                ) : (
                  filteredData.map(record => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800 text-sm">{record.date}</td>
                      <td className="p-4 font-medium text-slate-800">{record.userName}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {record.role === 'security' ? 'Keamanan' : 'Kebersihan'}
                      </td>
                      <td className="p-4 text-slate-600 text-sm">{record.shift}</td>
                      <td className="p-4 font-mono text-slate-700 text-center text-sm">
                        {new Date(record.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-4 font-mono text-slate-700 text-center text-sm">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : <span className="text-amber-500 text-xs italic">Aktif</span>}
                      </td>
                      <td className="p-4">
                        {record.latenessMins > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                            Terlambat {record.latenessMins} mnt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Tepat Waktu
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Clock, Calendar, Download, User, CheckCircle, AlertTriangle, FileSpreadsheet, Users } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';

// --- FIREBASE SETUP ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- MOCK DATA & CONFIGURATION ---
const SHIFTS = {
  SECURITY_1: { id: 'sec1', name: 'Shift 1 (08:00 - 20:00)', expectedInHour: 8, expectedInMinute: 0 },
  SECURITY_2: { id: 'sec2', name: 'Shift 2 (20:00 - 08:00)', expectedInHour: 20, expectedInMinute: 0 },
  CLEANER: { id: 'cln1', name: 'Shift Pagi (09:00 - 16:00)', expectedInHour: 9, expectedInMinute: 0 }
};

const USERS = [
  { id: 'admin', username: 'admin', password: '123', role: 'admin', name: 'Pengurus Cluster' },
  { id: 'sec_1', username: 'satpam1', password: '123', role: 'security', name: 'Satpam Andi' },
  { id: 'sec_2', username: 'satpam2', password: '123', role: 'security', name: 'Satpam Budi' },
  { id: 'sec_3', username: 'satpam3', password: '123', role: 'security', name: 'Satpam Cipto' },
  { id: 'sec_4', username: 'satpam4', password: '123', role: 'security', name: 'Satpam Dedi' },
  { id: 'sec_5', username: 'satpam5', password: '123', role: 'security', name: 'Satpam Eko' },
  { id: 'cln_1', username: 'bersih1', password: '123', role: 'cleaner', name: 'Petugas Siti' },
  { id: 'cln_2', username: 'bersih2', password: '123', role: 'cleaner', name: 'Petugas Joko' },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Firebase Auth Init
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Attendances from Firestore
  useEffect(() => {
    if (!firebaseUser) return;
    
    const attendancesRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendances');
    const unsubscribe = onSnapshot(attendancesRef, (snapshot) => {
      const data = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // Sort by checkIn descending manually
      data.sort((a, b) => b.checkIn - a.checkIn);
      setAttendances(data);
    }, (error) => {
      console.error("Firestore error:", error);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleClockIn = async (shiftConfig) => {
    if (!firebaseUser) return;
    
    const now = new Date();
    
    // Calculate lateness
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

    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'attendances', newRecordId);
    try {
      await setDoc(docRef, newRecord);
    } catch (error) {
      console.error("Error clocking in:", error);
    }
  };

  const handleClockOut = async (recordId) => {
    if (!firebaseUser) return;
    const now = new Date();
    
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'attendances', recordId);
    try {
      await updateDoc(docRef, { checkOut: now.getTime() });
    } catch (error) {
      console.error("Error clocking out:", error);
    }
  };

  // Main Render
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (currentUser.role === 'admin') {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} attendances={attendances} />;
  }

  return (
    <StaffDashboard 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      attendances={attendances}
      onClockIn={handleClockIn}
      onClockOut={handleClockOut}
      currentTime={currentTime}
    />
  );
}

// --- LOGIN COMPONENT ---
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('Username atau password salah! (Hint: pass untuk semua user adalah "123")');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Sistem Absensi</h1>
          <p className="text-slate-500">Cluster Sweet Alba</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm flex items-start">
            <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Masukkan username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Masukkan password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center"
          >
            <LogIn size={20} className="mr-2" />
            Masuk
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 font-semibold mb-2">Panduan Login Demo:</p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li><strong>Admin:</strong> admin / 123</li>
            <li><strong>Satpam (5 org):</strong> satpam1 s/d satpam5 / 123</li>
            <li><strong>Kebersihan (2 org):</strong> bersih1, bersih2 / 123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- STAFF DASHBOARD COMPONENT ---
function StaffDashboard({ currentUser, onLogout, attendances, onClockIn, onClockOut, currentTime }) {
  const [showShiftSelect, setShowShiftSelect] = useState(false);
  
  const myRecords = attendances.filter(r => r.userId === currentUser.id);
  
  // Check if there is an active session (clocked in but not clocked out today)
  const todayStr = new Date().toLocaleDateString('id-ID');
  const activeRecord = myRecords.find(r => r.date === todayStr && !r.checkOut);
  const alreadyCompletedToday = myRecords.find(r => r.date === todayStr && r.checkOut);

  const formatTime = (dateObj) => {
    return dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleActionClick = () => {
    if (activeRecord) {
      onClockOut(activeRecord.id);
    } else {
      if (currentUser.role === 'security') {
        setShowShiftSelect(true);
      } else {
        // Cleaner only has 1 shift
        onClockIn(SHIFTS.CLEANER);
      }
    }
  };

  const confirmShift = (shiftKey) => {
    onClockIn(SHIFTS[shiftKey]);
    setShowShiftSelect(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-emerald-600 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-full">
              <User size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg">{currentUser.name}</h1>
              <p className="text-emerald-100 text-sm">
                {currentUser.role === 'security' ? 'Petugas Keamanan' : 'Petugas Kebersihan'}
              </p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center px-3 py-2 bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} className="mr-2" />
            Keluar
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Action Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 text-center">
          <h2 className="text-slate-500 font-medium mb-2">Waktu Saat Ini</h2>
          <div className="text-5xl font-bold text-slate-800 mb-6 font-mono">
            {formatTime(currentTime)}
          </div>

          {alreadyCompletedToday && !activeRecord ? (
             <div className="bg-blue-50 text-blue-700 p-4 rounded-xl flex items-center justify-center mb-4">
               <CheckCircle className="mr-2" />
               Anda sudah menyelesaikan absensi hari ini. Terima kasih!
             </div>
          ) : (
            <>
              {showShiftSelect ? (
                <div className="animate-fade-in bg-slate-50 p-6 rounded-xl border border-slate-200 max-w-md mx-auto">
                  <h3 className="font-semibold text-slate-800 mb-4">Pilih Shift Anda Hari Ini:</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => confirmShift('SECURITY_1')}
                      className="w-full flex justify-between items-center px-4 py-3 bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-md rounded-lg transition-all"
                    >
                      <span className="font-medium text-slate-800">Shift 1</span>
                      <span className="text-sm text-slate-500">08:00 - 20:00</span>
                    </button>
                    <button 
                      onClick={() => confirmShift('SECURITY_2')}
                      className="w-full flex justify-between items-center px-4 py-3 bg-white border border-emerald-200 hover:border-emerald-500 hover:shadow-md rounded-lg transition-all"
                    >
                      <span className="font-medium text-slate-800">Shift 2</span>
                      <span className="text-sm text-slate-500">20:00 - 08:00</span>
                    </button>
                  </div>
                  <button onClick={() => setShowShiftSelect(false)} className="mt-4 text-sm text-slate-500 hover:text-slate-700">Batal</button>
                </div>
              ) : (
                <button
                  onClick={handleActionClick}
                  className={`px-8 py-4 rounded-full text-lg font-bold shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center mx-auto min-w-[250px]
                    ${activeRecord 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }
                  `}
                >
                  <Clock className="mr-3" size={24} />
                  {activeRecord ? 'ABSEN PULANG' : 'ABSEN MASUK'}
                </button>
              )}
            </>
          )}

          {activeRecord && (
            <p className="mt-4 text-emerald-600 font-medium">
              Anda sedang aktif di <strong>{activeRecord.shift}</strong> sejak {new Date(activeRecord.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
            </p>
          )}
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center">
            <Calendar className="text-slate-500 mr-2" size={20} />
            <h2 className="font-semibold text-slate-800">Riwayat Absensi Anda</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Shift</th>
                  <th className="p-4 font-medium">Jam Masuk</th>
                  <th className="p-4 font-medium">Jam Pulang</th>
                  <th className="p-4 font-medium">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody>
                {myRecords.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-slate-500">Belum ada riwayat absensi.</td></tr>
                ) : (
                  myRecords.map(record => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800">{record.date}</td>
                      <td className="p-4 text-slate-600 text-sm">{record.shift}</td>
                      <td className="p-4 font-mono text-slate-700">
                        {new Date(record.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-4 font-mono text-slate-700">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : <span className="text-amber-500 text-sm italic">Belum Pulang</span>}
                      </td>
                      <td className="p-4">
                        {record.latenessMins > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                            Terlambat {record.latenessMins} menit
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Tepat Waktu
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}

// --- ADMIN DASHBOARD COMPONENT ---
function AdminDashboard({ currentUser, onLogout, attendances }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredData = attendances.filter(record => {
    const matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || record.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const exportToCSV = () => {
    // Buat header CSV
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tanggal,Nama Petugas,Peran,Shift,Jam Masuk,Jam Pulang,Status/Keterlambatan\n";

    // Isi baris data
    filteredData.forEach(row => {
      const date = row.date;
      const name = row.userName;
      const role = row.role === 'security' ? 'Keamanan' : 'Kebersihan';
      const shift = row.shift;
      const timeIn = new Date(row.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
      const timeOut = row.checkOut ? new Date(row.checkOut).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : 'Belum Pulang';
      const status = row.latenessMins > 0 ? ⁠ Terlambat ${row.latenessMins} menit ⁠ : 'Tepat Waktu';
      
      csvContent += ⁠ ${date},${name},${role},${shift},${timeIn},${timeOut},${status}\n ⁠;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", ⁠ Laporan_Absensi_SweetAlba_${new Date().getTime()}.csv ⁠);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 text-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-700 p-2 rounded-lg">
              <FileSpreadsheet size={24} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Dashboard Pengurus</h1>
              <p className="text-slate-400 text-sm">Sistem Absensi Sweet Alba</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
             <div className="text-sm text-slate-300 hidden sm:block">
               Halo, <strong>{currentUser.name}</strong>
             </div>
            <button 
              onClick={onLogout}
              className="flex items-center px-3 py-2 bg-slate-700 hover:bg-rose-600 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={16} className="mr-2" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
             <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
               <Users size={28} />
             </div>
             <div>
               <p className="text-slate-500 text-sm font-medium">Total Absensi Bulan Ini</p>
               <p className="text-2xl font-bold text-slate-800">{attendances.length}</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
             <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mr-4">
               <AlertTriangle size={28} />
             </div>
             <div>
               <p className="text-slate-500 text-sm font-medium">Total Keterlambatan</p>
               <p className="text-2xl font-bold text-slate-800">
                 {attendances.filter(a => a.latenessMins > 0).length}
               </p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
             <div>
               <p className="text-slate-500 text-sm font-medium mb-1">Export Laporan Data</p>
               <p className="text-xs text-slate-400">Unduh ke Excel/CSV</p>
             </div>
             <button 
                onClick={exportToCSV}
                className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 p-3 rounded-xl transition-colors"
                title="Download Excel/CSV"
             >
               <Download size={24} />
             </button>
          </div>
        </div>

        {/* Data Table Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Controls */}
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-semibold text-slate-800 flex items-center">
              <Calendar className="mr-2 text-slate-500" size={20} /> Rekapitulasi Data
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="Cari nama petugas..." 
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Semua Peran</option>
                <option value="security">Keamanan (Satpam)</option>
                <option value="cleaner">Kebersihan</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-slate-500 text-sm">
                  <th className="p-4 font-medium">Tanggal</th>
                  <th className="p-4 font-medium">Nama Petugas</th>
                  <th className="p-4 font-medium">Peran</th>
                  <th className="p-4 font-medium">Shift</th>
                  <th className="p-4 font-medium text-center">Masuk</th>
                  <th className="p-4 font-medium text-center">Pulang</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan="7" className="p-8 text-center text-slate-500">Tidak ada data ditemukan.</td></tr>
                ) : (
                  filteredData.map(record => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800 text-sm">{record.date}</td>
                      <td className="p-4 font-medium text-slate-800">{record.userName}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {record.role === 'security' ? 'Keamanan' : 'Kebersihan'}
                      </td>
                      <td className="p-4 text-slate-600 text-sm">{record.shift}</td>
                      <td className="p-4 font-mono text-slate-700 text-center text-sm">
                        {new Date(record.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-4 font-mono text-slate-700 text-center text-sm">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : <span className="text-amber-500 text-xs italic">Aktif</span>}
                      </td>
                      <td className="p-4">
                        {record.latenessMins > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                            Terlambat {record.latenessMins} mnt
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Tepat Waktu
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}