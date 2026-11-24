import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { HrGoLogo } from '../../components/HrGoLogo';

export default function SignInScreen() {
  const router = useRouter();
  const [code, setCode] = useState('EMP-0142');
  const [password, setPassword] = useState('password1');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [selectedLang, setSelectedLang] = useState<'en' | 'my' | 'th'>('en');

  const handleSignIn = () => {
    router.replace('/(tabs)');
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

            {/* Employee ID Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Employee ID or code</Text>
              <View style={styles.inputBox}>
                <Feather name="user" size={19} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={code}
                  onChangeText={setCode}
                  placeholder="e.g. EMP-0142"
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

            {/* Remember Me */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
              <Text style={styles.rememberText}>Keep me signed in on this device</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.signInButton}
              onPress={handleSignIn}
              activeOpacity={0.8}
            >
              <Text style={styles.signInButtonText}>Sign in</Text>
            </TouchableOpacity>

            {/* Forgot Password Hint */}
            <Text style={styles.forgotHint}>
              Forgot your password? Ask your HR admin to reset it.
            </Text>

            {/* Language Selector Pills */}
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[styles.langPill, selectedLang === 'en' && styles.langPillActive]}
                onPress={() => setSelectedLang('en')}
                activeOpacity={0.7}
              >
                <Text style={[styles.langText, selectedLang === 'en' && styles.langTextActive]}>
                  English
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.langPill, selectedLang === 'my' && styles.langPillActive]}
                onPress={() => setSelectedLang('my')}
                activeOpacity={0.7}
              >
                <Text style={[styles.langText, selectedLang === 'my' && styles.langTextActive]}>
                  မြန်မာ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.langPill, selectedLang === 'th' && styles.langPillActive]}
                onPress={() => setSelectedLang('th')}
                activeOpacity={0.7}
              >
                <Text style={[styles.langText, selectedLang === 'th' && styles.langTextActive]}>
                  ไทย
                </Text>
              </TouchableOpacity>
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
    height: 190,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  bannerDecorCircle1: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.accent,
    opacity: 0.25,
  },
  bannerDecorCircle2: {
    position: 'absolute',
    right: 50,
    bottom: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    opacity: 0.08,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 13,
    color: '#BFD3F5',
    marginTop: 2,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    gap: 18,
  },
  headerTextCol: {
    gap: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textNavy,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
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
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.inputBg,
    flexDirection: 'row',
    alignItems: 'center',
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxChecked: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  rememberText: {
    fontSize: 13,
    color: Colors.textSubtle,
  },
  signInButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  signInButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  forgotHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  langRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 16,
  },
  langPill: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langPillActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  langText: {
    fontSize: 13,
    color: Colors.textSubtle,
    fontWeight: '500',
  },
  langTextActive: {
    color: Colors.textNavy,
    fontWeight: '600',
  },
});
