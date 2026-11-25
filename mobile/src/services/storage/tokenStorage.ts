import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// SecureStore keys can only contain alphanumeric characters, '.', '-', and '_'
const SECURE_TOKEN_KEY = 'hrgo_access_token';
const LEGACY_TOKEN_KEY = '@hrgo_access_token';

export const tokenStorage = {
  async getToken(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    }
    const token = await SecureStore.getItemAsync(SECURE_TOKEN_KEY);
    if (token) {
      // Remove any legacy unencrypted token if present.
      await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
      return token;
    }
    const legacy = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy) {
      await SecureStore.setItemAsync(SECURE_TOKEN_KEY, legacy);
      await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
    }
    return legacy;
  },

  async setToken(token: string): Promise<void> {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(LEGACY_TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(SECURE_TOKEN_KEY, token);
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
  },

  async removeToken(): Promise<void> {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY).catch(() => {});
    }
    await AsyncStorage.removeItem(LEGACY_TOKEN_KEY).catch(() => {});
  },
};
