export type LeakType =
  | "HIGH_RATE_PERSONAL_LOAN"
  | "FLOATING_RATE_RISK"
  | "SUBOPTIMAL_TENURE"
  | "IDLE_BALANCE_OPPORTUNITY"
  | "HIGH_EMI_LOW_PRINCIPAL"
  | "LOAN_ORDERING_INEFFICIENCY";

export interface FinancialProfileInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  hasEmergencyFund: boolean;
  emergencyFundMonths: number;
  employmentType?: "SALARIED" | "SELF_EMPLOYED" | "STUDENT" | "BUSINESS_OWNER" | "OTHER";
  creditScoreRange?: string;
}

export interface LoanInput {
  id: string;
  name: string;
  loanType: string;
  interestRate: number;
  rateType: "FIXED" | "FLOATING";
  tenureMonths: number;
  outstandingBalance: number;
  emiAmount: number;
  startDate: string | Date;
}

export interface InterestLeak {
  type: LeakType;
  loanId: string;
  loanName: string;
  severity: "low" | "medium" | "high";
  annualLeakAmount: number;
  fixDescription: string;
  actionLabel: string;
  actionRoute: string;
}

export function detectInterestLeaks(
  loans: LoanInput[],
  profile: FinancialProfileInput
): InterestLeak[] {
  const leaks: InterestLeak[] = [];

  const personalLoans = loans.filter((loan) => loan.loanType === "PERSONAL" && loan.interestRate > 13);
  const homeLoan = loans.find((loan) => loan.loanType === "HOME");

  if (personalLoans.length > 0 && homeLoan) {
    for (const personalLoan of personalLoans) {
      const rateDiff = personalLoan.interestRate - homeLoan.interestRate;
      const annualLeak = personalLoan.outstandingBalance * (rateDiff / 100);

      leaks.push({
        type: "HIGH_RATE_PERSONAL_LOAN",
        loanId: personalLoan.id,
        loanName: personalLoan.name,
        severity: annualLeak > 50000 ? "high" : "medium",
        annualLeakAmount: annualLeak,
        fixDescription: `You are paying ${personalLoan.interestRate}% on this loan while your home loan is at ${homeLoan.interestRate}%. A home loan top-up could save you Rs ${Math.round(annualLeak).toLocaleString("en-IN")} per year.`,
        actionLabel: "See prepayment options",
        actionRoute: `/(drawer)/(tabs)/loans/${personalLoan.id}`,
      });
    }
  }

  loans
    .filter((loan) => loan.rateType === "FLOATING" && loan.tenureMonths > 120)
    .forEach((loan) => {
      const riskPremium = loan.outstandingBalance * 0.015;
      leaks.push({
        type: "FLOATING_RATE_RISK",
        loanId: loan.id,
        loanName: loan.name,
        severity: "medium",
        annualLeakAmount: riskPremium,
        fixDescription: `A 1.5% rate rise on this floating loan would cost you Rs ${Math.round(riskPremium).toLocaleString("en-IN")} more per year. Consider fixing the rate if your bank offers it.`,
        actionLabel: "Model rate risk",
        actionRoute: "/(drawer)/(tabs)/strategy",
      });
    });

  loans.forEach((loan) => {
    const monthInterestRate = loan.interestRate / 12 / 100;
    const monthlyInterest = loan.outstandingBalance * monthInterestRate;
    const interestRatio = loan.emiAmount > 0 ? monthlyInterest / loan.emiAmount : 0;

    if (interestRatio > 0.8) {
      leaks.push({
        type: "HIGH_EMI_LOW_PRINCIPAL",
        loanId: loan.id,
        loanName: loan.name,
        severity: interestRatio > 0.9 ? "high" : "medium",
        annualLeakAmount: monthlyInterest * 12 * 0.15,
        fixDescription: `${Math.round(interestRatio * 100)}% of each EMI on this loan goes to interest, only ${Math.round((1 - interestRatio) * 100)}% to principal. A Rs 10,000 prepayment now would save significantly.`,
        actionLabel: "Calculate prepayment impact",
        actionRoute: `/(drawer)/(tabs)/loans/${loan.id}`,
      });
    }
  });

  if (profile.hasEmergencyFund && profile.emergencyFundMonths > 6) {
    const excessMonths = profile.emergencyFundMonths - 6;
    const highestRateLoan = [...loans].sort((a, b) => b.interestRate - a.interestRate)[0];

    if (highestRateLoan) {
      const totalEMI = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
      const excessFund = excessMonths * (profile.monthlyExpenses + totalEMI);
      const annualSaving = excessFund * (highestRateLoan.interestRate / 100);

      leaks.push({
        type: "IDLE_BALANCE_OPPORTUNITY",
        loanId: highestRateLoan.id,
        loanName: highestRateLoan.name,
        severity: annualSaving > 30000 ? "high" : "low",
        annualLeakAmount: annualSaving,
        fixDescription: `You have ${excessMonths} months of extra emergency fund beyond the recommended 6. Using Rs ${Math.round(excessFund).toLocaleString("en-IN")} to prepay your ${highestRateLoan.interestRate}% loan could save Rs ${Math.round(annualSaving).toLocaleString("en-IN")} in interest this year.`,
        actionLabel: "Simulate prepayment",
        actionRoute: `/(drawer)/(tabs)/loans/${highestRateLoan.id}`,
      });
    }
  }

  return leaks.sort((a, b) => b.annualLeakAmount - a.annualLeakAmount);
}

