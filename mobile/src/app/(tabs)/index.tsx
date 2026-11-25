import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { HrGoLogo } from '../../components/HrGoLogo';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../services/api/attendanceApi';
import { profileApi } from '../../services/api/profileApi';
import { offlineQueue } from '../../services/offline/offlineQueue';
import { MobileShiftResponse, MobileTodayResponse } from '../../services/api/types';
import { formatTime, toLocalDateString } from '../../utils/dateTime';

interface WeekDaySummary {
  dayName: string;
  dateNum: number;
  label: string;
  isToday: boolean;
  statusColor?: string;
}

function buildCurrentWeekDays(
  calendarDays: { date: string; status: string; isHoliday: boolean }[]
): WeekDaySummary[] {
  const now = new Date();
  const monday = new Date(now);
  const diffToMonday = (now.getDay() + 6) % 7;
  monday.setDate(now.getDate() - diffToMonday);
  const todayStr = toLocalDateString(now);

  const byDate = new Map(calendarDays.map((d) => [d.date.slice(0, 10), d]));
  const items: WeekDaySummary[] = [];

  for (let i = 0; i < 5; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const iso = toLocalDateString(dt);
    const match = byDate.get(iso);
    const isToday = iso === todayStr;

    let label = isToday ? 'Today' : '—';
    let statusColor: string | undefined;
    if (match) {
      if (match.isHoliday || match.status === 'HOLIDAY') {
        label = 'Holiday';
        statusColor = '#7C3AED';
      } else if (match.status === 'PRESENT' || match.status === 'WORKING') {
        label = isToday ? 'Today' : 'On time';
        statusColor = isToday ? undefined : '#12805C';
      } else if (match.status === 'LATE') {
        label = 'Late';
        statusColor = '#D97706';
      } else if (match.status === 'ABSENT') {
        label = 'Absent';
        statusColor = '#C2261C';
      }
    }

    items.push({
      dayName: dt.toLocaleDateString('en-GB', { weekday: 'short' }),
      dateNum: dt.getDate(),
      label,
      isToday,
      statusColor,
    });
  }
  return items;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, deviceIdentifier } = useAuth();

  const [currentTime, setCurrentTime] = useState<string>(() =>
    formatTime(new Date().toISOString())
  );
  const [currentDateLabel, setCurrentDateLabel] = useState<string>(() =>
    new Date().toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  );
  const [todayData, setTodayData] = useState<MobileTodayResponse | null>(null);
  const [shiftData, setShiftData] = useState<MobileShiftResponse | null>(null);
  const [weekDays, setWeekDays] = useState<WeekDaySummary[]>(() =>
    buildCurrentWeekDays([])
  );
  const [pendingCorrectionsCount, setPendingCorrectionsCount] = useState<number>(0);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineTimes, setOfflineTimes] = useState<{ in?: string; out?: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [punching, setPunching] = useState<boolean>(false);
  const [step, setStep] = useState<number>(0); // 0: Not checked in, 1: Working, 2: Day complete

  // Update live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setCurrentDateLabel(
        now.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch today's attendance, week calendar, pending corrections, and offline queue
  const fetchTodayData = useCallback(async () => {
    const now = new Date();
    try {
      const queued = await offlineQueue.getEvents();
      setPendingOfflineCount(queued.filter((e) => e.status === 'PENDING').length);
    } catch {
      setPendingOfflineCount(0);
    }

    try {
      const [todayRes, calRes, corrRes, shiftRes] = await Promise.all([
        attendanceApi.getToday(),
        attendanceApi
          .getCalendar(now.getFullYear(), now.getMonth() + 1)
          .catch(() => null),
        attendanceApi
          .listCorrections({ status: 'PENDING', pageSize: 1 })
          .catch(() => null),
        profileApi.getShift().catch(() => null),
      ]);

      setIsOffline(false);
      setTodayData(todayRes);
      if (shiftRes) {
        setShiftData(shiftRes);
      } else if (todayRes.shift) {
        setShiftData(todayRes.shift);
      }
      if (calRes?.days) {
        setWeekDays(buildCurrentWeekDays(calRes.days));
      }
      setPendingCorrectionsCount(corrRes?.totalItems ?? 0);

      if (todayRes.checkOutTime) {
        setStep(2);
      } else if (todayRes.checkInTime) {
        setStep(1);
      } else {
        setStep(0);
      }
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || err?.code === 'TIMEOUT') {
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchTodayData();
  }, [fetchTodayData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchTodayData();
  }, [fetchTodayData]);

  const handlePunchAction = async () => {
    if (step === 2) return;
    setPunching(true);

    try {
      if (step === 0) {
        try {
          await attendanceApi.checkIn({
            deviceId: deviceIdentifier,
            notes: 'Mobile app check-in',
          });
          setStep(1);
          await fetchTodayData();
          Alert.alert('Checked In', 'Your check-in has been successfully recorded.');
        } catch (apiErr: any) {
          if (apiErr?.code === 'NETWORK_ERROR' || apiErr?.code === 'TIMEOUT') {
            const ev = await offlineQueue.addPunch('CHECK_IN', {
              notes: 'Stored offline on device',
            });
            setOfflineTimes((prev) => ({ ...prev, in: ev.localEventTime }));
            setPendingOfflineCount((c) => c + 1);
            setIsOffline(true);
            setStep(1);
            Alert.alert(
              'Offline Check-in Saved',
              'Network is unavailable. Your check-in was saved offline and will sync when reconnected.'
            );
          } else {
            Alert.alert(
              'Check-in Failed',
              apiErr?.message || 'Unable to record check-in.'
            );
          }
        }
      } else if (step === 1) {
        try {
          await attendanceApi.checkOut({
            deviceId: deviceIdentifier,
            notes: 'Mobile app check-out',
          });
          setStep(2);
          await fetchTodayData();
          Alert.alert('Checked Out', 'Your check-out has been successfully recorded.');
        } catch (apiErr: any) {
          if (apiErr?.code === 'NETWORK_ERROR' || apiErr?.code === 'TIMEOUT') {
            const ev = await offlineQueue.addPunch('CHECK_OUT', {
              notes: 'Stored offline on device',
            });
            setOfflineTimes((prev) => ({ ...prev, out: ev.localEventTime }));
            setPendingOfflineCount((c) => c + 1);
            setIsOffline(true);
            setStep(2);
            Alert.alert(
              'Offline Check-out Saved',
              'Network is unavailable. Your check-out was saved offline and will sync when reconnected.'
            );
          } else {
            Alert.alert(
              'Check-out Failed',
              apiErr?.message || 'Unable to record check-out.'
            );
          }
        }
      }
    } finally {
      setPunching(false);
    }
  };

  const statusLabels = ['Not checked in', 'Working', 'Day complete'];
  const btnLabels = ['Check in', 'Check out', 'Checked out for today'];

  const statusLabel = todayData?.status || statusLabels[step];
  const btnLabel = btnLabels[step];
  const btnBg =
    step === 0 ? Colors.accent : step === 1 ? Colors.white : 'rgba(255,255,255,0.14)';
  const btnFg = step === 1 ? Colors.primary : Colors.white;
  const isDone = step === 2;

  const inTime = todayData?.checkInTime
    ? formatTime(todayData.checkInTime)
    : offlineTimes.in
    ? formatTime(offlineTimes.in)
    : '--:--';
  const outTime = todayData?.checkOutTime
    ? formatTime(todayData.checkOutTime)
    : offlineTimes.out
    ? formatTime(offlineTimes.out)
    : '--:--';

  let worked = '--';
  if (todayData?.workMinutes) {
    const hrs = Math.floor(todayData.workMinutes / 60);
    const mins = todayData.workMinutes % 60;
    worked = `${hrs}h ${mins}m`;
  } else if (step === 2) {
    worked = 'Synced pending';
  } else if (step === 1) {
    worked = 'In progress';
  } else {
    worked = '0h';
  }

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Employee';
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'E'
    : 'E';

  const activeShift = todayData?.shift || shiftData;
  const shiftInfoText = activeShift
    ? `${activeShift.shiftName} · ${activeShift.startTime} – ${activeShift.endTime}`
    : loading
    ? 'Loading shift...'
    : 'Default workspace schedule';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.userRow}>
            <HrGoLogo width={36} height={36} />
            <View>
              <Text style={styles.greetingText}>Mingalaba,</Text>
              <Text style={styles.userName}>{displayName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.onlinePill}
              onPress={() => router.push('/offline-sync')}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.onlineDot,
                  isOffline && { backgroundColor: '#D97706' },
                ]}
              />
              <Text style={styles.onlineText}>
                {isOffline
                  ? 'Offline'
                  : pendingOfflineCount > 0
                  ? `${pendingOfflineCount} pending`
                  : 'Online'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Punch Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroCircle} />

          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroDate}>{currentDateLabel}</Text>
              <Text style={styles.heroClock}>{currentTime}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.shiftInfoRow}>
            <Feather name="clock" size={15} color="#DCE7FA" />
            <Text style={styles.shiftInfoText}>{shiftInfoText}</Text>
          </View>

          {/* Punch Button */}
          <TouchableOpacity
            style={[styles.punchButton, { backgroundColor: btnBg }]}
            onPress={handlePunchAction}
            disabled={isDone || punching}
            activeOpacity={0.8}
          >
            {punching ? (
              <ActivityIndicator color={btnFg} />
            ) : (
              <>
                <Feather
                  name={step === 0 ? 'log-in' : step === 1 ? 'log-out' : 'check'}
                  size={20}
                  color={btnFg}
                />
                <Text style={[styles.punchButtonText, { color: btnFg }]}>{btnLabel}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Check in</Text>
              <Text style={styles.statValue}>{inTime}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Check out</Text>
              <Text style={styles.statValue}>{outTime}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Worked</Text>
              <Text style={styles.statValue}>{worked}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/overtime')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Feather name="clock" size={20} color={Colors.accentDark} />
              </View>
              <Text style={styles.actionLabel}>Overtime</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/attendance')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Feather name="check-square" size={20} color={Colors.accentDark} />
              </View>
              <Text style={styles.actionLabel}>Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/leave')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Feather name="calendar" size={20} color={Colors.accentDark} />
              </View>
              <Text style={styles.actionLabel}>Leave</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/my-requests')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrapper}>
                <Feather name="list" size={20} color={Colors.accentDark} />
              </View>
              <Text style={styles.actionLabel}>Requests</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* This Week Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>This week</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={styles.viewCalendarText}>View calendar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekStrip}>
            {weekDays.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.dayCard,
                  item.isToday && styles.dayCardToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayCardName,
                    item.isToday && styles.dayCardNameToday,
                  ]}
                >
                  {item.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayCardDate,
                    item.isToday && styles.dayCardDateToday,
                  ]}
                >
                  {item.dateNum}
                </Text>
                <Text
                  style={[
                    styles.dayCardStatus,
                    item.statusColor ? { color: item.statusColor } : undefined,
                    item.isToday && styles.dayCardStatusToday,
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pending Correction Alert Banner (only shown when server has pending requests) */}
        {pendingCorrectionsCount > 0 && (
          <View style={styles.alertBanner}>
            <View style={styles.alertIconCol}>
              <Ionicons name="information-circle" size={22} color="#8A4B00" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Attendance correction pending</Text>
              <Text style={styles.alertDesc}>
                You have {pendingCorrectionsCount} pending request{pendingCorrectionsCount === 1 ? '' : 's'} waiting for HR approval.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/my-requests')}
                activeOpacity={0.7}
              >
                <Text style={styles.alertAction}>View status →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E3F5EC',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#12805C',
  },
  onlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0E6B4C',
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    gap: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(23, 135, 245, 0.18)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroDate: {
    fontSize: 12,
    color: '#DCE7FA',
    fontWeight: '500',
  },
  heroClock: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  shiftInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftInfoText: {
    fontSize: 12,
    color: '#DCE7FA',
    fontWeight: '500',
  },
  punchButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  punchButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#BFD3F5',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  viewCalendarText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  actionIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSubtle,
  },
  weekStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  dayCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  dayCardToday: {
    backgroundColor: Colors.primary,
  },
  dayCardName: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  dayCardNameToday: {
    color: '#DCE7FA',
  },
  dayCardDate: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  dayCardDateToday: {
    color: Colors.white,
  },
  dayCardStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textDisabled,
  },
  dayCardStatusToday: {
    color: Colors.accent,
  },
  alertBanner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF8E6',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE0A3',
  },
  alertIconCol: {
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
    gap: 3,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A4B00',
  },
  alertDesc: {
    fontSize: 12,
    color: '#8A4B00',
    lineHeight: 16,
  },
  alertAction: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A4B00',
    marginTop: 4,
  },
});
