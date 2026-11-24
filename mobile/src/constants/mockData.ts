export interface UserProfile {
  name: string;
  initials: string;
  code: string;
  role: string;
  email: string;
  phone: string;
  branch: string;
  department: string;
  joinDate: string;
  status: string;
  dob?: string;
  gender?: string;
  maritalStatus?: string;
  emergencyContact?: string;
  avatarInitials?: string;
  employeeCode?: string;
}

export const initialProfile: UserProfile = {
  name: 'Aung Ko Ko',
  initials: 'AK',
  avatarInitials: 'AK',
  code: 'EMP-0142',
  employeeCode: 'EMP-0142',
  role: 'Sales Executive',
  email: 'aung.koko@brightlabs.com',
  phone: '+95 9 798 123 456',
  branch: 'Yangon Branch',
  department: 'Sales',
  joinDate: '3 Mar 2024',
  dob: '12 Aug 1996',
  gender: 'Male',
  maritalStatus: 'Single',
  emergencyContact: 'Daw Mya · Mother',
  status: 'Active',
};

export const EMPLOYEE_PROFILE = initialProfile;

export interface ShiftInfo {
  name: string;
  start: string;
  end: string;
  hours?: string;
  breakMin: number;
  breakMinutes?: number;
  effectiveDate?: string;
  days: string;
}

export const currentShift: ShiftInfo = {
  name: 'Morning Shift',
  start: '09:00',
  end: '17:00',
  hours: '09:00 – 17:00',
  breakMin: 60,
  breakMinutes: 60,
  effectiveDate: '1 Jun 2026',
  days: 'Mon – Fri',
};

export const CURRENT_SHIFT = currentShift;

export interface PositionHistoryItem {
  title: string;
  department?: string;
  branch?: string;
  date?: string;
  effective?: string;
  isCurrent?: boolean;
}

export const positionHistory: PositionHistoryItem[] = [
  {
    title: 'Sales Associate → Sales Executive',
    department: 'Sales',
    branch: 'Yangon Branch',
    date: 'Effective 1 Apr 2026',
    effective: '1 Apr 2026',
    isCurrent: true,
  },
];

export const POSITION_HISTORY = positionHistory;

export interface WeekDayItem {
  dayName: string;
  dateNum: number;
  label: string;
  isToday?: boolean;
  statusColor?: string;
  bg?: string;
}

export const initialWeekDays: WeekDayItem[] = [
  { dayName: 'Mon', dateNum: 23, label: 'Holiday', statusColor: '#7C3AED' },
  { dayName: 'Tue', dateNum: 24, label: 'Today', isToday: true },
  { dayName: 'Wed', dateNum: 25, label: '—' },
  { dayName: 'Thu', dateNum: 26, label: '—' },
  { dayName: 'Fri', dateNum: 27, label: '—' },
];

export interface CalendarDayInfo {
  day: number;
  dow: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'HOLIDAY' | 'DAY OFF' | 'TODAY' | 'UPCOMING';
  inTime: string;
  outTime: string;
  note: string;
  title: string;
  badgeBg: string;
  badgeFg: string;
  dot: string;
}

export function getCalendarMonthData(): CalendarDayInfo[] {
  const lateMap: Record<number, [string, string, string]> = {
    5: ['09:14', '17:05', '14 min late'],
    12: ['09:08', '17:02', '8 min late'],
    20: ['09:21', '17:00', '21 min late'],
  };

  const C = {
    present: { dot: '#12805C', status: 'PRESENT' as const, badgeBg: '#E3F5EC', badgeFg: '#0E6B4C', title: 'Worked full shift' },
    late: { dot: '#D97706', status: 'LATE' as const, badgeBg: '#FFF1D6', badgeFg: '#8A4B00', title: 'Late arrival' },
    absent: { dot: '#C2261C', status: 'ABSENT' as const, badgeBg: '#FDE8E7', badgeFg: '#A3231A', title: 'No attendance recorded' },
    holiday: { dot: '#7C3AED', status: 'HOLIDAY' as const, badgeBg: '#F1EAFE', badgeFg: '#5B21B6', title: 'Yangon Branch holiday' },
    off: { dot: 'transparent', status: 'DAY OFF' as const, badgeBg: '#EEF1F7', badgeFg: '#34405E', title: 'Not a shift day' },
    today: { dot: '#1787f5', status: 'TODAY' as const, badgeBg: '#EAF3FE', badgeFg: '#1269C7', title: 'Morning Shift · 09:00–17:00' },
    future: { dot: 'transparent', status: 'UPCOMING' as const, badgeBg: '#EEF1F7', badgeFg: '#34405E', title: 'Morning Shift · 09:00–17:00' },
  };

  const days: CalendarDayInfo[] = [];
  for (let n = 1; n <= 30; n++) {
    const dow = (n - 1) % 7;
    let k: keyof typeof C = 'present';
    if (dow === 0 || dow === 6) k = 'off';
    else if (n === 23) k = 'holiday';
    else if (n === 24) k = 'today';
    else if (n > 24) k = 'future';
    else if (n === 17) k = 'absent';
    else if (lateMap[n]) k = 'late';

    const times = lateMap[n] || (k === 'present' ? ['08:55', '17:03', 'On time'] : k === 'holiday' ? ['—', '—', 'Paid'] : k === 'today' ? ['08:52', '--:--', 'Working'] : ['—', '—', '—']);

    days.push({
      day: n,
      dow,
      status: C[k].status,
      inTime: times[0],
      outTime: times[1],
      note: times[2],
      title: C[k].title,
      badgeBg: C[k].badgeBg,
      badgeFg: C[k].badgeFg,
      dot: C[k].dot,
    });
  }
  return days;
}

