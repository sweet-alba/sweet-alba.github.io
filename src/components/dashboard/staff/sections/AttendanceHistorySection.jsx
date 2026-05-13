import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight, MapPin } from 'lucide-react';
import { Button, Card } from '../../../ui';
import { MONTHS_ID, getRecordDate, formatMinutesAdaptive } from '../../../../utils/dateUtils';

export default function AttendanceHistorySection({
  myRecords,
  selectedMonth,
  selectedYear,
  currentPage,
  setCurrentPage,
  setSelectedRecord,
  setPeriodSheetOpen
}) {
  const ITEMS_PER_PAGE = 10;

  const filteredRecords = useMemo(() => {
    return myRecords
      .filter(r => {
        const date = getRecordDate(r);
        return date && date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      })
      .sort((a, b) => {
        const dateA = getRecordDate(a);
        const dateB = getRecordDate(b);
        return dateB - dateA;
      });
  }, [myRecords, selectedMonth, selectedYear]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const periodLabel = `${MONTHS_ID[selectedMonth]} ${selectedYear}`;

  return (
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
                            {getRecordDate(record) ? getRecordDate(record).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '...'}
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
                            <span className="type-caption font-bold text-rose-600">{formatMinutesAdaptive(record.latenessMins, { short: true })}</span>
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
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.max(prev - 1, 1)); }}
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
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(prev => Math.min(prev + 1, totalPages)); }}
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
  );
}
