
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { AppLoading } from '@/components/ui/AppLoading';

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoading />;
  }

  // If already authenticated, redirect to dashboard
  if (session) {
    return <Redirect href="/(drawer)/(tabs)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'fade',
      }}
    />
  );
}
