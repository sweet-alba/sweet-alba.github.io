import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Card } from '../../../ui';

export default function TrendsSection({ attendances }) {
  // Calculate chart data (last 7 days)
  const chartData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('id-ID');
      const records = attendances.filter(a => a.date === dateStr);
      const lateRecords = records.filter(a => a.latenessMins > 0);
      const completedRecords = records.filter(a => a.checkOut);
      const activeRecords = records.filter(a => !a.checkOut);

      return {
        name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        shortDate: d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        fullDate: dateStr,
        count: records.length,
        late: lateRecords.length,
        onTime: records.length - lateRecords.length,
        completed: completedRecords.length,
        active: activeRecords.length,
        uniqueUsers: new Set(records.map(record => record.userId).filter(Boolean)).size,
        lateMinutes: lateRecords.reduce((sum, record) => sum + (record.latenessMins || 0), 0)
      };
    }).reverse();
  }, [attendances]);

  const chartSummary = useMemo(() => {
    const total = chartData.reduce((sum, day) => sum + day.count, 0);
    const totalLate = chartData.reduce((sum, day) => sum + day.late, 0);
    const totalActive = chartData.reduce((sum, day) => sum + day.active, 0);
    const totalCompleted = chartData.reduce((sum, day) => sum + day.completed, 0);
    const totalLateMinutes = chartData.reduce((sum, day) => sum + day.lateMinutes, 0);
    const peakDay = chartData.reduce((peak, day) => day.count > peak.count ? day : peak, chartData[0]);
    const quietDay = chartData.reduce((quiet, day) => day.count < quiet.count ? day : quiet, chartData[0]);
    const latestDay = chartData[chartData.length - 1] || { count: 0 };
    const previousDay = chartData[chartData.length - 2] || { count: 0 };
    const trendDelta = latestDay.count - previousDay.count;

    return {
      total,
      average: Math.round((total / Math.max(chartData.length, 1)) * 10) / 10,
      totalLate,
      totalActive,
      totalCompleted,
      totalLateMinutes,
      peakDay,
      quietDay,
      trendDelta,
      completionRate: total ? Math.round((totalCompleted / total) * 100) : 0
    };
  }, [chartData]);

  const chartMetrics = useMemo(() => {
    const width = 640;
    const height = 280;
    const padding = { top: 24, right: 24, bottom: 48, left: 44 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const rawMax = Math.max(...chartData.flatMap(day => [day.count, day.late]), 1);
    const maxValue = Math.max(4, Math.ceil(rawMax / 4) * 4);
    const ticks = Array.from({ length: 5 }, (_, index) => Math.round((maxValue / 4) * index)).reverse();
    const getX = (index) => padding.left + (plotWidth / Math.max(chartData.length - 1, 1)) * index;
    const getY = (value) => padding.top + plotHeight - (value / maxValue) * plotHeight;
    const points = (key) => chartData.map((day, index) => ({
      x: getX(index),
      y: getY(day[key]),
      value: day[key],
      day
    }));
    const linePath = (items) => items.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const attendancePoints = points('count');
    const latePoints = points('late');
    const baselineY = getY(0);
    const areaPath = attendancePoints.length
      ? `${linePath(attendancePoints)} L ${attendancePoints[attendancePoints.length - 1].x} ${baselineY} L ${attendancePoints[0].x} ${baselineY} Z`
      : '';

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      maxValue,
      ticks,
      getY,
      attendancePoints,
      latePoints,
      attendancePath: linePath(attendancePoints),
      latePath: linePath(latePoints),
      areaPath,
      baselineY
    };
  }, [chartData]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className=""
      >
        <Card className="p-6 border-none bg-white shadow-sm dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner dark:bg-blue-500/10 dark:text-blue-400">
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 className="type-card-title text-slate-900 dark:text-white">Tren Kehadiran</h3>
                <p className="type-overline text-slate-400 dark:text-slate-500">Performa 7 hari terakhir</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { label: 'Total Kehadiran', value: chartSummary.total.toLocaleString('id-ID'), tone: 'text-slate-950 dark:text-white' },
              { label: 'Rata-rata/Hari', value: chartSummary.average.toLocaleString('id-ID'), tone: 'text-brand-600 dark:text-brand-300' },
              { label: 'Frekuensi Telat', value: chartSummary.totalLate.toLocaleString('id-ID'), tone: 'text-rose-500' },
              { label: 'Selesai Shift', value: `${chartSummary.completionRate}%`, tone: 'text-blue-600 dark:text-blue-300' }
            ].map(item => (
              <div key={item.label} className="rounded-[1.75rem] border border-slate-100 bg-slate-50/60 p-4 dark:border-white/10 dark:bg-slate-950/60">
                <p className="type-overline text-slate-400">{item.label}</p>
                <p className={`type-value mt-1 ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-slate-50/40 p-4 dark:border-white/10 dark:bg-slate-950/40">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="type-overline text-slate-400">Grafik 7 Hari</p>
                <p className="type-body font-bold text-slate-900 dark:text-white">
                  Puncak: {chartSummary.peakDay?.name || '-'} ({chartSummary.peakDay?.count || 0} hadir)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-brand-500" />
                  <span className="type-overline text-slate-500">Kehadiran</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="type-overline text-slate-500">Telat</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto pb-2">
              <svg
                viewBox={`0 0 ${chartMetrics.width} ${chartMetrics.height}`}
                className="min-w-[620px] w-full"
                role="img"
                aria-label="Line chart tren kehadiran tujuh hari terakhir"
              >
                <defs>
                  <linearGradient id="attendanceArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {chartMetrics.ticks.map(tick => {
                  const y = chartMetrics.getY(tick);
                  return (
                    <g key={tick}>
                      <line
                        x1={chartMetrics.padding.left}
                        x2={chartMetrics.width - chartMetrics.padding.right}
                        y1={y}
                        y2={y}
                        stroke="currentColor"
                        className="text-slate-200 dark:text-white/10"
                        strokeDasharray={tick === 0 ? '0' : '6 8'}
                      />
                      <text x={12} y={y + 4} className="fill-slate-400 type-overline">
                        {tick}
                      </text>
                    </g>
                  );
                })}

                <path d={chartMetrics.areaPath} fill="url(#attendanceArea)" />
                <path
                  d={chartMetrics.attendancePath}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={chartMetrics.latePath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 8"
                />

                {chartMetrics.attendancePoints.map(point => (
                  <g key={`attendance-${point.day.fullDate}`}>
                    <line
                      x1={point.x}
                      x2={point.x}
                      y1={chartMetrics.padding.top}
                      y2={chartMetrics.baselineY}
                      stroke="currentColor"
                      className="text-slate-100 dark:text-white/5"
                    />
                    <circle cx={point.x} cy={point.y} r="7" fill="#ffffff" stroke="#22c55e" strokeWidth="4" />
                    <text x={point.x} y={point.y - 14} textAnchor="middle" className="fill-slate-700 type-overline dark:fill-slate-200">
                      {point.value}
                    </text>
                  </g>
                ))}

                {chartMetrics.latePoints.map(point => point.value > 0 && (
                  <g key={`late-${point.day.fullDate}`}>
                    <circle cx={point.x} cy={point.y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="2" />
                  </g>
                ))}

                {chartData.map((day, index) => {
                  const point = chartMetrics.attendancePoints[index];
                  return (
                    <g key={`label-${day.fullDate}`}>
                      <text x={point.x} y={chartMetrics.height - 24} textAnchor="middle" className="fill-slate-500 type-overline">
                        {day.name}
                      </text>
                      <text x={point.x} y={chartMetrics.height - 10} textAnchor="middle" className="fill-slate-400 type-overline">
                        {day.shortDate}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-[2rem] border border-slate-100 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-slate-950/50">
              <p className="type-overline text-slate-400">Insight Cepat</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="type-body font-bold text-slate-900 dark:text-white">
                    {chartSummary.trendDelta > 0
                      ? `Naik ${chartSummary.trendDelta} dari hari sebelumnya`
                      : chartSummary.trendDelta < 0
                        ? `Turun ${Math.abs(chartSummary.trendDelta)} dari hari sebelumnya`
                        : 'Stabil dibanding hari sebelumnya'}
                  </p>
                  <p className="type-caption text-slate-500 dark:text-slate-400">Perbandingan data terbaru dengan satu hari sebelumnya.</p>
                </div>
                <div>
                  <p className="type-body font-bold text-slate-900 dark:text-white">
                    {chartSummary.totalLateMinutes.toLocaleString('id-ID')} menit total keterlambatan
                  </p>
                  <p className="type-caption text-slate-500 dark:text-slate-400">Akumulasi keterlambatan dari seluruh record pada rentang ini.</p>
                </div>
                <div>
                  <p className="type-body font-bold text-slate-900 dark:text-white">
                    {chartSummary.totalActive.toLocaleString('id-ID')} shift masih aktif
                  </p>
                  <p className="type-caption text-slate-500 dark:text-slate-400">Record yang belum memiliki waktu pulang.</p>
                </div>
                <div>
                  <p className="type-body font-bold text-slate-900 dark:text-white">
                    Hari tersepi: {chartSummary.quietDay?.name || '-'} ({chartSummary.quietDay?.count || 0} hadir)
                  </p>
                  <p className="type-caption text-slate-500 dark:text-slate-400">Membantu melihat hari dengan aktivitas paling rendah.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-100 bg-slate-50/60 p-5 dark:border-white/10 dark:bg-slate-950/50">
              <div className="mb-4 flex items-center justify-between">
                <p className="type-overline text-slate-400">Detail Harian</p>
                <p className="type-overline text-slate-500">Hadir / Telat / Selesai / Aktif</p>
              </div>
              <div className="space-y-3">
                {chartData.map(day => (
                  <div key={day.fullDate} className="grid grid-cols-[72px_1fr] items-center gap-3">
                    <div>
                      <p className="type-body font-bold text-slate-900 dark:text-white">{day.name}</p>
                      <p className="type-overline text-slate-400">{day.shortDate}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: day.count, className: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' },
                        { value: day.late, className: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300' },
                        { value: day.completed, className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' },
                        { value: day.active, className: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300' }
                      ].map((item, index) => (
                        <div key={`${day.fullDate}-${index}`} className={`rounded-2xl px-3 py-2 text-center type-button ${item.className}`}>
                          {item.value}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
