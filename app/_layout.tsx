import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet, Text } from 'react-native';

// Set global default font family for standard React Native Text components to prevent phone's system font leakage
if ((Text as any).defaultProps == null) {
  (Text as any).defaultProps = {};
}
(Text as any).defaultProps.style = {
  fontFamily: 'Manrope',
};
import { 
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold 
} from '@expo-google-fonts/space-grotesk';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium
} from '@expo-google-fonts/ibm-plex-mono';

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useGlobalSync } from '@/hooks/useGlobalSync';
import { useAutoSync } from '@/hooks/useAutoSync';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Prevent splash from hiding until we're ready
SplashScreen.preventAutoHideAsync();

function NotificationInitializer() {
  usePushNotifications();
  return null;
}

function GlobalSyncInitializer() {
  useGlobalSync();
  return null;
}

function AutoSyncInitializer() {
  useAutoSync(5000);
  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'SpaceGrotesk': SpaceGrotesk_400Regular,
    'SpaceGrotesk-Medium': SpaceGrotesk_500Medium,
    'SpaceGrotesk-SemiBold': SpaceGrotesk_600SemiBold,
    'SpaceGrotesk-Bold': SpaceGrotesk_700Bold,
    'Manrope': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
    'IBMPlexMono': IBMPlexMono_400Regular,
    'IBMPlexMono-Medium': IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <AuthProvider>
            <NotificationInitializer />
            <GlobalSyncInitializer />
            <AutoSyncInitializer />
            <StatusBar style="dark" />
            <Stack screenOptions={{ 
              headerShown: false,
              headerTitleStyle: {
                fontFamily: 'SpaceGrotesk-SemiBold',
                fontSize: 16,
              },
              headerTintColor: '#0d1b2f',
            }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(drawer)" />
              <Stack.Screen name="terms" options={{ headerShown: true, title: 'Terms of Service' }} />
              <Stack.Screen name="privacy" options={{ headerShown: true, title: 'Privacy Policy' }} />
              <Stack.Screen
                name="notifications"
                options={{
                  presentation: 'modal',
                  headerShown: true,
                  headerTitle: 'Notifications',
                }}
              />
            </Stack>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
