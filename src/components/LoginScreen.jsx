import { useState } from 'react';
import { LogIn, User, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card, Input, ThemeToggle } from './ui';

export default function LoginScreen({ onLogin, dbUsers = [], theme, onThemeToggle }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      const user = dbUsers.find(u => u.username === username && u.password === password);
      if (!user) {
        throw new Error('Nomor HP atau password salah!');
      }
      await onLogin(user);
    } catch (err) {
      setError(err?.message || 'Nomor HP atau password salah!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 overflow-hidden relative dark:bg-slate-950">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
      </div>
      {/* Background blobs for premium look */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob dark:bg-brand-900 dark:opacity-25 dark:mix-blend-screen"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 dark:bg-emerald-900 dark:opacity-20 dark:mix-blend-screen"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000 dark:bg-cyan-900 dark:opacity-20 dark:mix-blend-screen"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Card className="p-8 sm:p-10 border-none">
          <div className="text-center mb-10">
            <div className="premium-gradient w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-500/20 transform -rotate-6">
              <User size={40} className="text-white" />
            </div>
            <h1 className="type-page-title text-slate-900 dark:text-white">Selamat Datang</h1>
            <p className="type-body text-slate-500 mt-2 dark:text-slate-400">Sistem Absensi Cluster Sweet Alba</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-8 type-body flex items-start border border-rose-100"
            >
              <AlertTriangle size={18} className="mr-3 mt-0.5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nomor Handphone / ID Admin"
              placeholder="Masukkan nomor HP"
              value={username}
              onChange={(e) => {
                const val = e.target.value.toLowerCase();
                // Hanya izinkan angka ATAU partial/full string 'admin'
                if (val === '' || /^\d+$/.test(val) || 'admin'.startsWith(val)) {
                  setUsername(val);
                }
              }}
              autoFocus
            />
            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password anda..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" className="w-full mt-4" size="md">
              <LogIn size={20} className="mr-2" />
              {submitting ? 'Memproses...' : 'Masuk Sekarang'}
            </Button>
          </form>
        </Card>

      </motion.div>
    </div>
  );
}
