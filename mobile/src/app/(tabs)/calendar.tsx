import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { Badge } from '../../components/Badge';
import { getCalendarMonthData, CalendarDayInfo } from '../../constants/mockData';

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDayNum, setSelectedDayNum] = useState<number>(20);

  const monthData = getCalendarMonthData();
  const selectedDay = monthData.find((d) => d.day === selectedDayNum) || monthData[19];

  const dowNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fullDateLabel = `${dowNames[selectedDay.dow]}, ${selectedDay.day} November 2026`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
            <TouchableOpacity style={styles.monthNavBtn} activeOpacity={0.7}>
              <Feather name="chevron-left" size={18} color={Colors.textSubtle} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>November 2026</Text>
            <TouchableOpacity style={styles.monthNavBtn} activeOpacity={0.7}>
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

          {/* 30 Days Grid */}
          <View style={styles.daysGrid}>
            {monthData.map((d) => {
              const isSelected = d.day === selectedDayNum;
              const isToday = d.status === 'TODAY';

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

          {/* Legend Row */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#12805C' }]} />
              <Text style={styles.legendText}>Present</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#D97706' }]} />
              <Text style={styles.legendText}>Late</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#C2261C' }]} />
              <Text style={styles.legendText}>Absent</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#7C3AED' }]} />
              <Text style={styles.legendText}>Holiday</Text>
            </View>
          </View>
        </View>

        {/* Selected Day Detail Card */}
        <View style={styles.detailCard}>
          <View style={styles.detailCardHeader}>
            <View style={styles.detailDateCol}>
              <Text style={styles.detailDateLabel}>{fullDateLabel}</Text>
              <Text style={styles.detailTitleText}>{selectedDay.title}</Text>
            </View>
            <Badge
              label={selectedDay.status}
              bg={selectedDay.badgeBg}
              fg={selectedDay.badgeFg}
            />
          </View>

          {/* Times Row */}
          <View style={styles.timesContainer}>
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxLabel}>Check in</Text>
              <Text style={styles.timeBoxVal}>{selectedDay.inTime}</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxLabel}>Check out</Text>
              <Text style={styles.timeBoxVal}>{selectedDay.outTime}</Text>
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxLabel}>Status Note</Text>
              <Text style={styles.timeBoxVal}>{selectedDay.note}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.detailActionsRow}>
            <TouchableOpacity
              style={styles.detailActionBtn}
              onPress={() => router.push('/attendance-detail')}
              activeOpacity={0.7}
            >
              <Feather name="file-text" size={16} color={Colors.accentDark} />
              <Text style={styles.detailActionText}>View details</Text>
            </TouchableOpacity>

            {(selectedDay.status === 'LATE' || selectedDay.status === 'ABSENT') && (
              <TouchableOpacity
                style={[styles.detailActionBtn, styles.correctionBtn]}
                onPress={() => router.push('/correction-request')}
                activeOpacity={0.7}
              >
                <Feather name="edit-2" size={16} color={Colors.status.late.text} />
                <Text style={[styles.detailActionText, { color: Colors.status.late.text }]}>
                  Request correction
                </Text>
              </TouchableOpacity>
            )}
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
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  headerShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
    alignSelf: 'flex-start',
  },
  headerShiftText: {
    fontSize: 12,
    color: Colors.accentDark,
    fontWeight: '600',
  },
  monthCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 14,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
  },
  dowLabel: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  dayCell: {
    width: 40,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    backgroundColor: Colors.accentLight,
    borderWidth: 1.5,
    borderColor: Colors.accent,
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
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  detailCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 14,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailDateCol: {
    gap: 2,
    flex: 1,
  },
  detailDateLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  detailTitleText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  timesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeBox: {
    flex: 1,
    backgroundColor: Colors.inputBg,
    borderRadius: 12,
    padding: 10,
    gap: 3,
  },
  timeBoxLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  timeBoxVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  detailActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  correctionBtn: {
    backgroundColor: Colors.status.late.bg,
  },
  detailActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentDark,
  },
});
