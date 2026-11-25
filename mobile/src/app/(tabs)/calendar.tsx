import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { Badge } from '../../components/Badge';
import { getCalendarMonthData, CalendarDayInfo } from '../../constants/mockData';
import { attendanceApi } from '../../services/api/attendanceApi';
import { MobileCalendarDay } from '../../services/api/types';

function formatPunchTime(iso?: string): string {
  if (!iso) return '--:--';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return iso;
  }
}

export default function CalendarScreen() {
  const router = useRouter();

  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(11); // 1-12
  const [selectedDayNum, setSelectedDayNum] = useState<number>(20);
  const [monthDays, setMonthDays] = useState<CalendarDayInfo[]>(getCalendarMonthData());
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchCalendar = useCallback(async (year: number, month: number) => {
    setLoading(true);
    try {
      const res = await attendanceApi.getCalendar(year, month);
      if (res && res.days && res.days.length > 0) {
        // Map backend days
        const mapped: CalendarDayInfo[] = res.days.map((d, index) => {
          const dateObj = new Date(d.date);
          const dayNum = dateObj.getDate() || index + 1;
          const dow = dateObj.getDay() || 0;

          let badgeBg: string = Colors.status.off.bg;
          let badgeFg: string = Colors.status.off.text;
          let dot: string = 'transparent';
          let title = 'Work day';

          const normalizedStatus = (d.status || 'DAY OFF').toUpperCase();
          if (normalizedStatus === 'PRESENT') {
            dot = Colors.status.present.dot;
            badgeBg = Colors.status.present.bg;
            badgeFg = Colors.status.present.text;
            title = 'Worked full shift';
          } else if (normalizedStatus === 'LATE') {
            dot = Colors.status.late.dot;
            badgeBg = Colors.status.late.bg;
            badgeFg = Colors.status.late.text;
            title = 'Late arrival';
          } else if (normalizedStatus === 'ABSENT') {
            dot = Colors.status.absent.dot;
            badgeBg = Colors.status.absent.bg;
            badgeFg = Colors.status.absent.text;
            title = 'No attendance recorded';
          } else if (d.isHoliday || normalizedStatus === 'HOLIDAY') {
            dot = Colors.status.holiday.dot;
            badgeBg = Colors.status.holiday.bg;
            badgeFg = Colors.status.holiday.text;
            title = d.holidayName || 'Holiday';
          } else if (normalizedStatus === 'WORKING' || normalizedStatus === 'TODAY') {
            dot = Colors.status.today.dot;
            badgeBg = Colors.status.today.bg;
            badgeFg = Colors.status.today.text;
            title = 'Working today';
          }

          return {
            day: dayNum,
            dow,
            status: normalizedStatus as any,
            inTime: formatPunchTime(d.checkInTime),
            outTime: formatPunchTime(d.checkOutTime),
            note: d.isHoliday ? 'Paid holiday' : d.checkInTime ? 'Recorded' : 'No punches',
            title,
            badgeBg,
            badgeFg,
            dot,
          };
        });

        setMonthDays(mapped);
      }
    } catch {
      // Fallback to local month data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(currentYear, currentMonth);
  }, [fetchCalendar, currentYear, currentMonth]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCalendar(currentYear, currentMonth);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthTitle = `${monthNames[currentMonth - 1]} ${currentYear}`;

  const selectedDay = monthDays.find((d) => d.day === selectedDayNum) || monthDays[0] || {
    day: selectedDayNum,
    dow: 5,
    status: 'LATE',
    inTime: '09:21',
    outTime: '17:00',
    note: '21 min late',
    title: 'Late arrival',
    badgeBg: Colors.status.late.bg,
    badgeFg: Colors.status.late.text,
    dot: Colors.status.late.dot,
  };

  const dowNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fullDateLabel = `${dowNames[selectedDay.dow]}, ${selectedDay.day} ${monthNames[currentMonth - 1]} ${currentYear}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Calendar</Text>
          <View style={styles.headerShiftBadge}>
            <Feather name="clock" size={13} color={Colors.accentDark} />
            <Text style={styles.headerShiftText}>Morning Shift · 09:00–17:00</Text>
          </View>
        </View>

        {/* Month Selector Bar */}
        <View style={styles.monthCard}>
          <View style={styles.monthHeaderRow}>
            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={handlePrevMonth}
              activeOpacity={0.7}
            >
              <Feather name="chevron-left" size={18} color={Colors.textSubtle} />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.monthTitle}>{monthTitle}</Text>
              {loading && <ActivityIndicator size="small" color={Colors.accent} />}
            </View>

            <TouchableOpacity
              style={styles.monthNavBtn}
              onPress={handleNextMonth}
              activeOpacity={0.7}
            >
              <Feather name="chevron-right" size={18} color={Colors.textSubtle} />
            </TouchableOpacity>
          </View>

          {/* DOW Header */}
          <View style={styles.dowHeaderRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
              <Text key={i} style={styles.dowLabel}>
                {d}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {monthDays.map((d) => {
              const isSelected = d.day === selectedDayNum;
              const isToday = d.status === 'TODAY' || (d.status as string) === 'WORKING';

              return (
                <TouchableOpacity
                  key={d.day}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => setSelectedDayNum(d.day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dayNumText,
                      isSelected && styles.dayNumTextSelected,
                      d.status === 'DAY OFF' && !isSelected && styles.dayNumTextOff,
                    ]}
                  >
                    {d.day}
                  </Text>
                  {d.dot !== 'transparent' && (
                    <View
                      style={[
                        styles.dayDot,
                        { backgroundColor: isSelected ? Colors.white : d.dot },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Day Detail Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailHeaderRow}>
            <View>
              <Text style={styles.detailDate}>{fullDateLabel}</Text>
              <Text style={styles.detailTitle}>{selectedDay.title}</Text>
            </View>
            <Badge label={selectedDay.status} bg={selectedDay.badgeBg} fg={selectedDay.badgeFg} />
          </View>

          {/* Punches & Duration Grid */}
          <View style={styles.punchesGrid}>
            <View style={styles.punchBox}>
              <Text style={styles.punchBoxLabel}>Check in</Text>
              <Text style={styles.punchBoxValue}>{selectedDay.inTime}</Text>
              <Text style={styles.punchBoxSub}>
                {selectedDay.status === 'LATE' ? 'Late arrival' : 'Shift start'}
              </Text>
            </View>

            <View style={styles.punchBox}>
              <Text style={styles.punchBoxLabel}>Check out</Text>
              <Text style={styles.punchBoxValue}>{selectedDay.outTime}</Text>
              <Text style={styles.punchBoxSub}>
                {selectedDay.outTime !== '--:--' ? 'Shift end' : 'Not recorded'}
              </Text>
            </View>

            <View style={styles.punchBox}>
              <Text style={styles.punchBoxLabel}>Status note</Text>
              <Text style={styles.punchBoxValue}>{selectedDay.note}</Text>
              <Text style={styles.punchBoxSub}>Validated</Text>
            </View>
          </View>

          {/* Shift Details Box */}
          <View style={styles.shiftDetailsBox}>
            <View style={styles.shiftDetailsRow}>
              <Feather name="clock" size={15} color={Colors.textMuted} />
              <Text style={styles.shiftDetailsLabel}>Assigned shift:</Text>
              <Text style={styles.shiftDetailsValue}>Morning Shift (09:00 – 17:00)</Text>
            </View>
            <View style={styles.shiftDetailsRow}>
              <Feather name="coffee" size={15} color={Colors.textMuted} />
              <Text style={styles.shiftDetailsLabel}>Break allowance:</Text>
              <Text style={styles.shiftDetailsValue}>60 minutes</Text>
            </View>
          </View>

          {/* Actions Button */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.detailActionBtn}
              onPress={() =>
                router.push({
                  pathname: '/attendance-detail',
                  params: {
                    date: fullDateLabel,
                    status: selectedDay.status,
                    day: String(selectedDay.day),
                  },
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.detailActionText}>View full day details</Text>
              <Feather name="arrow-right" size={15} color={Colors.accentDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.status.present.dot }]} />
              <Text style={styles.legendLabel}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.status.late.dot }]} />
              <Text style={styles.legendLabel}>Late</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.status.absent.dot }]} />
              <Text style={styles.legendLabel}>Absent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.status.holiday.dot }]} />
              <Text style={styles.legendLabel}>Holiday</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  headerShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: Colors.accentLight,
  },
  headerShiftText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accentDark,
  },
  monthCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  dowHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dowLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    backgroundColor: Colors.accentLight,
  },
  dayNumText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dayNumTextSelected: {
    color: Colors.white,
  },
  dayNumTextOff: {
    color: Colors.textDisabled,
    fontWeight: '400',
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailDate: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textNavy,
    marginTop: 2,
  },
  punchesGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  punchBox: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  punchBoxLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  punchBoxValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  punchBoxSub: {
    fontSize: 10,
    color: Colors.textDisabled,
  },
  shiftDetailsBox: {
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  shiftDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftDetailsLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  shiftDetailsValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  actionButtonsRow: {
    marginTop: 2,
  },
  detailActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
  },
  detailActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentDark,
  },
  legendCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.textSubtle,
    fontWeight: '500',
  },
});
