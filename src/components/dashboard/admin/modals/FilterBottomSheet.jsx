import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from '../../../ui';

export default function FilterBottomSheet({ open, title, options, value, onSelect, onClose }) {
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
            >
              <X size={20} />
            </button>
            <div className="mb-8 pr-12">
              <h3 className="type-page-title text-slate-950 dark:text-white">{title}</h3>
            </div>
            <div className="space-y-3">
              {options.map((option) => {
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
