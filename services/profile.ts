import { supabase } from '@/lib/supabase';


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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('FinancialProfile')
    .select('*')
    .eq('userId', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Failed to fetch profile:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { error: 'Unauthorized' };

  // NOTE: id is intentionally omitted from the upsert payload.
  // On INSERT (no existing profile), the DB default generates a UUID.
  // On UPDATE (onConflict: 'userId'), Supabase preserves the existing id.
  // Previously passing id: uuidv4() would overwrite the primary key on every save.
  const { error } = await supabase
    .from('FinancialProfile')
    .upsert({
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from('HealthSnapshot')
    .select('id, capturedAt, affordabilityScore, dtiRatio, totalOutstanding')
    .eq('userId', user.id)
    .order('capturedAt', { ascending: true })
    .limit(12);

  if (error) {
    console.error('Failed to fetch snapshots:', error);
    throw new Error(`Failed to fetch snapshots: ${error.message}`);
  }
  return (data as HealthSnapshot[]) ?? [];
}

export async function getUserData() {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from('User')
    .select('id, name, email, onboardingStep, onboardingCompleted')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Failed to fetch user data:', error);
    throw new Error(`Failed to fetch user data: ${error.message}`);
  }
  return data;
}

export async function updateUserName(name: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
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
