import { useState, useEffect, useRef } from 'react';
import { Clock, Timer, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card } from '../../ui';
import DigitalClock from '../../Clock';
import { SHIFTS } from '../../../constants';
import Navbar from '../../Navbar';
import BottomNav from '../../BottomNav';

// Utils
import { formatDuration, getRecordDate } from '../../../utils/dateUtils';

// Modular Components
import AttendanceDetailModal from '../shared/AttendanceDetailModal';
import StaffPeriodBottomSheet from './modals/StaffPeriodBottomSheet';
import ActionSection from './sections/ActionSection';
import PersonalStats from './sections/PersonalStats';
import AttendanceHistorySection from './sections/AttendanceHistorySection';

export default function StaffDashboard({ currentUser, onLogout, theme, onThemeToggle, attendances, onClockIn, onClockOut, announcement }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [showShiftSelect, setShowShiftSelect] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return (
          <div className="space-y-8">
            <ActionSection
              activeRecord={activeRecord}
              alreadyCompletedToday={alreadyCompletedToday}
              showShiftSelect={showShiftSelect}
              setShowShiftSelect={setShowShiftSelect}
              currentUser={currentUser}
              handleActionClick={handleActionClick}
              confirmShift={confirmShift}
              activeDurationLabel={activeDurationLabel}
            />
            <PersonalStats myRecords={myRecords} />
          </div>
        );
      case 'announcement':
        return (
          <AnimatePresence mode="wait">
            {announcement ? (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
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
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <AlertTriangle size={48} className="opacity-20 mb-4" />
                <p className="type-overline">Belum ada pengumuman hari ini</p>
              </div>
            )}
          </AnimatePresence>
        );
      case 'trends':
        return (
          <AttendanceHistorySection
            myRecords={myRecords}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            setSelectedRecord={setSelectedRecord}
            setPeriodSheetOpen={setPeriodSheetOpen}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col dark:bg-slate-950">
      <Navbar currentUser={currentUser} onLogout={onLogout} theme={theme} onThemeToggle={onThemeToggle} />

      <div className="fixed inset-x-0 top-0 z-50 pointer-events-none bg-[#f8fafc]/95 pt-32 pb-3 backdrop-blur-md dark:bg-slate-950/95">
        <div className="px-4">
          <div className="mx-auto max-w-lg rounded-[2rem] py-3 text-center">
            <DigitalClock />
          </div>
        </div>
      </div>

      <main className="relative z-10 w-full max-w-md mx-auto px-4 pt-64 pb-40 space-y-8">

        {/* Alerts Section (Always visible if exists) */}
        <div className="space-y-6">
          <AnimatePresence>
            {overdueRecord && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-6 border-none bg-rose-50 border border-rose-100 rounded-3xl dark:bg-rose-950/30 dark:border-rose-500/20">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
                        <Clock size={24} />
                      </div>
                      <div>
                        <h3 className="type-card-title text-rose-900 dark:text-rose-100">Shift Sebelumnya Belum Selesai</h3>
                        <p className="type-body text-rose-700/70 mt-1 dark:text-rose-200/80">
                          Anda memiliki absen aktif pada tanggal <span className="font-bold">{overdueRecord.date}</span>
                        </p>
                      </div>
                    </div>
                    <Button variant="danger" onClick={() => onClockOut(overdueRecord.id)} className="w-full sm:w-auto bg-rose-600 shadow-none">
                      Selesaikan Shift Lama
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {renderContent()}

      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="staff" />

      <AttendanceDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />

      <StaffPeriodBottomSheet
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
