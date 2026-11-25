import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { profileApi } from '../../services/api/profileApi';
import { MobileShiftResponse } from '../../services/api/types';
import { formatShortDate } from '../../utils/dateTime';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, device, logout, refreshProfile } = useAuth();

  const [shiftData, setShiftData] = useState<MobileShiftResponse | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchShift = useCallback(async () => {
    try {
      const s = await profileApi.getShift();
      if (s) {
        setShiftData(s);
      }
    } catch {
      // Shift may be unavailable when offline
    }
  }, []);

  useEffect(() => {
    void fetchShift();
  }, [fetchShift]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshProfile(), fetchShift()]);
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const displayName = user ? `${user.firstName} ${user.lastName}` : '—';
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'E'
    : 'E';
  const roleDept = user
    ? `${user.positionTitle || 'Employee'} · ${user.departmentName || 'General'}`
    : '—';
  const empMeta = user
    ? `${user.employeeCode} · ${user.branchName || 'All Branches'} · ${user.employmentStatus || '—'}`
    : '—';
  const phone = user?.phone || '—';
  const joinDate = user?.dateOfJoining ? formatShortDate(user.dateOfJoining) : '—';
  const dob = user?.profile?.dateOfBirth ? formatShortDate(user.profile.dateOfBirth) : '—';
  const genderMarital =
    user?.profile?.gender || user?.profile?.maritalStatus
      ? `${user.profile.gender || '—'} · ${user.profile.maritalStatus || '—'}`
      : '—';
  const emergencyContact = user?.profile?.emergencyContact || '—';
  const positionHistory = user?.positionHistory ?? [];

  const shiftName = shiftData?.shiftName || 'Default Workspace Shift';
  const shiftHours = shiftData ? `${shiftData.startTime} – ${shiftData.endTime}` : '—';
  const shiftBreak = shiftData
    ? `${shiftData.breakMinutes ?? 0} min break · ${shiftData.gracePeriodMinutes ?? 0} min grace`
    : 'Standard hours';

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Profile Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.employeeName}>{displayName}</Text>
            <Text style={styles.employeeRole}>{roleDept}</Text>
            <Text style={styles.employeeMeta}>{empMeta}</Text>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* Assigned Shift Card */}
          <View style={styles.card}>
            <View style={styles.shiftIconBox}>
              <Ionicons name="time-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.shiftInfo}>
              <Text style={styles.sectionSubtitle}>Assigned shift</Text>
              <Text style={styles.shiftTitle}>
                {shiftName} {shiftHours !== '—' ? `· ${shiftHours}` : ''}
              </Text>
              <Text style={styles.shiftSubtitle}>{shiftBreak}</Text>
            </View>
          </View>

          {/* Personal Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.cardHeading}>Personal information</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Phone</Text>
              <Text style={styles.rowValue}>{phone}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date of joining</Text>
              <Text style={styles.rowValue}>{joinDate}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date of birth</Text>
              <Text style={styles.rowValue}>{dob}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Gender · Marital status</Text>
              <Text style={styles.rowValue}>{genderMarital}</Text>
            </View>
            <View style={[styles.row, { borderBottomWidth: 0 }]}>
              <Text style={styles.rowLabel}>Emergency contact</Text>
              <Text style={styles.rowValue}>{emergencyContact}</Text>
            </View>
          </View>

          {/* Position History Card */}
          <View style={styles.cardSection}>
            <Text style={styles.cardHeading}>Position history</Text>
            {positionHistory.length === 0 ? (
              <Text style={styles.timelineSubtitle}>No position changes recorded.</Text>
            ) : (
              positionHistory.map((item) => (
                <View key={item.id} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>
                      {item.oldPositionTitle
                        ? `${item.oldPositionTitle} → ${item.newPositionTitle}`
                        : item.newPositionTitle}
                    </Text>
                    <Text style={styles.timelineSubtitle}>
                      Effective {formatShortDate(item.effectiveDate)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Account Navigation List */}
          <View style={styles.navMenuCard}>
            <TouchableOpacity
              style={styles.navMenuItem}
              activeOpacity={0.7}
              onPress={() => router.push('/change-password')}
            >
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
              <Text style={styles.navMenuText}>Change password</Text>
              <Ionicons name="chevron-forward" size={18} color="#8A94AD" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navMenuItem}
              activeOpacity={0.7}
              onPress={() => router.push('/offline-sync')}
            >
              <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
              <Text style={styles.navMenuText}>This device & offline sync</Text>
              <Text style={styles.deviceBadge}>
                {device?.status === 'ACTIVE' ? 'Registered' : 'Device'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navMenuItem, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={handleSignOut}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.navMenuText, { color: colors.error, fontWeight: '600' }]}>
                Sign out
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 24,
  },
  headerBanner: {
    backgroundColor: colors.primary,
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  employeeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  employeeRole: {
    fontSize: 13,
    color: '#DCE7FA',
  },
  employeeMeta: {
    fontSize: 12,
    color: '#BFD3F5',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  shiftIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftInfo: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  shiftTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  shiftSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F7',
  },
  rowLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timelineSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  navMenuCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  navMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 50,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F7',
  },
  navMenuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  deviceBadge: {
    fontSize: 12,
    color: colors.status.presentText,
    fontWeight: '600',
  },
});
