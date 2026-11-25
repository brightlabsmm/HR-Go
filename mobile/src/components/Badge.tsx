import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/theme';

export type StatusType =
  | 'PRESENT'
  | 'LATE'
  | 'ABSENT'
  | 'HOLIDAY'
  | 'WORKING'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONFLICT'
  | 'DAY OFF'
  | 'TODAY'
  | 'UPCOMING'
  | string;

export interface BadgeProps {
  label?: string;
  status?: StatusType;
  bg?: string;
  fg?: string;
  dot?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  status,
  bg,
  fg,
  dot,
  size = 'md',
}) => {
  const displayLabel = label || status || '';
  let defaultBg: string = Colors.status.off.bg;
  let defaultFg: string = Colors.status.off.text;
  let defaultDot: string | undefined;

  const normalized = displayLabel.trim().toUpperCase();
  if (
    normalized === 'PRESENT' ||
    normalized === 'ACCEPTED' ||
    normalized === 'APPROVED' ||
    normalized === 'ONLINE'
  ) {
    defaultBg = Colors.status.present.bg;
    defaultFg = Colors.status.present.text;
    defaultDot = Colors.status.present.dot;
  } else if (
    normalized === 'LATE' ||
    normalized === 'PENDING' ||
    normalized === 'CONFLICT'
  ) {
    defaultBg = Colors.status.late.bg;
    defaultFg = Colors.status.late.text;
    defaultDot = Colors.status.late.dot;
  } else if (normalized === 'ABSENT' || normalized === 'REJECTED') {
    defaultBg = Colors.status.absent.bg;
    defaultFg = Colors.status.absent.text;
    defaultDot = Colors.status.absent.dot;
  } else if (normalized === 'HOLIDAY') {
    defaultBg = Colors.status.holiday.bg;
    defaultFg = Colors.status.holiday.text;
    defaultDot = Colors.status.holiday.dot;
  } else if (normalized === 'WORKING' || normalized === 'TODAY') {
    defaultBg = Colors.status.working.bg;
    defaultFg = Colors.status.working.text;
    defaultDot = Colors.status.working.dot;
  }

  const badgeBg = bg || defaultBg;
  const badgeFg = fg || defaultFg;
  const dotColor = dot !== undefined ? dot : defaultDot;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeBg },
        size === 'sm' && styles.badgeSm,
      ]}
    >
      {dotColor && dotColor !== 'transparent' && (
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
      )}
      <Text
        style={[
          styles.label,
          { color: badgeFg },
          size === 'sm' && styles.labelSm,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  labelSm: {
    fontSize: 9,
  },
});
