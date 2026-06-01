import { useState, useEffect, useCallback } from 'react';
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

    let initialCacheLoaded = false;
    if (!isRefresh) {
      try {
        const cachedData = await reader();
        const syncTime = await getLastSyncTime();
        if (cachedData && syncTime) {
          setData(cachedData);
          initialCacheLoaded = true;
          setLastSync(syncTime);
          setLoading(false);
        }
      } catch (e) {
        console.error('Failed to pre-load cached data', e);
      }
    }

    try {
      if (isOnline) {
        // Fetch online data
        const onlineData = await fetcher();
        setData(onlineData);
        // Cache it offline
        await cacher(onlineData);
      } else {
        // Fetch offline data
        const cachedData = await reader();
        setData(cachedData);
      }
      
      const syncTime = await getLastSyncTime();
      setLastSync(syncTime);
    } catch (e) {
      console.error('Failed to load offline-enabled data', e);
      // Fallback to cache if error occurs on fetch
      if (!initialCacheLoaded) {
        try {
          const cachedData = await reader();
          setData(cachedData);
        } catch (cacheErr) {
          console.error('Failed to load from cache fallback', cacheErr);
        }
      }
      // Ensure we still load the last sync time when offline/error
      try {
        const syncTime = await getLastSyncTime();
        setLastSync(syncTime);
      } catch (syncErr) {
        console.error('Failed to get sync time in catch block', syncErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline, fetcher, cacher, reader]);

  useEffect(() => {
    loadData();
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