export interface AttendanceRecord {
  id: string;
  dow: string;
  day: string;
  date: string;
  times: string;
  meta: string;
  status: 'WORKING' | 'HOLIDAY' | 'LATE' | 'PRESENT' | 'ABSENT';
}

export type AttendanceHistoryItem = AttendanceRecord;

export const initialAttendanceHistory: AttendanceRecord[] = [
  { id: '1', dow: 'TUE', day: '24', date: 'Tuesday, 24 Nov 2026', times: '08:52 – --:--', meta: 'Mobile · in progress', status: 'WORKING' },
  { id: '2', dow: 'MON', day: '23', date: 'Monday, 23 Nov 2026', times: 'Yangon Branch holiday', meta: 'Paid holiday', status: 'HOLIDAY' },
  { id: '3', dow: 'FRI', day: '20', date: 'Friday, 20 Nov 2026', times: '09:21 – 17:00', meta: 'Mobile · 21 min late · 6h 39m', status: 'LATE' },
  { id: '4', dow: 'THU', day: '19', date: 'Thursday, 19 Nov 2026', times: '08:55 – 17:03', meta: 'Mobile · 7h 08m', status: 'PRESENT' },
  { id: '5', dow: 'WED', day: '18', date: 'Wednesday, 18 Nov 2026', times: '08:49 – 17:12', meta: 'Offline sync · 7h 23m', status: 'PRESENT' },
  { id: '6', dow: 'TUE', day: '17', date: 'Tuesday, 17 Nov 2026', times: 'No check-in', meta: 'Tap to request a correction', status: 'ABSENT' },
  { id: '7', dow: 'MON', day: '16', date: 'Monday, 16 Nov 2026', times: '08:57 – 17:01', meta: 'Mobile · 7h 04m', status: 'PRESENT' },
];

export const ATTENDANCE_HISTORY = initialAttendanceHistory;

export interface SyncQueueEvent {
  id: string;
  short: 'IN' | 'OUT';
  title: string;
  time: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONFLICT';
  note: string;
}

export const initialSyncEvents: SyncQueueEvent[] = [
  { id: 'ev-1', short: 'IN', title: 'Check in', time: 'Tue 24 Nov · 08:52', status: 'PENDING', note: 'Waiting for connection' },
  { id: 'ev-2', short: 'OUT', title: 'Check out', time: 'Mon 22 Nov · 17:10', status: 'CONFLICT', note: 'A check-out already exists for this day' },
  { id: 'ev-3', short: 'IN', title: 'Check in', time: 'Mon 22 Nov · 08:58', status: 'ACCEPTED', note: 'Synced 22 Nov, 12:04' },
  { id: 'ev-4', short: 'OUT', title: 'Check out', time: 'Sun 21 Nov · 16:40', status: 'REJECTED', note: 'Not a working day for your shift' },
];

export interface CorrectionRequestItem {
  id: string;
  date: string;
  type: string;
  sent: string;
  was: string;
  req: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  note: string;
}

