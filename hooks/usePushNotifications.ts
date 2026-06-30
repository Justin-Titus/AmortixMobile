import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

// Configure notification behavior for when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') {
      return;
    }

    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    try {
      // Get the Expo Push Token using Project ID from config
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      if (!projectId) {
        console.warn('EAS Project ID not found. Push notifications token registration skipped.');
        return;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      console.log('Expo Push Token generated successfully:', token);
      setExpoPushToken(token);
    } catch (e) {
      console.error('Error during push token registration:', e);
    }
  }

  // 1. Initial register call on mount
  useEffect(() => {
    registerForPushNotificationsAsync();

    // Listen for notification arrival when the app is in the foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for interactions (tap on notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('User interacted with notification:', response);
      }
    );

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // 2. Save token to Supabase User Profile whenever token or auth state changes
  useEffect(() => {
    if (!expoPushToken) return;

    const saveToken = async (userId: string) => {
      const { error } = await supabase
        .from('User')
        .update({ expoPushToken: expoPushToken })
        .eq('id', userId);
      if (error) {
        console.error('Failed to register push token in database:', error);
      } else {
        console.log('Registered push token in database successfully!');
      }
    };

    // Try to save token immediately if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        saveToken(session.user.id);
      }
    });

    // Listen for auth changes to save token when user logs in later
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        saveToken(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [expoPushToken]);

  return { expoPushToken, notification };
}
