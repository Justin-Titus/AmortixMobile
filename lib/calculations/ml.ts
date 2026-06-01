import { formatCurrency } from "./currency";

export interface DefaultRiskInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  employmentType:
    | "SALARIED"
    | "SELF_EMPLOYED"
    | "STUDENT"
    | "BUSINESS_OWNER"
    | "OTHER";
  hasEmergencyFund: boolean;
  emergencyFundMonths: number;
  creditScoreRange: string;

  loanType: string;
  interestRate: number;
  rateType: "FIXED" | "FLOATING";
  tenureMonths: number;
  outstandingBalance: number;
  emiAmount: number;
  monthsActive: number;

  totalMonthlyEMI: number;
  numberOfActiveLoans: number;
  debtToIncomeRatio: number;
}

export interface RiskFactor {
  name: string;
  impact: "positive" | "negative";
  weight: number;
  description: string;
}

export interface DefaultRiskResult {
  probability: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  riskScore: number;
  topFactors: RiskFactor[];
  recommendation: string;
}

const WEIGHTS = [0.28, 0.22, 0.18, 0.12, 0.08, 0.07, 0.15, 0.06, 0.09, 0.1] as const;
const BIAS = -2.4;

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

function normalizeCreditScoreRange(range: string): string {
  return range
    .trim()
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, "");
}

