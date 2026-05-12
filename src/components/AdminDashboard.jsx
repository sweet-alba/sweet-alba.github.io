import { useState } from 'react';
import { LogOut, Calendar, Download, FileSpreadsheet, Users, AlertTriangle, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, Input } from './ui';

export default function AdminDashboard({ currentUser, onLogout, attendances }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const filteredData = attendances.filter(record => {
    const matchesSearch = record.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || record.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tanggal,Nama Petugas,Peran,Shift,Jam Masuk,Jam Pulang,Status/Keterlambatan\n";

    filteredData.forEach(row => {
      const date = row.date;
      const name = row.userName;
      const role = row.role === 'security' ? 'Keamanan' : 'Kebersihan';
      const shift = row.shift;
      const timeIn = new Date(row.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'});
      const timeOut = row.checkOut ? new Date(row.checkOut).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : 'Belum Pulang';
      const status = row.latenessMins > 0 ? `Terlambat ${row.latenessMins} menit` : 'Tepat Waktu';
      
      csvContent += `${date},${name},${role},${shift},${timeIn},${timeOut},${status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Absensi_SweetAlba_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { 
      label: 'Total Absensi', 
      value: attendances.length, 
      icon: Users, 
      color: 'bg-blue-50 text-blue-600',
      description: 'Seluruh catatan bulan ini'
    },
    { 
      label: 'Keterlambatan', 
      value: attendances.filter(a => a.latenessMins > 0).length, 
      icon: AlertTriangle, 
      color: 'bg-rose-50 text-rose-600',
      description: 'Butuh perhatian khusus'
    },
    { 
      label: 'Aktif Sekarang', 
      value: attendances.filter(a => !a.checkOut).length, 
      icon: Calendar, 
      color: 'bg-brand-50 text-brand-600',
      description: 'Petugas di lapangan'
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-2xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-brand-500 p-2.5 rounded-2xl">
              <FileSpreadsheet size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight">Admin Console</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Management System v2.0</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:block text-right">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Administrator</p>
              <p className="text-sm font-bold text-slate-200">{currentUser.name}</p>
            </div>
            <Button variant="danger" size="sm" onClick={onLogout} className="bg-slate-800 hover:bg-rose-600 border-none">
              <LogOut size={16} className="mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-10 w-full space-y-10">
        
        {/* Stats Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-6 border-none flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center">
                  <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center mr-5 shadow-sm group-hover:scale-110 transition-transform`}>
                    <stat.icon size={28} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-900 leading-none">{stat.value}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">{stat.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* Data Management Area */}
        <section className="space-y-6">
          <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-slate-100 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <Calendar size={20} />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Rekapitulasi Kehadiran</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Cari nama petugas..." 
                    className="pl-11 py-2.5"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    className="pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 appearance-none min-w-[180px]"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                  >
                    <option value="all">Semua Peran</option>
                    <option value="security">Security (Satpam)</option>
                    <option value="cleaner">Kebersihan</option>
                  </select>
                </div>
                <Button onClick={exportToCSV} className="bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap">
                  <Download size={18} className="mr-2" />
                  Export Data
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-[0.15em]">
                    <th className="px-8 py-5">Tanggal</th>
                    <th className="px-8 py-5">Petugas</th>
                    <th className="px-8 py-5">Shift</th>
                    <th className="px-8 py-5 text-center">Masuk</th>
                    <th className="px-8 py-5 text-center">Pulang</th>
                    <th className="px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <Search size={64} className="mb-4" />
                          <p className="text-xl font-bold">Data Tidak Ditemukan</p>
                          <p className="text-sm">Coba sesuaikan pencarian atau filter anda</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((record, idx) => (
                      <motion.tr 
                        key={record.id} 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <p className="text-slate-900 font-bold text-sm">{record.date}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                              {record.userName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-slate-900 font-black text-sm">{record.userName}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {record.role === 'security' ? 'Keamanan' : 'Kebersihan'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                            {record.shift.split(' (')[0]}
                          </span>
                        </td>
                        <td className="px-8 py-6 font-mono text-slate-900 font-bold text-center text-sm">
                          {new Date(record.checkIn).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
                        </td>
                        <td className="px-8 py-6 font-mono text-center text-sm">
                          {record.checkOut ? (
                            <span className="text-slate-900 font-bold">{new Date(record.checkOut).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                          ) : (
                            <span className="text-brand-500 font-black italic bg-brand-50 px-3 py-1 rounded-lg text-[10px] uppercase tracking-tighter animate-pulse">Aktif</span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          {record.latenessMins > 0 ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-rose-100 text-rose-600">
                              Terlambat {record.latenessMins}m
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-emerald-100 text-emerald-600">
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
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-widest">
          <p>&copy; 2024 Sweet Alba Management</p>
          <p>Internal Security & Logistics Division</p>
        </div>
      </footer>
    </div>
  );
}
