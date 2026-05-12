export const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
];

export const MIN_PERIOD_YEAR = 2026;

export function getRecordDate(record) {
  if (record?.checkIn?.toDate) return record.checkIn.toDate();
  if (record?.checkIn) return new Date(record.checkIn);
  return null;
}

export function formatDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return '0j 0m';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes}m ${seconds}d`;
}
