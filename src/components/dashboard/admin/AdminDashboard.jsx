import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Users, TrendingUp } from 'lucide-react';
import Navbar from '../../Navbar';
import BottomNav from '../../BottomNav';
import { Input } from '../../ui';
import { MONTHS_ID } from '../../../utils/dateUtils';

// Modular Sections
import SummaryStats from './sections/SummaryStats';
import AttendanceSection from './sections/AttendanceSection';
import AnnouncementSection from './sections/AnnouncementSection';
import TrendsSection from './sections/TrendsSection';
import UserManagementSection from './sections/UserManagementSection';

// Modular Modals
import AttendanceDetailModal from '../shared/AttendanceDetailModal';
import PeriodBottomSheet from './modals/PeriodBottomSheet';
import FilterBottomSheet from './modals/FilterBottomSheet';

export default function AdminDashboard({
  currentUser,
  onLogout,
  theme,
  onThemeToggle,
  attendances,
  users,
  onUserAction,
  announcement,
  announcementLogs,
  onUpdateAnnouncement
}) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterSheet, setFilterSheet] = useState(null); // 'user' or 'role'
  const [selectedUserFilter, setSelectedUserFilter] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterType, setFilterType] = useState('all'); // 'all', 'late', 'ontime', 'active'

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Pagination States
  const [attendancePage, setAttendancePage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  // Local state for broadcast input
  const [localAnnouncement, setLocalAnnouncement] = useState(announcement || '');

  // Derived Data for Summary
  const stats = useMemo(() => {
    const today = new Date().toLocaleDateString('id-ID');
    const todayRecords = attendances.filter(a => a.date === today);
    const lateToday = todayRecords.filter(a => a.latenessMins > 0).length;
    const activeShift = todayRecords.filter(a => !a.checkOut).length;

    return [
      {
        label: 'Total Petugas',
        value: users.length,
        unit: 'Jiwa',
        icon: Users,
        iconBg: 'bg-slate-100 dark:bg-white/10',
        iconColor: 'text-slate-600 dark:text-slate-200',
        textColor: 'text-slate-900 dark:text-white'
      },
      {
        label: 'Hadir Hari Ini',
        value: todayRecords.length,
        unit: 'Orang',
        icon: Calendar,
        iconBg: 'bg-brand-50 dark:bg-brand-500/10',
        iconColor: 'text-brand-600 dark:text-brand-400',
        textColor: 'text-brand-600 dark:text-brand-400'
      },
      {
        label: 'Terlambat',
        value: lateToday,
        unit: 'Orang',
        icon: TrendingUp,
        iconBg: 'bg-rose-50 dark:bg-rose-500/10',
        iconColor: 'text-rose-600 dark:text-rose-400',
        textColor: 'text-rose-600 dark:text-rose-400'
      },
      {
        label: 'Shift Aktif',
        value: activeShift,
        unit: 'Orang',
        icon: Users,
        iconBg: 'bg-amber-50 dark:bg-amber-500/10',
        iconColor: 'text-amber-600 dark:text-amber-400',
        textColor: 'text-amber-600 dark:text-amber-400'
      }
    ];
  }, [attendances, users]);

  // Labels for filter sheets
  const selectedUserLabel = selectedUserFilter === 'all' ? 'Semua Petugas' : users.find(u => u.id === selectedUserFilter)?.name || 'Petugas';
  const selectedRoleLabel = filterRole === 'all' ? 'Semua Peran' : filterRole === 'security' ? 'Security' : 'Kebersihan';

  const userOptions = [
    { label: 'Semua Petugas', value: 'all' },
    ...users
      .filter(u => u.role !== 'admin')
      .map(u => ({ label: u.name, value: u.id }))
  ];

  const roleOptions = [
    { label: 'Semua Peran', value: 'all' },
    { label: 'Security', value: 'security' },
    { label: 'Kebersihan (Cleaner)', value: 'cleaner' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'attendance':
        return (
          <>
            <section className="">
              <div className="w-full">
                <SummaryStats stats={stats} />
              </div>
            </section>

            {/* Period & Filter Control */}
            <section className="">
              <div className="w-full">
                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPeriodSheetOpen(true)}
                    className="flex h-14 w-full items-center justify-between rounded-[1.75rem] border border-slate-200 bg-white px-6 type-body font-bold text-slate-700 shadow-sm transition-all hover:border-brand-200 active:scale-95 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Calendar size={18} className="text-brand-600 flex-shrink-0" />
                      <span className="truncate">{MONTHS_ID[selectedMonth]} {selectedYear}</span>
                    </div>
                    <Filter size={14} className="text-slate-300 flex-shrink-0 ml-2" />
                  </button>

                  <div className="flex flex-1 items-center bg-white p-1.5 rounded-2xl border border-slate-200 dark:bg-slate-900 dark:border-white/5 w-full">
                    {['all', 'late', 'ontime', 'active'].map(type => (
                      <button
                        key={type}
                        onClick={() => { setFilterType(type); setAttendancePage(1); }}
                        className={`flex-1 py-2 px-1 rounded-xl type-overline transition-all uppercase text-[9px] leading-tight ${filterType === type ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'text-slate-400'}`}
                      >
                        {type === 'all' ? 'Semua' : type === 'late' ? 'Telat' : type === 'ontime' ? 'Tepat' : 'Aktif'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Attendance Table Section */}
            <section className="">
              <div className="w-full">
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-2">
                    <h2 className="type-section-title text-slate-950 dark:text-white">Riwayat Absensi</h2>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowSearch(prev => !prev)}
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-colors ${showSearch || searchTerm ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20' : 'bg-white border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10'}`}
                      >
                        <Search size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowFilters(prev => !prev)}
                        className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-colors ${showFilters || selectedUserFilter !== 'all' || filterRole !== 'all' ? 'bg-brand-50 border-brand-200 text-brand-700 dark:bg-brand-500/10 dark:border-brand-500/20' : 'bg-white border-slate-200 text-slate-500 dark:bg-white/5 dark:border-white/10'}`}
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
                          className="h-14 pl-12 rounded-[1.75rem] border-slate-200 bg-white type-body font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200"
                          icon={<Search size={18} className="text-slate-600" />}
                        />
                      </div>
                    )}

                    {showFilters && (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setFilterSheet('user')}
                          className="h-14 min-w-0 rounded-[1.75rem] border border-slate-200 bg-white px-4 text-left type-body font-semibold text-slate-700 transition-colors dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200"
                        >
                          <span className="block truncate">{selectedUserLabel}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilterSheet('role')}
                          className="h-14 min-w-0 rounded-[1.75rem] border border-slate-200 bg-white px-4 text-left type-body font-semibold text-slate-700 transition-colors dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200"
                        >
                          <span className="block truncate">{selectedRoleLabel}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm dark:border-white/5">
                    <AttendanceSection
                      attendances={attendances}
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                      searchTerm={searchTerm}
                      selectedUserFilter={selectedUserFilter}
                      filterRole={filterRole}
                      filterType={filterType}
                      attendancePage={attendancePage}
                      setAttendancePage={setAttendancePage}
                      setSelectedRecord={setSelectedRecord}
                    />
                  </div>
                </div>
              </div>
            </section>
          </>
        );
      case 'announcement':
        return (
          <section className="">
            <div className="w-full">
              <AnnouncementSection
                announcement={localAnnouncement}
                announcementLogs={announcementLogs}
                setAnnouncement={setLocalAnnouncement}
                onUpdateAnnouncement={() => onUpdateAnnouncement(localAnnouncement)}
              />
            </div>
          </section>
        );
      case 'trends':
        return (
          <section className="">
            <div className="w-full">
              <TrendsSection attendances={attendances} />
            </div>
          </section>
        );
      case 'users':
        return (
          <section className="">
            <div className="w-full">
              <UserManagementSection
                users={users}
                onUserAction={onUserAction}
                usersPage={usersPage}
                setUsersPage={setUsersPage}
              />
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col dark:bg-slate-950">
      <Navbar currentUser={currentUser} onLogout={onLogout} theme={theme} onThemeToggle={onThemeToggle} />

      <main className="relative z-10 w-full max-w-md mx-auto px-4 pt-36 pb-40 space-y-10">

        {/* Header */}
        <div className="px-2">
          <h1 className="type-page-title text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p className="type-overline text-slate-400 mt-1">Sistem Manajemen Kehadiran Sweet Alba</p>
        </div>

        {renderContent()}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} role="admin" />

      {/* Modals */}
      <AttendanceDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      <PeriodBottomSheet
        open={periodSheetOpen}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onClose={() => setPeriodSheetOpen(false)}
        onApply={({ month, year }) => {
          setSelectedMonth(month);
          setSelectedYear(year);
          setAttendancePage(1);
          setPeriodSheetOpen(false);
        }}
      />

      <FilterBottomSheet
        open={filterSheet === 'user'}
        title="Filter Nama Petugas"
        options={userOptions}
        value={selectedUserFilter}
        onSelect={(val) => { setSelectedUserFilter(val); setAttendancePage(1); setFilterSheet(null); }}
        onClose={() => setFilterSheet(null)}
      />

      <FilterBottomSheet
        open={filterSheet === 'role'}
        title="Filter Peran Akses"
        options={roleOptions}
        value={filterRole}
        onSelect={(val) => { setFilterRole(val); setAttendancePage(1); setFilterSheet(null); }}
        onClose={() => setFilterSheet(null)}
      />

    </div>
  );
}
