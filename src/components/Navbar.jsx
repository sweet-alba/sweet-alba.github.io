import { LogOut, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from './ui';
const MIN_MOVE_METERS_FOR_REVERSE_GEOCODE = 75;
const FALLBACK_POLL_INTERVAL_MS = 10000;
const GEO_REINIT_INTERVAL_MS = 45000;

function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) ** 2
    + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

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
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const restartTrackingRef = useRef(() => {});

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    let isMounted = true;
    let watchId = null;
    let pollId = null;
    let reinitId = null;
    let lastGeoPoint = null;
    let lastAreaLabel = '';
    let lastGeocodeAt = 0;
    let hasValidLocation = false;

    const updateLabel = (area, coords) => {
      const combined = area ? `${area} • ${coords}` : coords;
      hasValidLocation = true;
      if (isMounted) setLocationLabel(combined);
    };

    const reverseGeocode = async (latitude, longitude, coordsLabel) => {
      try {
        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          localityLanguage: 'id'
        });
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`);
        if (!response.ok) throw new Error('Reverse geocode failed');
        const data = await response.json();
        lastAreaLabel = formatLocationName(data);
      } catch {
        // keep previous area label if reverse geocode fails
      }
      updateLabel(lastAreaLabel, coordsLabel);
    };

    const processPosition = (position) => {
      const { latitude, longitude } = position.coords;
      const coordsLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      const now = Date.now();

      if (!lastGeoPoint) {
        lastGeoPoint = { latitude, longitude };
        lastGeocodeAt = now;
        reverseGeocode(latitude, longitude, coordsLabel);
        return;
      }

      const movedMeters = calculateDistanceMeters(
        lastGeoPoint.latitude,
        lastGeoPoint.longitude,
        latitude,
        longitude
      );

      updateLabel(lastAreaLabel, coordsLabel);

      if (
        movedMeters >= MIN_MOVE_METERS_FOR_REVERSE_GEOCODE
        || now - lastGeocodeAt >= 120000
      ) {
        lastGeoPoint = { latitude, longitude };
        lastGeocodeAt = now;
        reverseGeocode(latitude, longitude, coordsLabel);
      }
    };

    const onGeoError = () => {
      if (!isMounted) return;
      if (hasValidLocation) return;
      setLocationLabel('Lokasi belum aktif');
    };

    const pollFallback = () => {
      navigator.geolocation.getCurrentPosition(
        processPosition,
        onGeoError,
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        }
      );
    };

    const startTracking = () => {
      watchId = navigator.geolocation.watchPosition(
        processPosition,
        onGeoError,
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        }
      );
      pollFallback();
      pollId = setInterval(pollFallback, FALLBACK_POLL_INTERVAL_MS);
    };

    const stopTracking = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (pollId) {
        clearInterval(pollId);
        pollId = null;
      }
    };

    const restartTracking = () => {
      stopTracking();
      startTracking();
    };
    restartTrackingRef.current = restartTracking;

    const handleWindowFocus = () => {
      restartTracking();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        restartTracking();
      }
    };

    startTracking();
    reinitId = setInterval(restartTracking, GEO_REINIT_INTERVAL_MS);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      stopTracking();
      if (reinitId) clearInterval(reinitId);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleForceRefreshLocation = () => {
    if (isRefreshingLocation || !navigator.geolocation) return;
    setIsRefreshingLocation(true);
    restartTrackingRef.current();
    window.setTimeout(() => {
      setIsRefreshingLocation(false);
    }, 1200);
  };

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
          <button
            type="button"
            onClick={handleForceRefreshLocation}
            className="type-caption mt-1 flex items-center justify-center text-slate-500 dark:text-slate-400 truncate w-full"
            title="Refresh lokasi"
          >
            <MapPin size={12} className="mr-1 text-brand-600 flex-shrink-0 dark:text-brand-400" />
            <span className="truncate">{isRefreshingLocation ? 'Memperbarui lokasi...' : locationLabel}</span>
          </button>
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