function normalizeFeatures(input: DefaultRiskInput): number[] {
  const disposableIncome = Math.max(input.monthlyIncome - input.monthlyExpenses, 1);

  const employmentRisk: Record<DefaultRiskInput["employmentType"], number> = {
    SALARIED: 0,
    STUDENT: 0.4,
    SELF_EMPLOYED: 0.35,
    BUSINESS_OWNER: 0.3,
    OTHER: 0.5,
  };

  const creditRisk: Record<string, number> = {
    "below-650": 1,
    "650-700": 0.7,
    "700-750": 0.4,
    "750-800": 0.15,
    "800+": 0,
  };

  return [
    clamp01(input.debtToIncomeRatio / 0.6),
    clamp01(input.emiAmount / disposableIncome),
    clamp01(input.outstandingBalance / Math.max(input.monthlyIncome * 12, 1)),
    input.hasEmergencyFund ? clamp01(1 - input.emergencyFundMonths / 6) : 1,
    input.rateType === "FLOATING" && input.tenureMonths > 120 ? 0.8 : 0,
    employmentRisk[input.employmentType] ?? 0.4,
    creditRisk[normalizeCreditScoreRange(input.creditScoreRange)] ?? 0.5,
    clamp01((input.numberOfActiveLoans - 1) / 4),
    clamp01(1 - input.monthsActive / Math.max(input.tenureMonths, 1)),
    clamp01((input.interestRate - 7) / 10),
  ];
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function predictDefaultRisk(input: DefaultRiskInput, currencyCode: string = "INR"): DefaultRiskResult {
  const features = normalizeFeatures(input);

  const logit = features.reduce((sum, feature, index) => sum + feature * WEIGHTS[index], BIAS);
  const probability = sigmoid(logit);
  const riskScore = Math.round(probability * 100);

  const riskLevel =
    probability < 0.15
      ? "low"
      : probability < 0.35
        ? "medium"
        : probability < 0.6
          ? "high"
          : "critical";

  const factorContributions = [
    {
      name: "Debt-to-income ratio",
      impact: features[0],
      weight: WEIGHTS[0],
      description: `Your DTI is ${Math.round(input.debtToIncomeRatio * 100)}%`,
    },
    {
      name: "EMI vs disposable income",
      impact: features[1],
      weight: WEIGHTS[1],
      description: `EMI takes ${Math.round(features[1] * 100)}% of your disposable income`,
    },
    {
      name: "Outstanding balance",
      impact: features[2],
      weight: WEIGHTS[2],
      description: `Balance is ${(input.outstandingBalance / Math.max(input.monthlyIncome, 1)).toFixed(1)}x your monthly income`,
    },
    {
      name: "Emergency fund",
      impact: features[3],
      weight: WEIGHTS[3],
      description: input.hasEmergencyFund
        ? `${input.emergencyFundMonths} months of cover`
        : "No emergency fund",
    },
    {
      name: "Rate type risk",
      impact: features[4],
      weight: WEIGHTS[4],
      description: "Floating rate on long tenure",
    },
    {
      name: "Employment stability",
      impact: features[5],
      weight: WEIGHTS[5],
      description: input.employmentType.toLowerCase().replace("_", " "),
    },
    {
      name: "Credit score",
      impact: features[6],
      weight: WEIGHTS[6],
      description: `Score range: ${input.creditScoreRange}`,
    },
    {
      name: "Loan count",
      impact: features[7],
      weight: WEIGHTS[7],
      description: `${input.numberOfActiveLoans} active loans`,
    },
    {
      name: "Loan maturity",
      impact: features[8],
      weight: WEIGHTS[8],
      description: `${input.monthsActive} of ${input.tenureMonths} months completed`,
    },
    {
      name: "Interest rate",
      impact: features[9],
      weight: WEIGHTS[9],
      description: `${input.interestRate}% annual rate`,
    },
  ];

  const topFactors = factorContributions
    .map((factor) => ({ ...factor, score: factor.impact * factor.weight }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((factor) => ({
      name: factor.name,
      impact: factor.impact > 0.3 ? ("negative" as const) : ("positive" as const),
      weight: factor.weight,
      description: factor.description,
    }));

  const formattedPrepayOption = `${formatCurrency(5000, currencyCode)}-${formatCurrency(10000, currencyCode)}`;

  const recommendationByLevel: Record<DefaultRiskResult["riskLevel"], string> = {
    low: "Your repayment risk is low. Maintain your emergency fund and continue your current strategy.",
    medium: "Consider building your emergency fund to at least 3 months of EMI payments.",
    high: `Reduce this loan's risk by prepaying ${formattedPrepayOption} now or consolidating with a lower-rate loan.`,
    critical:
      "Immediate action needed - contact your lender about restructuring before missing an EMI.",
  };

  return {
    probability,
    riskLevel,
    riskScore,
    topFactors,
    recommendation: recommendationByLevel[riskLevel],
  };
}

export interface LoanState {
  id: string;
  name: string;
  outstanding: number;
  annualRate: number;
  emi: number;
}

export interface OptimizedAllocation {
  loanId: string;
  loanName: string;
  baseEMI: number;
  extraAllocation: number;
  totalPayment: number;
  marginalInterestSaved: number;
  reasoning: string;
}

export interface OptimizationResult {
  allocations: OptimizedAllocation[];
  totalInterestSaved: number;
  monthsSaved: number;
  optimizedPayoffDate: Date;
  vsAvalanche: { interestDifference: number; monthsDifference: number };
  confidenceScore: number;
}

interface SimulationResult {
  totalInterest: number;
  monthsToPayoff: number;
}

const MIN_ALLOCATION_STEP = 500;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function monthRate(annualRate: number): number {
  return annualRate / 12 / 100;
}

function getMarginalSaving(loan: LoanState, totalOutstanding: number): number {
  if (loan.outstanding <= 0 || totalOutstanding <= 0) {
    return 0;
  }
  return monthRate(loan.annualRate) * (loan.outstanding / totalOutstanding);
}

import { calculateMinimumPaymentBaseline } from "./strategies";

function simulatePayoff(
  loans: LoanState[],
  extraAllocations: Map<string, number>,
  projectionMonths: number,
  oneTimePayment: number = 0
): SimulationResult {
  // Deep-clone balances so we never mutate the caller's data
  const outstanding = new Map<string, number>(
    loans.map((loan) => [loan.id, loan.outstanding])
  );

  // Copy the per-loan extra allocations so we can cascade into them
  const currentExtra = new Map<string, number>(extraAllocations);

  // Track which loans still have a balance
  const activeIds = new Set<string>(
    loans.filter((l) => l.outstanding > 0).map((l) => l.id)
  );

  let totalInterest = 0;
  let months = 0;

  // Running carry-forward: when a loan is fully paid off its freed EMI
  // (+ any extra already allocated to it) is rolled to the next highest-rate loan.
  // We accumulate it here and add it to extraRemaining every month,
  // IDENTICAL to how runStrategy in strategies.ts works.
  let carryForwardFreedEMI = 0;

  while (activeIds.size > 0 && months < projectionMonths) {
    months++;

    // Highest-rate first (avalanche cascade mirrors baseline)
    const orderedActive = loans
      .filter((l) => activeIds.has(l.id))
      .sort((a, b) => b.annualRate - a.annualRate);

    // Extra available this month = per-allocation extra + cascade + one-time (month 1 only)
    let extraRemaining = carryForwardFreedEMI + (months === 1 ? oneTimePayment : 0);

    // Add the per-loan allocation totals into the shared pool so they can be
    // redistributed after cascade. Each loan's slice will be applied to it first.
    // Note: we treat allocations as a priority hint, not as hard assignments,
    // so we simply sum them and let the priority order handle distribution.
    for (const loan of orderedActive) {
      extraRemaining += currentExtra.get(loan.id) ?? 0;
    }
    // Zero out per-loan extras since we've merged them into extraRemaining
    for (const loan of orderedActive) {
      currentExtra.set(loan.id, 0);
    }

    for (const loan of orderedActive) {
      const remaining = outstanding.get(loan.id) ?? 0;
      if (remaining <= 0.5) {
        activeIds.delete(loan.id);
        continue;
      }

      const interest = remaining * monthRate(loan.annualRate);
      totalInterest += interest;

      // Base payment (capped so we never overpay)
      let payment = Math.min(loan.emi, remaining + interest);
      let principal = payment - interest;
      const prevOutstanding = remaining;

      // Apply extra from the shared pool
      if (extraRemaining > 0) {
        const extraForThis = Math.min(
          extraRemaining,
          Math.max(0, remaining - principal)
        );
        if (extraForThis > 0) {
          payment    += extraForThis;
          principal  += extraForThis;
          extraRemaining -= extraForThis;
        }
      }

      const nextOutstanding = Math.max(0, remaining - principal);
      outstanding.set(loan.id, nextOutstanding);

      // When a loan is paid off, cascade its freed EMI to the next month's pool
      if (prevOutstanding > 0.5 && nextOutstanding <= 0.5) {
        activeIds.delete(loan.id);
        carryForwardFreedEMI += loan.emi;
      }
    }
  }

  return {
    totalInterest: Math.round(totalInterest),
    monthsToPayoff: months,
  };
}

export function optimizeEMIAllocation(
  loans: LoanState[],
  extraBudget: number,
  currencyCode: string = "INR",
  projectionMonths: number = 240,
  oneTimePayment: number = 0
): OptimizationResult {
  if (loans.length === 0) {
    return {
      allocations: [],
      totalInterestSaved: 0,
      monthsSaved: 0,
      optimizedPayoffDate: new Date(),
      vsAvalanche: { interestDifference: 0, monthsDifference: 0 },
      confidenceScore: 0,
    };
  }

  const safeExtraBudget = Math.max(0, Math.round(extraBudget));
  const allocations = new Map<string, number>(loans.map((loan) => [loan.id, 0]));
  const mutableLoans = loans.map((loan) => ({ ...loan }));

  let budgetLeft = safeExtraBudget;

  while (budgetLeft >= MIN_ALLOCATION_STEP) {
    const totalOutstanding = mutableLoans.reduce((sum, loan) => sum + Math.max(loan.outstanding, 0), 0);

    const ranked = mutableLoans
      .map((loan) => ({ loan, marginal: getMarginalSaving(loan, totalOutstanding) }))
      .sort((a, b) => b.marginal - a.marginal);

    const target = ranked[0];
    if (!target || target.marginal <= 0) {
      break;
    }

    const step = Math.min(MIN_ALLOCATION_STEP, budgetLeft);
    allocations.set(target.loan.id, (allocations.get(target.loan.id) ?? 0) + step);
    budgetLeft -= step;

    // Approximate immediate balance drop from this month's extra allocation.
    target.loan.outstanding = Math.max(0, target.loan.outstanding - step);
  }

  const baselineResult = calculateMinimumPaymentBaseline(loans);
  const baselineSimulation = {
    totalInterest: baselineResult.totalInterest,
    monthsToPayoff: baselineResult.months,
  };
  const optimizedSimulation = simulatePayoff(loans, allocations, projectionMonths, oneTimePayment);

  const highestRateLoan = [...loans].sort((a, b) => b.annualRate - a.annualRate)[0];
  const avalancheAllocations = new Map<string, number>(
    loans.map((loan) => [loan.id, loan.id === highestRateLoan.id ? safeExtraBudget : 0])
  );
  const avalancheSimulation = simulatePayoff(loans, avalancheAllocations, projectionMonths, oneTimePayment);

  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding, 0);
  const rateValues = loans.map((loan) => loan.annualRate);
  const maxRate = Math.max(...rateValues);
  const minRate = Math.min(...rateValues);
  const rateSpread = maxRate - minRate;

  const outstandingValues = loans.map((loan) => loan.outstanding);
  const maxOutstanding = Math.max(...outstandingValues);
  const minOutstanding = Math.min(...outstandingValues);
  const outstandingSpread = totalOutstanding > 0 ? (maxOutstanding - minOutstanding) / totalOutstanding : 0;

  const confidenceScore = Math.round(sigmoid(rateSpread * Math.max(outstandingSpread, 0) * 10) * 100);

  const resultAllocations: OptimizedAllocation[] = loans.map((loan) => {
    const extraAllocation = allocations.get(loan.id) ?? 0;
    const marginalInterestSaved = getMarginalSaving(loan, totalOutstanding);
    const formattedOutstanding = formatCurrency(loan.outstanding, currencyCode);
    const reasoning =
      extraAllocation > 0
        ? `Allocated toward ${loan.annualRate.toFixed(2)}% rate with ${formattedOutstanding} outstanding.`
        : "Lower current marginal impact than other loans this month.";

    return {
      loanId: loan.id,
      loanName: loan.name,
      baseEMI: loan.emi,
      extraAllocation,
      totalPayment: loan.emi + extraAllocation,
      marginalInterestSaved,
      reasoning,
    };
  });

  const optimizedPayoffDate = new Date();
  optimizedPayoffDate.setMonth(optimizedPayoffDate.getMonth() + optimizedSimulation.monthsToPayoff);

  return {
    allocations: resultAllocations,
    totalInterestSaved: Math.max(0, baselineSimulation.totalInterest - optimizedSimulation.totalInterest),
    monthsSaved: Math.max(0, baselineSimulation.monthsToPayoff - optimizedSimulation.monthsToPayoff),
    optimizedPayoffDate,
    vsAvalanche: {
      interestDifference: avalancheSimulation.totalInterest - optimizedSimulation.totalInterest,
      monthsDifference: avalancheSimulation.monthsToPayoff - optimizedSimulation.monthsToPayoff,
    },
    confidenceScore,
  };
}
