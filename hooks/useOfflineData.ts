import { useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useNetworkStatus } from './useNetworkStatus';
import { getLastSyncTime } from '@/lib/offline/cache';

interface UseOfflineDataOptions<T> {
  fetcher: () => Promise<T>;
  cacher: (data: T) => Promise<void>;
  reader: () => Promise<T>;
}

export function useOfflineData<T>({ fetcher, cacher, reader }: UseOfflineDataOptions<T>) {
  const isOnline = useNetworkStatus();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    // --- Step 1: Always load from cache first ---
    // This guarantees data is shown immediately even while a network
    // request is in flight, and is the sole source of truth when offline.
    try {
      const cachedData = await reader();
      const syncTime = await getLastSyncTime();
      // Only surface cached data if we actually have a prior sync timestamp,
      // which proves data was saved previously (not a first-run empty state).
      if (syncTime) {
        setData(cachedData);
        setLastSync(syncTime);
        setLoading(false); // Set loading to false immediately to render cached data while fetching in background
      }
    } catch (e) {
      console.error('Failed to pre-load cached data', e);
    }

    // --- Step 2: Fetch live data only when online ---
    if (isOnline) {
      try {
        const onlineData = await fetcher();
        setData(onlineData);
        await cacher(onlineData);
        const syncTime = await getLastSyncTime();
        setLastSync(syncTime);
      } catch (e) {
        console.error('Failed to fetch online data, falling back to cache', e);
        // Cache is already set in Step 1, so no extra action needed.
      }
    }

    setLoading(false);
    setRefreshing(false);
  }, [isOnline, fetcher, cacher, reader]);

  useEffect(() => {
    loadData();
    const subscription = DeviceEventEmitter.addListener('global_sync_complete', () => {
      loadData(true);
    });
    return () => subscription.remove();
  }, [loadData]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return {
    data,
    loading,
    refreshing,
    isOffline: !isOnline,
    lastSync,
    refresh,
  };
}
