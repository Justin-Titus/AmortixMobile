/**
 * Amortization Schedule Generator
 */

export interface ScheduleEntry {
  month: number;
  emi: number;
  principalComponent: number;
  interestComponent: number;
  outstandingBalance: number;
}

/**
 * Generate a month-by-month amortization schedule.
 * Supports optional extra payment per month (prepayment).
 */
export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  extraPayment: number = 0
): ScheduleEntry[] {
  if (principal <= 0 || tenureMonths <= 0 || annualRate < 0 || extraPayment < 0) return [];

  const r = annualRate / 12 / 100;
  let emi: number;

  if (annualRate === 0) {
    emi = principal / tenureMonths;
  } else {
    emi =
      (principal * r * Math.pow(1 + r, tenureMonths)) /
      (Math.pow(1 + r, tenureMonths) - 1);
  }

  const schedule: ScheduleEntry[] = [];
  let outstanding = principal;

  for (let month = 1; month <= tenureMonths && outstanding > 0.5; month++) {
    const interestComponent = outstanding * r;
    let principalComponent = emi - interestComponent + extraPayment;

    // Cap principal component at outstanding balance
    if (principalComponent > outstanding) {
      principalComponent = outstanding;
    }

    outstanding -= principalComponent;

    // Prevent floating point issues
    if (outstanding < 0.5) outstanding = 0;

    schedule.push({
      month,
      emi: principalComponent + interestComponent,
      principalComponent: Math.round(principalComponent * 100) / 100,
      interestComponent: Math.round(interestComponent * 100) / 100,
      outstandingBalance: Math.round(outstanding * 100) / 100,
    });

    if (outstanding <= 0) break;
  }

  return schedule;
}

/**
 * Get summary stats from an amortization schedule
 */
export function getScheduleSummary(schedule: ScheduleEntry[]) {
  const totalInterest = schedule.reduce(
    (sum, entry) => sum + entry.interestComponent,
    0
  );
  const totalPaid = schedule.reduce((sum, entry) => sum + entry.emi, 0);
  const months = schedule.length;
  const lastEntry = schedule[schedule.length - 1];

  return {
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    months,
    finalBalance: lastEntry?.outstandingBalance ?? 0,
  };
}
