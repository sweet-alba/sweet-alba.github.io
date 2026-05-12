import { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Check,
  Trash2,
  AlertTriangle,
  TrendingUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Bell,
  Settings,
  X,
  Shield,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button, Card, Input } from './ui';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

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
  if (record.checkIn?.toDate) return record.checkIn.toDate();
  if (record.checkIn) return new Date(record.checkIn);

  if (record.date) {
    const [day, month, year] = String(record.date).split('/').map(Number);
    if (day && month && year) return new Date(year, month - 1, day);
  }

  return null;
}

function isSameDay(dateA, dateB) {
  return dateA?.getDate() === dateB?.getDate()
    && dateA?.getMonth() === dateB?.getMonth()
    && dateA?.getFullYear() === dateB?.getFullYear();
}

function isSameMonth(date, month, year) {
  return date?.getMonth() === month && date?.getFullYear() === year;
}

export default function AdminDashboard({ currentUser, onLogout, theme, onThemeToggle, attendances, users = [], onUserAction, announcement, announcementLogs = [], onUpdateAnnouncement }) {
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'users', or 'trends'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showSearch, setShowSearch] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [filterSheet, setFilterSheet] = useState(null);
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);
  const [summaryScope, setSummaryScope] = useState('monthly');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');

  const [attendancePage, setAttendancePage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [filterType, setFilterType] = useState('all'); // 'all', 'late', 'active'
  const ITEMS_PER_PAGE = 10;

  const periodData = useMemo(() => {
    return attendances.filter(record => {
      const recordDate = getRecordDate(record);
      if (!recordDate || Number.isNaN(recordDate.getTime())) return false;

      if (summaryScope === 'daily') {
        return isSameDay(recordDate, selectedDate);
      }

      return isSameMonth(recordDate, selectedMonth, selectedYear);
    });
  }, [attendances, summaryScope, selectedDate, selectedMonth, selectedYear]);

  const filteredData = useMemo(() => {
    let data = periodData.filter(record => {
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
        data = summaryScope === 'daily'
          ? data.filter(a => !a.checkOut)
          : data.filter(a => a.userId);
        break;
      default:
        break;
    }

    return data.sort((a, b) => {
      const dateA = getRecordDate(a);
      const dateB = getRecordDate(b);
      return dateB - dateA;
    });
  }, [periodData, searchTerm, filterRole, selectedUserFilter, filterType, summaryScope]);

  // Attendance Pagination
  const totalAttendancePages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedAttendance = filteredData.slice(
    (attendancePage - 1) * ITEMS_PER_PAGE,
    attendancePage * ITEMS_PER_PAGE
  );
  const staffUsers = users.filter(u => u.role !== 'admin');
  const selectedUserLabel = selectedUserFilter === 'all'
    ? 'Semua Petugas'
    : staffUsers.find(user => user.id === selectedUserFilter)?.name || 'Semua Petugas';
  const selectedRoleLabel = filterRole === 'all'
    ? 'Semua Peran'
    : filterRole === 'security'
      ? 'Security'
      : 'Kebersihan';

  const stats = [
    {
      id: 'all',
      label: 'TOTAL KEHADIRAN',
      value: periodData.length,
      icon: Users,
      bgClass: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10',
      iconBg: 'bg-slate-100 dark:bg-white/5',
      labelColor: 'text-slate-500 dark:text-slate-500',
      valueColor: 'text-slate-950 dark:text-white',
      unit: summaryScope === 'daily' ? 'HARI' : 'KALI'
    },
    {
      id: 'late',
      label: 'FREKUENSI TELAT',
      value: periodData.filter(a => a.latenessMins > 0).length,
      icon: AlertTriangle,
      bgClass: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10',
      iconBg: 'bg-rose-50 dark:bg-white/5',
      labelColor: 'text-slate-500 dark:text-slate-500',
      valueColor: 'text-slate-950 dark:text-white',
      unit: 'KALI'
    },
    {
      id: 'active',
      label: summaryScope === 'daily' ? 'SEDANG AKTIF' : 'PETUGAS AKTIF',
      value: summaryScope === 'daily'
        ? periodData.filter(a => !a.checkOut).length
        : new Set(periodData.map(a => a.userId).filter(Boolean)).size,
      icon: UserPlus,
      bgClass: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10',
      iconBg: 'bg-brand-50 dark:bg-white/5',
      labelColor: 'text-slate-500 dark:text-slate-500',
      valueColor: 'text-slate-950 dark:text-white',
      unit: 'ORANG'
    },
    {
      id: 'total_users',
      label: 'TOTAL USER',
      value: users.filter(u => u.role !== 'admin').length,
      icon: Shield,
      bgClass: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10',
      iconBg: 'bg-slate-100 dark:bg-white/5',
      labelColor: 'text-slate-500 dark:text-slate-500',
      valueColor: 'text-slate-950 dark:text-white',
      unit: 'ORANG'
    }
  ];

  const periodLabel = summaryScope === 'daily'
    ? selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : `${MONTHS_ID[selectedMonth]} ${selectedYear}`;

  return (
    <div className="h-screen overflow-hidden bg-slate-100 flex flex-col dark:bg-slate-900">
      <Navbar currentUser={currentUser} onLogout={onLogout} theme={theme} onThemeToggle={onThemeToggle} />

      {/* Main Dark Content Area (The Scroll Area) */}
      <main className="fixed inset-x-0 bottom-0 top-[100px] bg-slate-50 rounded-t-[3rem] border border-slate-200 overflow-y-auto scrollbar-hide z-20 dark:bg-slate-950 dark:border-slate-950">
        <div className="px-4 pt-10 pb-32 space-y-10">

          {activeTab === 'announcement' ? (
            <AnnouncementSection
              announcement={announcement}
              announcementLogs={announcementLogs}
              onUpdateAnnouncement={onUpdateAnnouncement}
            />
          ) : activeTab === 'trends' ? (
            <TrendsSection
              attendances={attendances}
              users={users}
            />
          ) : activeTab === 'attendance' ? (
            <>
              <PeriodControl
                scope={summaryScope}
                periodLabel={periodLabel}
                onScopeChange={(nextScope) => {
                  setSummaryScope(nextScope);
                  setFilterType('all');
                  setAttendancePage(1);
                }}
                onOpenPeriod={() => setPeriodSheetOpen(true)}
              />

              <SummaryStats
                stats={stats}
                filterType={filterType}
                setFilterType={setFilterType}
                setAttendancePage={setAttendancePage}
              />

              <section className="space-y-8">
                <div className="flex items-center justify-between px-2">
                  <h2 className="type-section-title text-slate-950 dark:text-white">Riwayat Absensi</h2>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowSearch(prev => !prev)}
                      aria-pressed={showSearch}
                      aria-label="Tampilkan pencarian"
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-colors ${showSearch || searchTerm
                        ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-300'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-950 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                      <Search size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowFilters(prev => !prev)}
                      aria-pressed={showFilters}
                      aria-label="Tampilkan filter"
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-colors ${showFilters || selectedUserFilter !== 'all' || filterRole !== 'all'
                        ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20 dark:text-brand-300'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-950 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
                        }`}
                    >
                      <Filter size={18} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {showSearch && (
                    <div className="relative">
                      <Input
                        placeholder="Cari nama petugas..."
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setAttendancePage(1); }}
                        className="h-14 pl-12 rounded-[1.75rem] border-slate-200 bg-white type-body font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200 dark:placeholder:text-slate-600"
                        icon={<Search size={18} className="text-slate-600" />}
                      />
                    </div>
                  )}

                  {showFilters && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFilterSheet('user')}
                        className="h-14 min-w-0 rounded-[1.75rem] border border-slate-200 bg-white px-4 text-left type-body font-semibold text-slate-700 transition-colors focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200"
                      >
                        <span className="block truncate">{selectedUserLabel}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterSheet('role')}
                        className="h-14 min-w-0 rounded-[1.75rem] border border-slate-200 bg-white px-4 text-left type-body font-semibold text-slate-700 transition-colors focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200"
                      >
                        <span className="block truncate">{selectedRoleLabel}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm dark:border-white/5">
                  <AttendanceSection
                    filteredData={filteredData}
                    paginatedAttendance={paginatedAttendance}
                    attendancePage={attendancePage}
                    setAttendancePage={setAttendancePage}
                    totalAttendancePages={totalAttendancePages}
                    setSelectedRecord={setSelectedRecord}
                  />
                </div>
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
        </div>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <AttendanceDetailModal record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      <FilterBottomSheet
        open={filterSheet === 'user'}
        title="Pilih Petugas"
        options={[
          { value: 'all', label: 'Semua Petugas' },
          ...staffUsers.map(user => ({ value: user.id, label: user.name }))
        ]}
        value={selectedUserFilter}
        onSelect={(value) => {
          setSelectedUserFilter(value);
          setAttendancePage(1);
          setFilterSheet(null);
        }}
        onClose={() => setFilterSheet(null)}
      />
      <FilterBottomSheet
        open={filterSheet === 'role'}
        title="Pilih Peran"
        options={[
          { value: 'all', label: 'Semua Peran' },
          { value: 'security', label: 'Security' },
          { value: 'cleaner', label: 'Kebersihan' }
        ]}
        value={filterRole}
        onSelect={(value) => {
          setFilterRole(value);
          setAttendancePage(1);
          setFilterSheet(null);
        }}
        onClose={() => setFilterSheet(null)}
      />
      <PeriodBottomSheet
        key={`${periodSheetOpen}-${selectedYear}-${selectedMonth}-${selectedDate?.toISOString?.() ?? ''}`}
        open={periodSheetOpen}
        scope={summaryScope}
        selectedDate={selectedDate}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onClose={() => setPeriodSheetOpen(false)}
        onApply={({ date, month, year }) => {
          setSelectedDate(date);
          setSelectedMonth(month);
          setSelectedYear(year);
          setAttendancePage(1);
          setPeriodSheetOpen(false);
        }}
      />
    </div>
  );
}

function PeriodControl({ scope, periodLabel, onScopeChange, onOpenPeriod }) {
  return (
    <section className="sticky top-0 z-30 -mx-6 -mt-2 bg-slate-50/95 px-6 pt-2 pb-4 backdrop-blur-md dark:bg-slate-950/95">
      <div className="flex items-center gap-3 rounded-[2rem] border border-slate-200 bg-white p-2 shadow-none dark:border-white/10 dark:bg-slate-900">
        <div className="grid flex-1 grid-cols-2 gap-1 rounded-[1.5rem] bg-slate-100 p-1 dark:bg-slate-950/70">
          {[
            { value: 'daily', label: 'Harian' },
            { value: 'monthly', label: 'Bulanan' }
          ].map(item => (
            <button
              key={item.value}
              type="button"
              onClick={() => onScopeChange(item.value)}
              className={`h-11 rounded-[1.15rem] type-button transition-all ${scope === item.value
                ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onOpenPeriod}
          className="flex h-14 min-w-0 max-w-[44%] items-center justify-center gap-2 rounded-[1.5rem] border border-slate-200 bg-white px-4 type-button text-slate-700 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-white/5"
        >
          <CalendarDays size={18} className="shrink-0 text-brand-600 dark:text-brand-300" />
          <span className="truncate">{periodLabel}</span>
        </button>
      </div>
    </section>
  );
}

function PeriodBottomSheet({ open, scope, selectedDate, selectedMonth, selectedYear, onClose, onApply }) {
  const [draftDate, setDraftDate] = useState(selectedDate);
  const [draftMonth, setDraftMonth] = useState(selectedMonth);
  const [draftYear, setDraftYear] = useState(selectedYear);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const daysInMonth = new Date(draftYear, draftMonth + 1, 0).getDate();
  const maxSelectableDay = draftYear === currentYear && draftMonth === currentMonth ? currentDay : daysInMonth;
  const selectedDay = Math.min(draftDate.getDate(), maxSelectableDay);
  const visibleMonths = MONTHS_ID
    .map((label, value) => ({ label, value }))
    .filter(month => draftYear < currentYear || month.value <= currentMonth);
  const canGoPreviousYear = draftYear > MIN_PERIOD_YEAR;
  const canGoNextYear = draftYear < currentYear;

  const updateYear = (nextYear) => {
    const safeYear = Math.min(Math.max(nextYear, MIN_PERIOD_YEAR), currentYear);
    const safeMonth = safeYear === currentYear ? Math.min(draftMonth, currentMonth) : draftMonth;
    const safeMaxDay = safeYear === currentYear && safeMonth === currentMonth
      ? currentDay
      : new Date(safeYear, safeMonth + 1, 0).getDate();

    setDraftYear(safeYear);
    setDraftMonth(safeMonth);
    setDraftDate(new Date(safeYear, safeMonth, Math.min(selectedDay, safeMaxDay)));
  };

  const updateMonth = (nextMonth) => {
    const isFutureMonth = draftYear === currentYear && nextMonth > currentMonth;
    if (isFutureMonth) return;

    const safeMaxDay = draftYear === currentYear && nextMonth === currentMonth
      ? currentDay
      : new Date(draftYear, nextMonth + 1, 0).getDate();

    setDraftMonth(nextMonth);
    setDraftDate(new Date(draftYear, nextMonth, Math.min(selectedDay, safeMaxDay)));
  };

  const handleApply = () => {
    const nextDate = new Date(draftYear, draftMonth, selectedDay);
    onApply({
      date: nextDate,
      month: draftMonth,
      year: draftYear
    });
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
              <h3 className="type-page-title text-slate-950 dark:text-white">
                {scope === 'daily' ? 'Pilih Tanggal' : 'Pilih Bulan'}
              </h3>
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
                  {visibleMonths.map(month => (
                    <button
                      key={month.label}
                      type="button"
                      onClick={() => updateMonth(month.value)}
                      className={`min-h-14 rounded-[1.75rem] border px-4 text-left type-body font-semibold transition-colors ${draftMonth === month.value
                        ? 'border-brand-500/30 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300'
                        : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-white/5'
                        }`}
                    >
                      {month.label}
                    </button>
                  ))}
                </div>
              </div>

              {scope === 'daily' && (
                <div className="space-y-3">
                  <p className="type-overline text-slate-400">Tanggal</p>
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => {
                      const disabled = day > maxSelectableDay;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setDraftDate(new Date(draftYear, draftMonth, day))}
                          disabled={disabled}
                          className={`aspect-square rounded-2xl type-button transition-colors disabled:opacity-25 disabled:pointer-events-none ${selectedDay === day
                            ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                            : 'bg-slate-50 text-slate-500 hover:text-slate-950 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:text-white'
                            }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <Button onClick={handleApply} className="w-full py-5 rounded-3xl type-button shadow-none">
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

function SummaryStats({ stats, filterType, setFilterType, setAttendancePage }) {
  return (
    <section className="grid grid-cols-2 gap-4">
      {stats.map((stat, idx) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          onClick={() => {
            setFilterType(stat.id);
            setAttendancePage(1);
          }}
          className="cursor-pointer group"
        >
          <Card className={`p-4 flex flex-col justify-between h-28 transition-all duration-300 rounded-[1.5rem] relative overflow-hidden shadow-sm ${filterType === stat.id ? 'outline outline-2 outline-brand-500/60 bg-brand-50/40 dark:outline-white dark:bg-white/5' : ''
            } ${stat.bgClass || 'bg-white'}`}>

            {/* Top Row: Value & Icon */}
            <div className="flex justify-between items-start relative z-10">
              <p className={`type-stat ${stat.valueColor || 'text-slate-900'}`}>
                {typeof stat.value === 'number' ? stat.value.toLocaleString('id-ID') : stat.value}
                <span className="type-overline ml-1 opacity-60">
                  {stat.unit === 'HARI' ? '' : stat.unit}
                </span>
              </p>
              <div className={`p-2 rounded-xl ${stat.iconBg} text-slate-500 shadow-none dark:text-white`}>
                <stat.icon size={20} />
              </div>
            </div>

            {/* Bottom Row: Label */}
            <div className="mt-auto relative z-10">
              <p className={`type-overline opacity-80 ${stat.labelColor || 'text-slate-400'}`}>
                {stat.label}
              </p>
            </div>

            {/* Subtle background decoration */}
            <div className={`absolute -right-4 -bottom-4 opacity-[0.06] group-hover:scale-110 transition-transform duration-500 ${stat.valueColor || 'text-slate-900'}`}>
              <stat.icon size={80} />
            </div>
          </Card>
        </motion.div>
      ))}
    </section>
  );
}

function AttendanceSection({ paginatedAttendance, attendancePage, setAttendancePage, totalAttendancePages, setSelectedRecord }) {
  return (
    <div className="bg-transparent min-h-[500px]">
      <div className="divide-y divide-slate-100 dark:divide-white/5">
        {paginatedAttendance.length > 0 ? (
          paginatedAttendance.map((record, idx) => {
            const timeIn = (record.checkIn?.toDate ? record.checkIn.toDate() : new Date(record.checkIn)).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const timeOut = record.checkOut ? (record.checkOut?.toDate ? record.checkOut.toDate() : new Date(record.checkOut)).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Bekerja';
            const dateStr = record.date;

            return (
              <motion.div
                key={record.id || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedRecord(record)}
                className="p-6 space-y-4 cursor-pointer hover:bg-slate-100/70 transition-colors border-b border-slate-100 dark:hover:bg-white/5 dark:border-white/5"
              >
                {/* Header Info */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 type-card-title shadow-sm dark:bg-white/5 dark:border-white/10 dark:text-white dark:shadow-inner">
                      {record.userName?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="type-card-title text-slate-950 dark:text-white">{record.userName}</h3>
                      <p className="type-overline text-slate-500 mt-1">
                        {record.role === 'security' ? 'KEAMANAN' : 'KEBERSIHAN'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="type-overline text-slate-700 dark:text-white">{dateStr}</p>
                    <p className="type-overline text-slate-500 mt-0.5">SHIFT {record.shift?.split(' (')[0] || '-'}</p>
                  </div>
                </div>

                {/* Time Box */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 grid grid-cols-2 gap-4 dark:bg-slate-900 dark:border-white/5">
                  <div>
                    <p className="type-overline text-slate-400 mb-1 dark:text-slate-600">MASUK</p>
                    <p className="type-value text-slate-950 dark:text-white">{timeIn}</p>
                  </div>
                  <div>
                    <p className="type-overline text-slate-400 mb-1 dark:text-slate-600">PULANG</p>
                    <p className={`type-value ${record.checkOut ? 'text-slate-950 dark:text-white' : 'text-emerald-500 italic'}`}>
                      {timeOut}
                    </p>
                  </div>
                </div>

                {/* Footer Badges */}
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {record.latenessMins > 0 ? (
                      <span className="px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 type-overline">
                        TERLAMBAT {record.latenessMins}M
                      </span>
                    ) : (
                      <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 type-overline">
                        TEPAT WAKTU
                      </span>
                    )}
                  </div>
                  {record.checkOut && (
                    <span className="type-overline text-slate-500 dark:text-slate-700 italic">Selesai</span>
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
        <div className="p-6 flex items-center justify-between">
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

function AnnouncementSection({ announcement, announcementLogs = [], onUpdateAnnouncement }) {
  const [localAnn, setLocalAnn] = useState(announcement || '');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="p-8 border-none bg-white shadow-sm dark:bg-slate-900">
        <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 shadow-inner dark:bg-brand-500/10 dark:text-brand-400">
            <Bell size={24} />
          </div>
          <div>
            <h3 className="type-card-title text-slate-900 dark:text-white">Broadcast Pengumuman</h3>
            <p className="type-overline text-slate-400 dark:text-slate-500">Pesan internal untuk seluruh petugas</p>
          </div>
        </div>

        <div className="space-y-6">
          <textarea
            className="w-full h-48 p-6 bg-slate-50 border border-slate-100 rounded-[1.75rem] type-body font-semibold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none resize-none transition-all placeholder:text-slate-400 dark:bg-slate-950/60 dark:border-white/10 dark:text-white dark:placeholder:text-slate-600"
            placeholder="Tulis instruksi atau pengumuman hari ini yang akan muncul di dashboard petugas..."
            value={localAnn}
            onChange={(e) => setLocalAnn(e.target.value)}
          />

          <Button
            className="w-full py-5 rounded-3xl type-button shadow-none"
            onClick={() => onUpdateAnnouncement(localAnn)}
          >
            Update Pengumuman Sekarang
          </Button>
        </div>

        <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20">
          <div className="flex space-x-3 text-amber-800 dark:text-amber-300">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p className="type-overline leading-relaxed">
              Peringatan: Pengumuman ini akan langsung terlihat oleh semua staff saat mereka membuka dashboard masing-masing.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="type-card-title text-slate-900 dark:text-white">Log Pengumuman</h4>
              <p className="type-overline text-slate-400 dark:text-slate-500">Riwayat broadcast yang pernah dibuat admin</p>
            </div>
            <span className="type-overline text-slate-500 dark:text-slate-400">{announcementLogs.length} entri</span>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {announcementLogs.length > 0 ? announcementLogs.map((log) => {
              const createdAt = log.createdAt?.toDate ? log.createdAt.toDate() : null;
              return (
                <div key={log.id} className="rounded-[1.5rem] border border-slate-100 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-slate-950/60">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="type-body font-bold text-slate-900 dark:text-white break-words">
                        {log.text || '-'}
                      </p>
                      <p className="type-overline text-slate-400 mt-1">
                        {log.createdBy || 'Administrator'} • {createdAt ? createdAt.toLocaleString('id-ID') : 'Menunggu sinkronisasi'}
                      </p>
                    </div>
                    <span className="type-overline shrink-0 rounded-full bg-brand-50 px-3 py-1 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                      Broadcast
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50/40 p-6 text-center dark:border-white/10 dark:bg-slate-950/40">
                <p className="type-body text-slate-500 dark:text-slate-400">Belum ada log pengumuman.</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function TrendsSection({ attendances }) {
  // Calculate chart data (last 7 days)
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID');
      const records = attendances.filter(a => a.date === dateStr);
      const lateRecords = records.filter(a => a.latenessMins > 0);
      const completedRecords = records.filter(a => a.checkOut);
      const activeRecords = records.filter(a => !a.checkOut);

      return {
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        shortDate: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        fullDate: dateStr,
        count: records.length,
        late: lateRecords.length,
        onTime: records.length - lateRecords.length,
        completed: completedRecords.length,
        active: activeRecords.length,
        uniqueUsers: new Set(records.map(record => record.userId).filter(Boolean)).size,
        lateMinutes: lateRecords.reduce((sum, record) => sum + (record.latenessMins || 0), 0)
      };
    }).reverse();
  }, [attendances]);

  const chartSummary = useMemo(() => {
    const total = chartData.reduce((sum, day) => sum + day.count, 0);
    const totalLate = chartData.reduce((sum, day) => sum + day.late, 0);
    const totalActive = chartData.reduce((sum, day) => sum + day.active, 0);
    const totalCompleted = chartData.reduce((sum, day) => sum + day.completed, 0);
    const totalLateMinutes = chartData.reduce((sum, day) => sum + day.lateMinutes, 0);
    const peakDay = chartData.reduce((peak, day) => day.count > peak.count ? day : peak, chartData[0]);
    const quietDay = chartData.reduce((quiet, day) => day.count < quiet.count ? day : quiet, chartData[0]);
    const latestDay = chartData[chartData.length - 1] || { count: 0 };
    const previousDay = chartData[chartData.length - 2] || { count: 0 };
    const trendDelta = latestDay.count - previousDay.count;

    return {
      total,
      average: Math.round((total / Math.max(chartData.length, 1)) * 10) / 10,
      totalLate,
      totalActive,
      totalCompleted,
      totalLateMinutes,
      peakDay,
      quietDay,
      trendDelta,
      completionRate: total ? Math.round((totalCompleted / total) * 100) : 0
    };
  }, [chartData]);

  const chartMetrics = useMemo(() => {
    const width = 640;
    const height = 280;
    const padding = { top: 24, right: 24, bottom: 48, left: 44 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const rawMax = Math.max(...chartData.flatMap(day => [day.count, day.late]), 1);
    const maxValue = Math.max(4, Math.ceil(rawMax / 4) * 4);
    const ticks = Array.from({ length: 5 }, (_, index) => Math.round((maxValue / 4) * index)).reverse();
    const getX = (index) => padding.left + (plotWidth / Math.max(chartData.length - 1, 1)) * index;
    const getY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
    const points = (key) => chartData.map((day, index) => ({
      x: getX(index),
      y: getY(day[key]),
      value: day[key],
      day
    }));
    const linePath = (items) => items.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const attendancePoints = points('count');
    const latePoints = points('late');
    const baselineY = getY(0);
    const areaPath = attendancePoints.length
      ? `${linePath(attendancePoints)} L ${attendancePoints[attendancePoints.length - 1].x} ${baselineY} L ${attendancePoints[0].x} ${baselineY} Z`
      : '';

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      maxValue,
      ticks,
      getY,
      attendancePoints,
      latePoints,
      attendancePath: linePath(attendancePoints),
      latePath: linePath(latePoints),
      areaPath,
      baselineY
    };
  }, [chartData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <Card className="p-6 sm:p-8 border-none bg-white shadow-sm dark:bg-slate-900">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner dark:bg-blue-500/10 dark:text-blue-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="type-card-title text-slate-900 dark:text-white">Tren Kehadiran</h3>
              <p className="type-overline text-slate-400 dark:text-slate-500">Performa 7 hari terakhir</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-8">
          {[
            { label: 'Total Kehadiran', value: chartSummary.total.toLocaleString('id-ID'), tone: 'text-slate-950 dark:text-white' },
            { label: 'Rata-rata/Hari', value: chartSummary.average.toLocaleString('id-ID'), tone: 'text-brand-600 dark:text-brand-300' },
            { label: 'Frekuensi Telat', value: chartSummary.totalLate.toLocaleString('id-ID'), tone: 'text-rose-500' },
            { label: 'Selesai Shift', value: `${chartSummary.completionRate}%`, tone: 'text-blue-600 dark:text-blue-300' }
          ].map(item => (
            <div key={item.label} className="rounded-[1.75rem] border border-slate-100 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-slate-950/60">
              <p className="type-overline text-slate-400">{item.label}</p>
              <p className={`type-value mt-1 ${item.tone}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-slate-50/40 p-4 dark:border-white/10 dark:bg-slate-950/40">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="type-overline text-slate-400">Grafik 7 Hari</p>
              <p className="type-body font-bold text-slate-900 dark:text-white">
                Puncak: {chartSummary.peakDay?.name || '-'} ({chartSummary.peakDay?.count || 0} hadir)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-brand-500" />
                <span className="type-overline text-slate-500">Kehadiran</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-rose-500" />
                <span className="type-overline text-slate-500">Telat</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <svg
              viewBox={`0 0 ${chartMetrics.width} ${chartMetrics.height}`}
              className="min-w-[620px] w-full"
              role="img"
              aria-label="Line chart tren kehadiran tujuh hari terakhir"
            >
              <defs>
                <linearGradient id="attendanceArea" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>

              {chartMetrics.ticks.map(tick => {
                const y = chartMetrics.getY(tick);
                return (
                  <g key={tick}>
                    <line
                      x1={chartMetrics.padding.left}
                      x2={chartMetrics.width - chartMetrics.padding.right}
                      y1={y}
                      y2={y}
                      stroke="currentColor"
                      className="text-slate-200 dark:text-white/10"
                      strokeDasharray={tick === 0 ? '0' : '6 8'}
                    />
                    <text x={12} y={y + 4} className="fill-slate-400 type-overline">
                      {tick}
                    </text>
                  </g>
                );
              })}

              <path d={chartMetrics.areaPath} fill="url(#attendanceArea)" />
              <path
                d={chartMetrics.attendancePath}
                fill="none"
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={chartMetrics.latePath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="8 8"
              />

              {chartMetrics.attendancePoints.map(point => (
                <g key={`attendance-${point.day.fullDate}`}>
                  <line
                    x1={point.x}
                    x2={point.x}
                    y1={chartMetrics.padding.top}
                    y2={chartMetrics.baselineY}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-white/5"
                  />
                  <circle cx={point.x} cy={point.y} r="7" fill="#ffffff" stroke="#22c55e" strokeWidth="4" />
                  <text x={point.x} y={point.y - 14} textAnchor="middle" className="fill-slate-700 type-overline dark:fill-slate-200">
                    {point.value}
                  </text>
                </g>
              ))}

              {chartMetrics.latePoints.map(point => point.value > 0 && (
                <g key={`late-${point.day.fullDate}`}>
                  <circle cx={point.x} cy={point.y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                </g>
              ))}

              {chartData.map((day, index) => {
                const point = chartMetrics.attendancePoints[index];
                return (
                  <g key={`label-${day.fullDate}`}>
                    <text x={point.x} y={chartMetrics.height - 24} textAnchor="middle" className="fill-slate-500 type-overline">
                      {day.name}
                    </text>
                    <text x={point.x} y={chartMetrics.height - 10} textAnchor="middle" className="fill-slate-400 type-overline">
                      {day.shortDate}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.35fr]">
          <div className="rounded-[2rem] border border-slate-100 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-slate-950/50">
            <p className="type-overline text-slate-400">Insight Cepat</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="type-body font-bold text-slate-900 dark:text-white">
                  {chartSummary.trendDelta > 0
                    ? `Naik ${chartSummary.trendDelta} dari hari sebelumnya`
                    : chartSummary.trendDelta < 0
                      ? `Turun ${Math.abs(chartSummary.trendDelta)} dari hari sebelumnya`
                      : 'Stabil dibanding hari sebelumnya'}
                </p>
                <p className="type-caption text-slate-500 dark:text-slate-400">Perbandingan data terbaru dengan satu hari sebelumnya.</p>
              </div>
              <div>
                <p className="type-body font-bold text-slate-900 dark:text-white">
                  {chartSummary.totalLateMinutes.toLocaleString('id-ID')} menit total keterlambatan
                </p>
                <p className="type-caption text-slate-500 dark:text-slate-400">Akumulasi keterlambatan dari seluruh record pada rentang ini.</p>
              </div>
              <div>
                <p className="type-body font-bold text-slate-900 dark:text-white">
                  {chartSummary.totalActive.toLocaleString('id-ID')} shift masih aktif
                </p>
                <p className="type-caption text-slate-500 dark:text-slate-400">Record yang belum memiliki waktu pulang.</p>
              </div>
              <div>
                <p className="type-body font-bold text-slate-900 dark:text-white">
                  Hari tersepi: {chartSummary.quietDay?.name || '-'} ({chartSummary.quietDay?.count || 0} hadir)
                </p>
                <p className="type-caption text-slate-500 dark:text-slate-400">Membantu melihat hari dengan aktivitas paling rendah.</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-slate-950/50">
            <div className="mb-4 flex items-center justify-between">
              <p className="type-overline text-slate-400">Detail Harian</p>
              <p className="type-overline text-slate-500">Hadir / Telat / Selesai / Aktif</p>
            </div>
            <div className="space-y-3">
              {chartData.map(day => (
                <div key={day.fullDate} className="grid grid-cols-[72px_1fr] items-center gap-3">
                  <div>
                    <p className="type-body font-bold text-slate-900 dark:text-white">{day.name}</p>
                    <p className="type-overline text-slate-400">{day.shortDate}</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: day.count, className: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' },
                      { value: day.late, className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' },
                      { value: day.completed, className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' },
                      { value: day.active, className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300' }
                    ].map((item, index) => (
                      <div key={`${day.fullDate}-${index}`} className={`rounded-2xl px-3 py-2 text-center type-button ${item.className}`}>
                        {item.value}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function FilterBottomSheet({ open, title, options, value, onSelect, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
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
              aria-label="Tutup filter"
            >
              <X size={20} />
            </button>
            <div className="mb-8">
              <h3 className="type-page-title text-slate-950 dark:text-white">{title}</h3>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pb-2">
              {options.map(option => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onSelect(option.value)}
                    className={`flex min-h-14 w-full items-center justify-between rounded-[1.75rem] border px-4 text-left type-body font-semibold transition-colors ${isSelected
                      ? 'border-brand-500/30 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:bg-white/5'
                      }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={18} />}
                  </button>
                );
              })}
            </div>
            <div className="pt-6">
              <Button onClick={onClose} className="w-full py-5 rounded-3xl type-button shadow-none">
                Tutup
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function AttendanceDetailModal({ record, onClose }) {
  if (!record) return null;
  const timeIn = record.checkIn?.toDate ? record.checkIn.toDate() : new Date(record.checkIn);
  const timeOut = record.checkOut ? (record.checkOut?.toDate ? record.checkOut.toDate() : new Date(record.checkOut)) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
      <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className="bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-lg relative dark:bg-slate-900">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10 dark:bg-white/10 dark:hover:text-white"><X size={20} /></button>
        <div className="p-8 sm:p-10 space-y-8">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center text-white type-page-title uppercase">{record.userName.charAt(0)}</div>
            <div>
              <h3 className="type-page-title text-slate-900 dark:text-white">{record.userName}</h3>
              <p className="type-overline text-slate-400 mt-1">{record.role === 'security' ? 'Security' : 'Kebersihan'} • {record.date}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 dark:bg-slate-950/60 dark:border-white/10">
              <p className="type-overline text-slate-400 mb-2">Waktu Masuk</p>
              <p className="type-value font-mono text-slate-900 dark:text-white">{timeIn.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
              {record.locationIn && <a href={`https://www.google.com/maps?q=${record.locationIn.lat},${record.locationIn.lng}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center type-overline text-blue-600 bg-blue-100 px-3 py-1.5 rounded-xl"><MapPin size={10} className="mr-1.5" /> Lihat di Map</a>}
            </div>
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 dark:bg-slate-950/60 dark:border-white/10">
              <p className="type-overline text-slate-400 mb-2">Waktu Pulang</p>
              <p className="type-value font-mono text-slate-900 dark:text-white">{timeOut ? timeOut.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
              {record.locationOut && <a href={`https://www.google.com/maps?q=${record.locationOut.lat},${record.locationOut.lng}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center type-overline text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-xl"><MapPin size={10} className="mr-1.5" /> Lihat di Map</a>}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-white/10"><span className="type-body text-slate-500">Shift</span><span className="type-body font-bold text-slate-900 dark:text-white">{record.shift}</span></div>
            <div className="flex justify-between items-center py-4 border-b border-slate-100 dark:border-white/10"><span className="type-body text-slate-500">Status Kehadiran</span>{record.latenessMins > 0 ? <span className="type-body text-rose-600 font-bold uppercase">Terlambat {record.latenessMins} Menit</span> : <span className="type-body text-emerald-600 font-bold uppercase">Tepat Waktu</span>}</div>
          </div>
          <Button onClick={onClose} className="w-full py-5 rounded-3xl type-button shadow-none">Tutup Detail</Button>
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
      <Card className="border-none shadow-sm overflow-hidden rounded-[2rem]">
        <div className="p-5 sm:p-8 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 dark:border-white/10">
          <div className="flex items-center space-x-3 self-start sm:self-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 dark:bg-white/10 dark:text-slate-300"><Settings size={20} /></div>
            <h2 className="type-card-title text-slate-900 dark:text-white">Daftar Akun Petugas</h2>
          </div>
          <Button onClick={handleAddNew} className="w-full sm:w-auto rounded-[1.75rem]"><UserPlus size={18} /> Tambah Akun Baru</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left hidden sm:table">
            <thead><tr className="bg-slate-50 type-overline text-slate-400 dark:bg-slate-950/70 dark:text-slate-500"><th className="px-8 py-4">Nama Lengkap</th><th className="px-8 py-4">Nomor HP</th><th className="px-8 py-4">Peran</th><th className="px-8 py-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/10">
              {paginatedUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors dark:hover:bg-white/5">
                  <td className="px-8 py-5 type-body font-bold text-slate-900 dark:text-white">{user.name}</td>
                  <td className="px-8 py-5 font-mono type-body text-slate-600 dark:text-slate-300">{user.username}</td>
                  <td className="px-8 py-5 type-overline text-slate-500">{user.role}</td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button onClick={() => handleEdit(user)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10"><Edit2 size={16} /></button>
                    <button onClick={() => onUserAction('delete', user)} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Users Pagination Controls */}
          {totalUsersPages > 1 && (
            <div className="p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-white gap-4 dark:bg-slate-900 dark:border-white/10">
              <div className="type-overline text-slate-400 text-center sm:text-left order-2 sm:order-1">
                Total {users.length} Akun
              </div>
              <div className="flex items-center space-x-2 order-1 sm:order-2 w-full sm:w-auto justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUsersPage(prev => Math.max(prev - 1, 1))}
                  disabled={usersPage === 1}
                  className="flex-1 sm:flex-none"
                >
                  Sebelumnya
                </Button>
                <div className="flex h-10 items-center px-4 bg-slate-50 rounded-2xl dark:bg-slate-950/70">
                  <span className="type-caption font-bold text-brand-600">{usersPage}</span>
                  <span className="type-caption font-bold text-slate-300 mx-2">/</span>
                  <span className="type-caption font-bold text-slate-500">{totalUsersPages}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setUsersPage(prev => Math.min(prev + 1, totalUsersPages))}
                  disabled={usersPage === totalUsersPages}
                  className="flex-1 sm:flex-none"
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}

          <div className="sm:hidden divide-y divide-slate-100 dark:divide-white/10">
            {paginatedUsers.map(user => (
              <div key={user.id} className="p-5 flex justify-between items-center bg-white dark:bg-slate-900">
                <div className="space-y-1"><p className="type-body font-bold text-slate-900 dark:text-white">{user.name}</p><p className="type-caption font-mono text-slate-500 dark:text-slate-400">{user.username}</p><span className="inline-block px-2 py-0.5 bg-slate-100 rounded type-overline text-slate-500 dark:bg-white/10 dark:text-slate-400">{user.role}</span></div>
                <div className="flex space-x-1"><button onClick={() => handleEdit(user)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 active:bg-brand-50 active:text-brand-600 dark:active:bg-brand-500/10"><Edit2 size={18} /></button><button onClick={() => onUserAction('delete', user)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-slate-400 active:bg-rose-50 active:text-rose-600 dark:active:bg-rose-500/10"><Trash2 size={18} /></button></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      {createPortal(
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
              <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2.5rem] bg-white p-8 pb-8 shadow-lg dark:bg-slate-900 sm:rounded-[2.5rem] sm:p-10">
                <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden dark:bg-white/10" />
                <h3 className="type-page-title text-slate-900 mb-8 dark:text-white">{editingUser ? 'Edit Akun' : 'Akun Baru'}</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input label="Nama Lengkap" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="h-14 rounded-[1.25rem]" />
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
                    className="h-14 rounded-[1.25rem]"
                  />
                  <Input label="Password" type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required className="h-14 rounded-[1.25rem]" />
                  <div className="space-y-2"><label className="type-overline text-slate-400 ml-1">Peran Akses</label><select className="w-full h-14 px-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] type-body font-semibold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none appearance-none dark:bg-slate-950/60 dark:border-white/10 dark:text-white" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}><option value="security">Keamanan (Security)</option><option value="cleaner">Kebersihan (Cleaner)</option><option value="admin">Administrator</option></select></div>
                  <div className="flex flex-col gap-3 pt-6"><Button type="submit" className="w-full py-5 rounded-3xl type-button shadow-none">Simpan</Button><Button type="button" variant="secondary" className="w-full py-5 rounded-3xl type-button shadow-none" onClick={handleCloseModal}>Batal</Button></div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </section>
  );
}
