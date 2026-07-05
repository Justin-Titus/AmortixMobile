import { z } from "zod";

/**
 * Loan validation schema for mobile.
 * Mirrors AmortixWeb/lib/validations/loan.schema.ts
 */
export const loanSchema = z.object({
  name: z
    .string()
    .min(2, "Loan name must be at least 2 characters")
    .max(100, "Loan name must be less than 100 characters"),
  loanType: z.enum([
    "HOME",
    "EDUCATION",
    "PERSONAL",
    "VEHICLE",
    "BUSINESS",
    "GOLD",
    "OTHER",
  ]),
  principal: z
    .number()
    .positive("Principal must be a positive number")
    .max(100000000, "Principal seems too large"),
  outstandingBalance: z
    .number()
    .min(0, "Outstanding balance cannot be negative")
    .max(100000000, "Amount seems too large"),
  interestRate: z
    .number()
    .min(0, "Interest rate cannot be negative")
    .max(50, "Interest rate seems too high"),
  rateType: z.enum(["FIXED", "FLOATING"]),
  tenureMonths: z
    .number()
    .int("Tenure must be a whole number")
    .positive("Tenure must be positive")
    .max(600, "Tenure cannot exceed 50 years"),
  emiAmount: z
    .number()
    .positive("EMI must be a positive number")
    .max(10000000, "EMI seems too large"),
  startDate: z.coerce.date(),
  lender: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  currency: z.string().max(10).optional().default("INR"),
  workspaceId: z.string().optional().nullable(),
});

export type LoanInput = z.infer<typeof loanSchema>;

/**
 * Payment validation schema for mobile.
 * Mirrors AmortixWeb/lib/validations/payment.schema.ts
 */
export const paymentSchema = z.object({
  amount: z.number().positive("Payment amount must be a positive number"),
  paymentDate: z.coerce.date(),
  type: z.enum(["EMI", "PREPAYMENT"]),
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
