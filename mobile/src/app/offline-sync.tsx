import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { Badge, StatusType } from '../components/Badge';

interface SyncEvent {
  id: number;
  short: 'IN' | 'OUT';
  title: string;
  time: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CONFLICT';
  note: string;
}

export default function OfflineSyncScreen() {
  const router = useRouter();
  const [synced, setSynced] = useState(false);
  const [checkedOutOffline, setCheckedOutOffline] = useState(false);

  const events: SyncEvent[] = [
    {
      id: 1,
      short: 'IN',
      title: 'Check in',
      time: 'Tue 24 Nov · 08:52',
      status: synced ? 'ACCEPTED' : 'PENDING',
      note: synced ? 'Synced 09:41' : 'Waiting for connection',
    },
    {
      id: 2,
      short: 'OUT',
      title: 'Check out',
      time: 'Mon 22 Nov · 17:10',
      status: 'CONFLICT',
      note: 'A check-out already exists for this day',
    },
    {
      id: 3,
      short: 'IN',
      title: 'Check in',
      time: 'Mon 22 Nov · 08:58',
      status: 'ACCEPTED',
      note: 'Synced 22 Nov, 12:04',
    },
    {
      id: 4,
      short: 'OUT',
      title: 'Check out',
      time: 'Sun 21 Nov · 16:40',
      status: 'REJECTED',
      note: 'Not a working day for your shift',
    },
  ];

  const handleCheckOutOffline = () => {
    setCheckedOutOffline(true);
    Alert.alert('Offline Action Stored', 'Check-out at 17:06 has been saved offline on this device.');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offline attendance</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline / Online Status Banner */}
        <View
          style={[
            styles.banner,
            synced ? styles.bannerOnline : styles.bannerOffline,
          ]}
        >
          <Ionicons
            name={synced ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={22}
            color={synced ? '#0E6B4C' : '#ffffff'}
            style={styles.bannerIcon}
          />
          <View style={styles.bannerTextCol}>
            <Text
              style={[
                styles.bannerTitle,
                { color: synced ? '#0E6B4C' : '#ffffff' },
              ]}
            >
              {synced ? 'Back online · 1 action synced' : 'You are offline'}
            </Text>
            <Text
              style={[
                styles.bannerBody,
                { color: synced ? '#0E6B4C' : 'rgba(255,255,255,0.85)' },
              ]}
            >
              {synced
                ? 'Conflicts and rejections need your review or an HR correction.'
                : 'You can still check in, check out and view saved attendance. We will sync automatically when you reconnect.'}
            </Text>
          </View>
        </View>

        {/* Offline Action Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.shiftMeta}>Today · Morning Shift</Text>
              <Text style={styles.punchStatus}>
                {checkedOutOffline
                  ? 'Checked out 17:06 (offline)'
                  : 'Checked in 08:52 (offline)'}
              </Text>
            </View>
            <View style={styles.onDeviceBadge}>
              <Text style={styles.onDeviceText}>On device</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.actionButton,
              checkedOutOffline && { backgroundColor: '#8A94AD' },
            ]}
            activeOpacity={0.8}
            onPress={handleCheckOutOffline}
            disabled={checkedOutOffline}
          >
            <Text style={styles.actionButtonText}>
              {checkedOutOffline ? 'Offline Check-out Complete' : 'Check out offline'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.actionCardFootnote}>
            Actions are time-stamped and stored securely on this phone until they reach HRGo.
          </Text>
        </View>

        {/* Events Section Header */}
        <View style={styles.eventsHeader}>
          <Text style={styles.sectionHeading}>Pending & recent events</Text>
          <TouchableOpacity
            style={[
              styles.syncButton,
              synced && styles.syncButtonDone,
            ]}
            onPress={() => setSynced(!synced)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.syncButtonText,
                synced && styles.syncButtonTextDone,
              ]}
            >
              {synced ? 'Synced' : 'Sync now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sync Queue List */}
        <View style={styles.eventList}>
          {events.map((ev) => {
            const isConflict = ev.status === 'CONFLICT';
            const isRejected = ev.status === 'REJECTED';
            return (
              <View key={ev.id} style={styles.eventItem}>
                <View
                  style={[
                    styles.eventIconBox,
                    ev.short === 'IN' ? styles.iconIn : styles.iconOut,
                  ]}
                >
                  <Text
                    style={[
                      styles.iconShortText,
                      ev.short === 'IN'
                        ? { color: colors.accent }
                        : { color: colors.primary },
                    ]}
                  >
                    {ev.short}
                  </Text>
                </View>

                <View style={styles.eventContent}>
                  <View style={styles.eventHeaderLine}>
                    <Text style={styles.eventTitle}>{ev.title}</Text>
                    <Badge status={ev.status as StatusType} />
                  </View>
                  <Text style={styles.eventTime}>{ev.time}</Text>
                  <Text
                    style={[
                      styles.eventNote,
                      isConflict && { color: colors.status.lateText },
                      isRejected && { color: colors.status.absentText },
                    ]}
                  >
                    {ev.note}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Conflict Correction CTA */}
        <TouchableOpacity
          style={styles.conflictCta}
          activeOpacity={0.8}
          onPress={() => router.push('/correction-request')}
        >
          <Text style={styles.conflictCtaText}>
            Conflict? Submit an attendance correction
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  bannerOffline: {
    backgroundColor: '#0B1B3F',
  },
  bannerOnline: {
    backgroundColor: '#E3F5EC',
  },
  bannerIcon: {
    marginTop: 2,
  },
  bannerTextCol: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  bannerBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  punchStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  onDeviceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#EEF1F7',
  },
  onDeviceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34405E',
  },
  actionButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionCardFootnote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  syncButton: {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonDone: {
    backgroundColor: '#E3F5EC',
    borderColor: '#E3F5EC',
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  syncButtonTextDone: {
    color: '#0E6B4C',
  },
  eventList: {
    gap: 10,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  eventIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconIn: {
    backgroundColor: colors.accentLight,
  },
  iconOut: {
    backgroundColor: '#EEF1F7',
  },
  iconShortText: {
    fontSize: 13,
    fontWeight: '700',
  },
  eventContent: {
    flex: 1,
    gap: 2,
  },
  eventHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  eventNote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginTop: 2,
  },
  conflictCta: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  conflictCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});
