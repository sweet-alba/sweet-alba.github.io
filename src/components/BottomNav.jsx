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
    <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-80 bg-white/90 backdrop-blur-xl px-4 py-3 rounded-[2.5rem] shadow-sm border border-slate-200 flex items-center justify-between pointer-events-auto dark:bg-slate-950/90 dark:border-slate-800"
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
                  className="absolute inset-0 bg-slate-950 rounded-full shadow-sm dark:bg-white"
                  transition={{ type: "spring", duration: 0.6 }}
                />
              )}
              <item.icon
                size={22}
                className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white dark:text-slate-900' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  }`}
              />

              {/* Tooltip for desktop */}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white type-overline px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none dark:bg-slate-800">
                {item.label}
              </span>
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
