import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

type OtCategory = 'w' | 'r' | 'h';

export default function NewOvertimeScreen() {
  const router = useRouter();

  const [category, setCategory] = useState<OtCategory>('w');
  const [date, setDate] = useState('2026-11-26');
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('20:00');
  const [reason, setReason] = useState('Month-end closing support.');
  const [sent, setSent] = useState(false);

  const categories = [
    { id: 'w' as OtCategory, label: 'Weekday overtime', hint: 'After regular shift hours' },
    { id: 'r' as OtCategory, label: 'Rest day overtime', hint: 'Weekends and assigned rest days' },
    { id: 'h' as OtCategory, label: 'Holiday overtime', hint: 'Gazetted and company holidays' },
  ];

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
        <Text style={styles.headerTitle}>New overtime request</Text>
      </View>

      {!sent ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Overtime Category Radio Cards */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Overtime category</Text>
            <View style={styles.categoryList}>
              {categories.map((c) => {
                const active = category === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.categoryCard,
                      active && styles.categoryCardActive,
                    ]}
                    onPress={() => setCategory(c.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.radioRow}>
                      <View
                        style={[
                          styles.radioOuter,
                          active && styles.radioOuterActive,
                        ]}
                      >
                        {active && <View style={styles.radioInner} />}
                      </View>
                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryTitle}>{c.label}</Text>
                        <Text style={styles.categoryHint}>{c.hint}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date Input */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Start and End Times */}
          <View style={styles.rowInputs}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Start time</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>End time</Text>
              <TextInput
                style={styles.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          {/* Calculated Duration Strip */}
          <View style={styles.durationStrip}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.durationLabel}>Calculated duration:</Text>
            <Text style={styles.durationValue}>2h 30m</Text>
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
              placeholder="Describe the work being performed"
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
            <Text style={styles.submitButtonText}>Submit overtime request</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* Sent Confirmation Screen */
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={44} color="#12805C" />
          </View>
          <Text style={styles.successTitle}>Overtime request sent</Text>
          <Text style={styles.successSubtitle}>
            2h 30m for 26 Nov has been submitted for manager approval.
          </Text>

          <TouchableOpacity
            style={styles.viewRequestsButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/overtime')}
          >
            <Text style={styles.viewRequestsButtonText}>View overtime requests</Text>
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
  categoryList: {
    gap: 8,
  },
  categoryCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 14,
  },
  categoryCardActive: {
    borderColor: colors.secondary,
    backgroundColor: '#F4F9FF',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.secondary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.secondary,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  categoryHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  durationStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
  },
  durationLabel: {
    fontSize: 13,
    color: colors.primary,
  },
  durationValue: {
    fontSize: 14,
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
