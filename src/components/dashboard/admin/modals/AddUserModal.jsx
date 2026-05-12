import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input } from '../../../ui';

export default function AddUserModal({ show, editingUser, formData, setFormData, onClose, onSubmit }) {
  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md">
          <motion.div 
            initial={{ y: "100%", opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            exit={{ y: "100%", opacity: 0 }} 
            className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2.5rem] bg-white p-8 pb-8 shadow-lg dark:bg-slate-900 sm:rounded-[2.5rem] sm:p-10"
          >
            <div className="w-12 h-1 bg-slate-100 rounded-full mx-auto mb-8 sm:hidden dark:bg-white/10" />
            <h3 className="type-page-title text-slate-900 mb-8 dark:text-white">
              {editingUser ? 'Edit Akun' : 'Akun Baru'}
            </h3>
            <form onSubmit={onSubmit} className="space-y-5">
              <Input 
                label="Nama Lengkap" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                required 
                className="h-14 rounded-[1.25rem]" 
              />
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
              <Input 
                label="Password" 
                type="text" 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                required 
                className="h-14 rounded-[1.25rem]" 
              />
              <div className="space-y-2">
                <label className="type-overline text-slate-400 ml-1">Peran Akses</label>
                <select 
                  className="w-full h-14 px-4 bg-slate-50 border border-slate-100 rounded-[1.25rem] type-body font-semibold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none appearance-none dark:bg-slate-950/60 dark:border-white/10 dark:text-white" 
                  value={formData.role} 
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="security">Keamanan (Security)</option>
                  <option value="cleaner">Kebersihan (Cleaner)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex flex-col gap-3 pt-6">
                <Button type="submit" className="w-full py-5 rounded-3xl type-button shadow-none">Simpan</Button>
                <Button type="button" variant="secondary" className="w-full py-5 rounded-3xl type-button shadow-none" onClick={onClose}>Batal</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
