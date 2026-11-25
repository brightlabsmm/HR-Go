import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { leaveApi, MobileLeaveBalance } from '../services/api/leaveApi';

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function calcDays(from: string, to: string, half: boolean): number {
  const s = new Date(`${from.trim()}T00:00:00`);
  const e = new Date(`${to.trim()}T00:00:00`);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
  const raw = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return half ? Math.max(0.5, raw - 0.5) : raw;
}

export default function NewLeaveScreen() {
  const router = useRouter();

  const [leaveOptions, setLeaveOptions] = useState<MobileLeaveBalance[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(todayYMD);
  const [toDate, setToDate] = useState<string>(todayYMD);
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const list = await leaveApi.listBalances();
        setLeaveOptions(list);
        if (list.length > 0) {
          setSelectedTypeId(list[0].leaveTypeId);
        }
      } catch (err: any) {
        Alert.alert('Load Failed', err?.message || 'Unable to load leave types.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentOption = leaveOptions.find((o) => o.leaveTypeId === selectedTypeId) ?? null;
  const requestedDays = calcDays(fromDate, toDate, halfDay);
  const daysText = `${requestedDays} ${requestedDays === 1 ? 'day' : 'days'}`;
  const afterBalanceText =
    currentOption && currentOption.requiresBalance
      ? `${Math.max(0, currentOption.remainingDays - requestedDays)} days`
      : 'Not tracked';

  const handleSubmit = async () => {
    if (!selectedTypeId) {
      Alert.alert('Leave Type Required', 'Please select a leave type.');
      return;
    }
    if (requestedDays <= 0) {
      Alert.alert('Invalid Dates', 'Please enter valid YYYY-MM-DD From and To dates.');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for your leave request.');
      return;
    }

    setSubmitting(true);
    try {
      await leaveApi.submitRequest({
        leaveTypeId: selectedTypeId,
        startDate: fromDate.trim(),
        endDate: toDate.trim(),
        isHalfDay: halfDay,
        reason: reason.trim(),
      });
      setSent(true);
    } catch (err: any) {
      Alert.alert('Submission Failed', err?.message || 'Unable to submit leave request.');
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
        <Text style={styles.headerTitle}>New leave request</Text>
      </View>

      {!sent ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Leave Type Selector 2x2 */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Leave type</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : leaveOptions.length === 0 ? (
              <Text style={styles.typeLeft}>No leave types configured for your organization.</Text>
            ) : (
              <View style={styles.typesGrid}>
                {leaveOptions.map((opt) => {
                  const active = selectedTypeId === opt.leaveTypeId;
                  return (
                    <TouchableOpacity
                      key={opt.leaveTypeId}
                      style={[
                        styles.typeCard,
                        active && styles.typeCardActive,
                      ]}
                      onPress={() => setSelectedTypeId(opt.leaveTypeId)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.typeName,
                          active && styles.typeNameActive,
                        ]}
                      >
                        {opt.leaveTypeName}
                      </Text>
                      <Text style={styles.typeLeft}>
                        {opt.requiresBalance ? `${opt.remainingDays} days left` : 'No limit'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Date Range 2 Columns */}
          <View style={styles.rowInputs}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>From</Text>
              <TextInput
                style={styles.input}
                value={fromDate}
                onChangeText={setFromDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>To</Text>
              <TextInput
                style={styles.input}
                value={toDate}
                onChangeText={setToDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Half Day Toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Half day on the last day</Text>
            <Switch
              value={halfDay}
              onValueChange={setHalfDay}
              trackColor={{ false: '#D5DDEC', true: colors.secondary }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Balance Preview Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewCol}>
              <Text style={styles.previewLabel}>Days requested</Text>
              <Text style={styles.previewValue}>{daysText}</Text>
            </View>
            <View style={styles.previewCol}>
              <Text style={styles.previewLabel}>Balance after approval</Text>
              <Text style={styles.previewValue}>{afterBalanceText}</Text>
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
              placeholder="Add a short reason for your approver"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
            activeOpacity={0.8}
            disabled={submitting}
            onPress={() => void handleSubmit()}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit leave request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Sent Confirmation Screen */
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={44} color="#12805C" />
          </View>
          <Text style={styles.successTitle}>Leave request sent</Text>
          <Text style={styles.successSubtitle}>
            {currentOption?.leaveTypeName || 'Leave'} for {daysText} ({fromDate} to {toDate}) is pending. Your balance
            changes only after it is approved.
          </Text>

          <TouchableOpacity
            style={styles.viewRequestsButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/leave')}
          >
            <Text style={styles.viewRequestsButtonText}>View my leave</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backHomeLink}
            activeOpacity={0.7}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.backHomeText}>Back to home</Text>
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
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#34405E',
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
  typeCardActive: {
    borderColor: colors.secondary,
    backgroundColor: '#F4F9FF',
  },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  typeNameActive: {
    color: colors.primary,
  },
  typeLeft: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 14,
    color: colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  previewCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
  },
  previewCol: {
    flex: 1,
    gap: 2,
  },
  previewLabel: {
    fontSize: 12,
    color: colors.primary,
  },
  previewValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  textArea: {
    minHeight: 80,
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
  backHomeLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backHomeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
});
