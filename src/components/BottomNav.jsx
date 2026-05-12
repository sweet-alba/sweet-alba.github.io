import { motion } from 'framer-motion';
import { Home, Bell, TrendingUp, Users } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'attendance', icon: Home, label: 'Home' },
    { id: 'announcement', icon: Bell, label: 'Pengumuman' },
    { id: 'trends', icon: TrendingUp, label: 'Analitik' },
    { id: 'users', icon: Users, label: 'Petugas' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-slate-900/90 backdrop-blur-xl px-4 py-3 rounded-[2.5rem] shadow-2xl shadow-slate-900/40 border border-slate-800 flex items-center space-x-2 pointer-events-auto"
      >
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className="relative p-3 group transition-all duration-300"
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-white rounded-full shadow-lg"
                  transition={{ type: "spring", duration: 0.6 }}
                />
              )}
              <item.icon 
                size={22} 
                className={`relative z-10 transition-colors duration-300 ${
                  isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-200'
                }`} 
              />
              
              {/* Tooltip for desktop */}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-black px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest">
                {item.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
