import { supabase } from '@/lib/supabase';

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


export type FinancialProfile = {
  id: string;
  userId: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  creditScoreRange: string;
  employmentType: string;
  hasEmergencyFund: boolean;
  emergencyFundMonths: number;
  affordabilityScore: number | null;
  currency: string;
};

export type HealthSnapshot = {
  id: string;
  capturedAt: string;
  affordabilityScore: number;
  dtiRatio: number;
  totalOutstanding: number;
};

export async function getProfile(): Promise<FinancialProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('FinancialProfile')
    .select('*')
    .eq('userId', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Failed to fetch profile:', error);
    return null;
  }
  return data as FinancialProfile;
}

export async function updateProfile(input: {
  monthlyIncome?: number;
  monthlyExpenses?: number;
  creditScoreRange?: string;
  employmentType?: string;
  hasEmergencyFund?: boolean;
  emergencyFundMonths?: number;
  currency?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('FinancialProfile')
    .upsert({
      id: uuidv4(),
      userId: user.id,
      monthlyIncome: input.monthlyIncome ?? 0,
      monthlyExpenses: input.monthlyExpenses ?? 0,
      creditScoreRange: input.creditScoreRange ?? '700-749',
      employmentType: input.employmentType ?? 'SALARIED',
      hasEmergencyFund: input.hasEmergencyFund ?? false,
      emergencyFundMonths: input.emergencyFundMonths ?? 0,
      currency: input.currency ?? 'INR',
      updatedAt: new Date().toISOString(),
    }, { onConflict: 'userId' });

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}

export async function getHealthSnapshots(): Promise<HealthSnapshot[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('HealthSnapshot')
    .select('id, capturedAt, affordabilityScore, dtiRatio, totalOutstanding')
    .eq('userId', user.id)
    .order('capturedAt', { ascending: true })
    .limit(12);

  if (error) {
    console.error('Failed to fetch snapshots:', error);
    return [];
  }
  return (data as HealthSnapshot[]) ?? [];
}

export async function getUserData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('User')
    .select('id, name, email, onboardingStep, onboardingCompleted')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
  return data;
}

export async function updateUserName(name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('User')
    .update({ 
      name,
      updatedAt: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}
