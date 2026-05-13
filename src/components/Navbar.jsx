import { LogOut, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { ThemeToggle } from './ui';

function formatLocationName(data) {
  const parts = [
    data.locality,
    data.city,
    data.principalSubdivision
  ].filter(Boolean);

  return [...new Set(parts)].slice(0, 2).join(', ');
}

export default function Navbar({ currentUser, onLogout, theme, onThemeToggle }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [locationLabel, setLocationLabel] = useState(() => (
    navigator.geolocation ? 'Lokasi belum aktif' : 'GPS tidak tersedia'
  ));

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let isMounted = true;
    let timerId;

    const refreshLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coordinateLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          try {
            const params = new URLSearchParams({
              latitude: String(latitude),
              longitude: String(longitude),
              localityLanguage: 'id'
            });
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`);
            if (!response.ok) throw new Error('Reverse geocode failed');

            const data = await response.json();
            const locationName = formatLocationName(data);
            if (isMounted) setLocationLabel(locationName || coordinateLabel);
          } catch {
            if (isMounted) setLocationLabel(coordinateLabel);
          }
        },
        () => {
          if (isMounted) setLocationLabel('Lokasi belum aktif');
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        }
      );
    };

    refreshLocation();
    timerId = setInterval(refreshLocation, 30000);

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  // Format date parts to match reference image
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const title = currentUser?.role && currentUser.role !== 'admin'
    ? currentUser.name
    : monthYear;

  return (
    <div className="fixed top-2 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none">
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-slate-950 h-20 px-4 flex items-center justify-between w-full max-w-md pointer-events-auto bg-white/95 backdrop-blur-md shadow-lg rounded-[2rem] border border-slate-200/50 dark:bg-slate-950/95 dark:text-white dark:border-white/10"
      >
        {/* Left: User Initials (Circular) */}
        <div className="flex-1 flex justify-start">
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>

        {/* Center: Dynamic Date Info */}
        <div className="flex-[2] flex flex-col items-center justify-center text-center min-w-0 px-2">
          <h2 className="type-card-title text-slate-950 dark:text-white truncate w-full">
            {title}
          </h2>
          <p className="type-caption mt-1 flex items-center justify-center text-slate-500 dark:text-slate-400 truncate w-full">
            <MapPin size={12} className="mr-1 text-brand-600 flex-shrink-0 dark:text-brand-400" />
            <span className="truncate">{locationLabel}</span>
          </p>
        </div>

        <div className="flex-1 flex justify-end gap-2">
          <button
            onClick={onLogout}
            className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center text-rose-500 hover:text-rose-600 hover:border-rose-500/30 hover:bg-rose-500/5 transition-all duration-300 bg-slate-50 backdrop-blur-md shadow-inner group dark:border-white/10 dark:text-rose-400 dark:hover:text-rose-500 dark:bg-white/5"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>
      </motion.nav>
    </div>
  );
}
