import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

type LeaveTypeKey = 'casual' | 'earned' | 'medical' | 'unpaid';

export default function NewLeaveScreen() {
  const router = useRouter();

  const [leaveType, setLeaveType] = useState<LeaveTypeKey>('casual');
  const [fromDate, setFromDate] = useState('2026-12-10');
  const [toDate, setToDate] = useState('2026-12-11');
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("Sister's wedding in Bago.");
  const [sent, setSent] = useState(false);

  const leaveOptions: { id: LeaveTypeKey; name: string; left: number | null }[] = [
    { id: 'casual', name: 'Casual', left: 4 },
    { id: 'earned', name: 'Earned', left: 8 },
    { id: 'medical', name: 'Medical', left: 28 },
    { id: 'unpaid', name: 'Unpaid', left: null },
  ];

  const currentOption = leaveOptions.find((o) => o.id === leaveType)!;
  const requestedDays: number = halfDay ? 1.5 : 2;
  const daysText = `${requestedDays} ${requestedDays === 1 ? 'day' : 'days'}`;
  const afterBalanceText =
    currentOption.left != null && typeof currentOption.left === 'number'
      ? `${currentOption.left - requestedDays} days`
      : 'Not tracked';

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
            <View style={styles.typesGrid}>
              {leaveOptions.map((opt) => {
                const active = leaveType === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.typeCard,
                      active && styles.typeCardActive,
                    ]}
                    onPress={() => setLeaveType(opt.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.typeName,
                        active && styles.typeNameActive,
                      ]}
                    >
                      {opt.name}
                    </Text>
                    <Text style={styles.typeLeft}>
                      {opt.left != null ? `${opt.left} days left` : 'No balance'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
            style={styles.submitButton}
            activeOpacity={0.8}
            onPress={() => setSent(true)}
          >
            <Text style={styles.submitButtonText}>Submit leave request</Text>
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
            {currentOption.name} leave for {daysText} (10–11 Dec) is pending. Your balance
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
