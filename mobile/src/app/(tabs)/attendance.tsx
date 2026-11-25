import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { Badge, StatusType } from '../../components/Badge';
import { attendanceApi } from '../../services/api/attendanceApi';
import { useAuth } from '../../context/AuthContext';
import { formatFullDate, formatTime, toLocalDateString } from '../../utils/dateTime';

type FilterType = 'All' | 'Late' | 'Absent' | 'Holiday';

interface AttendanceHistoryRow {
  id: string;
  rawDate: string;
  dow: string;
  day: string;
  date: string;
  times: string;
  meta: string;
  status: string;
  shiftLabel: string;
  workedMinutes: number;
  workedLabel: string;
  checkInTime: string;
  checkOutTime: string;
  lateMinutes: number;
  earlyMinutes: number;
  source: string;
  notes: string;
}

function formatPunchTimes(inTime?: string, outTime?: string): string {
  if (!inTime && !outTime) return 'No check-in';
  return `${formatTime(inTime)} – ${formatTime(outTime)}`;
}

export default function AttendanceScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [filter, setFilter] = useState<FilterType>('All');
  const [records, setRecords] = useState<AttendanceHistoryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const monthLabel = new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString(
    'en-GB',
    { month: 'short', year: 'numeric' }
  );

  const fetchHistory = useCallback(async () => {
    setErrorMessage(null);
    const startDate = toLocalDateString(new Date(selectedYear, selectedMonth - 1, 1));
    const endDate = toLocalDateString(new Date(selectedYear, selectedMonth, 0));

    try {
      const res = await attendanceApi.getHistory({
        startDate,
        endDate,
        pageSize: 50,
      });
      const mapped: AttendanceHistoryRow[] = (res?.items ?? []).map((item) => {
        const d = new Date(item.attendanceDate);
        const dow = isNaN(d.getTime())
          ? 'DAY'
          : d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
        const day = isNaN(d.getTime()) ? '01' : String(d.getDate()).padStart(2, '0');
        const dateFull = formatFullDate(item.attendanceDate);

        const times = formatPunchTimes(item.checkInTime, item.checkOutTime);
        const workMins = item.workMinutes ?? 0;
        const workedLabel = workMins
          ? `${Math.floor(workMins / 60)}h ${workMins % 60}m`
          : '0h 0m';
        const lateMins = item.lateMinutes ?? 0;
        const earlyMins = item.earlyDepartureMinutes ?? 0;
        const lateMeta = lateMins > 0 ? ` · ${lateMins} min late` : '';
        const workMeta = workMins ? ` · ${workedLabel}` : '';
        const source = item.checkInSource || 'Mobile';
        const meta = `${source}${lateMeta}${workMeta}`;

        return {
          id: item.id,
          rawDate: item.attendanceDate.slice(0, 10),
          dow,
          day,
          date: dateFull,
          times,
          meta,
          status: item.status || 'PRESENT',
          shiftLabel: item.shiftName || 'Default Shift',
          workedMinutes: workMins,
          workedLabel,
          checkInTime: formatTime(item.checkInTime),
          checkOutTime: formatTime(item.checkOutTime),
          lateMinutes: lateMins,
          earlyMinutes: earlyMins,
          source,
          notes: item.notes || '',
        };
      });

      setRecords(mapped);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to load attendance history.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchHistory();
  };

  const handleCycleMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const filteredRecords = records.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Late') return item.status === 'LATE';
    if (filter === 'Absent') return item.status === 'ABSENT';
    if (filter === 'Holiday') return item.status === 'HOLIDAY';
    return true;
  });

  // Calculate dynamic stats from fetched records
  const onTimeCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'WORKING').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;
  const totalWorkedHours = Math.floor(
    records.reduce((acc, r) => acc + r.workedMinutes, 0) / 60
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Attendance</Text>
          <TouchableOpacity style={styles.monthPicker} activeOpacity={0.7} onPress={handleCycleMonth}>
            <Text style={styles.monthText}>{monthLabel}</Text>
            <Ionicons name="chevron-back" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.status.presentText }]}>
              {onTimeCount}
            </Text>
            <Text style={styles.statLabel}>On time</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.status.lateText }]}>
              {lateCount}
            </Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.status.absentText }]}>
              {absentCount}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{totalWorkedHours}h</Text>
            <Text style={styles.statLabel}>Worked</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['All', 'Late', 'Absent', 'Holiday'] as FilterType[]).map((tab) => {
            const active = filter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterChip,
                  active ? styles.filterChipActive : styles.filterChipInactive,
                ]}
                onPress={() => setFilter(tab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active ? styles.filterChipTextActive : styles.filterChipTextInactive,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Attendance List */}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 28 }} color={colors.primary} />
        ) : errorMessage ? (
          <View style={styles.card}>
            <Text style={[styles.cardMeta, { color: colors.status.absentText }]}>
              {errorMessage}
            </Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTimes}>No attendance records</Text>
              <Text style={styles.cardMeta}>
                Records for {monthLabel} will appear here once logged.
              </Text>
            </View>
          </View>
        ) : (
        <View style={styles.list}>
          {filteredRecords.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/attendance-detail',
                  params: {
                    id: item.id,
                    rawDate: item.rawDate,
                    day: item.day,
                    dow: item.dow,
                    date: item.date,
                    status: item.status,
                    times: item.times,
                    shiftLabel: item.shiftLabel,
                    workedLabel: item.workedLabel,
                    checkInTime: item.checkInTime,
                    checkOutTime: item.checkOutTime,
                    lateMinutes: String(item.lateMinutes),
                    earlyMinutes: String(item.earlyMinutes),
                    source: item.source,
                    branchName: user?.branchName || '',
                    notes: item.notes,
                  },
                })
              }
            >
              <View style={styles.dayBox}>
                <Text style={styles.dowText}>{item.dow}</Text>
                <Text style={styles.dayText}>{item.day}</Text>
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTimes} numberOfLines={1}>
                  {item.times}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {item.meta}
                </Text>
              </View>

              <Badge status={item.status as StatusType} />
            </TouchableOpacity>
          ))}
        </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  monthPicker: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  filterChipInactive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipTextInactive: {
    color: colors.textMuted,
  },
  list: {
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  dayBox: {
    width: 44,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dowText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 20,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTimes: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
