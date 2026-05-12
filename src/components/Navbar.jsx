import { LogOut, User, Menu, X, Shield, LayoutDashboard, Settings, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button } from './ui';

export default function Navbar({ currentUser, onLogout }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = currentUser.role === 'admin';

  // Format date parts to match reference image
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const fullDate = currentDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="fixed top-6 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
      <motion.nav 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/90 backdrop-blur-2xl text-white h-20 sm:h-24 px-8 rounded-[3rem] shadow-2xl shadow-slate-950/40 border border-white/5 flex items-center justify-between w-full max-w-4xl pointer-events-auto"
      >
        {/* Left: User Initials (Circular) */}
        <div className="flex-1 flex justify-start">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 flex items-center justify-center text-slate-300 bg-white/5 backdrop-blur-md shadow-inner">
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest">
              {currentUser.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </span>
          </div>
        </div>

        {/* Center: Dynamic Date Info */}
        <div className="flex-[2] flex flex-col items-center justify-center text-center">
          <h2 className="text-base sm:text-xl font-black tracking-tight leading-none text-white">
            {monthYear}
          </h2>
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1 sm:mt-2 opacity-80">
            {fullDate}
          </p>
        </div>

        {/* Right: Logout Action (Circular) */}
        <div className="flex-1 flex justify-end">
          <button 
            onClick={onLogout}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-white/10 flex items-center justify-center text-rose-400 hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-300 bg-white/5 backdrop-blur-md shadow-inner group"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>
      </motion.nav>
    </div>
  );
}
