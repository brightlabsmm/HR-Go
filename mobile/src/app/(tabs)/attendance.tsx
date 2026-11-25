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
import { ATTENDANCE_HISTORY, AttendanceRecord } from '../../constants/mockData';
import { Badge, StatusType } from '../../components/Badge';
import { attendanceApi } from '../../services/api/attendanceApi';

type FilterType = 'All' | 'Late' | 'Absent' | 'Holiday';

function formatPunchTimes(inTime?: string, outTime?: string): string {
  const fmt = (t?: string) => {
    if (!t) return '--:--';
    try {
      const d = new Date(t);
      return isNaN(d.getTime())
        ? t
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return t;
    }
  };

  if (!inTime && !outTime) return 'No check-in';
  return `${fmt(inTime)} – ${fmt(outTime)}`;
}

export default function AttendanceScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('All');
  const [records, setRecords] = useState<AttendanceRecord[]>(ATTENDANCE_HISTORY);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await attendanceApi.getHistory({ pageSize: 50 });
      if (res && res.items && res.items.length > 0) {
        const mapped: AttendanceRecord[] = res.items.map((item) => {
          const d = new Date(item.attendanceDate);
          const dow = isNaN(d.getTime())
            ? 'DAY'
            : d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
          const day = isNaN(d.getTime()) ? '01' : String(d.getDate()).padStart(2, '0');
          const dateFull = isNaN(d.getTime())
            ? item.attendanceDate
            : d.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

          const times = formatPunchTimes(item.checkInTime, item.checkOutTime);
          const lateMeta =
            item.lateMinutes && item.lateMinutes > 0 ? ` · ${item.lateMinutes} min late` : '';
          const workMeta = item.workMinutes
            ? ` · ${Math.floor(item.workMinutes / 60)}h ${item.workMinutes % 60}m`
            : '';
          const meta = `${item.checkInSource || 'Mobile'}${lateMeta}${workMeta}`;

          return {
            id: item.id,
            dow,
            day,
            date: dateFull,
            times,
            meta: meta || 'Recorded on mobile',
            status: (item.status || 'PRESENT') as any,
          };
        });

        setRecords(mapped);
      }
    } catch {
      // Retain fallback records if offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const filteredRecords = records.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Late') return item.status === 'LATE';
    if (filter === 'Absent') return item.status === 'ABSENT';
    if (filter === 'Holiday') return item.status === 'HOLIDAY';
    return true;
  });

  // Calculate dynamic stats
  const onTimeCount = records.filter((r) => r.status === 'PRESENT' || r.status === 'WORKING').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;

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
          <TouchableOpacity style={styles.monthPicker} activeOpacity={0.7}>
            <Text style={styles.monthText}>Nov 2026</Text>
            <Ionicons name="chevron-down" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.status.presentText }]}>
              {onTimeCount || 11}
            </Text>
            <Text style={styles.statLabel}>On time</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.status.lateText }]}>
              {lateCount || 3}
            </Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.status.absentText }]}>
              {absentCount || 1}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statValue, { color: colors.primary }]}>98h</Text>
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
                    day: item.day,
                    dow: item.dow,
                    date: item.date,
                    status: item.status,
                    times: item.times,
                    meta: item.meta,
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
