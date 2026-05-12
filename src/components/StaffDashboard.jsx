import { useState, useMemo, useEffect, useRef } from 'react';
import { Clock, Calendar, Check, CheckCircle, ChevronLeft, ChevronRight, X, AlertTriangle, AlertCircle, Timer, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button, Card } from './ui';
import DigitalClock from './Clock';
import { SHIFTS } from '../constants';
import Navbar from './Navbar';
import { AttendanceDetailModal } from './AdminDashboard';

const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];
const MIN_PERIOD_YEAR = 2026;

function getRecordDate(record) {
  if (record?.checkIn?.toDate) return record.checkIn.toDate();
  if (record?.checkIn) return new Date(record.checkIn);
  return null;
}

function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return '0j 0m';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes}m ${seconds}d`;
}

export default function StaffDashboard({ currentUser, onLogout, theme, onThemeToggle, attendances, onClockIn, onClockOut, announcement }) {
  const [showShiftSelect, setShowShiftSelect] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const myRecords = attendances.filter(r => r.userId === currentUser.id);
  const todayStr = new Date().toLocaleDateString('id-ID');
  const activeRecord = myRecords.find(r => r.date === todayStr && !r.checkOut);
  const overdueRecord = myRecords.find(r => r.date !== todayStr && !r.checkOut);
  const alreadyCompletedToday = myRecords.find(r => r.date === todayStr && r.checkOut);
  const activeCheckInDate = getRecordDate(activeRecord);
  const [durationTick, setDurationTick] = useState(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    if (!activeRecord) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setDurationTick(Date.now());
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [activeRecord?.id]);
  const activeDurationLabel = activeCheckInDate
    ? formatDuration(durationTick - activeCheckInDate.getTime())
    : 'Menghitung...';

  const personalStats = useMemo(() => {
    const lateRecords = myRecords.filter(a => a.latenessMins > 0);
    const onTimeRecords = myRecords.filter(a => !a.latenessMins || a.latenessMins <= 0);
    const totalLateMins = myRecords.reduce((acc, curr) => acc + (curr.latenessMins || 0), 0);
    const lateHours = Math.floor(totalLateMins / 60);
    const lateMins = totalLateMins % 60;
    return {
      total: myRecords.length,
      lateCount: lateRecords.length,
      totalLateTime: `${lateHours}j ${lateMins}m`,
      onTimeCount: onTimeRecords.length
    };
  }, [myRecords]);

  const statCards = [
    {
      label: 'Total Kehadiran',
      value: personalStats.total,
      unit: 'Hari',
      icon: Calendar,
      accent: 'text-slate-500',
      iconClass: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white'
    },
    {
      label: 'Frekuensi Telat',
      value: personalStats.lateCount,
      unit: 'Kali',
      icon: AlertCircle,
      accent: 'text-rose-500',
      iconClass: 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400'
    },
    {
      label: 'Akumulasi Telat',
      value: personalStats.totalLateTime,
      unit: '',
      icon: Timer,
      accent: 'text-brand-500 dark:text-brand-300',
      iconClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
    },
    {
      label: 'Tepat Waktu',
      value: personalStats.onTimeCount,
      unit: 'Hari',
      icon: CheckCircle,
      accent: 'text-emerald-500',
      iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
    }
  ];

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
  const periodLabel = `${MONTHS_ID[selectedMonth]} ${selectedYear}`;
  const formatShiftHour = (hour) => String(hour).padStart(2, '0');

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col dark:bg-slate-950">
      <Navbar currentUser={currentUser} onLogout={onLogout} theme={theme} onThemeToggle={onThemeToggle} />

      <div className="fixed inset-x-0 top-0 z-50 pointer-events-none bg-[#f8fafc]/95 pt-24 pb-3 backdrop-blur-md dark:bg-slate-950/95 sm:pt-28">
        <div className="px-4">
          <div className="mx-auto max-w-lg rounded-[2rem] py-3 text-center">
            <DigitalClock />
          </div>
        </div>
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-56 pb-6 sm:pt-64 sm:pb-8 space-y-8">

        <div className="space-y-6">
          <AnimatePresence>
            {overdueRecord && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="p-6 border-none bg-rose-50 border border-rose-100 rounded-3xl dark:bg-rose-950/30 dark:border-rose-500/20">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <Clock size={24} />
                      </div>
                      <div>
                        <h3 className="type-card-title text-rose-900 dark:text-rose-100">Shift Sebelumnya Belum Selesai</h3>
                        <p className="type-body text-rose-700/70 mt-1 dark:text-rose-200/80">Anda memiliki absen aktif pada tanggal <span className="font-bold">{overdueRecord.date}</span></p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => onClockOut(overdueRecord.id)}
                      className="w-full sm:w-auto bg-rose-600 shadow-none"
                    >
                      Selesaikan Shift Lama
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative flex w-full justify-center">
          <AnimatePresence mode="wait">
            {alreadyCompletedToday && !activeRecord ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-lg bg-brand-50 text-brand-700 p-8 rounded-[2.5rem] border border-brand-100 flex flex-col items-center shadow-sm dark:bg-brand-950/35 dark:text-brand-200 dark:border-brand-500/20"
              >
                <CheckCircle size={48} className="mb-4 text-brand-500" />
                <p className="type-card-title">Absensi Selesai</p>
                <p className="type-body text-brand-600/80 mt-1 dark:text-brand-300/80">Terima kasih atas dedikasi anda hari ini.</p>
              </motion.div>
            ) : showShiftSelect ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full max-w-lg"
              >
                <Card className="p-8 border-brand-100 bg-brand-50/30 rounded-[2.5rem] dark:border-brand-500/20 dark:bg-brand-950/20">
                  <h3 className="type-card-title text-slate-800 mb-8 dark:text-white">Pilih Shift Hari Ini</h3>
                  <div className="grid gap-4">
                    {Object.keys(SHIFTS)
                      .filter(key => key.startsWith(currentUser.role.toUpperCase()))
                      .map((key) => (
                        <Button
                          key={key}
                          variant="secondary"
                          onClick={() => confirmShift(key)}
                          className="h-16 rounded-3xl border-slate-100 group dark:border-white/10"
                        >
                          <div className="flex flex-col items-center">
                            <span className="type-body font-bold text-slate-800 group-hover:text-brand-600 uppercase dark:text-slate-100 dark:group-hover:text-brand-400">{SHIFTS[key].name}</span>
                            <span className="type-overline text-slate-400 mt-1 dark:text-slate-500">
                              {formatShiftHour(SHIFTS[key].expectedInHour)}:00 - {formatShiftHour(SHIFTS[key].expectedOutHour)}:00
                            </span>
                          </div>
                        </Button>
                      ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowShiftSelect(false)}
                    className="mt-6 w-full"
                  >
                    Batalkan
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="main-action"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex w-full justify-center"
              >
                <button
                  onClick={handleActionClick}
                  className={`group relative w-full max-w-[250px] sm:max-w-[280px] h-[250px] sm:h-[280px] mx-auto rounded-[2.75rem] transition-all duration-500 overflow-hidden shadow-sm ${activeRecord
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 dark:shadow-rose-950/40'
                    : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200 dark:shadow-brand-950/40'
                    }`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex h-full flex-col items-center justify-center p-6 space-y-3">
                    <div className={`${activeRecord ? 'w-14 h-14 sm:w-16 sm:h-16' : 'w-16 h-16 sm:w-20 sm:h-20'} rounded-[1.75rem] bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-105 transition-transform duration-500`}>
                      <Timer size={activeRecord ? 34 : 36} className="text-white" />
                    </div>
                    <div className="text-center">
                      <p className="type-overline text-white/80 mb-1">
                        {activeRecord ? 'Shift Sedang Berjalan' : 'Sapa Hari Ini'}
                      </p>
                      <h2 className="type-page-title text-white uppercase italic">
                        {activeRecord ? 'CLOCK OUT' : 'CLOCK IN'}
                      </h2>
                    </div>
                    {activeRecord && (
                      <div className="text-center backdrop-blur-md">
                        <p className="type-overline text-white/65">Durasi Absen</p>
                        <p className="type-card-title text-white tabular-nums">{activeDurationLabel}</p>
                      </div>
                    )}
                    {activeRecord && (
                      <div className="bg-white/12 px-4 py-1.5 rounded-full backdrop-blur-md max-w-[210px]">
                        <p className="type-caption text-white uppercase flex items-center justify-center text-center">
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

        <AnimatePresence>
          {announcement && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="p-6 border-none bg-brand-50 border-l-4 border-l-brand-500 rounded-3xl overflow-hidden relative group dark:bg-brand-950/25">
                <div className="relative z-10 flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-600 flex-shrink-0">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="type-overline text-brand-600 mb-1">Pengumuman Penting</p>
                    <p className="type-body font-bold text-slate-800 leading-relaxed dark:text-slate-100">{announcement}</p>
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
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
              >
                <Card className="h-28 p-4 border border-slate-200 bg-white overflow-hidden relative group shadow-sm dark:bg-slate-900 dark:border-white/10">
                  <div className="relative z-10 flex items-center gap-4 h-full">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.iconClass}`}>
                      <stat.icon size={24} />
                    </div>
                    <div className="min-w-0">
                      <p className={`type-overline ${stat.accent}`}>{stat.label}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <p className="type-stat text-slate-950 tabular-nums dark:text-white">{stat.value}</p>
                        {stat.unit && <p className="type-overline text-slate-500">{stat.unit}</p>}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <h2 className="type-section-title text-slate-900 flex items-center dark:text-white">
              <Calendar className="mr-3 text-brand-600" size={24} />
              Riwayat Absensi
            </h2>
            <button
              type="button"
              onClick={() => setPeriodSheetOpen(true)}
              className="flex h-14 w-full items-center justify-between rounded-[1.75rem] border border-slate-200 bg-white px-4 type-body font-semibold text-slate-700 shadow-none transition-colors focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200 sm:w-auto sm:min-w-52"
            >
              <span>{periodLabel}</span>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          </div>

          <div className="space-y-4">
            {paginatedRecords.length === 0 ? (
              <Card className="p-12 text-center border-none shadow-sm bg-white/50 dark:bg-slate-900/70">
                <Calendar size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                <p className="type-body text-slate-400 dark:text-slate-500">Tidak ada riwayat untuk periode ini</p>
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
                              <p className="type-body font-bold text-slate-900 dark:text-white">{record.date}</p>
                              <span className="type-overline bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md dark:bg-white/5 dark:text-slate-400">
                                {record.shift.split(' (')[0]}
                              </span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50/50 p-3 rounded-xl dark:bg-slate-950/60">
                              <p className="type-overline text-slate-400 mb-1">Masuk</p>
                              <p className="type-body font-mono font-bold text-slate-800 dark:text-slate-100">
                                {record.checkIn?.toDate ? record.checkIn.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...'}
                              </p>
                            </div>
                            <div className="bg-slate-50/50 p-3 rounded-xl dark:bg-slate-950/60">
                              <p className="type-overline text-slate-400 mb-1">Pulang</p>
                              <p className="type-body font-mono font-bold text-slate-800 dark:text-slate-100">
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
                                <span className="px-2 py-1 rounded-lg type-overline bg-rose-100 text-rose-600">Terlambat</span>
                                <span className="type-caption font-bold text-rose-600">{record.latenessMins}m</span>
                              </div>
                            ) : (
                              <span className="px-2 py-1 rounded-lg type-overline bg-emerald-100 text-emerald-600">Tepat Waktu</span>
                            )}
                            {record.locationIn && (
                              <div className="flex items-center type-overline text-blue-500">
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
                      className="border-slate-100"
                    >
                      Sebelumnya
                    </Button>
                    <div className="flex h-10 items-center px-4 bg-white border border-slate-100 rounded-2xl shadow-none dark:bg-slate-950/60 dark:border-white/10">
                      <span className="type-overline text-slate-400 mr-2">Halaman</span>
                      <span className="type-body font-bold text-brand-600">{currentPage}</span>
                      <span className="type-overline text-slate-300 mx-2">Dari</span>
                      <span className="type-body font-bold text-slate-400">{totalPages}</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="border-slate-100"
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
      <StaffPeriodBottomSheet
        key={`${periodSheetOpen}-${selectedYear}-${selectedMonth}`}
        open={periodSheetOpen}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onClose={() => setPeriodSheetOpen(false)}
        onApply={({ month, year }) => {
          setSelectedMonth(month);
          setSelectedYear(year);
          setCurrentPage(1);
          setPeriodSheetOpen(false);
        }}
      />

    </div>
  );
}

function StaffPeriodBottomSheet({ open, selectedMonth, selectedYear, onClose, onApply }) {
  const [draftMonth, setDraftMonth] = useState(selectedMonth);
  const [draftYear, setDraftYear] = useState(selectedYear);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const visibleMonths = MONTHS_ID
    .map((label, value) => ({ label, value }))
    .filter(month => draftYear < currentYear || month.value <= currentMonth);
  const canGoPreviousYear = draftYear > MIN_PERIOD_YEAR;
  const canGoNextYear = draftYear < currentYear;

  const updateYear = (nextYear) => {
    const safeYear = Math.min(Math.max(nextYear, MIN_PERIOD_YEAR), currentYear);
    const safeMonth = safeYear === currentYear ? Math.min(draftMonth, currentMonth) : draftMonth;
    setDraftYear(safeYear);
    setDraftMonth(safeMonth);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[2.5rem] bg-white p-8 shadow-lg dark:bg-slate-900 sm:rounded-[2.5rem] sm:p-10"
          >
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden dark:bg-white/10" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10 dark:bg-white/10 dark:hover:text-white"
              aria-label="Tutup filter periode"
            >
              <X size={20} />
            </button>

            <div className="mb-8 pr-12">
              <h3 className="type-page-title text-slate-950 dark:text-white">Pilih Periode</h3>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-[1.75rem] border border-slate-200 bg-slate-50/60 p-2 dark:border-white/10 dark:bg-slate-950/60">
                <button
                  type="button"
                  onClick={() => updateYear(draftYear - 1)}
                  disabled={!canGoPreviousYear}
                  className="h-11 w-11 rounded-2xl text-slate-500 transition-colors hover:bg-white hover:text-slate-950 disabled:opacity-30 disabled:pointer-events-none dark:hover:bg-white/5 dark:hover:text-white"
                  aria-label="Tahun sebelumnya"
                >
                  <ChevronLeft size={18} className="mx-auto" />
                </button>
                <div className="text-center">
                  <p className="type-overline text-slate-400">Tahun</p>
                  <p className="type-card-title text-slate-950 dark:text-white">{draftYear}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateYear(draftYear + 1)}
                  disabled={!canGoNextYear}
                  className="h-11 w-11 rounded-2xl text-slate-500 transition-colors hover:bg-white hover:text-slate-950 disabled:opacity-30 disabled:pointer-events-none dark:hover:bg-white/5 dark:hover:text-white"
                  aria-label="Tahun berikutnya"
                >
                  <ChevronRight size={18} className="mx-auto" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="type-overline text-slate-400">Bulan</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {visibleMonths.map(month => {
                    const isSelected = draftMonth === month.value;
                    return (
                      <button
                        key={month.label}
                        type="button"
                        onClick={() => setDraftMonth(month.value)}
                        className={`flex min-h-14 items-center justify-between rounded-[1.75rem] border px-4 text-left type-body font-semibold transition-colors ${isSelected
                          ? 'border-brand-500/30 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300'
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-white/5'
                          }`}
                      >
                        <span>{month.label}</span>
                        {isSelected && <Check size={18} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button onClick={() => onApply({ month: draftMonth, year: draftYear })} className="w-full py-5 rounded-3xl type-button shadow-none">
                  Terapkan
                </Button>
                <Button type="button" variant="secondary" onClick={onClose} className="w-full py-5 rounded-3xl type-button shadow-none">
                  Batal
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
