export const Colors = {
  primary: '#0f2b71',
  primaryDark: '#0B1B3F',
  accent: '#1787f5',
  accentDark: '#1269C7',
  accentLight: '#EAF3FE',
  background: '#F3F6FC',
  card: '#ffffff',
  inputBg: '#F7F9FD',
  border: '#D5DDEC',
  borderLight: '#E4E9F3',
  text: '#0B1B3F',
  textNavy: '#0f2b71',
  textMuted: '#5A6785',
  textSubtle: '#34405E',
  textDisabled: '#8A94AD',
  white: '#ffffff',
  error: '#A3231A',

  // Status tokens
  status: {
    present: { bg: '#E3F5EC', text: '#0E6B4C', dot: '#12805C' },
    late: { bg: '#FFF1D6', text: '#8A4B00', dot: '#D97706' },
    absent: { bg: '#FDE8E7', text: '#A3231A', dot: '#C2261C' },
    holiday: { bg: '#F1EAFE', text: '#5B21B6', dot: '#7C3AED' },
    today: { bg: '#EAF3FE', text: '#1269C7', dot: '#1787f5' },
    off: { bg: '#EEF1F7', text: '#34405E', dot: '#8A94AD' },
    upcoming: { bg: '#EEF1F7', text: '#34405E', dot: '#8A94AD' },
    pending: { bg: '#FFF1D6', text: '#8A4B00', dot: '#D97706' },
    approved: { bg: '#E3F5EC', text: '#0E6B4C', dot: '#12805C' },
    rejected: { bg: '#FDE8E7', text: '#A3231A', dot: '#C2261C' },
    conflict: { bg: '#FFF1D6', text: '#8A4B00', dot: '#D97706' },
    working: { bg: '#EAF3FE', text: '#1269C7', dot: '#1787f5' },
  },
} as const;

export const colors = {
  ...Colors,
  bg: Colors.background,
  secondary: Colors.accent,
  textPrimary: Colors.text,
  textSecondary: Colors.textMuted,
  status: {
    ...Colors.status,
    presentText: Colors.status.present.text,
    lateText: Colors.status.late.text,
    absentText: Colors.status.absent.text,
    holidayText: Colors.status.holiday.text,
    workingText: Colors.status.working.text,
  },
};

export const Typography = {
  fontFamily: 'System',
} as const;
