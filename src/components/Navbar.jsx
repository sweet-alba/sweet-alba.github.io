import { LogOut, User, Menu, X, Shield, LayoutDashboard, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from './ui';

export default function Navbar({ currentUser, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md text-white sticky top-0 z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-brand-500 p-2 rounded-xl shadow-lg shadow-brand-500/20">
              {isAdmin ? <Shield size={20} className="text-white" /> : <LayoutDashboard size={20} className="text-white" />}
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg tracking-tight leading-none">Sweet Alba</h1>
              <p className="text-slate-500 text-[8px] font-bold uppercase tracking-[0.2em] mt-1">
                {isAdmin ? 'Management System' : 'Attendance App'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex flex-col items-end mr-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isAdmin ? 'Administrator' : 'Petugas Lapangan'}</span>
              <span className="text-sm font-bold text-slate-200">{currentUser.name}</span>
            </div>
            <Button 
              variant="danger" 
              size="sm" 
              onClick={onLogout}
              className="bg-slate-800 hover:bg-rose-600 border-none px-4 py-2 rounded-xl"
            >
              <LogOut size={16} className="mr-2" />
              Keluar
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-300 hover:text-white transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-800 border-b border-slate-700 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 border border-brand-500/20">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                    {isAdmin ? 'Administrator' : 'Petugas'}
                  </p>
                  <p className="font-bold text-white">{currentUser.name}</p>
                </div>
              </div>
              
              <Button 
                variant="danger" 
                size="md" 
                onClick={onLogout}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white border-none py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px]"
              >
                <LogOut size={18} className="mr-3" />
                Logout dari Akun
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
