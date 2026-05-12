import { motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { Button } from '../../ui';

export default function AttendanceDetailModal({ record, onClose }) {
  if (!record) return null;
  const timeIn = record.checkIn?.toDate ? record.checkIn.toDate() : new Date(record.checkIn);
  const timeOut = record.checkOut ? (record.checkOut?.toDate ? record.checkOut.toDate() : new Date(record.checkOut)) : null;
  const durationMins = timeOut ? Math.floor((timeOut - timeIn) / (1000 * 60)) : null;

  const formatDuration = (mins) => {
    if (mins === null) return '--';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} Jam ${m} Menit`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div 
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%", opacity: 0 }} 
        className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-lg relative dark:bg-slate-900"
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10 dark:bg-white/10 dark:hover:text-white"
        >
          <X size={20} />
        </button>
        <div className="p-8 sm:p-10 space-y-8">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white type-page-title uppercase">
              {record.userName.charAt(0)}
            </div>
            <div>
              <h3 className="type-page-title text-slate-900 dark:text-white">{record.userName}</h3>
              <p className="type-overline text-slate-400 mt-1">
                {record.role === 'security' ? 'Security' : 'Kebersihan'} • {record.date}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 dark:bg-slate-950/60 dark:border-white/10">
              <p className="type-overline text-slate-400 mb-2">Waktu Masuk</p>
              <p className="type-value font-mono text-slate-900 dark:text-white">
                {timeIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {record.locationIn && (
                <a 
                  href={`https://www.google.com/maps?q=${record.locationIn.lat},${record.locationIn.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-3 inline-flex items-center type-overline text-blue-600 bg-blue-100 px-3 py-1.5 rounded-xl"
                >
                  <MapPin size={10} className="mr-1.5" /> Lihat di Map
                </a>
              )}
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 dark:bg-slate-950/60 dark:border-white/10">
              <p className="type-overline text-slate-400 mb-2">Waktu Pulang</p>
              <p className="type-value font-mono text-slate-900 dark:text-white">
                {timeOut ? timeOut.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </p>
              {record.locationOut && (
                <a 
                  href={`https://www.google.com/maps?q=${record.locationOut.lat},${record.locationOut.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-3 inline-flex items-center type-overline text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-xl"
                >
                  <MapPin size={10} className="mr-1.5" /> Lihat di Map
                </a>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-white/10">
              <span className="type-body text-slate-500">Shift</span>
              <span className="type-body font-bold text-slate-900 dark:text-white">{record.shift}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-white/10">
              <span className="type-body text-slate-500">Durasi Kerja</span>
              <span className="type-body font-bold text-slate-900 dark:text-white">{formatDuration(durationMins)}</span>
            </div>
            <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-white/10">
              <span className="type-body text-slate-500">Status Kehadiran</span>
              {record.latenessMins > 0 ? (
                <span className="type-body text-rose-600 font-bold uppercase">Terlambat {record.latenessMins} Menit</span>
              ) : (
                <span className="type-body text-emerald-600 font-bold uppercase">Tepat Waktu</span>
              )}
            </div>
          </div>
          <Button onClick={onClose} className="w-full py-5 rounded-3xl type-button shadow-none">
            Tutup Detail
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
