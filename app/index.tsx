import React, { useState, useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLoading } from '@/components/ui/AppLoading';

export default function Index() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [isWelcomeLoading, setIsWelcomeLoading] = useState(true);
  const [isMinTimeElapsed, setIsMinTimeElapsed] = useState(false);

  useEffect(() => {
    async function checkWelcome() {
      try {
        const value = await AsyncStorage.getItem('amortix_has_seen_welcome');
        setHasSeenWelcome(value === 'true');
      } catch (err) {
        setHasSeenWelcome(false);
      } finally {
        setIsWelcomeLoading(false);
      }
    }
    checkWelcome();

    // Enforce a minimum display time of 1.8 seconds to showcase the premium animations
    const timer = setTimeout(() => {
      setIsMinTimeElapsed(true);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  if (isAuthLoading || isWelcomeLoading || !isMinTimeElapsed) {
    return <AppLoading />;
  }

  if (session) {
    return <Redirect href="/(drawer)/(tabs)/dashboard" />;
  }

  if (hasSeenWelcome) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
