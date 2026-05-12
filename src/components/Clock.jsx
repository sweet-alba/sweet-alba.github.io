import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function DigitalClock({ className }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className={className}>
      <motion.div 
        key={time.getSeconds()}
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 1 }}
        className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter font-mono"
      >
        {formatTime(time)}
      </motion.div>
      <div className="text-slate-500 font-medium mt-2 text-lg">
        {formatDate(time)}
      </div>
    </div>
  );
}
