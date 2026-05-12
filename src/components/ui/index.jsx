import { Moon, Sun } from 'lucide-react';
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
