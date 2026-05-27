/**
 * Repayment Strategy Calculator
 * Avalanche, Snowball, and Hybrid strategies
 * Ported from web app lib/calculations/strategies.ts
 */

export interface LoanInput {
  id: string;
  name: string;
  outstanding: number;
  annualRate: number;
  emi: number;
}

export interface MonthlyAllocation {
  month: number;
  allocations: Array<{
    loanId: string;
    loanName: string;
    payment: number;
    principal: number;
    interest: number;
    remainingBalance: number;
  }>;
  totalDebtRemaining: number;
}

export interface StrategyResult {
  strategy: "avalanche" | "snowball" | "hybrid";
  totalInterestPaid: number;
  monthsToPayoff: number;
  payoffDate: Date;
  monthlySavedVsMinimum: number;
  totalSavedVsMinimum: number;
  schedule: MonthlyAllocation[];
}

/**
 * Calculate the "minimum payment only" baseline for comparison
 */
export function calculateMinimumPaymentBaseline(
  loans: LoanInput[]
): { totalInterest: number; months: number } {
  const activeLoans = loans.map((loan) => ({ ...loan, outstanding: loan.outstanding }));
  let totalInterest = 0;
  let month = 0;
  const maxMonths = 600;

  while (activeLoans.some((loan) => loan.outstanding > 0.5) && month < maxMonths) {
    month++;

    for (const loan of activeLoans) {
      if (loan.outstanding <= 0.5) continue;

      const monthlyRate = loan.annualRate / 12 / 100;
      const interest = loan.outstanding * monthlyRate;
      totalInterest += interest;

      const payment = Math.min(loan.emi, loan.outstanding + interest);
      const principal = payment - interest;
      loan.outstanding = Math.max(0, loan.outstanding - principal);
    }
  }

  return {
    totalInterest: Math.round(totalInterest),
    months: month,
  };
}

/**
 * Calculate a specific debt repayment strategy
 */
export function calculateStrategy(
  loans: LoanInput[],
  extraMonthlyBudget: number,
  strategy: "avalanche" | "snowball" | "hybrid",
  oneTimePayment: number = 0
): StrategyResult {
  return runStrategy(loans, extraMonthlyBudget, strategy, oneTimePayment);
}

function runStrategy(
  inputLoans: LoanInput[],
  extraBudget: number,
  strategy: "avalanche" | "snowball" | "hybrid",
  oneTimePayment: number = 0
): StrategyResult {
  // Deep clone loans to avoid mutations
  const activeLoans = inputLoans.map((l) => ({
    ...l,
    outstanding: l.outstanding,
  }));

  const schedule: MonthlyAllocation[] = [];
  let totalInterest = 0;
  let month = 0;
  const maxMonths = 600; // Safety: cap at 50 years
  let hybridSwitched = false;
  let carryForwardFreedEMI = 0;

  while (activeLoans.some((l) => l.outstanding > 0.5) && month < maxMonths) {
    month++;

    // Sort based on strategy
    let sortedLoans: typeof activeLoans;

    if (strategy === "hybrid" && !hybridSwitched) {
      // Snowball until smallest loan is paid off
      sortedLoans = [...activeLoans]
        .filter((l) => l.outstanding > 0.5)
        .sort((a, b) => a.outstanding - b.outstanding);
    } else if (strategy === "snowball") {
      sortedLoans = [...activeLoans]
        .filter((l) => l.outstanding > 0.5)
        .sort((a, b) => a.outstanding - b.outstanding);
    } else {
      // Avalanche (or hybrid after switch)
      sortedLoans = [...activeLoans]
        .filter((l) => l.outstanding > 0.5)
        .sort((a, b) => b.annualRate - a.annualRate);
    }

    let extraRemaining = extraBudget + carryForwardFreedEMI;

    // Add one-time payment to the first month
    if (month === 1 && oneTimePayment > 0) {
      extraRemaining += oneTimePayment;
    }

    const monthAllocations: MonthlyAllocation["allocations"] = [];

    for (const loan of sortedLoans) {
      if (loan.outstanding <= 0.5) continue;

      const r = loan.annualRate / 12 / 100;
      const interest = loan.outstanding * r;
      totalInterest += interest;

      // Minimum payment
      let payment = Math.min(loan.emi, loan.outstanding + interest);
      let principal = payment - interest;
      const startingOutstanding = loan.outstanding;

      if (extraRemaining > 0) {
        const extraForThis = Math.min(
          extraRemaining,
          Math.max(0, loan.outstanding - principal)
        );

        if (extraForThis > 0) {
          payment += extraForThis;
          principal += extraForThis;
          extraRemaining -= extraForThis;
        }
      }

      loan.outstanding = Math.max(0, loan.outstanding - principal);

      if (startingOutstanding > 0.5 && loan.outstanding <= 0.5) {
        carryForwardFreedEMI += loan.emi;
      }

      monthAllocations.push({
        loanId: loan.id,
        loanName: loan.name,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        remainingBalance: Math.round(loan.outstanding * 100) / 100,
      });
    }

    // Check if hybrid should switch to avalanche
    if (strategy === "hybrid" && !hybridSwitched) {
      const justPaidOff = activeLoans.filter((l) => l.outstanding <= 0.5);
      if (justPaidOff.length > 0) {
        hybridSwitched = true;
      }
    }

    const totalRemaining = activeLoans.reduce(
      (sum, l) => sum + l.outstanding,
      0
    );

    schedule.push({
      month,
      allocations: monthAllocations,
      totalDebtRemaining: Math.round(totalRemaining * 100) / 100,
    });
  }

  // Calculate savings vs minimum payment
  const baseline = calculateMinimumPaymentBaseline(inputLoans);

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + month);

  return {
    strategy,
    totalInterestPaid: Math.round(totalInterest),
    monthsToPayoff: month,
    payoffDate,
    totalSavedVsMinimum: Math.round(baseline.totalInterest - totalInterest),
    monthlySavedVsMinimum:
      month > 0
        ? Math.round((baseline.totalInterest - totalInterest) / month)
        : 0,
    schedule,
  };
}

/**
 * Calculate all three strategies at once for comparison
 */
export function compareAllStrategies(
  loans: LoanInput[],
  extraMonthlyBudget: number,
  oneTimePayment: number = 0
): {
  avalanche: StrategyResult;
  snowball: StrategyResult;
  hybrid: StrategyResult;
  baseline: { totalInterest: number; months: number };
} {
  const baseline = calculateMinimumPaymentBaseline(loans);
  const avalanche = calculateStrategy(loans, extraMonthlyBudget, "avalanche", oneTimePayment);
  const snowball = calculateStrategy(loans, extraMonthlyBudget, "snowball", oneTimePayment);
  const hybrid = calculateStrategy(loans, extraMonthlyBudget, "hybrid", oneTimePayment);

  return { avalanche, snowball, hybrid, baseline };
}
