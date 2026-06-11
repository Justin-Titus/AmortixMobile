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

export function getProjectedPayoffDate(loans: LoanSummaryInput[]): Date {
  let maxMonths = 0;
  for (const loan of loans) {
    if (loan.outstandingBalance <= 0 || loan.emiAmount <= 0) continue;
    
    const r = loan.interestRate / 12 / 100;
    let months = 0;
    if (r === 0) {
      months = loan.outstandingBalance / loan.emiAmount;
    } else {
      const denom = 1 - (r * loan.outstandingBalance) / loan.emiAmount;
      if (denom <= 0) {
         // EMI is less than interest! Never pays off. Cap at 100 years.
         months = 1200;
      } else {
         months = -Math.log(denom) / Math.log(1 + r);
      }
    }
    maxMonths = Math.max(maxMonths, months);
  }
  
  const date = new Date();
  date.setMonth(date.getMonth() + Math.ceil(maxMonths));
  return date;
}
