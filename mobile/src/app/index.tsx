import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function Index() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return <Redirect href={isLoggedIn ? '/(tabs)' : '/(auth)/sign-in'} />;
}
