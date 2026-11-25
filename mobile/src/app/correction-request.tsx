import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { attendanceApi } from '../services/api/attendanceApi';
import {
  formatTime,
  localDateTimeToISO,
  toLocalDateString,
} from '../utils/dateTime';

export default function CorrectionRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    date?: string;
    attendanceRecordId?: string;
    recordedTimes?: string;
  }>();

  const [requestType, setRequestType] = useState<'corr' | 'late'>(
    params.type === 'late' ? 'late' : 'corr'
  );
  const [recordId, setRecordId] = useState(params.attendanceRecordId || '');
  const [recordedTimesLabel, setRecordedTimesLabel] = useState(
    params.recordedTimes || ''
  );
  const [date, setDate] = useState(params.date || toLocalDateString(new Date()));
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // When opened directly without an explicit attendanceRecordId, resolve a real record for the selected date.
  useEffect(() => {
    if (params.attendanceRecordId) return;
    let active = true;
    void (async () => {
      try {
        const res = await attendanceApi.getHistory({
          startDate: date,
          endDate: date,
          pageSize: 1,
        });
        const match = res?.items?.[0];
        if (!active) return;
        if (match) {
          setRecordId(match.id);
          setRecordedTimesLabel(
            `In ${formatTime(match.checkInTime)} · Out ${formatTime(match.checkOutTime)}`
          );
        } else {
          setRecordId('');
          setRecordedTimesLabel('');
        }
      } catch {
        if (!active) return;
        setRecordId('');
      }
    })();
    return () => {
      active = false;
    };
  }, [date, params.attendanceRecordId]);

  const handleSubmit = async () => {
    if (!recordId) {
      Alert.alert(
        'No Attendance Record',
        'Select an attendance date with an existing attendance record to submit a correction.'
      );
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Required Field', 'Please provide a reason for your correction request.');
      return;
    }

    const checkInISO = checkIn.trim() ? localDateTimeToISO(date, checkIn) : undefined;
    const checkOutISO = checkOut.trim() ? localDateTimeToISO(date, checkOut) : undefined;
    if (checkIn.trim() && !checkInISO) {
      Alert.alert('Invalid Check-in Time', 'Please use YYYY-MM-DD for date and HH:MM for check-in time.');
      return;
    }
    if (checkOut.trim() && !checkOutISO) {
      Alert.alert('Invalid Check-out Time', 'Please use YYYY-MM-DD for date and HH:MM for check-out time.');
      return;
    }
    if (!checkInISO && !checkOutISO) {
      Alert.alert('Requested Time Required', 'Enter at least a requested check-in or check-out time.');
      return;
    }

    setSubmitting(true);
    try {
      await attendanceApi.submitCorrection({
        attendanceRecordId: recordId,
        requestedCheckInTime: checkInISO || undefined,
        requestedCheckOutTime: checkOutISO || undefined,
        reason: reason.trim(),
      });

      setSent(true);
    } catch (err: any) {
      Alert.alert(
        'Submission Failed',
        err.message || 'Unable to submit correction request. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.headerTitle}>Attendance correction</Text>
      </View>

      {!sent ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Segmented Radio Control */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[
                styles.segmentTab,
                requestType === 'corr' && styles.segmentTabActive,
              ]}
              onPress={() => setRequestType('corr')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  requestType === 'corr' && styles.segmentTextActive,
                ]}
              >
                Correct times
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentTab,
                requestType === 'late' && styles.segmentTabActive,
              ]}
              onPress={() => setRequestType('late')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  requestType === 'late' && styles.segmentTextActive,
                ]}
              >
                Late submission
              </Text>
            </TouchableOpacity>
          </View>

          {/* Attendance Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Attendance date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Recorded Info Strip */}
          <View style={styles.recordedStrip}>
            <Text style={styles.recordedLabel}>Recorded</Text>
            <Text style={styles.recordedValue}>
              {recordedTimesLabel || 'No attendance record found for this date'}
            </Text>
          </View>

          {/* Requested Times 2 Columns */}
          <View style={styles.rowInputs}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Requested check-in</Text>
              <TextInput
                style={styles.input}
                value={checkIn}
                onChangeText={setCheckIn}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Requested check-out</Text>
              <TextInput
                style={styles.input}
                value={checkOut}
                onChangeText={setCheckOut}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Reason Field */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>Reason</Text>
              <Text style={styles.requiredAsterisk}>*</Text>
            </View>
            <TextInput
              style={styles.textArea}
              value={reason}
              onChangeText={setReason}
              placeholder="Tell your approver what happened"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.helperText}>
              Your original record stays unchanged until it is approved.
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.8 }]}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit correction request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Sent Confirmation Screen */
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={44} color="#12805C" />
          </View>
          <Text style={styles.successTitle}>Correction request sent</Text>
          <Text style={styles.successSubtitle}>
            Your approver has been notified. You can track this in My Requests.
          </Text>

          <TouchableOpacity
            style={styles.viewRequestsButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/my-requests')}
          >
            <Text style={styles.viewRequestsButtonText}>View my requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToAttendanceLink}
            activeOpacity={0.7}
            onPress={() => router.replace('/(tabs)/attendance')}
          >
            <Text style={styles.backToAttendanceText}>Back to attendance</Text>
          </TouchableOpacity>
        </View>
      )}
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
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E4E9F3',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#34405E',
  },
  requiredAsterisk: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  recordedStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  recordedLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  recordedValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  textArea: {
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  submitButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 14,
  },
  successIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E3F5EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  viewRequestsButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  viewRequestsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  backToAttendanceLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backToAttendanceText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
});
