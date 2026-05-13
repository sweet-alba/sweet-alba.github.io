import { describe, expect, it } from 'vitest';
import { SHIFTS } from '../constants';
import { buildClockInRecord, calculateLatenessMinutes, getShiftOptionsForRole } from './attendance';

describe('attendance helpers', () => {
  it('returns two security shifts with the new 12-hour rotation', () => {
    const shifts = getShiftOptionsForRole('security');

    expect(shifts).toHaveLength(2);
    expect(shifts.map((shift) => shift.name)).toEqual([
      'Shift Pagi (08:00 - 20:00)',
      'Shift Malam (20:00 - 08:00)'
    ]);
    expect(shifts.map((shift) => [shift.expectedInHour, shift.expectedOutHour])).toEqual([
      [8, 20],
      [20, 8]
    ]);
  });

  it('returns two cleaner shifts with the same role prefix', () => {
    const shifts = getShiftOptionsForRole('cleaner');

    expect(shifts).toHaveLength(2);
    expect(shifts.map((shift) => shift.name)).toEqual([
      SHIFTS.CLEANER_1.name,
      SHIFTS.CLEANER_2.name
    ]);
    expect(shifts.map((shift) => [shift.expectedInHour, shift.expectedOutHour])).toEqual([
      [8, 20],
      [20, 8]
    ]);
  });

  it('returns no shift options for admin and other non-staff roles', () => {
    expect(getShiftOptionsForRole('admin')).toEqual([]);
    expect(getShiftOptionsForRole('')).toEqual([]);
    expect(getShiftOptionsForRole(undefined)).toEqual([]);
  });

  it('builds a clock-in record without location lookup', () => {
    const now = new Date(2026, 4, 13, 8, 15, 0, 0);
    const record = buildClockInRecord({
      currentUser: { id: 'u1', name: 'Petugas A', role: 'security' },
      shiftConfig: SHIFTS.SECURITY_1,
      now
    });

    expect(record).toMatchObject({
      userId: 'u1',
      userName: 'Petugas A',
      role: 'security',
      shift: SHIFTS.SECURITY_1.name,
      checkOut: null,
      locationIn: null,
      latenessMins: 15
    });
  });

  it('does not count early arrivals as late', () => {
    const now = new Date(2026, 4, 13, 7, 45, 0, 0);

    expect(calculateLatenessMinutes(now, 8, 0)).toBe(0);
  });
});