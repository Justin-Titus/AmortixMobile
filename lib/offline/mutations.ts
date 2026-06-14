import AsyncStorage from '@react-native-async-storage/async-storage';
import { recordPayment, PaymentInput } from '@/services/loans';

const OFFLINE_MUTATIONS_KEY = 'amortix_offline_mutations';

export type OfflineMutation = {
  id: string;
  type: 'RECORD_PAYMENT';
  payload: {
    loanId: string;
    input: PaymentInput;
  };
  timestamp: string;
};

export async function getOfflineMutations(): Promise<OfflineMutation[]> {
  try {
    const json = await AsyncStorage.getItem(OFFLINE_MUTATIONS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (err) {
    console.error('Failed to get offline mutations:', err);
    return [];
  }
}

export async function queueOfflineMutation(mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) {
  try {
    const currentQueue = await getOfflineMutations();
    const newMutation: OfflineMutation = {
      ...mutation,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify([...currentQueue, newMutation]));
    return newMutation;
  } catch (err) {
    console.error('Failed to queue offline mutation:', err);
  }
}

export async function clearOfflineMutation(id: string) {
  try {
    const currentQueue = await getOfflineMutations();
    const filtered = currentQueue.filter((m) => m.id !== id);
    await AsyncStorage.setItem(OFFLINE_MUTATIONS_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to clear offline mutation:', err);
  }
}

export async function processOfflineMutations() {
  const mutations = await getOfflineMutations();
  if (mutations.length === 0) return;

  console.log(`Processing ${mutations.length} offline mutations...`);

  for (const mutation of mutations) {
    try {
      if (mutation.type === 'RECORD_PAYMENT') {
        const result = await recordPayment(mutation.payload.loanId, mutation.payload.input);
        if (!result.error) {
          await clearOfflineMutation(mutation.id);
        } else {
          console.error(`Failed to process mutation ${mutation.id}:`, result.error);
        }
      }
    } catch (err) {
      console.error(`Error processing mutation ${mutation.id}:`, err);
    }
  }
}
