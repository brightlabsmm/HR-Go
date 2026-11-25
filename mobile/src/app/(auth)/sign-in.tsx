import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { HrGoLogo } from '../../components/HrGoLogo';
import { useAuth } from '../../context/AuthContext';

export default function SignInScreen() {
  const router = useRouter();
  const { login, savedOrgCode } = useAuth();

  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [orgCode, setOrgCode] = useState(savedOrgCode || '');
  const [showOrgField, setShowOrgField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'en' | 'my' | 'th'>('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (savedOrgCode && !orgCode) {
      setOrgCode(savedOrgCode);
    }
  }, [savedOrgCode]);

  const handleSignIn = async () => {
    if (!code.trim()) {
      setErrorMessage('Please enter your employee code or identifier.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await login(code, password, orgCode.trim() || undefined);
      if (result.mustChangePassword) {
        router.replace('/change-password');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const msg = err.message || 'Sign in failed. Please check your credentials or network.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerDecorCircle1} />
            <View style={styles.bannerDecorCircle2} />
            <View style={styles.brandRow}>
              <HrGoLogo width={48} height={48} />
              <View>
                <Text style={styles.brandTitle}>HRGo</Text>
                <Text style={styles.brandTagline}>Smarter HR, Happier Teams</Text>
              </View>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <View style={styles.headerTextCol}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in with the employee code your HR team gave you.
              </Text>
            </View>

            {/* Error Message Alert */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={18} color={Colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Employee ID Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employee ID or code</Text>
              <View style={styles.inputBox}>
                <Feather name="user" size={19} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={code}
                  onChangeText={setCode}
                  placeholder="e.g. EMP-001 or EMP-0142"
                  placeholderTextColor={Colors.textDisabled}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputBox}>
                <Feather name="lock" size={19} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.textDisabled}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Organization Code (Collapsible) */}
            {showOrgField ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Organization Code</Text>
                <View style={styles.inputBox}>
                  <Feather name="briefcase" size={19} color={Colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    value={orgCode}
                    onChangeText={setOrgCode}
                    placeholder="e.g. ORG-001"
                    placeholderTextColor={Colors.textDisabled}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.orgToggleBtn}
                onPress={() => setShowOrgField(true)}
              >
                <Text style={styles.orgToggleText}>
                  {orgCode ? `+ Organization code (${orgCode})` : '+ Enter organization code (optional)'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Remember Me & Help Row */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    'Need Help?',
                    'Sign in with the employee code or work email provided by your HR team. Contact your HR administrator if you forgot your credentials or need a password reset.'
                  )
                }
              >
                <Text style={styles.forgotText}>Need help?</Text>
              </TouchableOpacity>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.signInButton, isSubmitting && { opacity: 0.8 }]}
              onPress={handleSignIn}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.signInButtonText}>Sign in</Text>
              )}
            </TouchableOpacity>

            {/* Language Switcher */}
            <View style={styles.languageContainer}>
              <Text style={styles.languageLabel}>Language</Text>
              <View style={styles.langPillsRow}>
                {(['en', 'my', 'th'] as const).map((lang) => {
                  const labels = { en: 'English', my: 'မြန်မာ', th: 'ไทย' };
                  const isSelected = selectedLang === lang;
                  return (
                    <TouchableOpacity
                      key={lang}
                      style={[
                        styles.langPill,
                        isSelected && styles.langPillActive,
                      ]}
                      onPress={() => setSelectedLang(lang)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.langPillText,
                          isSelected && styles.langPillTextActive,
                        ]}
                      >
                        {labels[lang]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  banner: {
    height: 200,
    backgroundColor: Colors.primary,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  bannerDecorCircle1: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(23, 135, 245, 0.25)',
  },
  bannerDecorCircle2: {
    position: 'absolute',
    bottom: -60,
    right: 60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    zIndex: 1,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    gap: 18,
  },
  headerTextCol: {
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
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
    color: Colors.error,
    fontWeight: '500',
    lineHeight: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSubtle,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 14,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
  },
  orgToggleBtn: {
    paddingVertical: 4,
  },
  orgToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.8,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  rememberText: {
    fontSize: 13,
    color: Colors.textSubtle,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
  },
  signInButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  languageContainer: {
    alignItems: 'center',
    marginTop: 14,
    gap: 8,
  },
  languageLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textDisabled,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  langPillActive: {
    backgroundColor: Colors.accentLight,
    borderColor: Colors.accent,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  langPillTextActive: {
    color: Colors.accentDark,
    fontWeight: '600',
  },
});
