import { useState, useMemo } from 'react';
import { LogOut, Calendar, Download, FileSpreadsheet, Users, AlertTriangle, Search, Filter, UserPlus, Settings, Trash2, Edit2, MapPin, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input } from './ui';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

export default function AdminDashboard({ currentUser, onLogout, attendances, users = [], onUserAction, announcement, onUpdateAnnouncement }) {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'users', or 'trends'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  
  const [attendancePage, setAttendancePage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [filterType, setFilterType] = useState('all'); // 'all', 'late', 'active'
  const ITEMS_PER_PAGE = 10;

  const filteredData = useMemo(() => {
    let data = attendances.filter(record => {
      const matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || record.role === filterRole;
      const matchesUser = selectedUserFilter === 'all' || record.userId === selectedUserFilter;
      return matchesSearch && matchesRole && matchesUser;
    });

    switch (filterType) {
      case 'late':
        data = data.filter(a => a.latenessMins > 0);
        break;
      case 'active':
        data = data.filter(a => !a.checkOut);
        break;
      default:
        break;
    }

    return data.sort((a, b) => {
      const dateA = a.checkIn?.toDate ? a.checkIn.toDate() : new Date(a.checkIn);
      const dateB = b.checkIn?.toDate ? b.checkIn.toDate() : new Date(b.checkIn);
      return dateB - dateA;
    });
  }, [attendances, searchTerm, filterRole, selectedUserFilter, filterType]);

  // Attendance Pagination
  const totalAttendancePages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedAttendance = filteredData.slice(
    (attendancePage - 1) * ITEMS_PER_PAGE,
    attendancePage * ITEMS_PER_PAGE
  );

  // Calculate User Specific Stats
  const userStats = useMemo(() => {
    if (selectedUserFilter === 'all') return null;
    const userRecords = attendances.filter(a => a.userId === selectedUserFilter);
    const lateRecords = userRecords.filter(a => a.latenessMins > 0);
    const totalLateMins = userRecords.reduce((acc, curr) => acc + (curr.latenessMins || 0), 0);

    const lateHours = Math.floor(totalLateMins / 60);
    const lateMins = totalLateMins % 60;

    return {
      total: userRecords.length,
      lateCount: lateRecords.length,
      totalLateTime: `${lateHours}j ${lateMins}m`
    };
  }, [selectedUserFilter, attendances]);

  const summaryData = {
      total: attendances.length,
      late: attendances.filter(a => a.latenessMins > 0).length,
      active: attendances.filter(a => !a.checkOut).length
  };

  const stats = [
    {
      id: 'all',
      label: 'Total Absensi',
      value: summaryData.total,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      description: 'Seluruh catatan bulan ini'
    },
    {
      id: 'late',
      label: 'Keterlambatan',
      value: summaryData.late,
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-600',
      description: 'Butuh perhatian khusus'
    },
    {
      id: 'active',
      label: 'Aktif Sekarang',
      value: summaryData.active,
      icon: Calendar,
      color: 'bg-brand-50 text-brand-600',
      description: 'Petugas di lapangan'
    },
  ];

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tanggal,Nama Petugas,Peran,Shift,Jam Masuk,Jam Pulang,Status/Keterlambatan\n";

    filteredData.forEach(row => {
      const date = row.date;
      const name = row.userName;
      const role = row.role === 'security' ? 'Keamanan' : 'Kebersihan';
      const shift = row.shift;
      const timeIn = (row.checkIn?.toDate ? row.checkIn.toDate() : new Date(row.checkIn)).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const timeOut = row.checkOut ? (row.checkOut?.toDate ? row.checkOut.toDate() : new Date(row.checkOut)).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Belum Pulang';
      const status = row.latenessMins > 0 ? `Terlambat ${row.latenessMins} menit` : 'Tepat Waktu';

      csvContent += `${date},${name},${role},${shift},${timeIn},${timeOut},${status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Absensi_SweetAlba_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-24">
      <Navbar currentUser={currentUser} onLogout={onLogout} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-6 sm:pt-16 sm:pb-10 w-full space-y-8 sm:space-y-10">

        {activeTab === 'announcement' ? (
          <AnnouncementSection 
            announcement={announcement} 
            onUpdateAnnouncement={onUpdateAnnouncement} 
          />
        ) : activeTab === 'trends' ? (
          <TrendsSection 
            attendances={filteredData} 
            summaryData={summaryData}
            setFilterType={setFilterType}
            filterType={filterType}
            setCurrentPage={setAttendancePage}
            users={users}
            onUserAction={onUserAction}
          />
        ) : activeTab === 'attendance' ? (
          <>
            <section className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={idx === 2 ? 'col-span-2 sm:col-span-1' : ''}
                  onClick={() => {
                    setFilterType(stat.id);
                    setAttendancePage(1);
                  }}
                >
                  <Card className={`p-4 sm:p-6 border-2 flex flex-col sm:flex-row sm:items-center justify-between group hover:scale-[1.02] transition-all duration-300 h-full cursor-pointer ${
                    filterType === stat.id ? 'border-brand-500 shadow-lg' : 'border-transparent'
                  }`}>
                    <div className="flex items-center sm:block lg:flex">
                      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${stat.color} flex items-center justify-center mr-3 sm:mr-0 lg:mr-5 mb-0 sm:mb-4 lg:mb-0 shadow-sm group-hover:scale-110 transition-transform`}>
                        <stat.icon size={20} className="sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <p className="text-slate-500 text-[8px] sm:text-xs font-black uppercase tracking-widest mb-0.5 sm:mb-1">{stat.label}</p>
                        <p className="text-xl sm:text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
                        <p className="hidden sm:block text-[10px] text-slate-400 mt-2 font-bold">{stat.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </section>

            <section className="space-y-6">
              <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-[2rem]">
                <div className="p-5 sm:p-8 border-b border-slate-100 bg-white space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                      <Calendar size={20} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Rekapitulasi Kehadiran</h2>
                  </div>

                  <div className="flex flex-col space-y-4">
                    <div className="relative w-full">
                      <Input 
                        placeholder="Cari nama petugas..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setAttendancePage(1); }} 
                        className="pl-12 py-3 rounded-xl border-slate-100 bg-slate-50/50" 
                        icon={<Search size={18} className="text-slate-400" />}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                          className="w-full pl-10 pr-10 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-black focus:outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none"
                          value={selectedUserFilter} 
                          onChange={e => { setSelectedUserFilter(e.target.value); setAttendancePage(1); }}
                        >
                          <option value="all">Pilih Petugas (Semua)</option>
                          {users.filter(u => u.role !== 'admin').map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="relative flex-1">
                        <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select
                          className="w-full pl-10 pr-10 py-3 bg-slate-50/50 border border-slate-100 rounded-xl text-xs font-black focus:outline-none focus:ring-4 focus:ring-brand-500/10 appearance-none"
                          value={filterRole} 
                          onChange={e => { setFilterRole(e.target.value); setAttendancePage(1); }}
                        >
                          <option value="all">Semua Peran</option>
                          <option value="security">Security (Satpam)</option>
                          <option value="cleaner">Kebersihan</option>
                        </select>
                      </div>
                      <Button onClick={exportToCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-xs">
                        <Download size={18} className="mr-2" />
                        Export Data (.CSV)
                      </Button>
                    </div>
                  </div>
                </div>

                <AttendanceSection 
                  filteredData={filteredData} 
                  paginatedAttendance={paginatedAttendance} 
                  attendancePage={attendancePage} 
                  setAttendancePage={setAttendancePage} 
                  totalAttendancePages={totalAttendancePages} 
                  ITEMS_PER_PAGE={ITEMS_PER_PAGE}
                  setSelectedRecord={setSelectedRecord} 
                />
              </Card>
            </section>
          </>
        ) : (
          <UserManagementSection 
            users={users} 
            onUserAction={onUserAction} 
            usersPage={usersPage} 
            setUsersPage={setUsersPage} 
            ITEMS_PER_PAGE={ITEMS_PER_PAGE}
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <AttendanceDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
    </div>
  );
}

function AttendanceSection({ filteredData, paginatedAttendance, attendancePage, setAttendancePage, totalAttendancePages, ITEMS_PER_PAGE, setSelectedRecord }) {
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left hidden lg:table">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-[0.15em]">
              <th className="px-8 py-5">Tanggal</th>
              <th className="px-8 py-5">Petugas</th>
              <th className="px-8 py-5">Shift</th>
              <th className="px-8 py-5 text-center">Masuk</th>
              <th className="px-8 py-5 text-center">Pulang</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedAttendance.map((record) => (
              <motion.tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-8 py-6 font-bold text-sm text-slate-900">{record.date}</td>
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs uppercase">{record.userName.charAt(0)}</div>
                    <div>
                      <p className="text-slate-900 font-black text-sm">{record.userName}</p>
                      <div className="flex items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider space-x-2">
                        <span>{record.role === 'security' ? 'Keamanan' : 'Kebersihan'}</span>
                        {record.locationIn && (
                          <a href={`https://www.google.com/maps?q=${record.locationIn.lat},${record.locationIn.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            <MapPin size={8} className="mr-0.5" /> GPS IN
                          </a>
                        )}
                        {record.locationOut && (
                          <a href={`https://www.google.com/maps?q=${record.locationOut.lat},${record.locationOut.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            <MapPin size={8} className="mr-0.5" /> GPS OUT
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-xs font-bold text-slate-600">
                  <span className="bg-slate-100 px-3 py-1 rounded-lg">{record.shift.split(' (')[0]}</span>
                </td>
                <td className="px-8 py-6 font-mono font-black text-center text-sm">
                  {record.checkIn?.toDate ? record.checkIn.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...'}
                </td>
                <td className="px-8 py-6 font-mono text-center text-sm">
                  {record.checkOut ? (
                    <span className="font-black text-slate-900">{record.checkOut?.toDate ? record.checkOut.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                  ) : (
                    <span className="text-brand-500 font-black italic bg-brand-50 px-3 py-1 rounded-lg text-[10px] animate-pulse">Aktif</span>
                  )}
                </td>
                <td className="px-8 py-6">
                  {record.latenessMins > 0 ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-600">Telat {record.latenessMins}m</span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-600">Tepat</span>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => setSelectedRecord(record)} className="p-2 text-slate-400 hover:text-brand-600 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-slate-100 bg-slate-50/30">
          {paginatedAttendance.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">Data Kosong</div>
          ) : (
            paginatedAttendance.map((record) => (
              <div key={record.id} onClick={() => setSelectedRecord(record)} className="p-5 flex flex-col space-y-4 bg-white active:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 font-black uppercase">{record.userName.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-black text-slate-900">{record.userName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.role === 'security' ? 'Keamanan' : 'Kebersihan'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-900">{record.date}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{record.shift.split(' (')[0]}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Masuk</p>
                    <p className="text-sm font-mono font-black text-slate-900">
                      {record.checkIn?.toDate ? record.checkIn.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pulang</p>
                    <p className="text-sm font-mono font-black text-slate-900">
                      {record.checkOut ? record.checkOut?.toDate ? record.checkOut.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...' : <span className="text-brand-500 italic animate-pulse">Bekerja</span>}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  {record.latenessMins > 0 ? <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-rose-100 text-rose-600">Terlambat {record.latenessMins}m</span> : <span className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase bg-emerald-100 text-emerald-600">Tepat Waktu</span>}
                  {record.checkOut && <span className="text-[10px] font-black text-slate-400 italic">Selesai</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Attendance Pagination Controls */}
      {totalAttendancePages > 1 && (
        <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-white rounded-b-[2rem] gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left order-2 sm:order-1">
            Menampilkan {(attendancePage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(attendancePage * ITEMS_PER_PAGE, filteredData.length)} dari {filteredData.length}
          </div>
          <div className="flex items-center space-x-2 order-1 sm:order-2 w-full sm:w-auto justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAttendancePage(prev => Math.max(prev - 1, 1))}
              disabled={attendancePage === 1}
              className="px-3 sm:px-4 py-2 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex-1 sm:flex-none border-slate-100"
            >
              Sebelumnya
            </Button>
            <div className="flex items-center px-4 py-2 bg-slate-50 rounded-xl">
              <span className="text-xs font-black text-brand-600">{attendancePage}</span>
              <span className="text-xs font-black text-slate-300 mx-2">/</span>
              <span className="text-xs font-black text-slate-500">{totalAttendancePages}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAttendancePage(prev => Math.min(prev + 1, totalAttendancePages))}
              disabled={attendancePage === totalAttendancePages}
              className="px-3 sm:px-4 py-2 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex-1 sm:flex-none border-slate-100"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TrendsSection({ attendances, summaryData, setFilterType, filterType, setCurrentPage, users, onUserAction }) {
  const [localAnn, setLocalAnn] = useState(announcement || '');
  const [isSimulating, setIsSimulating] = useState(false);

  // Calculate trends for the last 7 days
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('id-ID');
    }).reverse();

    return last7Days.map(date => {
      const count = attendances.filter(a => a.date === date).length;
      return { 
        name: date.split('/')[0], 
        fullDate: date, 
        count: count 
      };
    });
  }, [attendances]);

  const handleSeedCleaner = async () => {
    setIsSimulating(true);
    const APP_ID = 'sweet-alba-absensi';
    const TEST_USER_ID = 'cln_test_siti';
    
    try {
      const siti = {
        id: TEST_USER_ID,
        name: 'Siti Aminah (Test)',
        username: '081299887766',
        password: '123',
        role: 'cleaner'
      };
      
      await onUserAction('add', siti);

      const batchSize = 90;
      for (let i = 0; i < batchSize; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        
        const dateStr = d.toLocaleDateString('id-ID');
        const recordId = `test-siti-${i}`;
        
        const checkInDate = new Date(d);
        const isLate = Math.random() > 0.8;
        const hour = isLate ? 9 : 8;
        const minute = isLate ? Math.floor(Math.random() * 20) + 1 : Math.floor(Math.random() * 59);
        checkInDate.setHours(hour, minute, 0);

        const lateness = isLate ? minute : 0;

        await setDoc(doc(db, 'apps', APP_ID, 'attendances', recordId), {
          userId: siti.id,
          userName: siti.name,
          role: siti.role,
          date: dateStr,
          shift: 'CLEANER (Shift Pagi 09:00 - 16:00)',
          checkIn: checkInDate,
          checkOut: new Date(checkInDate.getTime() + 7 * 60 * 60 * 1000), 
          latenessMins: lateness,
          locationIn: { lat: -6.22, lng: 106.81 }
        }, { merge: true });
      }
      alert("User 'Siti Aminah' dan 3 bulan log berhasil dibuat!");
    } catch (err) {
      console.error(err);
      alert("Gagal seeding data: " + err.message);
    }
    setIsSimulating(false);
  };

  const handleGenerateDummy = async () => {
    setIsSimulating(true);
    const APP_ID = 'sweet-alba-absensi';
    
    try {
      const staffUsers = users.filter(u => u.role !== 'admin');
      if (staffUsers.length === 0) {
        alert("Tidak ada user petugas untuk simulasi data.");
        setIsSimulating(false);
        return;
      }

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('id-ID');
        
        const dailyCount = Math.floor(Math.random() * 3) + 2; 
        const randomUsers = [...staffUsers].sort(() => 0.5 - Math.random()).slice(0, dailyCount);

        for (const user of randomUsers) {
          const recordId = `dummy-${dateStr}-${user.id}`;
          const checkInDate = new Date(d);
          checkInDate.setHours(7, Math.floor(Math.random() * 30), 0); 

          await setDoc(doc(db, 'apps', APP_ID, 'attendances', recordId), {
            userId: user.id,
            userName: user.name,
            role: user.role,
            date: dateStr,
            shift: 'SECURITY_1 (Pagi 07:00 - 15:00)',
            checkIn: checkInDate,
            checkOut: new Date(checkInDate.getTime() + 8 * 60 * 60 * 1000), 
            latenessMins: 0,
            locationIn: { lat: -6.2, lng: 106.8 }
          }, { merge: true });
        }
      }
      alert("Simulasi data berhasil! Grafik akan segera terupdate.");
    } catch (err) {
      console.error(err);
      alert("Gagal simulasi data: " + err.message);
    }
    setIsSimulating(false);
  };

function AnnouncementSection({ announcement, onUpdateAnnouncement }) {
  const [localAnn, setLocalAnn] = useState(announcement || '');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="p-8 border-none bg-white shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 shadow-inner">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="font-black text-slate-900 tracking-tight text-xl">Broadcast Pengumuman</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pesan internal untuk seluruh petugas</p>
          </div>
        </div>

        <div className="space-y-6">
          <textarea 
            className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium focus:ring-4 focus:ring-brand-500/10 outline-none resize-none transition-all"
            placeholder="Tulis instruksi atau pengumuman hari ini yang akan muncul di dashboard petugas..."
            value={localAnn}
            onChange={(e) => setLocalAnn(e.target.value)}
          />
          
          <Button 
            className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs" 
            onClick={() => onUpdateAnnouncement(localAnn)}
          >
            Update Pengumuman Sekarang
          </Button>
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100">
           <div className="flex space-x-3 text-amber-800">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold leading-relaxed uppercase tracking-wider">
                Peringatan: Pengumuman ini akan langsung terlihat oleh semua staff saat mereka membuka dashboard masing-masing.
              </p>
           </div>
        </div>
      </Card>
    </motion.div>
  );
}

function TrendsSection({ attendances, summaryData, setFilterType, filterType, setCurrentPage, users, onUserAction }) {
  const [isSimulating, setIsSimulating] = useState(false);
              {chartData.map((day, i) => {
                const maxCount = Math.max(...chartData.map(d => d.count), 1);
                const heightPercentage = (day.count / maxCount) * 100;
                
                return (
                  <div key={day.fullDate} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-20 shadow-2xl pointer-events-none mb-2 transform group-hover:-translate-y-1 font-black">
                      {day.count} Orang
                    </div>
                    
                    {/* Bar Container */}
                    <div className="w-full flex flex-col items-center justify-end h-full group">
                      {day.count > 0 ? (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercentage}%` }}
                          transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
                          className="w-4 sm:w-8 bg-brand-500 rounded-t-lg relative group-hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20"
                        />
                      ) : (
                        <div className="w-4 sm:w-8 h-1.5 bg-slate-100 rounded-full mb-0" />
                      )}
                    </div>
                    
                    {/* Label */}
                    <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">{day.name}</p>
                  </div>
                );
              })}
           </div>
           
           <div className="mt-8 flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tercatat</span>
              </div>
              <div className="flex items-center space-x-2">
                 <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kosong</span>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}

export function AttendanceDetailModal({ record, onClose }) {
  if (!record) return null;
  const timeIn = record.checkIn?.toDate ? record.checkIn.toDate() : new Date(record.checkIn);
  const timeOut = record.checkOut ? (record.checkOut?.toDate ? record.checkOut.toDate() : new Date(record.checkOut)) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10"><LogOut size={20} className="rotate-180" /></button>
        <div className="p-8 sm:p-10 space-y-8">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white font-black text-2xl uppercase">{record.userName.charAt(0)}</div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight">{record.userName}</h3>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-1">{record.role === 'security' ? 'Security' : 'Kebersihan'} • {record.date}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Waktu Masuk</p>
              <p className="text-xl font-mono font-black text-slate-900">{timeIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
              {record.locationIn && <a href={`https://www.google.com/maps?q=${record.locationIn.lat},${record.locationIn.lng}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center text-[9px] font-black text-blue-600 bg-blue-100 px-3 py-1.5 rounded-xl uppercase tracking-tighter"><MapPin size={10} className="mr-1.5" /> Lihat di Map</a>}
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Waktu Pulang</p>
              <p className="text-xl font-mono font-black text-slate-900">{timeOut ? timeOut.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
              {record.locationOut && <a href={`https://www.google.com/maps?q=${record.locationOut.lat},${record.locationOut.lng}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center text-[9px] font-black text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-xl uppercase tracking-tighter"><MapPin size={10} className="mr-1.5" /> Lihat di Map</a>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 border-b border-slate-100"><span className="text-sm font-bold text-slate-500">Shift</span><span className="text-sm font-black text-slate-900">{record.shift}</span></div>
            <div className="flex justify-between items-center py-4 border-b border-slate-100"><span className="text-sm font-bold text-slate-500">Status Kehadiran</span>{record.latenessMins > 0 ? <span className="text-rose-600 font-black text-sm uppercase">Terlambat {record.latenessMins} Menit</span> : <span className="text-emerald-600 font-black text-sm uppercase">Tepat Waktu</span>}</div>
          </div>
          <Button onClick={onClose} className="w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl">Tutup Detail</Button>
        </div>
      </motion.div>
    </div>
  );
}

function UserManagementSection({ users, onUserAction, usersPage, setUsersPage, ITEMS_PER_PAGE }) {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', username: '', password: '', role: 'security' });

  // User Pagination
  const totalUsersPages = Math.ceil(users.length / ITEMS_PER_PAGE);
  const paginatedUsers = users.slice(
    (usersPage - 1) * ITEMS_PER_PAGE,
    usersPage * ITEMS_PER_PAGE
  );

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ ...user }); // Use spread to avoid direct reference
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'security' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'security' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUserAction(editingUser ? 'update' : 'add', formData);
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', username: '', password: '', role: 'security' });
  };

  return (
    <section className="space-y-6 pb-20 sm:pb-0">
      <Card className="border-none shadow-xl overflow-hidden rounded-[2rem]">
        <div className="p-5 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
          <div className="flex items-center space-x-3 self-start sm:self-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><Settings size={20} /></div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">Daftar Akun Petugas</h2>
          </div>
          <Button onClick={handleAddNew} className="w-full sm:w-auto bg-brand-600 text-white rounded-xl py-3 px-6 font-black text-xs uppercase tracking-widest"><UserPlus size={18} className="mr-2" /> Tambah Akun Baru</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left hidden sm:table">
            <thead><tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400"><th className="px-8 py-4">Nama Lengkap</th><th className="px-8 py-4">Nomor HP</th><th className="px-8 py-4">Peran</th><th className="px-8 py-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-black text-slate-900">{user.name}</td>
                  <td className="px-8 py-5 font-mono text-sm text-slate-600">{user.username}</td>
                  <td className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{user.role}</td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button onClick={() => handleEdit(user)} className="p-2 text-slate-300 hover:text-brand-600 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => onUserAction('delete', user)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Users Pagination Controls */}
          {totalUsersPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-white gap-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center sm:text-left order-2 sm:order-1">
                Total {users.length} Akun
              </div>
              <div className="flex items-center space-x-2 order-1 sm:order-2 w-full sm:w-auto justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                  disabled={usersPage === 1}
                  className="px-3 sm:px-4 py-2 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex-1 sm:flex-none border-slate-100"
                >
                  Sebelumnya
                </Button>
                <div className="flex items-center px-4 py-2 bg-slate-50 rounded-xl">
                  <span className="text-xs font-black text-brand-600">{usersPage}</span>
                  <span className="text-xs font-black text-slate-300 mx-2">/</span>
                  <span className="text-xs font-black text-slate-500">{totalUsersPages}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUsersPage(prev => Math.min(prev + 1, totalUsersPages))}
                  disabled={usersPage === totalUsersPages}
                  className="px-3 sm:px-4 py-2 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex-1 sm:flex-none border-slate-100"
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}

          <div className="sm:hidden divide-y divide-slate-100">
            {paginatedUsers.map(user => (
              <div key={user.id} className="p-5 flex justify-between items-center bg-white">
                <div className="space-y-1"><p className="text-sm font-black text-slate-900">{user.name}</p><p className="text-xs font-mono text-slate-500">{user.username}</p><span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter">{user.role}</span></div>
                <div className="flex space-x-1"><button onClick={() => handleEdit(user)} className="p-3 text-slate-300 active:text-brand-600"><Edit2 size={18} /></button><button onClick={() => onUserAction('delete', user)} className="p-3 text-slate-300 active:text-rose-600"><Trash2 size={18} /></button></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative">
              <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden" />
              <h3 className="text-2xl font-black text-slate-900 mb-8">{editingUser ? 'Edit Akun' : 'Akun Baru'}</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input label="Nama Lengkap" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="rounded-xl" />
                <Input 
                  label="Nomor Handphone" 
                  placeholder="Contoh: 0812..." 
                  value={formData.username} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) {
                      setFormData({ ...formData, username: val });
                    }
                  }} 
                  required 
                  className="rounded-xl" 
                />
                <Input label="Password" type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required className="rounded-xl" />
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Peran Akses</label><select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 outline-none appearance-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}><option value="security">Keamanan (Security)</option><option value="cleaner">Kebersihan (Cleaner)</option><option value="admin">Administrator</option></select></div>
                <div className="flex gap-3 pt-6"><Button type="button" variant="secondary" className="flex-1 rounded-xl py-3" onClick={handleCloseModal}>Batal</Button><Button type="submit" className="flex-1 rounded-xl py-3 font-black uppercase tracking-widest text-xs">Simpan</Button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
