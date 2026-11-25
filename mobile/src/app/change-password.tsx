import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import { authApi } from '../services/api/authApi';

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPw, setCurrentPw] = useState('Password@123');
  const [newPw, setNewPw] = useState('Yangon@2026');
  const [confirmPw, setConfirmPw] = useState('Yangon@2026');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const checks = [
    { label: 'At least 8 characters', ok: newPw.length >= 8 },
    { label: 'An uppercase and a lowercase letter', ok: /[A-Z]/.test(newPw) && /[a-z]/.test(newPw) },
    { label: 'At least one number', ok: /\d/.test(newPw) },
    { label: 'A symbol such as ! @ #', ok: /[^A-Za-z0-9]/.test(newPw) },
  ];

  const score = checks.filter((c) => c.ok).length;
  const scoreColors = ['#C2261C', '#C2261C', '#D97706', '#1787f5', '#12805C'];
  const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthTextColors = ['#A3231A', '#A3231A', '#8A4B00', '#1269C7', '#0E6B4C'];

  const barColor = scoreColors[score];
  const strengthLabel = strengthLabels[score];
  const strengthTextColor = strengthTextColors[score];

  const handleUpdate = async () => {
    if (!currentPw) {
      setErrorMessage('Please enter your current password.');
      return;
    }
    if (newPw.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      await authApi.changePassword({
        oldPassword: currentPw,
        newPassword: newPw,
      });

      Alert.alert('Success', 'Your password has been updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const msg = err.message || 'Failed to update password. Please check your current password.';
      setErrorMessage(msg);
      Alert.alert('Change Password Failed', msg);
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
        <Text style={styles.headerTitle}>Change password</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headerNote}>
          You will stay signed in on this device. Other devices will need to sign in again.
        </Text>

        {errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Current Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Current password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={currentPw}
              onChangeText={setCurrentPw}
              secureTextEntry={!showCurrent}
              placeholder="Enter current password"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowCurrent(!showCurrent)}
            >
              <Ionicons
                name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>New password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={newPw}
              onChangeText={setNewPw}
              secureTextEntry={!showNew}
              placeholder="Enter new password"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowNew(!showNew)}
            >
              <Ionicons
                name={showNew ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* 4 Strength Bars */}
          <View style={styles.strengthBarsRow}>
            {[0, 1, 2, 3].map((idx) => (
              <View
                key={idx}
                style={[
                  styles.strengthBar,
                  { backgroundColor: idx < score ? barColor : '#E4E9F3' },
                ]}
              />
            ))}
          </View>

          <Text style={[styles.strengthText, { color: strengthTextColor }]}>
            {strengthLabel}
          </Text>
        </View>

        {/* Criteria Checklist */}
        <View style={styles.rulesCard}>
          {checks.map((c, i) => (
            <View key={i} style={styles.ruleItem}>
              <View
                style={[
                  styles.ruleCircle,
                  { backgroundColor: c.ok ? '#12805C' : '#C9D1E1' },
                ]}
              >
                <Ionicons name="checkmark" size={12} color="#ffffff" />
              </View>
              <Text
                style={[
                  styles.ruleLabel,
                  { color: c.ok ? colors.textPrimary : colors.textSecondary },
                ]}
              >
                {c.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Confirm New Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Confirm new password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry={!showConfirm}
              placeholder="Confirm new password"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Ionicons
                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Update Button */}
        <TouchableOpacity
          style={[styles.updateButton, submitting && { opacity: 0.8 }]}
          activeOpacity={0.8}
          onPress={handleUpdate}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.updateButtonText}>Update password</Text>
          )}
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
    paddingBottom: 28,
    gap: 16,
  },
  headerNote: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDE8E7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#34405E',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  eyeButton: {
    padding: 6,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  rulesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleLabel: {
    fontSize: 13,
  },
  updateButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
