import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle, Timer, CheckCircle } from 'lucide-react';
import { Card } from '../../../ui';

export default function PersonalStats({ myRecords }) {
  const personalStats = useMemo(() => {
    const lateRecords = myRecords.filter(a => a.latenessMins > 0);
    const onTimeRecords = myRecords.filter(a => !a.latenessMins || a.latenessMins <= 0);
    const totalLateMins = myRecords.reduce((acc, curr) => acc + (curr.latenessMins || 0), 0);
    const lateHours = Math.floor(totalLateMins / 60);
    const lateMins = totalLateMins % 60;
    return {
      total: myRecords.length,
      lateCount: lateRecords.length,
      totalLateTime: `${lateHours}j ${lateMins}m`,
      onTimeCount: onTimeRecords.length
    };
  }, [myRecords]);

  const statCards = [
    {
      label: 'Total Kehadiran',
      value: personalStats.total,
      unit: 'Hari',
      icon: Calendar,
      accent: 'text-slate-500',
      iconClass: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white'
    },
    {
      label: 'Frekuensi Telat',
      value: personalStats.lateCount,
      unit: 'Kali',
      icon: AlertCircle,
      accent: 'text-rose-500',
      iconClass: 'bg-rose-50 text-rose-500 dark:bg-rose-500/15 dark:text-rose-400'
    },
    {
      label: 'Akumulasi Telat',
      value: personalStats.totalLateTime,
      unit: '',
      icon: Timer,
      accent: 'text-brand-500 dark:text-brand-300',
      iconClass: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300'
    },
    {
      label: 'Tepat Waktu',
      value: personalStats.onTimeCount,
      unit: 'Hari',
      icon: CheckCircle,
      accent: 'text-emerald-500',
      iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
    }
  ];

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
          >
            <Card className="h-28 p-4 border border-slate-200 bg-white overflow-hidden relative group shadow-sm dark:bg-slate-900 dark:border-white/10">
              <div className="relative z-10 flex items-center gap-4 h-full">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.iconClass}`}>
                  <stat.icon size={24} />
                </div>
                <div className="min-w-0">
                  <p className={`type-overline ${stat.accent}`}>{stat.label}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="type-stat text-slate-950 tabular-nums dark:text-white">{stat.value}</p>
                    {stat.unit && <p className="type-overline text-slate-500">{stat.unit}</p>}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
