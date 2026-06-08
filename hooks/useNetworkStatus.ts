import { useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true); // Assume online initially to prevent flashing

  useEffect(() => {
    let active = true;

    const checkStatus = async () => {
      let id: ReturnType<typeof setTimeout> | undefined;
      try {
        const controller = new AbortController();
        id = setTimeout(() => controller.abort(), 10000); // 10s timeout for weak networks

        // Use a simple, lightweight request to check internet connection
        await fetch('https://clients3.google.com/generate_204', {
          method: 'GET',
          signal: controller.signal,
          headers: { 'Cache-Control': 'no-cache' }
        });

        clearTimeout(id);
        if (active) setIsOnline(true);
      } catch (e) {
        clearTimeout(id);
        if (active) setIsOnline(false);
      }
    };

    // Check immediately
    checkStatus();

    // Check every 10 seconds
    const interval = setInterval(checkStatus, 10000);

    // Check on app state changes (e.g. app comes to foreground)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkStatus();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      active = false;
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return isOnline;
}
