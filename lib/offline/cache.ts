import AsyncStorage from '@react-native-async-storage/async-storage';
import { type LoanRecord } from '@/services/loans';
import { type FinancialProfile, type HealthSnapshot } from '@/services/profile';

const KEY_LOANS = '@amortix_cache_loans';
const KEY_PROFILE = '@amortix_cache_profile';
const KEY_SNAPSHOTS = '@amortix_cache_snapshots';
const KEY_USERDATA = '@amortix_cache_userdata';
const KEY_LAST_SYNC = '@amortix_cache_last_sync';
const KEY_LOANS_WITH_PAYMENTS = '@amortix_cache_loans_with_payments';

export async function saveOfflineLoans(loans: LoanRecord[]) {
  try {
    await AsyncStorage.setItem(KEY_LOANS, JSON.stringify(loans));
    await updateLastSync();
  } catch (e) {
    console.error('Failed to save offline loans', e);
  }
}

export async function getOfflineLoans(): Promise<LoanRecord[]> {
  try {
    const cached = await AsyncStorage.getItem(KEY_LOANS);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    console.error('Failed to read offline loans', e);
    return [];
  }
}

export async function saveOfflineLoansWithPayments(loans: LoanRecord[]) {
  try {
    await AsyncStorage.setItem(KEY_LOANS_WITH_PAYMENTS, JSON.stringify(loans));
    await updateLastSync();
  } catch (e) {
    console.error('Failed to save offline loans with payments', e);
  }
}

export async function getOfflineLoansWithPayments(): Promise<LoanRecord[]> {
  try {
    const cached = await AsyncStorage.getItem(KEY_LOANS_WITH_PAYMENTS);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    console.error('Failed to read offline loans with payments', e);
    return [];
  }
}

export async function saveOfflineProfile(profile: FinancialProfile) {
  try {
    await AsyncStorage.setItem(KEY_PROFILE, JSON.stringify(profile));
    await updateLastSync();
  } catch (e) {
    console.error('Failed to save offline profile', e);
  }
}

export async function getOfflineProfile(): Promise<FinancialProfile | null> {
  try {
    const cached = await AsyncStorage.getItem(KEY_PROFILE);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.error('Failed to read offline profile', e);
    return null;
  }
}

export async function saveOfflineSnapshots(snapshots: HealthSnapshot[]) {
  try {
    await AsyncStorage.setItem(KEY_SNAPSHOTS, JSON.stringify(snapshots));
    await updateLastSync();
  } catch (e) {
    console.error('Failed to save offline snapshots', e);
  }
}

export async function getOfflineSnapshots(): Promise<HealthSnapshot[]> {
  try {
    const cached = await AsyncStorage.getItem(KEY_SNAPSHOTS);
    return cached ? JSON.parse(cached) : [];
  } catch (e) {
    console.error('Failed to read offline snapshots', e);
    return [];
  }
}

export async function saveOfflineUserData(userData: any) {
  try {
    await AsyncStorage.setItem(KEY_USERDATA, JSON.stringify(userData));
    await updateLastSync();
  } catch (e) {
    console.error('Failed to save offline user data', e);
  }
}

export async function getOfflineUserData(): Promise<any> {
  try {
    const cached = await AsyncStorage.getItem(KEY_USERDATA);
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.error('Failed to read offline user data', e);
    return null;
  }
}

async function updateLastSync() {
  try {
    await AsyncStorage.setItem(KEY_LAST_SYNC, new Date().toISOString());
  } catch (e) {
    console.error('Failed to save last sync timestamp', e);
  }
}

export async function getLastSyncTime(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_LAST_SYNC);
  } catch (e) {
    return null;
  }
}

export async function clearOfflineCache() {
  try {
    await AsyncStorage.multiRemove([KEY_LOANS, KEY_PROFILE, KEY_SNAPSHOTS, KEY_USERDATA, KEY_LAST_SYNC, KEY_LOANS_WITH_PAYMENTS]);
  } catch (e) {
    console.error('Failed to clear offline cache', e);
  }
}

/**
 * Invalidates only the loans portion of the cache.
 * Call after createLoan / updateLoan / deleteLoan so the next offline
 * read does not serve stale data. Profile and snapshots are preserved.
 */
export async function clearCachedLoans() {
  try {
    await AsyncStorage.multiRemove([KEY_LOANS, KEY_LOANS_WITH_PAYMENTS]);
  } catch (e) {
    console.error('Failed to clear loan cache', e);
  }
}

