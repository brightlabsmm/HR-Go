import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isLoggedIn, isLoading, mustChangePassword } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (mustChangePassword) {
    return <Redirect href="/change-password" />;
  }

  return <Redirect href="/(tabs)" />;
}
