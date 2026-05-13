import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Timer, MapPin } from 'lucide-react';
import { Button, Card } from '../../../ui';
import { getShiftOptionsForRole } from '../../../../utils/attendance';

export default function ActionSection({
  activeRecord,
  alreadyCompletedToday,
  showShiftSelect,
  setShowShiftSelect,
  currentUser,
  handleActionClick,
  confirmShift,
  activeDurationLabel,
  isVerifyingLocation = false
}) {
  const formatShiftHour = (hour) => String(hour).padStart(2, '0');
  const shiftOptions = getShiftOptionsForRole(currentUser.role);

  return (
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
                {shiftOptions.map(({ key, name, expectedInHour, expectedOutHour }) => (
                    <Button
                      key={key}
                      variant="secondary"
                      onClick={() => confirmShift(key)}
                      disabled={isVerifyingLocation}
                      className="h-16 rounded-3xl border-slate-100 group dark:border-white/10"
                    >
                      <div className="flex flex-col items-center">
                        <span className="type-body font-bold text-slate-800 group-hover:text-brand-600 uppercase dark:text-slate-100 dark:group-hover:text-brand-400">{name}</span>
                        <span className="type-overline text-slate-400 mt-1 dark:text-slate-500">
                          {formatShiftHour(expectedInHour)}:00 - {formatShiftHour(expectedOutHour)}:00
                        </span>
                      </div>
                    </Button>
                  ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowShiftSelect(false)}
                disabled={isVerifyingLocation}
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
              disabled={isVerifyingLocation}
              className={`group relative w-full max-w-[250px] sm:max-w-[280px] h-[250px] sm:h-[280px] mx-auto rounded-[2.75rem] transition-all duration-500 overflow-hidden shadow-sm ${activeRecord
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200 dark:shadow-rose-950/40'
                : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200 dark:shadow-brand-950/40'
                } ${isVerifyingLocation ? 'opacity-80 cursor-not-allowed' : ''}`}
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
                  {isVerifyingLocation && (
                    <p className="type-overline text-white/80 mt-1">Memverifikasi lokasi...</p>
                  )}
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
  );
}
