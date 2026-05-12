import { supabase } from '@/lib/supabase';

// Utility to generate UUIDs for database inserts
// This fixes the 'null value in column "id"' error when the DB lacks auto-generation defaults
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}


export type LoanRecord = {
  id: string;
  userId: string;
  name: string;
  loanType: string;
  principal: number;
  outstandingBalance: number;
  interestRate: number;
  rateType: 'FIXED' | 'FLOATING';
  tenureMonths: number;
  emiAmount: number;
  startDate: string;
  nextEmiDate: string | null;
  lender: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  payments?: PaymentRecord[];
};

export type PaymentRecord = {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: string;
  type: 'EMI' | 'PREPAYMENT';
  notes: string | null;
  createdAt: string;
};

export type LoanInput = {
  name: string;
  loanType: string;
  principal: number;
  outstandingBalance: number;
  interestRate: number;
  rateType: 'FIXED' | 'FLOATING';
  tenureMonths: number;
  emiAmount: number;
  startDate: string;
  lender?: string | null;
  notes?: string | null;
};

export type PaymentInput = {
  amount: number;
  paymentDate: string;
  type: 'EMI' | 'PREPAYMENT';
  notes?: string;
};

export async function getLoans(): Promise<LoanRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('Loan')
    .select('*')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Failed to fetch loans:', error);
    return [];
  }
  return (data as LoanRecord[]) ?? [];
}

export async function getLoan(id: string): Promise<LoanRecord | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('Loan')
    .select('*, payments:Payment(*)')
    .eq('id', id)
    .eq('userId', user.id)
    .order('paymentDate', { foreignTable: 'Payment', ascending: false })
    .single();

  if (error) {
    console.error('Failed to fetch loan:', error);
    return null;
  }
  return data as LoanRecord;
}

export async function createLoan(input: LoanInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be logged in to add a loan.' };

  const now = new Date().toISOString();
  const { error } = await supabase.from('Loan').insert({
    id: uuidv4(),
    userId: user.id,
    name: input.name,
    loanType: input.loanType,
    principal: input.principal,
    outstandingBalance: input.outstandingBalance,
    interestRate: input.interestRate,
    rateType: input.rateType,
    tenureMonths: input.tenureMonths,
    emiAmount: input.emiAmount,
    startDate: input.startDate,
    lender: input.lender ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  if (error) {
    console.error('Failed to create loan:', error);
    return { error: error.message };
  }
  return { success: true };
}

export async function updateLoan(id: string, input: LoanInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be logged in to update a loan.' };

  const { error } = await supabase
    .from('Loan')
    .update({
      name: input.name,
      loanType: input.loanType,
      principal: input.principal,
      outstandingBalance: input.outstandingBalance,
      interestRate: input.interestRate,
      rateType: input.rateType,
      tenureMonths: input.tenureMonths,
      emiAmount: input.emiAmount,
      startDate: input.startDate,
      lender: input.lender ?? null,
      notes: input.notes ?? null,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('userId', user.id);

  if (error) {
    console.error('Failed to update loan:', error);
    return { error: error.message };
  }
  return { success: true };
}

export async function deleteLoan(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be logged in to delete a loan.' };

  const { error } = await supabase
    .from('Loan')
    .delete()
    .eq('id', id)
    .eq('userId', user.id);

  if (error) {
    console.error('Failed to delete loan:', error);
    return { error: error.message };
  }
  return { success: true };
}

export async function recordPayment(loanId: string, input: PaymentInput) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be logged in to record a payment.' };

  // Get current loan
  const { data: loan, error: fetchError } = await supabase
    .from('Loan')
    .select('outstandingBalance, nextEmiDate')
    .eq('id', loanId)
    .eq('userId', user.id)
    .single();

  if (fetchError || !loan) {
    return { error: 'Loan not found.' };
  }

  const newBalance = Math.max(0, loan.outstandingBalance - input.amount);

  // Create payment record
  const now = new Date().toISOString();
  const { error: paymentError } = await supabase.from('Payment').insert({
    id: uuidv4(),
    loanId,
    amount: input.amount,
    paymentDate: input.paymentDate,
    type: input.type,
    notes: input.notes || null,
    createdAt: now,
  });

  if (paymentError) {
    return { error: paymentError.message };
  }

  // Update loan balance
  const { error: updateError } = await supabase
    .from('Loan')
    .update({ 
      outstandingBalance: newBalance,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', loanId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}

export async function getPayments(loanId: string) {
  const { data, error } = await supabase
    .from('Payment')
    .select('*')
    .eq('loanId', loanId)
    .order('paymentDate', { ascending: false });

  if (error) {
    console.error('Failed to fetch payments:', error);
    return [];
  }
  return data ?? [];
}

export async function getLoansWithPayments(): Promise<LoanRecord[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('Loan')
    .select('*, payments:Payment(*)')
    .eq('userId', user.id);

  if (error) {
    console.error('Failed to fetch loans with payments:', error);
    return [];
  }
  return (data as LoanRecord[]) ?? [];
}
