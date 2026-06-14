import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import { getLoansWithPayments } from '@/services/loans';
import { getProfile, getHealthSnapshots, getUserData } from '@/services/profile';
import {
  saveOfflineLoansWithPayments,
  saveOfflineProfile,
  saveOfflineSnapshots,
  saveOfflineUserData,
  saveOfflineLoans, // also save simple loans to fulfill all cache needs
} from '@/lib/offline/cache';

import { processOfflineMutations } from '@/lib/offline/mutations';

export function useGlobalSync() {
  const { session } = useAuth();
  const isOnline = useNetworkStatus();

  useEffect(() => {
    let active = true;

    async function syncData() {
      // Only sync if logged in and connected
      if (!session || !isOnline) return;

      try {
        // Process offline mutations first
        await processOfflineMutations();

        const [loans, profile, snapshots, user] = await Promise.all([
          getLoansWithPayments(),
          getProfile(),
          getHealthSnapshots(),
          getUserData(),
        ]);

        if (active) {
          if (loans) {
            await saveOfflineLoansWithPayments(loans);
            await saveOfflineLoans(loans); // Map to the basic loans cache as well
          }
          if (profile) await saveOfflineProfile(profile);
          if (snapshots) await saveOfflineSnapshots(snapshots);
          if (user) await saveOfflineUserData(user);
        }
      } catch (err) {
        console.error('Background global sync failed:', err);
      }
    }

    syncData();

    return () => {
      active = false;
    };
  }, [session, isOnline]);
}
