import { formatCurrency } from "./currency";

export type LoanSummaryInput = {
  outstandingBalance: number;
  emiAmount: number;
  interestRate: number;
};

export type LoanHeroStat = {
  label: string;
  value: string;
  muted: boolean;
};

export type LoanSummary = {
  loans: number;
  totalOutstanding: number;
  totalEMI: number;
  avgRate: number;
};

export function summarizeLoans(loans: LoanSummaryInput[]): LoanSummary {
  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  const totalEMI = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
  const avgRate = totalOutstanding > 0
    ? loans.reduce((sum, loan) => sum + loan.interestRate * loan.outstandingBalance, 0) / totalOutstanding
    : 0;

  return {
    loans: loans.length,
    totalOutstanding,
    totalEMI,
    avgRate,
  };
}

export function buildLoanHeroStats(loans: LoanSummaryInput[], currencyCode: string = "INR"): LoanHeroStat[] {
  const { loans: count, totalOutstanding, totalEMI, avgRate } = summarizeLoans(loans);

  return [
    { label: "Loans", value: count.toString(), muted: count === 0 },
    { label: "Debt", value: formatCurrency(totalOutstanding, currencyCode), muted: totalOutstanding === 0 },
    { label: "Monthly EMI", value: formatCurrency(totalEMI, currencyCode), muted: totalEMI === 0 },
    { label: "Avg rate", value: `${avgRate.toFixed(2)}%`, muted: avgRate === 0 },
  ];
}
