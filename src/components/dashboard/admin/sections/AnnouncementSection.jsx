import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { AlertTriangle, Send, History, User, Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, Input } from '../../../ui';

export default function AnnouncementSection({ announcement, announcementLogs = [], setAnnouncement, onUpdateAnnouncement }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [announcement]);
  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 border-none bg-brand-600 shadow-xl shadow-brand-600/20 rounded-[2.5rem] relative overflow-hidden group">
          <div className="relative z-10 flex flex-col justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className="type-card-title text-white">Broadcast Pengumuman</h3>
                <p className="type-overline text-white/60">Akan muncul di dashboard seluruh petugas</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <textarea
                ref={textareaRef}
                placeholder="Ketik pesan pengumuman hari ini..."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                rows={1}
                className="w-full px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-4 focus:ring-white/10 type-body font-semibold transition-all resize-none overflow-hidden min-h-[80px]"
              />
              <Button
                onClick={onUpdateAnnouncement}
                className="h-14 px-8 rounded-2xl bg-white text-brand-600 hover:bg-white/90 shadow-lg shadow-black/10 w-full"
              >
                <Send size={18} />
                <span className="ml-2">Update</span>
              </Button>
            </div>
          </div>
          {/* Background decorative element */}
          <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <AlertTriangle size={200} />
          </div>
        </Card>
      </motion.div>

      <section className="space-y-6">
        <div className="flex flex-col space-y-4 px-2">
          <div className="flex items-center justify-between">
            <h2 className="type-section-title text-slate-950 dark:text-white flex items-center">
              <History className="mr-3 text-brand-600" size={24} />
              Riwayat Pengumuman
            </h2>
            <span className="type-overline text-slate-400">{announcementLogs.length} Pesan</span>
          </div>

          <div className="relative">
            <Input
              placeholder="Cari isi pengumuman..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="h-14 pl-12 rounded-2xl border-slate-200 bg-white type-body font-semibold text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-slate-950/50 dark:text-slate-200"
              icon={<Search size={18} className="text-slate-400" />}
            />
          </div>
        </div>

        <div className="space-y-4">
          {(() => {
            const filteredLogs = announcementLogs.filter(log => 
              log.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (log.createdBy || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            
            const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
            const startIndex = (currentPage - 1) * itemsPerPage;
            const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

            if (paginatedLogs.length > 0) {
              return (
                <>
                  {paginatedLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-6 border-none shadow-sm hover:shadow-md transition-all group dark:bg-slate-900">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <p className="type-body font-bold text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                              {log.text}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-50 dark:border-white/5">
                              <div className="flex items-center space-x-2 text-slate-400">
                                <User size={14} />
                                <span className="type-overline">{log.createdBy || 'Administrator'}</span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold uppercase dark:bg-white/5">
                                  {log.createdByRole || 'admin'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-slate-400">
                                <Clock size={14} />
                                <span className="type-overline">
                                  {log.createdAt?.toDate 
                                    ? log.createdAt.toDate().toLocaleString('id-ID', { 
                                        day: '2-digit', 
                                        month: 'short', 
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) 
                                    : 'Baru saja'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 px-2">
                      <Button
                        variant="secondary"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="h-12 px-4 rounded-xl"
                      >
                        <ChevronLeft size={18} />
                      </Button>
                      <span className="type-overline text-slate-400">
                        Halaman {currentPage} dari {totalPages}
                      </span>
                      <Button
                        variant="secondary"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="h-12 px-4 rounded-xl"
                      >
                        <ChevronRight size={18} />
                      </Button>
                    </div>
                  )}
                </>
              );
            }

            return (
              <Card className="p-12 text-center border-none shadow-sm bg-white/50 dark:bg-slate-900/70">
                <History size={48} className="mx-auto mb-4 text-slate-200 dark:text-slate-700" />
                <p className="type-body text-slate-400 dark:text-slate-500">
                  {searchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada riwayat pengumuman'}
                </p>
              </Card>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
