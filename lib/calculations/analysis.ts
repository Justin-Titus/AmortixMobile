import { formatCurrency } from "./currency";

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
  startDate?: string | Date;
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
  profile: FinancialProfileInput,
  currencyCode: string = "INR",
  buildRoute?: (type: LeakType, loanId: string, loanName: string) => string
): InterestLeak[] {
  const leaks: InterestLeak[] = [];

  const defaultBuildRoute = (type: LeakType, loanId: string, loanName: string) => {
    if (type === "FLOATING_RATE_RISK") return "/strategy";
    return `/loans/${loanId}`;
  };

  const routeBuilder = buildRoute || defaultBuildRoute;

  const personalLoans = loans.filter((loan) => loan.loanType === "PERSONAL" && loan.interestRate > 13);
  const homeLoan = loans.find((loan) => loan.loanType === "HOME");

  if (personalLoans.length > 0 && homeLoan) {
    for (const personalLoan of personalLoans) {
      const rateDiff = personalLoan.interestRate - homeLoan.interestRate;
      const annualLeak = personalLoan.outstandingBalance * (rateDiff / 100);

      const formattedSaving = formatCurrency(annualLeak, currencyCode);

      leaks.push({
        type: "HIGH_RATE_PERSONAL_LOAN",
        loanId: personalLoan.id,
        loanName: personalLoan.name,
        severity: annualLeak > 50000 ? "high" : "medium",
        annualLeakAmount: annualLeak,
        fixDescription: `You are paying ${personalLoan.interestRate}% on this loan while your home loan is at ${homeLoan.interestRate}%. A home loan top-up could save you ${formattedSaving} per year.`,
        actionLabel: "See prepayment options",
        actionRoute: routeBuilder("HIGH_RATE_PERSONAL_LOAN", personalLoan.id, personalLoan.name),
      });
    }
  }

  loans
    .filter((loan) => loan.rateType === "FLOATING" && loan.tenureMonths > 120)
    .forEach((loan) => {
      const riskPremium = loan.outstandingBalance * 0.015;
      const formattedPremium = formatCurrency(riskPremium, currencyCode);

      leaks.push({
        type: "FLOATING_RATE_RISK",
        loanId: loan.id,
        loanName: loan.name,
        severity: "medium",
        annualLeakAmount: riskPremium,
        fixDescription: `A 1.5% rate rise on this floating loan would cost you ${formattedPremium} more per year. Consider fixing the rate if your bank offers it.`,
        actionLabel: "Model rate risk",
        actionRoute: routeBuilder("FLOATING_RATE_RISK", loan.id, loan.name),
      });
    });

  loans.forEach((loan) => {
    const monthInterestRate = loan.interestRate / 12 / 100;
    const monthlyInterest = loan.outstandingBalance * monthInterestRate;
    const interestRatio = loan.emiAmount > 0 ? monthlyInterest / loan.emiAmount : 0;

    if (interestRatio > 0.8) {
      const formattedPrepayment = formatCurrency(10000, currencyCode);
      leaks.push({
        type: "HIGH_EMI_LOW_PRINCIPAL",
        loanId: loan.id,
        loanName: loan.name,
        severity: interestRatio > 0.9 ? "high" : "medium",
        annualLeakAmount: monthlyInterest * 12 * 0.15,
        fixDescription: `${Math.round(interestRatio * 100)}% of each EMI on this loan goes to interest, only ${Math.round((1 - interestRatio) * 100)}% to principal. A ${formattedPrepayment} prepayment now would save significantly.`,
        actionLabel: "Calculate prepayment impact",
        actionRoute: routeBuilder("HIGH_EMI_LOW_PRINCIPAL", loan.id, loan.name),
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

      const formattedFund = formatCurrency(excessFund, currencyCode);
      const formattedSaving = formatCurrency(annualSaving, currencyCode);

      leaks.push({
        type: "IDLE_BALANCE_OPPORTUNITY",
        loanId: highestRateLoan.id,
        loanName: highestRateLoan.name,
        severity: annualSaving > 30000 ? "high" : "low",
        annualLeakAmount: annualSaving,
        fixDescription: `You have ${excessMonths} months of extra emergency fund beyond the recommended 6. Using ${formattedFund} to prepay your ${highestRateLoan.interestRate}% loan could save ${formattedSaving} in interest this year.`,
        actionLabel: "Simulate prepayment",
        actionRoute: routeBuilder("IDLE_BALANCE_OPPORTUNITY", highestRateLoan.id, highestRateLoan.name),
      });
    }
  }

  return leaks.sort((a, b) => b.annualLeakAmount - a.annualLeakAmount);
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
