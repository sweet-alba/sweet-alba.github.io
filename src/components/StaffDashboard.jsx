import { useState } from 'react';
import { LogOut, Clock, Calendar, User, CheckCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card } from './ui';
import DigitalClock from './Clock';
import { SHIFTS } from '../constants';

export default function StaffDashboard({ currentUser, onLogout, attendances, onClockIn, onClockOut }) {
  const [showShiftSelect, setShowShiftSelect] = useState(false);
  
  const myRecords = attendances.filter(r => r.userId === currentUser.id);
  const todayStr = new Date().toLocaleDateString('id-ID');
  const activeRecord = myRecords.find(r => r.date === todayStr && !r.checkOut);
  const alreadyCompletedToday = myRecords.find(r => r.date === todayStr && r.checkOut);

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
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
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

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        
        {/* Status Section */}
        <section className="text-center space-y-8">
          <DigitalClock className="mb-4" />

          <div className="relative max-w-lg mx-auto">
            <AnimatePresence mode="wait">
              {alreadyCompletedToday && !activeRecord ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-brand-50 text-brand-700 p-6 rounded-3xl border border-brand-100 flex flex-col items-center shadow-sm"
                >
                  <CheckCircle size={40} className="mb-3 text-brand-500" />
                  <p className="font-bold text-lg">Absensi Selesai</p>
                  <p className="text-brand-600/80 text-sm mt-1">Terima kasih atas dedikasi anda hari ini.</p>
                </motion.div>
              ) : showShiftSelect ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="p-8 border-brand-100 bg-brand-50/30">
                    <h3 className="font-bold text-slate-800 mb-6 text-xl">Pilih Shift Hari Ini</h3>
                    <div className="grid gap-4">
                      {['SECURITY_1', 'SECURITY_2'].map((key) => (
                        <button 
                          key={key}
                          onClick={() => confirmShift(key)}
                          className="flex justify-between items-center p-5 bg-white border border-slate-200 hover:border-brand-500 hover:shadow-xl hover:shadow-brand-500/10 rounded-2xl transition-all group text-left"
                        >
                          <div>
                            <p className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{SHIFTS[key].name.split(' (')[0]}</p>
                            <p className="text-sm text-slate-500 font-medium">{SHIFTS[key].name.split(' (')[1].replace(')', '')}</p>
                          </div>
                          <ChevronRight className="text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setShowShiftSelect(false)} 
                      className="mt-6 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                    >
                      Batal
                    </button>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Button
                    onClick={handleActionClick}
                    variant={activeRecord ? 'danger' : 'primary'}
                    size="lg"
                    className="min-w-[300px] shadow-2xl shadow-brand-500/30 py-6"
                  >
                    <Clock className="mr-4" size={28} />
                    {activeRecord ? 'KONFIRMASI PULANG' : 'ABSEN MASUK SEKARANG'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {activeRecord && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-full text-slate-600 text-sm font-semibold"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Aktif: {activeRecord.shift} sejak {new Date(activeRecord.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
              </motion.div>
            )}
          </div>
        </section>

        {/* History Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <Calendar className="mr-3 text-brand-600" size={24} />
              Riwayat Absensi
            </h2>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {myRecords.length} Catatan
            </div>
          </div>

          <Card className="overflow-hidden border-none shadow-xl shadow-slate-200/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Shift Kerja</th>
                    <th className="px-6 py-4">Masuk</th>
                    <th className="px-6 py-4">Pulang</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {myRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="text-slate-300 mb-2 flex justify-center">
                          <Calendar size={48} opacity={0.2} />
                        </div>
                        <p className="text-slate-400 font-medium">Belum ada riwayat absensi untuk ditampilkan.</p>
                      </td>
                    </tr>
                  ) : (
                    myRecords.map((record, idx) => (
                      <motion.tr 
                        key={record.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <p className="text-slate-900 font-bold text-sm">{record.date}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                            {record.shift.split(' (')[0]}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-mono text-slate-700 font-bold text-sm">
                          {new Date(record.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-6 py-5 font-mono text-slate-700 text-sm">
                          {record.checkOut ? (
                            <span className="font-bold">{new Date(record.checkOut).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                          ) : (
                            <span className="text-amber-500 font-bold animate-pulse">Sedang Bekerja</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          {record.latenessMins > 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-rose-100 text-rose-600">
                              Terlambat {record.latenessMins}m
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-brand-100 text-brand-600">
                              Tepat Waktu
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

      </main>
    </div>
  );
}
