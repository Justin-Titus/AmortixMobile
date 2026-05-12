export type RawLoan = {
  id: string;
  name: string;
  emiAmount: number;
  nextEmiDate: string | null; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  payments: { amount: number; date: string; type: string }[]; // date YYYY-MM-DD
};

export type LoanDayEntry = {
  loanId: string;
  loanName: string;
  emiAmount: number;
  paidAmount: number;
  status: "paid" | "pending" | "overdue";
};

export type DailyEntry = {
  date: string; // YYYY-MM-DD
  totalDue: number;
  totalPaid: number;
  loans: LoanDayEntry[];
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseDateKey(s: string) {
  // Handle ISO strings or YYYY-MM-DD
  const dateStr = s.includes('T') ? s.split('T')[0] : s;
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function clampDay(year: number, month: number, day: number) {
  const days = getDaysInMonth(year, month);
  return new Date(year, month, Math.min(day, days));
}

function addMonthsClamped(date: Date, offset: number) {
  const result = new Date(date);
  const targetMonth = result.getMonth() + offset;
  const targetYear = result.getFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  result.setFullYear(targetYear, normalizedMonth, Math.min(result.getDate(), lastDay));
  return result;
}

function addDays(date: Date, amount: number) {
  const r = new Date(date);
  r.setDate(r.getDate() + amount);
  return r;
}

function parseAnchor(loan: RawLoan) {
  const anchorStr = loan.nextEmiDate ?? loan.startDate;
  return parseDateKey(anchorStr);
}

export function getLoanDueDateForMonth(loan: RawLoan, currentMonth: Date): Date | null {
  const anchor = parseAnchor(loan);
  const due = clampDay(currentMonth.getFullYear(), currentMonth.getMonth(), anchor.getDate());
  if (due < anchor) return null;
  return due;
}

export function getNextDueDateOnOrAfter(loan: RawLoan, fromDate: Date) {
  const anchor = parseAnchor(loan);
  let due = new Date(anchor);
  while (due < fromDate) due = addMonthsClamped(due, 1);
  return due;
}

export function buildCalendarData(loans: RawLoan[], currentMonth: Date, today: Date) {
  const days: Record<string, DailyEntry> = {};

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  function ensureDay(dateKey: string) {
    if (!days[dateKey]) {
      days[dateKey] = { date: dateKey, totalDue: 0, totalPaid: 0, loans: [] };
    }
    return days[dateKey];
  }

  for (const loan of loans) {
    const dueDate = getLoanDueDateForMonth(loan, currentMonth);
    if (!dueDate) continue;
    const dateKey = formatDateKey(dueDate);

    const paidAmount = loan.payments
      .filter((p) => {
        if (p.type !== "EMI") return false;
        const paymentDate = parseDateKey(p.date);
        return (
          paymentDate.getFullYear() === currentYear &&
          paymentDate.getMonth() === currentMonthIndex
        );
      })
      .reduce((s, p) => s + p.amount, 0);

    const emiAmount = loan.emiAmount;
    const status: LoanDayEntry["status"] = paidAmount >= emiAmount ? "paid" : dueDate < today ? "overdue" : "pending";

    const day = ensureDay(dateKey);
    day.loans.push({ loanId: loan.id, loanName: loan.name, emiAmount, paidAmount, status });
    day.totalDue += emiAmount;
    day.totalPaid += paidAmount;
  }

  const dueIn30: { loanId: string; loanName: string; amount: number; dueDate: Date }[] = [];
  const endDate = addDays(today, 30);
  for (const loan of loans) {
    let due = getNextDueDateOnOrAfter(loan, today);
    while (due <= endDate) {
      dueIn30.push({ loanId: loan.id, loanName: loan.name, amount: loan.emiAmount, dueDate: new Date(due) });
      due = addMonthsClamped(due, 1);
    }
  }

  const totalDueIn30 = dueIn30.reduce((s, e) => s + e.amount, 0);

  return { days, dueIn30, totalDueIn30 } as const;
}
