import { Sun, Moon, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/cn';

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-none active:scale-95',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-none active:scale-95 dark:bg-slate-950/60 dark:text-slate-200 dark:border-white/10 dark:hover:bg-white/5',
    outline: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-none active:scale-95 dark:bg-slate-950/60 dark:text-slate-200 dark:border-white/10 dark:hover:bg-white/5',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-none active:scale-95',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5',
  };

  const sizes = {
    sm: 'h-10 px-4 type-button rounded-2xl',
    md: 'h-14 px-5 type-button rounded-[1.75rem]',
    lg: 'h-16 px-8 type-button rounded-3xl',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-4 focus:ring-brand-500/10',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, glass = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200/60 bg-white premium-shadow dark:border-white/10 dark:bg-slate-900 dark:text-slate-100',
        glass && 'glass',
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, label, error, icon, ...props }) {
  return (
    <div className="space-y-2 w-full">
      {label && <label className="type-overline text-slate-400 ml-1 dark:text-slate-400">{label}</label>}
      <div className="relative">
        {icon && <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">{icon}</div>}
        <input
          className={cn(
            'h-14 w-full px-4 type-body font-semibold bg-slate-50 border border-slate-100 rounded-[1.25rem] focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400 dark:bg-slate-950/60 dark:border-white/10 dark:text-white dark:placeholder:text-slate-600',
            icon && 'pl-12',
            error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="type-caption text-rose-500 ml-1">{error}</p>}
    </div>
  );
}

export function ThemeToggle({ theme, onToggle, className }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={isDark ? 'Mode terang' : 'Mode gelap'}
      className={cn(
        'w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center justify-center transition-all duration-300 hover:border-brand-500/40 hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
        className
      )}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export function AlertModal({ isOpen, onClose, title, message, variant = 'warning' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden dark:bg-slate-900"
          >
            <div className="p-8 text-center">
              <div className={cn(
                "w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center",
                variant === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" : "bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
              )}>
                <AlertTriangle size={40} />
              </div>
              <h3 className="type-card-title text-slate-900 mb-2 dark:text-white">{title}</h3>
              <p className="type-body text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
              <Button 
                onClick={onClose} 
                variant={variant === 'warning' ? 'primary' : 'danger'}
                className="w-full mt-8 h-16 rounded-3xl"
              >
                Mengerti
              </Button>
            </div>
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-400"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
