import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../services/api/client';
import { authApi } from '../services/api/authApi';
import { profileApi } from '../services/api/profileApi';
import { MobileUserProfile, MobileDeviceResponse } from '../services/api/types';

const TOKEN_KEY = '@hrgo_access_token';
const USER_KEY = '@hrgo_user_profile';
const DEVICE_ID_KEY = '@hrgo_device_identifier';
const ORG_CODE_KEY = '@hrgo_saved_org_code';

interface AuthContextType {
  token: string | null;
  user: MobileUserProfile | null;
  device: MobileDeviceResponse | null;
  deviceIdentifier: string;
  savedOrgCode: string;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (identifier: string, password: string, organizationCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSavedOrgCode: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MobileUserProfile | null>(null);
  const [device, setDevice] = useState<MobileDeviceResponse | null>(null);
  const [deviceIdentifier, setDeviceIdentifier] = useState<string>('');
  const [savedOrgCode, setSavedOrgCodeState] = useState<string>('ORG-001');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session and device id on startup
  useEffect(() => {
    const bootstrap = async () => {
      try {
        // 1. Resolve Device Identifier
        let devId = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (!devId) {
          devId = generateUUID();
          await AsyncStorage.setItem(DEVICE_ID_KEY, devId);
        }
        setDeviceIdentifier(devId);

        // 2. Resolve Saved Org Code
        const orgCode = await AsyncStorage.getItem(ORG_CODE_KEY);
        if (orgCode) {
          setSavedOrgCodeState(orgCode);
        }

        // 3. Resolve Stored Token & User
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken) {
          setToken(storedToken);
          apiClient.setToken(storedToken);

          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }

          // Try refreshing profile in background
          try {
            const freshProfile = await profileApi.getProfile();
            setUser(freshProfile);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshProfile));
          } catch {
            // Offline or token expired; keep cached user or allow offline operation
          }
        }
      } catch (err) {
        console.warn('Auth bootstrap failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();

    // Setup unauthorized interceptor
    apiClient.setOnUnauthorized(() => {
      logout();
    });
  }, []);

  const login = async (identifier: string, password: string, organizationCode?: string) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({
        identifier: identifier.trim(),
        password,
        deviceIdentifier,
        organizationCode: organizationCode ? organizationCode.trim() : undefined,
        deviceName: 'Mobile App Device',
      });

      setToken(res.accessToken);
      setUser(res.user);
      setDevice(res.device);
      apiClient.setToken(res.accessToken);

      await AsyncStorage.setItem(TOKEN_KEY, res.accessToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));

      if (organizationCode) {
        await AsyncStorage.setItem(ORG_CODE_KEY, organizationCode);
        setSavedOrgCodeState(organizationCode);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setDevice(null);
    apiClient.setToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const fresh = await profileApi.getProfile();
      setUser(fresh);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(fresh));
    } catch (err) {
      console.warn('Failed to refresh profile:', err);
    }
  };

  const setSavedOrgCode = async (code: string) => {
    setSavedOrgCodeState(code);
    await AsyncStorage.setItem(ORG_CODE_KEY, code);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        device,
        deviceIdentifier,
        savedOrgCode,
        isLoading,
        isLoggedIn: Boolean(token),
        login,
        logout,
        refreshProfile,
        setSavedOrgCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
