import { useEffect, useState } from 'react';
import { AppState, DeviceEventEmitter } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getLoansWithPayments } from '@/services/loans';
import { getProfile, getHealthSnapshots, getUserData } from '@/services/profile';
import {
  saveOfflineLoansWithPayments,
  saveOfflineLoans,
  saveOfflineProfile,
  saveOfflineSnapshots,
  saveOfflineUserData,
} from '@/lib/offline/cache';

export function useAutoSync(intervalMs = 5000) {
  const { session } = useAuth();
  const [lastSync, setLastSync] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkSync = async () => {
      if (!session?.user || AppState.currentState !== 'active') return;

      try {
        const userId = session.user.id;
        
        // Fetch max updatedAt from Loan
        const { data: loans } = await supabase
          .from('Loan')
          .select('updatedAt')
          .eq('userId', userId)
          .order('updatedAt', { ascending: false })
          .limit(1);

        const { data: userRecord } = await supabase
          .from('User')
          .select('updatedAt')
          .eq('id', userId)
          .single();

        const dates = [
          userRecord?.updatedAt,
          loans?.[0]?.updatedAt,
        ].filter(Boolean).map(d => new Date(d as string).getTime());

        const maxDate = dates.length ? Math.max(...dates) : Date.now();

        if (lastSync === null) {
          // First load: establish baseline
          setLastSync(maxDate);
        } else if (maxDate > lastSync) {
          setLastSync(maxDate);
          try {
            // Fetch new data
            const [newLoans, profile, snapshots, userData] = await Promise.all([
              getLoansWithPayments(),
              getProfile(),
              getHealthSnapshots(),
              getUserData(),
            ]);
            // Update SQLite Cache
            if (newLoans) {
              await saveOfflineLoansWithPayments(newLoans);
              await saveOfflineLoans(newLoans);
            }
            if (profile) await saveOfflineProfile(profile);
            if (snapshots) await saveOfflineSnapshots(snapshots);
            if (userData) await saveOfflineUserData(userData);
            
            // Notify useOfflineData hooks to reload from cache
            DeviceEventEmitter.emit('global_sync_complete');
            
          } catch (err) {
            console.error('Failed to refresh data', err);
          }
        }
      } catch (e) {
        console.error('AutoSync error:', e);
      }
    };

    interval = setInterval(checkSync, intervalMs);

    return () => clearInterval(interval);
  }, [session, lastSync, intervalMs]);
}
