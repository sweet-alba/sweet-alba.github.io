export const SHIFTS = {
  SECURITY_1: { id: 'sec1', name: 'Shift Pagi (08:00 - 20:00)', expectedInHour: 8, expectedInMinute: 0, expectedOutHour: 20, expectedOutMinute: 0 },
  SECURITY_2: { id: 'sec2', name: 'Shift Malam (20:00 - 08:00)', expectedInHour: 20, expectedInMinute: 0, expectedOutHour: 8, expectedOutMinute: 0 },
  CLEANER_1: { id: 'cln1', name: 'Shift Pagi (08:00 - 20:00)', expectedInHour: 8, expectedInMinute: 0, expectedOutHour: 20, expectedOutMinute: 0 },
  CLEANER_2: { id: 'cln2', name: 'Shift Malam (20:00 - 08:00)', expectedInHour: 20, expectedInMinute: 0, expectedOutHour: 8, expectedOutMinute: 0 }
};

// Additional roles: ensure all roles have the two 12-hour shift options
export const EXTRA_SHIFTS = {
  STAFF_1: { id: 'stf1', name: 'Shift Pagi (08:00 - 20:00)', expectedInHour: 8, expectedInMinute: 0, expectedOutHour: 20, expectedOutMinute: 0 },
  STAFF_2: { id: 'stf2', name: 'Shift Malam (20:00 - 08:00)', expectedInHour: 20, expectedInMinute: 0, expectedOutHour: 8, expectedOutMinute: 0 }
};

// Merge for convenience (used by helpers that iterate over SHIFTS)
export const ALL_SHIFTS = { ...SHIFTS, ...EXTRA_SHIFTS };
