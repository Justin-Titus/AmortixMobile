/**
 * Affordability & Risk Score Calculator
 * Score formula from PLAN.md Section 7.9
 * Ported from web app lib/calculations/affordability.ts
 */

export interface AffordabilityInput {
  monthlyIncome: number;
  monthlyExpenses: number;
  totalMonthlyEMI: number;
  creditScoreRange: string;
  hasEmergencyFund: boolean;
  emergencyFundMonths: number;
  loans: Array<{
    annualRate: number;
    tenureMonths: number;
    rateType: string;
  }>;
}

export interface ScoreBreakdown {
  factor: string;
  value: string;
  impact: number;
  advice: string;
}

export interface AffordabilityResult {
  score: number;
  zone: "healthy" | "moderate" | "high-risk";
  breakdown: ScoreBreakdown[];
}

export function getAffordabilityZoneLabel(score: number): string {
  if (score >= 75) return "Healthy zone";
  if (score >= 50) return "Watch zone";
  return "Risk zone";
}

export function calculateAffordabilityScore(
  input: AffordabilityInput
): AffordabilityResult {
  let score = 100;
  const breakdown: ScoreBreakdown[] = [];

  // --- DTI (Debt-to-Income) Ratio ---
  const dti =
    input.monthlyIncome > 0
      ? (input.totalMonthlyEMI / input.monthlyIncome) * 100
      : Number.POSITIVE_INFINITY;

  if (dti > 50) {
    score -= 40;
    breakdown.push({
      factor: "Debt-to-Income Ratio",
      value: `${dti.toFixed(1)}%`,
      impact: -40,
      advice:
        "Your debt exceeds 50% of income. Consider reducing liabilities or increasing income.",
    });
  } else if (dti > 40) {
    score -= 25;
    breakdown.push({
      factor: "Debt-to-Income Ratio",
      value: `${dti.toFixed(1)}%`,
      impact: -25,
      advice:
        "Your DTI is high (40-50%). Try to keep it below 40% for financial safety.",
    });
  } else if (dti > 30) {
    score -= 10;
    breakdown.push({
      factor: "Debt-to-Income Ratio",
      value: `${dti.toFixed(1)}%`,
      impact: -10,
      advice:
        "Your DTI is moderate (30-40%). You're managing, but there's room to improve.",
    });
  } else {
    breakdown.push({
      factor: "Debt-to-Income Ratio",
      value: `${dti.toFixed(1)}%`,
      impact: 0,
      advice: "Your DTI is healthy. Well managed!",
    });
  }

  // --- EMI-to-Income Ratio ---
  const emiRatio =
    input.monthlyIncome - input.monthlyExpenses > 0
      ? (input.totalMonthlyEMI / (input.monthlyIncome - input.monthlyExpenses)) * 100
      : 0;

  if (emiRatio > 50) {
    score -= 25;
    breakdown.push({
      factor: "EMI-to-Income Ratio",
      value: `${emiRatio.toFixed(1)}%`,
      impact: -25,
      advice:
        "More than half your income goes to EMIs. This is a danger zone.",
    });
  } else if (emiRatio > 40) {
    score -= 15;
    breakdown.push({
      factor: "EMI-to-Income Ratio",
      value: `${emiRatio.toFixed(1)}%`,
      impact: -15,
      advice:
        "Your EMI burden is over 40% of income. Try to reduce it below 40%.",
    });
  } else {
    breakdown.push({
      factor: "EMI-to-Income Ratio",
      value: `${emiRatio.toFixed(1)}%`,
      impact: 0,
      advice: "Your EMI burden is within safe limits.",
    });
  }

  // --- Emergency Fund ---
  if (!input.hasEmergencyFund) {
    score -= 10;
    breakdown.push({
      factor: "Emergency Fund",
      value: "None",
      impact: -10,
      advice:
        "Build an emergency fund covering at least 3–6 months of expenses.",
    });
  } else {
    breakdown.push({
      factor: "Emergency Fund",
      value: `${input.emergencyFundMonths} months`,
      impact: 0,
      advice: "Having an emergency fund is great for financial safety.",
    });
  }

  // --- Floating-rate loans with long tenure ---
  const riskyLoans = input.loans.filter(
    (l) => l.rateType === "FLOATING" && l.tenureMonths > 120
  );
  const floatingPenalty = Math.min(riskyLoans.length * 5, 15);
  if (floatingPenalty > 0) {
    score -= floatingPenalty;
    breakdown.push({
      factor: "Long Floating-Rate Loans",
      value: `${riskyLoans.length} loan(s)`,
      impact: -floatingPenalty,
      advice:
        "Floating-rate loans with 10+ year tenure are risky. Consider refinancing to fixed rate.",
    });
  }

  // --- Credit Score Bonus ---
  if (
    input.creditScoreRange === "750–800" ||
    input.creditScoreRange === "800+"
  ) {
    score += 5;
    breakdown.push({
      factor: "Credit Score",
      value: input.creditScoreRange,
      impact: 5,
      advice: "Excellent credit score! This gives you better loan terms.",
    });
  } else {
    breakdown.push({
      factor: "Credit Score",
      value: input.creditScoreRange || "Not provided",
      impact: 0,
      advice:
        "Improving your credit score to 750+ can unlock better interest rates.",
    });
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine zone
  let zone: "healthy" | "moderate" | "high-risk";
  if (score >= 75) {
    zone = "healthy";
  } else if (score >= 50) {
    zone = "moderate";
  } else {
    zone = "high-risk";
  }

  return { score, zone, breakdown };
}
