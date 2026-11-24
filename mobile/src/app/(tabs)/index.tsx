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
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { HrGoLogo } from '../../components/HrGoLogo';
import { initialWeekDays } from '../../constants/mockData';

export default function HomeScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(0);

  const statusLabels = ['Not checked in', 'Working', 'Day complete'];
  const btnLabels = ['Check in', 'Check out', 'Checked out for today'];

  const clock = step === 0 ? '08:52' : step === 1 ? '08:52' : '17:06';
  const statusLabel = statusLabels[step];
  const btnLabel = btnLabels[step];
  const btnBg = step === 0 ? Colors.accent : step === 1 ? Colors.white : 'rgba(255,255,255,0.14)';
  const btnFg = step === 1 ? Colors.primary : Colors.white;
  const isDone = step === 2;

  const inTime = step >= 1 ? '08:52' : '--:--';
  const outTime = step === 2 ? '17:06' : '--:--';
  const worked = step === 2 ? '7h 14m' : step === 1 ? 'In progress' : '0h';

  const handlePunchAction = () => {
    if (!isDone) {
      setStep((prev) => Math.min(2, prev + 1));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.userRow}>
            <HrGoLogo width={36} height={36} />
            <View>
              <Text style={styles.greetingText}>Mingalaba,</Text>
              <Text style={styles.userName}>Aung Ko Ko</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.onlinePill}
              onPress={() => router.push('/offline-sync')}
              activeOpacity={0.7}
            >
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => router.push('/(tabs)/profile')}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>AK</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Punch Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroCircle} />

          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroDate}>Tuesday, 24 Nov 2026</Text>
              <Text style={styles.heroClock}>{clock}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.shiftInfoRow}>
            <Feather name="clock" size={15} color="#DCE7FA" />
            <Text style={styles.shiftInfoText}>
              Morning Shift · 09:00 – 17:00 · 60 min break
            </Text>
          </View>

          {/* Punch Button */}
          <TouchableOpacity
            style={[styles.punchButton, { backgroundColor: btnBg }]}
            onPress={handlePunchAction}
            disabled={isDone}
            activeOpacity={0.8}
          >
            <Feather
              name={step === 0 ? 'log-in' : step === 1 ? 'log-out' : 'check'}
              size={20}
              color={btnFg}
            />
            <Text style={[styles.punchButtonText, { color: btnFg }]}>{btnLabel}</Text>
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
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/attendance')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekContainer}>
            {initialWeekDays.map((item, index) => (
              <View key={index} style={styles.weekCol}>
                <Text style={styles.weekDayName}>{item.dayName}</Text>
                <View
                  style={[
                    styles.weekDateBadge,
                    item.isToday && styles.weekDateBadgeToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekDateNum,
                      item.isToday && styles.weekDateNumToday,
                    ]}
                  >
                    {item.dateNum}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.weekLabel,
                    item.isToday && styles.weekLabelToday,
                    item.statusColor ? { color: item.statusColor } : null,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pending Request Alert Banner */}
        <TouchableOpacity
          style={styles.pendingAlertCard}
          onPress={() => router.push('/my-requests')}
          activeOpacity={0.8}
        >
          <View style={styles.pendingIconBox}>
            <Feather name="clock" size={20} color="#8A4B00" />
          </View>
          <View style={styles.pendingTextCol}>
            <Text style={styles.pendingTitle}>1 correction pending</Text>
            <Text style={styles.pendingSubtitle}>
              20 Nov · waiting for HR approval
            </Text>
          </View>
          <Feather name="chevron-right" size={20} color="#8A4B00" />
        </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greetingText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  userName: {
    fontSize: 18,
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
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.status.present.bg,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.present.dot,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.status.present.text,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    gap: 16,
  },
  heroCircle: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.accent,
    opacity: 0.35,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroDate: {
    fontSize: 13,
    color: '#BFD3F5',
  },
  heroClock: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
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
    fontSize: 13,
    color: '#DCE7FA',
  },
  punchButton: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  punchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 10,
    gap: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#BFD3F5',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentDark,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSubtle,
  },
  weekContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  weekCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  weekDayName: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  weekDateBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDateBadgeToday: {
    backgroundColor: Colors.accent,
  },
  weekDateNum: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSubtle,
  },
  weekDateNumToday: {
    color: Colors.white,
  },
  weekLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  weekLabelToday: {
    color: Colors.accentDark,
    fontWeight: '600',
  },
  pendingAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFF6E5',
  },
  pendingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FDE7BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTextCol: {
    flex: 1,
    gap: 2,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  pendingSubtitle: {
    fontSize: 12,
    color: '#6B4A12',
  },
});
