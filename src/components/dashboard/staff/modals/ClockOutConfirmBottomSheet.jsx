import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, LogOut } from 'lucide-react';
import { Button } from '../../../ui';

export default function ClockOutConfirmBottomSheet({ open, onClose, onConfirm, isSubmitting = false }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[2.5rem] bg-white p-8 shadow-lg dark:bg-slate-900 sm:rounded-[2.5rem] sm:p-10"
          >
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden dark:bg-white/10" />
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-10 disabled:opacity-50 dark:bg-white/10 dark:hover:text-white"
              aria-label="Tutup konfirmasi clock out"
            >
              <X size={20} />
            </button>

            <div className="mb-8 pr-12">
              <h3 className="type-page-title text-slate-950 dark:text-white">Akhiri Sesi Kerja?</h3>
              <p className="type-body text-slate-500 mt-2 dark:text-slate-400">
                Pastikan semua tugas sudah selesai sebelum melakukan clock out.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-6">
              <Button
                onClick={onConfirm}
                disabled={isSubmitting}
                className="w-full py-5 rounded-3xl type-button shadow-none bg-rose-600 hover:bg-rose-700"
              >
                <LogOut size={16} className="mr-2" />
                {isSubmitting ? 'Memproses Clock Out...' : 'Ya, Akhiri Sesi'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full py-5 rounded-3xl type-button shadow-none"
              >
                Batal
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