export interface DefaultRiskInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  employmentType: "SALARIED" | "SELF_EMPLOYED" | "STUDENT" | "BUSINESS_OWNER" | "OTHER";
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

export function predictDefaultRisk(input: DefaultRiskInput): DefaultRiskResult {
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
    { name: "Debt-to-income ratio", impact: features[0], weight: WEIGHTS[0], description: `Your DTI is ${Math.round(input.debtToIncomeRatio * 100)}%` },
    { name: "EMI vs disposable income", impact: features[1], weight: WEIGHTS[1], description: `EMI takes ${Math.round(features[1] * 100)}% of your disposable income` },
    { name: "Outstanding balance", impact: features[2], weight: WEIGHTS[2], description: `Balance is ${(input.outstandingBalance / Math.max(input.monthlyIncome, 1)).toFixed(1)}x your monthly income` },
    { name: "Emergency fund", impact: features[3], weight: WEIGHTS[3], description: input.hasEmergencyFund ? `${input.emergencyFundMonths} months of cover` : "No emergency fund" },
    { name: "Rate type risk", impact: features[4], weight: WEIGHTS[4], description: "Floating rate on long tenure" },
    { name: "Employment stability", impact: features[5], weight: WEIGHTS[5], description: input.employmentType.toLowerCase().replace("_", " ") },
    { name: "Credit score", impact: features[6], weight: WEIGHTS[6], description: `Score range: ${input.creditScoreRange}` },
    { name: "Loan count", impact: features[7], weight: WEIGHTS[7], description: `${input.numberOfActiveLoans} active loans` },
    { name: "Loan maturity", impact: features[8], weight: WEIGHTS[8], description: `${input.monthsActive} of ${input.tenureMonths} months completed` },
    { name: "Interest rate", impact: features[9], weight: WEIGHTS[9], description: `${input.interestRate}% annual rate` },
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

  const recommendationByLevel: Record<DefaultRiskResult["riskLevel"], string> = {
    low: "Your repayment risk is low. Maintain your emergency fund and continue your current strategy.",
    medium: "Consider building your emergency fund to at least 3 months of EMI payments.",
    high: "Reduce this loan's risk by prepaying Rs 5,000-10,000 now or consolidating with a lower-rate loan.",
    critical: "Immediate action needed - contact your lender about restructuring before missing an EMI.",
  };

  return {
    probability,
    riskLevel,
    riskScore,
    topFactors,
    recommendation: recommendationByLevel[riskLevel],
  };
}

export function monthsSince(dateInput: Date | string | null | undefined): number {
  if (!dateInput) return 0;
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 0;
  }
  const now = new Date();
  const years = now.getFullYear() - date.getFullYear();
  const months = now.getMonth() - date.getMonth();
  const diff = years * 12 + months;
  if (diff <= 0) return 0;
  return diff;
}

export interface LoanHealthLoanInput {
  interestRate: number;
  rateType: "FIXED" | "FLOATING";
  tenureMonths: number;
  emiAmount: number;
  monthlyIncome: number;
  outstandingBalance: number;
  principal: number;
}

export function loanHealthScore(input: LoanHealthLoanInput): number {
  let score = 100;

  if (input.interestRate > 15) score -= 25;
  else if (input.interestRate > 12) score -= 15;
  else if (input.interestRate > 9) score -= 5;

  if (input.rateType === "FLOATING" && input.tenureMonths > 120) score -= 15;

  const emiRatio = input.monthlyIncome > 0 ? input.emiAmount / input.monthlyIncome : 1;
  if (emiRatio > 0.3) score -= 20;
  else if (emiRatio > 0.2) score -= 10;

  const paidRatio = 1 - input.outstandingBalance / Math.max(input.principal, 1);
  score += Math.round(paidRatio * 15);

  return Math.max(0, Math.min(100, score));
}
