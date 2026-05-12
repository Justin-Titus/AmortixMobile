/**
 * EMI calculation and currency formatting utilities
 * Ported from web app lib/calculations/emi.ts
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
  if (amount === 0) return '₹0';
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${Math.round(amount / 100000)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}K`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths;
  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

export function calculateTotalInterest(
  principal: number,
  emiAmount: number,
  tenureMonths: number
): number {
  return emiAmount * tenureMonths - principal;
}

export function calculateTenure(principal: number, annualRate: number, emiAmount: number): number {
  if (annualRate === 0) return Math.round(principal / emiAmount);
  const monthlyRate = annualRate / 12 / 100;
  
  // Basic sanity check: EMI must be greater than monthly interest
  if (emiAmount <= principal * monthlyRate) return 0;

  const tenure = Math.log(emiAmount / (emiAmount - principal * monthlyRate)) / Math.log(1 + monthlyRate);
  return Math.round(tenure);
}

