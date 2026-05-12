import { useState, useMemo } from 'react';
import { LogOut, Clock, Calendar, User, CheckCircle, ChevronRight, AlertTriangle, AlertCircle, Timer, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card } from './ui';
import DigitalClock from './Clock';
import { SHIFTS } from '../constants';
import { AttendanceDetailModal } from './AdminDashboard';

export default function StaffDashboard({ currentUser, onLogout, attendances, onClockIn, onClockOut, announcement }) {
  const [showShiftSelect, setShowShiftSelect] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const myRecords = attendances.filter(r => r.userId === currentUser.id);
  const todayStr = new Date().toLocaleDateString('id-ID');
  const activeRecord = myRecords.find(r => r.date === todayStr && !r.checkOut);
  const overdueRecord = myRecords.find(r => r.date !== todayStr && !r.checkOut);
  const alreadyCompletedToday = myRecords.find(r => r.date === todayStr && r.checkOut);

  const personalStats = useMemo(() => {
    const lateRecords = myRecords.filter(a => a.latenessMins > 0);
    const totalLateMins = myRecords.reduce((acc, curr) => acc + (curr.latenessMins || 0), 0);
    const lateHours = Math.floor(totalLateMins / 60);
    const lateMins = totalLateMins % 60;
    return {
      total: myRecords.length,
      lateCount: lateRecords.length,
      totalLateTime: `${lateHours}j ${lateMins}m`
    };
  }, [myRecords]);

  const filteredRecords = useMemo(() => {
    return myRecords
      .filter(r => {
        const date = r.checkIn?.toDate ? r.checkIn.toDate() : new Date(r.checkIn);
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      })
      .sort((a, b) => {
        const dateA = a.checkIn?.toDate ? a.checkIn.toDate() : new Date(a.checkIn);
        const dateB = b.checkIn?.toDate ? b.checkIn.toDate() : new Date(b.checkIn);
        return dateB - dateA;
      });
  }, [myRecords, selectedMonth, selectedYear]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleActionClick = () => {
    if (activeRecord) {
      onClockOut(activeRecord.id);
    } else {
      if (currentUser.role === 'security') {
        setShowShiftSelect(true);
      } else {
        onClockIn(SHIFTS.CLEANER);
      }
    }
  };

  const confirmShift = (shiftKey) => {
    onClockIn(SHIFTS[shiftKey]);
    setShowShiftSelect(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="premium-gradient p-2.5 rounded-2xl shadow-lg shadow-brand-500/20">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">{currentUser.name}</h1>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                {currentUser.role === 'security' ? 'Petugas Keamanan' : 'Petugas Kebersihan'}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={onLogout}>
            <LogOut size={16} className="mr-2" />
            Keluar
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        <div className="sticky top-[72px] z-30 bg-[#f8fafc]/90 backdrop-blur-md pt-2 pb-6 -mx-4 px-4 sm:-mx-6 sm:px-6 space-y-6">
          <AnimatePresence>
            {overdueRecord && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="p-6 border-none bg-rose-50 border border-rose-100 rounded-3xl">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <Clock size={24} />
                      </div>
                      <div>
                        <h3 className="font-black text-rose-900 leading-tight">Shift Sebelumnya Belum Selesai</h3>
                        <p className="text-rose-700/70 text-sm font-medium mt-1">Anda memiliki absen aktif pada tanggal <span className="font-bold">{overdueRecord.date}</span></p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => onClockOut(overdueRecord.id)}
                      className="w-full sm:w-auto bg-rose-600 shadow-xl shadow-rose-600/20"
                    >
                      Selesaikan Shift Lama
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <section className="text-center space-y-8">
            <DigitalClock className="mb-2 scale-90 sm:scale-100" />
            <div className="relative max-w-lg mx-auto">
              <AnimatePresence mode="wait">
                {alreadyCompletedToday && !activeRecord ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-brand-50 text-brand-700 p-8 rounded-[2.5rem] border border-brand-100 flex flex-col items-center shadow-sm"
                  >
                    <CheckCircle size={48} className="mb-4 text-brand-500" />
                    <p className="font-black text-xl">Absensi Selesai</p>
                    <p className="text-brand-600/80 text-sm mt-1">Terima kasih atas dedikasi anda hari ini.</p>
                  </motion.div>
                ) : showShiftSelect ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="p-8 border-brand-100 bg-brand-50/30 rounded-[2.5rem]">
                      <h3 className="font-black text-slate-800 mb-8 text-xl">Pilih Shift Hari Ini</h3>
                      <div className="grid gap-4">
                        {Object.keys(SHIFTS)
                          .filter(key => key.startsWith(currentUser.role.toUpperCase()))
                          .map((key) => (
                            <Button
                              key={key}
                              variant="secondary"
                              onClick={() => confirmShift(key)}
                              className="h-16 rounded-2xl border-2 border-slate-100 hover:border-brand-500 hover:bg-white group transition-all"
                            >
                              <div className="flex flex-col items-center">
                                <span className="font-black text-slate-800 group-hover:text-brand-600 uppercase tracking-tight">{SHIFTS[key].name}</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                  {SHIFTS[key].expectedInHour}:00 - {SHIFTS[key].expectedOutHour}:00
                                </span>
                              </div>
                            </Button>
                          ))}
                      </div>
                      <button
                        onClick={() => setShowShiftSelect(false)}
                        className="mt-6 text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                      >
                        Batalkan
                      </button>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="main-action"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <button
                      onClick={handleActionClick}
                      className={`group relative w-full aspect-square max-w-[280px] sm:max-w-[320px] mx-auto rounded-[3rem] transition-all duration-500 overflow-hidden shadow-2xl ${activeRecord
                        ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                        : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'
                        }`}
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex flex-col items-center justify-center p-8 space-y-4">
                        <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                          <Timer size={40} className="text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                            {activeRecord ? 'Shift Sedang Berjalan' : 'Sapa Hari Ini'}
                          </p>
                          <h2 className="text-white text-3xl sm:text-4xl font-black tracking-tight leading-none uppercase italic">
                            {activeRecord ? 'CLOCK OUT' : 'CLOCK IN'}
                          </h2>
                        </div>
                        {activeRecord && (
                          <div className="bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                            <p className="text-white text-xs font-bold uppercase tracking-widest flex items-center">
                              <MapPin size={12} className="mr-2" />
                              Sudah Check-in di lokasi
                            </p>
                          </div>
                        )}
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

          <AnimatePresence>
            {announcement && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="p-6 border-none bg-brand-50 border-l-4 border-l-brand-500 rounded-3xl overflow-hidden relative group">
                  <div className="relative z-10 flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-600 flex-shrink-0">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1">Pengumuman Penting</p>
                      <p className="text-base font-bold text-slate-800 leading-relaxed">{announcement}</p>
                    </div>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform">
                    <AlertTriangle size={140} />
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-4 border-none bg-slate-900 text-white overflow-hidden relative group">
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Kehadiran</p>
                    <div className="flex items-baseline space-x-1">
                      <p className="text-2xl font-black tabular-nums">{personalStats.total}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Hari</p>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-4 border-none bg-white border border-slate-100 overflow-hidden relative group shadow-sm">
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Frekuensi Telat</p>
                    <div className="flex items-baseline space-x-1">
                      <p className="text-2xl font-black text-rose-600 tabular-nums">{personalStats.lateCount}</p>
                      <p className="text-[10px] text-rose-400/60 font-bold uppercase">Kali</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-4 border-none bg-brand-600 text-white overflow-hidden relative group shadow-lg shadow-brand-500/20">
                <div className="relative z-10 flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                    <Timer size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-brand-200 uppercase tracking-widest">Akumulasi Telat</p>
                    <div className="flex items-baseline space-x-1">
                      <p className="text-2xl font-black tabular-nums">{personalStats.totalLateTime}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <Calendar className="mr-3 text-brand-600" size={24} />
              Riwayat Absensi
            </h2>
            <div className="flex items-center space-x-2">
              <select
                className="flex-1 sm:flex-initial text-xs font-black bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none shadow-sm focus:ring-4 focus:ring-brand-500/10 appearance-none"
                value={selectedMonth}
                onChange={(e) => { setSelectedMonth(parseInt(e.target.value)); setCurrentPage(1); }}
              >
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select
                className="text-xs font-black bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none shadow-sm focus:ring-4 focus:ring-brand-500/10 appearance-none"
                value={selectedYear}
                onChange={(e) => { setSelectedYear(parseInt(e.target.value)); setCurrentPage(1); }}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {paginatedRecords.length === 0 ? (
              <Card className="p-12 text-center border-none shadow-sm bg-white/50">
                <Calendar size={48} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-400 font-bold text-sm">Tidak ada riwayat untuk periode ini</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {paginatedRecords.map((record, idx) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <Card className="p-5 sm:p-6 border-none shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden cursor-pointer active:scale-[0.98]">
                      <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-4 w-full">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-black text-slate-900">{record.date}</p>
                              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                {record.shift.split(' (')[0]}
                              </span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 p-3 rounded-xl">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Masuk</p>
                              <p className="text-sm font-mono font-black text-slate-800">
                                {record.checkIn?.toDate ? record.checkIn.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...'}
                              </p>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-xl">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pulang</p>
                              <p className="text-sm font-mono font-black text-slate-800">
                                {record.checkOut ? (
                                  record.checkOut?.toDate ? record.checkOut.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...'
                                ) : (
                                  <span className="text-brand-500 italic animate-pulse">Bekerja</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            {record.latenessMins > 0 ? (
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-rose-100 text-rose-600">Terlambat</span>
                                <span className="text-xs font-black text-rose-600">{record.latenessMins}m</span>
                              </div>
                            ) : (
                              <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase bg-emerald-100 text-emerald-600">Tepat Waktu</span>
                            )}
                            {record.locationIn && (
                              <div className="flex items-center text-[9px] text-blue-500 font-bold uppercase">
                                <MapPin size={10} className="mr-1" /> GPS Aktif
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 pt-6">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-100"
                    >
                      Sebelumnya
                    </Button>
                    <div className="flex items-center px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Halaman</span>
                      <span className="text-sm font-black text-brand-600">{currentPage}</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mx-2">Dari</span>
                      <span className="text-sm font-black text-slate-400">{totalPages}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-100"
                    >
                      Berikutnya
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <AttendanceDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      <footer className="bg-white border-t border-slate-100 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Sweet Alba Security System
        </div>
      </footer>
    </div>
  );
}
