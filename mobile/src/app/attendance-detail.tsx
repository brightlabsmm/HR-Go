import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { Badge, StatusType } from '../components/Badge';
import { formatFullDate, toLocalDateString } from '../utils/dateTime';

export default function AttendanceDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    rawDate?: string;
    day?: string;
    dow?: string;
    date?: string;
    status?: string;
    times?: string;
    shiftLabel?: string;
    workedLabel?: string;
    checkInTime?: string;
    checkOutTime?: string;
    lateMinutes?: string;
    earlyMinutes?: string;
    source?: string;
    branchName?: string;
    notes?: string;
  }>();

  const titleDate = params.date || formatFullDate(params.rawDate);
  const status = (params.status || 'PRESENT') as StatusType;
  const shiftLabel = params.shiftLabel || 'Workspace Default Shift';
  const workedLabel = params.workedLabel || '—';
  const inTime = params.checkInTime || '--:--';
  const outTime = params.checkOutTime || '--:--';
  const lateMins = Number(params.lateMinutes || '0');
  const earlyMins = Number(params.earlyMinutes || '0');
  const sourceLabel = params.source || 'Mobile';
  const branchLabel = params.branchName || '—';
  const notesText = params.notes || 'No remarks recorded for this day.';
  const rawDate = params.rawDate || toLocalDateString(new Date());

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{titleDate}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.shiftLabel}>{shiftLabel}</Text>
              <Text style={styles.workedHours}>{workedLabel}</Text>
              <Text style={styles.workedSubtitle}>Recorded daily attendance</Text>
            </View>
            <Badge status={status} />
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            {/* Check-in event */}
            <View style={styles.timelineRow}>
              <View style={styles.dotCol}>
                <View style={[styles.timelineDot, { backgroundColor: '#D97706' }]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.timelineEventContent}>
                <Text style={styles.eventTitle}>Checked in · {inTime}</Text>
                <Text style={styles.eventSubtitle}>
                  {lateMins > 0 ? `${sourceLabel} · ${lateMins} min late` : `${sourceLabel} · on time`}
                </Text>
              </View>
            </View>

            {/* Check-out event */}
            <View style={styles.timelineRow}>
              <View style={styles.dotCol}>
                <View style={[styles.timelineDot, { backgroundColor: '#12805C' }]} />
              </View>
              <View style={styles.timelineEventContent}>
                <Text style={styles.eventTitle}>Checked out · {outTime}</Text>
                <Text style={styles.eventSubtitle}>
                  {outTime === '--:--'
                    ? 'Not yet recorded'
                    : earlyMins > 0
                    ? `${sourceLabel} · ${earlyMins} min early`
                    : `${sourceLabel} · on time`}
                </Text>
              </View>
            </View>
          </View>

          {/* 2x2 Details Grid */}
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Late</Text>
              <Text style={[styles.gridValue, lateMins > 0 && { color: colors.status.lateText }]}>
                {lateMins} min
              </Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Early leave</Text>
              <Text style={styles.gridValue}>{earlyMins} min</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Source</Text>
              <Text style={styles.gridValue}>{sourceLabel}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.gridLabel}>Branch</Text>
              <Text style={styles.gridValue}>{branchLabel}</Text>
            </View>
          </View>
        </View>

        {/* Remarks Section */}
        <View style={styles.remarksCard}>
          <Text style={styles.remarksTitle}>Remarks</Text>
          <Text style={styles.remarksText}>{notesText}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Text style={styles.actionHint}>
            Times look wrong? Your HR approver reviews every correction before the record changes.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() => router.push({
              pathname: '/correction-request',
              params: {
                type: 'corr',
                date: rawDate,
                attendanceRecordId: params.id,
                recordedTimes: params.times,
              },
            })}
          >
            <Ionicons name="pencil" size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Request correction</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() => router.push({
              pathname: '/correction-request',
              params: {
                type: 'late',
                date: rawDate,
                attendanceRecordId: params.id,
                recordedTimes: params.times,
              },
            })}
          >
            <Text style={styles.secondaryButtonText}>Explain late arrival</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shiftLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  workedHours: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primary,
  },
  workedSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dotCol: {
    width: 20,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 34,
    backgroundColor: '#E4E9F3',
  },
  timelineEventContent: {
    flex: 1,
    paddingBottom: 14,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  eventSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridCell: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.bg,
    gap: 2,
  },
  gridLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  remarksCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  remarksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  remarksText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
    marginTop: 10,
  },
  actionHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryButton: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
});
