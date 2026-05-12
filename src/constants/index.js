export const SHIFTS = {
  SECURITY_1: { id: 'sec1', name: 'Shift 1 (08:00 - 20:00)', expectedInHour: 8, expectedInMinute: 0 },
  SECURITY_2: { id: 'sec2', name: 'Shift 2 (20:00 - 08:00)', expectedInHour: 20, expectedInMinute: 0 },
  CLEANER: { id: 'cln1', name: 'Shift Pagi (09:00 - 16:00)', expectedInHour: 9, expectedInMinute: 0 }
};

export const USERS = [
  { id: 'admin', username: 'admin', password: '123', role: 'admin', name: 'Pengurus Cluster' },
  { id: 'sec_1', username: '081234567890', password: '123', role: 'security', name: 'Satpam Andi' },
  { id: 'sec_2', username: '081234567891', password: '123', role: 'security', name: 'Satpam Budi' },
  { id: 'sec_3', username: '081234567892', password: '123', role: 'security', name: 'Satpam Cipto' },
  { id: 'sec_4', username: '081234567893', password: '123', role: 'security', name: 'Satpam Dedi' },
  { id: 'sec_5', username: '081234567894', password: '123', role: 'security', name: 'Satpam Eko' },
  { id: 'cln_1', username: '081234567895', password: '123', role: 'cleaner', name: 'Petugas Siti' },
  { id: 'cln_2', username: '081234567896', password: '123', role: 'cleaner', name: 'Petugas Joko' },
];
