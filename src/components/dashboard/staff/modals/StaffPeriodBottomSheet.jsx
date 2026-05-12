import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '../../../ui';
import { MONTHS_ID, MIN_PERIOD_YEAR } from '../../../../utils/dateUtils';

export default function StaffPeriodBottomSheet({ open, selectedMonth, selectedYear, onClose, onApply }) {
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
