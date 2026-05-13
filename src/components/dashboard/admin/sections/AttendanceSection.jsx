import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '../../../ui';
import { formatMinutesAdaptive } from '../../../../utils/dateUtils';

export default function AttendanceSection({
  attendances,
  selectedMonth,
  selectedYear,
  searchTerm,
  selectedUserFilter,
  filterRole,
  filterType,
  attendancePage,
  setAttendancePage,
  setSelectedRecord
}) {
  const ITEMS_PER_PAGE = 8;

  const filteredData = useMemo(() => {
    return attendances
      .filter(a => {
        const dateObj = a.checkIn?.toDate ? a.checkIn.toDate() : new Date(a.checkIn);
        const matchesPeriod = dateObj.getMonth() === selectedMonth && dateObj.getFullYear() === selectedYear;
        const matchesSearch = a.userName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesUser = selectedUserFilter === 'all' || a.userId === selectedUserFilter;
        const matchesRole = filterRole === 'all' || a.role === filterRole;
        const matchesType = filterType === 'all'
          || (filterType === 'late' && a.latenessMins > 0)
          || (filterType === 'ontime' && a.latenessMins === 0)
          || (filterType === 'active' && !a.checkOut);

        return matchesPeriod && matchesSearch && matchesUser && matchesRole && matchesType;
      })
      .sort((a, b) => {
        const dateA = a.checkIn?.toDate ? a.checkIn.toDate() : new Date(a.checkIn);
        const dateB = b.checkIn?.toDate ? b.checkIn.toDate() : new Date(b.checkIn);
        return dateB - dateA;
      });
  }, [attendances, selectedMonth, selectedYear, searchTerm, selectedUserFilter, filterRole, filterType]);

  const paginatedAttendance = useMemo(() => {
    const start = (attendancePage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, attendancePage]);

  const totalAttendancePages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  return (
    <div className="bg-white dark:bg-slate-900">
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {paginatedAttendance.length > 0 ? (
          paginatedAttendance.map((record, index) => {
            const isLate = record.latenessMins > 0;
            const isActive = !record.checkOut;
            return (
              <motion.div
                key={record.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => setSelectedRecord(record)}
                className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group dark:hover:bg-white/5"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex-shrink-0 flex items-center justify-center type-body font-bold shadow-lg shadow-slate-900/10 dark:shadow-none uppercase">
                    {record.userName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="type-body font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors truncate">
                      {record.userName}
                    </h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="type-overline text-slate-500 truncate">
                        {record.role === 'security' ? 'Security' : 'Kebersihan'}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                      <span className="type-overline text-slate-400 font-mono flex-shrink-0">
                        {record.checkIn?.toDate ? record.checkIn.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1.5 flex-shrink-0 ml-4">
                  <div className="text-right">
                    {isLate ? (
                      <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold">
                        TERLAMBAT {formatMinutesAdaptive(record.latenessMins, { short: true }).toUpperCase()}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                        TEPAT WAKTU
                      </span>
                    )}
                  </div>
                  {isActive ? (
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 text-[10px] font-bold">
                      SEDANG AKTIF
                    </span>
                  ) : (
                    <span className="type-overline text-slate-400 dark:text-slate-600 italic">Selesai</span>
                  )}
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Users size={48} className="opacity-20 mb-4" />
            <p className="type-overline">Tidak ada data absensi</p>
          </div>
        )}
      </div>

      {/* Pagination Container */}
      {totalAttendancePages > 1 && (
        <div className="p-6 flex items-center justify-between border-t border-slate-100 dark:border-white/5">
          <p className="type-overline text-slate-600">
            Halaman {attendancePage} dari {totalAttendancePages}
          </p>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setAttendancePage(Math.max(1, attendancePage - 1)); }}
              disabled={attendancePage === 1}
              className="rounded-2xl"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setAttendancePage(Math.min(totalAttendancePages, attendancePage + 1)); }}
              disabled={attendancePage === totalAttendancePages}
              className="rounded-2xl"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