export const initialCorrections: CorrectionRequestItem[] = [
  {
    id: 'corr-1',
    date: 'Fri, 20 Nov 2026',
    type: 'Correct times',
    sent: '24 Nov',
    was: 'In 09:21 · Out 17:00',
    req: 'In 08:56 · Out 17:00',
    status: 'PENDING',
    note: 'Waiting for HR Manager review.',
  },
  {
    id: 'corr-2',
    date: 'Tue, 17 Nov 2026',
    type: 'Correct times',
    sent: '18 Nov',
    was: 'No record',
    req: 'In 08:58 · Out 17:04',
    status: 'REJECTED',
    note: 'Rejected by HR Manager on 19 Nov: “Please attach the branch visitor log entry in your reason.”',
  },
  {
    id: 'corr-3',
    date: 'Thu, 5 Nov 2026',
    type: 'Late submission',
    sent: '5 Nov',
    was: 'In 09:14',
    req: 'In 09:14 (reason)',
    status: 'APPROVED',
    note: 'Approved on 6 Nov. Traffic delay noted.',
  },
];

export const CORRECTION_REQUESTS = initialCorrections;

export interface OvertimeItem {
  id: number;
  date: string;
  hours: string;
  cat: string;
  time: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  decision?: string;
}

export const initialOvertimeRequests: OvertimeItem[] = [
  {
    id: 0,
    date: 'Tue 24 Nov',
    hours: '2h',
    cat: 'Weekday overtime',
    time: '17:30 – 19:30',
    status: 'PENDING',
    reason: 'Year-end stock count at Yangon Branch.',
    decision: 'Step 1 of 2 · waiting for Department Manager.',
  },
  {
    id: 1,
    date: 'Sat 21 Nov',
    hours: '4h',
    cat: 'Rest day overtime',
    time: '09:00 – 13:00',
    status: 'REJECTED',
    reason: 'Customer event support.',
    decision: 'Rejected by HR Manager on 22 Nov: “Rest-day overtime needs pre-approval from your manager. Please add the approval reference.”',
  },
  {
    id: 2,
    date: 'Wed 18 Nov',
    hours: '3h',
    cat: 'Weekday overtime',
    time: '17:30 – 20:30',
    status: 'APPROVED',
    reason: 'Monthly sales report deadline.',
    decision: 'Approved by HR Manager on 19 Nov.',
  },
  {
    id: 3,
    date: 'Tue 10 Nov',
    hours: '2.5h',
    cat: 'Weekday overtime',
    time: '17:30 – 20:00',
    status: 'APPROVED',
    reason: 'Branch system migration.',
    decision: 'Approved by Department Manager on 11 Nov.',
  },
];

export const OVERTIME_REQUESTS = initialOvertimeRequests;

export interface LeaveBalanceItem {
  id: string;
  name: string;
  left: number | string;
  total: number | null;
  c: string;
  color?: string;
}

export const initialLeaveBalances: LeaveBalanceItem[] = [
  { id: 'casual', name: 'Casual leave', left: 4, total: 6, c: '#1787f5', color: '#1787f5' },
  { id: 'earned', name: 'Earned leave', left: 8, total: 10, c: '#0f2b71', color: '#0f2b71' },
  { id: 'medical', name: 'Medical leave', left: 28, total: 30, c: '#12805C', color: '#12805C' },
  { id: 'unpaid', name: 'Unpaid leave', left: '—', total: null, c: '#8A94AD', color: '#8A94AD' },
];

export const LEAVE_BALANCES = initialLeaveBalances;

export interface LeaveRequestItem {
  id: number;
  type: string;
  days: string;
  range: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason: string;
  decision: string;
}

export const initialLeaveRequests: LeaveRequestItem[] = [
  {
    id: 0,
    type: 'Earned leave',
    days: '2 days',
    range: 'Thu 3 Dec – Fri 4 Dec',
    status: 'PENDING',
    reason: 'Family trip to Mandalay.',
    decision: 'Waiting for Department Manager. Balance is deducted only after approval.',
  },
  {
    id: 1,
    type: 'Casual leave',
    days: '1 day',
    range: 'Fri 13 Nov',
    status: 'REJECTED',
    reason: 'Personal errand.',
    decision: 'Rejected by HR Manager on 10 Nov: “Branch audit on that day. Please choose another date.”',
  },
  {
    id: 2,
    type: 'Medical leave',
    days: '2 days',
    range: 'Mon 12 Oct – Tue 13 Oct',
    status: 'APPROVED',
    reason: 'Fever, doctor’s note given to HR.',
    decision: 'Approved by HR Manager on 14 Oct. 2 days deducted from Medical leave.',
  },
];

export const LEAVE_REQUESTS = initialLeaveRequests;
