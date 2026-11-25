import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ApiError } from '../services/api/client';
import { authApi } from '../services/api/authApi';
import { profileApi } from '../services/api/profileApi';
import { tokenStorage } from '../services/storage/tokenStorage';
import { MobileUserProfile, MobileDeviceResponse } from '../services/api/types';

const USER_KEY = '@hrgo_user_profile';
const DEVICE_ID_KEY = '@hrgo_device_identifier';
const ORG_CODE_KEY = '@hrgo_saved_org_code';
const MUST_CHANGE_PASSWORD_KEY = '@hrgo_must_change_password';

interface AuthContextType {
  token: string | null;
  user: MobileUserProfile | null;
  device: MobileDeviceResponse | null;
  deviceIdentifier: string;
  savedOrgCode: string;
  mustChangePassword: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (
    identifier: string,
    password: string,
    organizationCode?: string
  ) => Promise<{ mustChangePassword: boolean }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearMustChangePassword: () => Promise<void>;
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
  const [savedOrgCode, setSavedOrgCodeState] = useState<string>('');
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setDevice(null);
    setMustChangePassword(false);
    apiClient.setToken(null);
    await tokenStorage.removeToken();
    await Promise.all([
      AsyncStorage.removeItem(USER_KEY),
      AsyncStorage.removeItem(MUST_CHANGE_PASSWORD_KEY),
    ]);
  }, []);

  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  // Initialize session and device id on startup
  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      void logoutRef.current();
    });

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
        const storedToken = await tokenStorage.getToken();
        const storedUser = await AsyncStorage.getItem(USER_KEY);
        const storedMustChange = await AsyncStorage.getItem(MUST_CHANGE_PASSWORD_KEY);
        setMustChangePassword(storedMustChange === 'true');

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
          } catch (profileErr) {
            if (profileErr instanceof ApiError && profileErr.status === 401) {
              await logoutRef.current();
            }
          }
        }
      } catch (err) {
        console.warn('Auth bootstrap failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
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

      const forcePasswordChange = Boolean(res.mustChangePassword);
      setToken(res.accessToken);
      setUser(res.user);
      setDevice(res.device);
      setMustChangePassword(forcePasswordChange);
      apiClient.setToken(res.accessToken);

      await tokenStorage.setToken(res.accessToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(res.user));
      await AsyncStorage.setItem(
        MUST_CHANGE_PASSWORD_KEY,
        forcePasswordChange ? 'true' : 'false'
      );

      if (organizationCode?.trim()) {
        const cleanOrg = organizationCode.trim();
        await AsyncStorage.setItem(ORG_CODE_KEY, cleanOrg);
        setSavedOrgCodeState(cleanOrg);
      }

      return { mustChangePassword: forcePasswordChange };
    } finally {
      setIsLoading(false);
    }
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

  const clearMustChangePassword = async () => {
    setMustChangePassword(false);
    await AsyncStorage.setItem(MUST_CHANGE_PASSWORD_KEY, 'false');
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
        mustChangePassword,
        isLoading,
        isLoggedIn: Boolean(token),
        login,
        logout,
        refreshProfile,
        clearMustChangePassword,
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
