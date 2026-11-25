import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/AuthContext';

function AuthNavigationGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isLoggedIn, mustChangePassword } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const rootSegment = segments[0];

    if (!isLoggedIn && rootSegment !== '(auth)') {
      router.replace('/(auth)/sign-in');
      return;
    }

    if (isLoggedIn && mustChangePassword && rootSegment !== 'change-password') {
      router.replace('/change-password');
      return;
    }

    if (isLoggedIn && !mustChangePassword && rootSegment === '(auth)') {
      router.replace('/(tabs)');
    }
  }, [isLoading, isLoggedIn, mustChangePassword, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthNavigationGuard>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="offline-sync" options={{ headerShown: false }} />
            <Stack.Screen name="attendance-detail" options={{ headerShown: false }} />
            <Stack.Screen name="correction-request" options={{ headerShown: false }} />
            <Stack.Screen name="my-requests" options={{ headerShown: false }} />
            <Stack.Screen name="change-password" options={{ headerShown: false }} />
            <Stack.Screen name="overtime" options={{ headerShown: false }} />
            <Stack.Screen name="new-overtime" options={{ headerShown: false }} />
            <Stack.Screen name="leave" options={{ headerShown: false }} />
            <Stack.Screen name="new-leave" options={{ headerShown: false }} />
          </Stack>
        </AuthNavigationGuard>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
