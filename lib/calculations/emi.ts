/**
 * EMI Calculation Engine
 * Standard reducing balance EMI formula
 */

import { formatCurrency, formatINR, formatNumber } from "./currency";

// Re-export currency helpers for backward compatibility
export { formatCurrency, formatINR, formatNumber };

/** Calculate monthly EMI using the standard reducing balance formula */
export function calculateEMI(
  principal: number,
  annualRate: number,
  tenureMonths: number
): number {
  if (
    principal <= 0 ||
    tenureMonths <= 0 ||
    annualRate < 0 ||
    !Number.isFinite(principal) ||
    !Number.isFinite(tenureMonths) ||
    !Number.isFinite(annualRate)
  ) {
    throw new Error(
      "Invalid input: principal must be >0, tenureMonths must be >0, annualRate must be >=0"
    );
  }

  const r = annualRate / 12 / 100;
  const n = tenureMonths;

  if (annualRate === 0) {
    return Math.round(principal / tenureMonths);
  }

  const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
}

/** Calculate total interest paid over the loan tenure */
export function totalInterest(
  emi: number,
  tenureMonths: number,
  principal: number
): number {
  return emi * tenureMonths - principal;
}

/** Calculate total amount paid (principal + interest) */
export function totalAmount(emi: number, tenureMonths: number): number {
  return emi * tenureMonths;
}

/** Backward-compatible function name from mobile */
export function calculateTotalInterest(
  principal: number,
  emiAmount: number,
  tenureMonths: number
): number {
  return emiAmount * tenureMonths - principal;
}

/** Calculate remaining tenure given principal, rate and desired EMI */
export function calculateTenure(
  principal: number,
  annualRate: number,
  emiAmount: number
): number {
  if (annualRate === 0) return Math.round(principal / emiAmount);
  const monthlyRate = annualRate / 12 / 100;
  
  // Basic sanity check: EMI must be greater than monthly interest
  if (emiAmount <= principal * monthlyRate) return 0;

  const tenure = Math.log(emiAmount / (emiAmount - principal * monthlyRate)) / Math.log(1 + monthlyRate);
  return Math.round(tenure);
}

/** Backward-compatible function from mobile */
export function formatCompactCurrency(amount: number, currencyCode: string = "INR"): string {
  return formatCurrency(amount, currencyCode, { compact: true });
}
