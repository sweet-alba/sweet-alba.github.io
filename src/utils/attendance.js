import { ALL_SHIFTS } from '../constants';

export function getShiftOptionsForRole(role) {
  if (!role) return [];

  const rolePrefix = `${role}`.toUpperCase();

  return Object.entries(ALL_SHIFTS)
    .filter(([key]) => key.startsWith(rolePrefix))
    .map(([key, shift]) => ({ key, ...shift }));
}

export function calculateLatenessMinutes(now, expectedInHour, expectedInMinute) {
  const expectedTime = new Date(now);
  expectedTime.setHours(expectedInHour, expectedInMinute, 0, 0);

  const diffMins = Math.floor((now.getTime() - expectedTime.getTime()) / 60000);
  return diffMins > 0 ? diffMins : 0;
}

export function buildClockInRecord({ currentUser, shiftConfig, now = new Date(), locationIn = null }) {
  return {
    userId: currentUser.id,
    userName: currentUser.name,
    role: currentUser.role,
    shift: shiftConfig.name,
    date: now.toLocaleDateString('id-ID'),
    checkOut: null,
    latenessMins: calculateLatenessMinutes(now, shiftConfig.expectedInHour, shiftConfig.expectedInMinute),
    locationIn
  };
}