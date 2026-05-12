import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm active:scale-95',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm active:scale-95',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm active:scale-95',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-xl',
    lg: 'px-8 py-4 text-lg font-bold rounded-2xl',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
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
        'rounded-3xl border border-slate-200/60 bg-white premium-shadow',
        glass && 'glass',
        className
      )}
      {...props}
    />
  );
}

export function Input({ className, label, error, ...props }) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-sm font-medium text-slate-700 ml-1">{label}</label>}
      <input
        className={cn(
          'w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-slate-400',
          error && 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/10',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-500 ml-1">{error}</p>}
    </div>
  );
}
