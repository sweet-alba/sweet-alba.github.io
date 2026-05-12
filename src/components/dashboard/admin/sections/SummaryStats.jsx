import { motion } from 'framer-motion';
import { Card } from '../../../ui';

export default function SummaryStats({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className=""
        >
          <Card className="p-5 border-none shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group h-full">
            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-2xl ${stat.iconBg} flex items-center justify-center ${stat.iconColor} mb-4 transition-transform group-hover:scale-110`}>
                <stat.icon size={24} />
              </div>
              <p className="type-overline text-slate-500 mb-1">{stat.label}</p>
              <div className="flex items-baseline space-x-1">
                <h3 className={`type-stat ${stat.textColor} tabular-nums`}>{stat.value}</h3>
                <span className="type-overline text-slate-400">{stat.unit}</span>
              </div>
            </div>
            {/* Background pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-slate-900 group-hover:scale-110 transition-transform">
              <stat.icon size={80} />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
