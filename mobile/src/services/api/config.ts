import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Resolves the backend API base URL.
 * Automatically adapts for Android Emulator (10.0.2.2), iOS Simulator (localhost),
 * and physical devices via Expo host debugger IP.
 */
function getDefaultApiBaseUrl(): string {
  // 1. Explicit environment variable if provided
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. Physical device connected via Expo development server
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8080/api/v1`;
    }
  }

  // 3. Android emulator loopback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8080/api/v1';
  }

  // 4. iOS simulator & Web default
  return 'http://localhost:8080/api/v1';
}

export const API_CONFIG = {
  baseUrl: getDefaultApiBaseUrl(),
  timeoutMs: 15000,
};
