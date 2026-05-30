import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { type ScheduleEntry } from '@/lib/calculations';
import { formatCurrency } from '@/lib/calculations';

interface ExportPDFOptions {
  loanName: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  currencyCode: string;
  schedule: ScheduleEntry[];
}

export async function exportAmortizationSchedulePDF({
  loanName,
  principal,
  interestRate,
  tenureMonths,
  emiAmount,
  currencyCode,
  schedule,
}: ExportPDFOptions) {
  const totalInterest = schedule.reduce((sum, entry) => sum + entry.interestComponent, 0);
  const totalPaid = schedule.reduce((sum, entry) => sum + entry.emi, 0);
  const months = schedule.length;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Amortix — Amortization Schedule</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f1b2d;
            padding: 40px;
            margin: 0;
            line-height: 1.5;
            background-color: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e4fbf4;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 700;
            color: #118c76;
            letter-spacing: -0.5px;
          }
          .doc-title {
            text-align: right;
          }
          .doc-title h1 {
            margin: 0;
            font-size: 20px;
            color: #0d1b2f;
          }
          .doc-title p {
            margin: 5px 0 0 0;
            font-size: 12px;
            color: #8290a1;
          }
          .metadata-grid {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 30px;
          }
          .meta-card {
            flex: 1;
            background-color: #f8fafc;
            border: 1px solid #dfddd5;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
          }
          .meta-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #8290a1;
            margin-bottom: 5px;
          }
          .meta-value {
            font-size: 16px;
            font-weight: 700;
            color: #0d1b2f;
          }
          .summary-title {
            font-size: 16px;
            font-weight: 700;
            color: #0d1b2f;
            margin-bottom: 15px;
            font-family: inherit;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            background-color: #0d1b2f;
            color: #ffffff;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px 10px;
            text-align: right;
          }
          th:first-child {
            text-align: center;
            border-top-left-radius: 8px;
            border-bottom-left-radius: 8px;
          }
          th:last-child {
            border-top-right-radius: 8px;
            border-bottom-right-radius: 8px;
          }
          td {
            padding: 10px;
            font-size: 13px;
            border-bottom: 1px solid #dfddd5;
            text-align: right;
          }
          td:first-child {
            text-align: center;
            font-weight: 600;
            color: #8290a1;
          }
          tr:nth-child(even) td {
            background-color: #fdfdfd;
          }
          .totals-row td {
            font-weight: 700;
            background-color: #e4fbf4 !important;
            border-bottom: 2px solid #118c76;
            color: #0d1b2f;
          }
          .totals-row td:first-child {
            color: #0d1b2f;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Amortix</div>
          <div class="doc-title">
            <h1>Amortization Schedule</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <h2 class="summary-title">Loan Details: ${loanName}</h2>
        <div class="metadata-grid">
          <div class="meta-card">
            <div class="meta-label">Principal</div>
            <div class="meta-value">${formatCurrency(principal, currencyCode)}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Interest Rate</div>
            <div class="meta-value">${interestRate}%</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">EMI Amount</div>
            <div class="meta-value">${formatCurrency(emiAmount, currencyCode)}</div>
          </div>
          <div class="meta-card">
            <div class="meta-label">Total Tenure</div>
            <div class="meta-value">${tenureMonths} Months</div>
          </div>
        </div>

        <h2 class="summary-title">Payoff Simulation Summary</h2>
        <div class="metadata-grid">
          <div class="meta-card" style="border-left: 4px solid #118c76;">
            <div class="meta-label">Total Principal Paid</div>
            <div class="meta-value">${formatCurrency(principal, currencyCode)}</div>
          </div>
          <div class="meta-card" style="border-left: 4px solid #f59f3a;">
            <div class="meta-label">Total Interest Paid</div>
            <div class="meta-value">${formatCurrency(totalInterest, currencyCode)}</div>
          </div>
          <div class="meta-card" style="border-left: 4px solid #0d1b2f;">
            <div class="meta-label">Total Payments</div>
            <div class="meta-value">${formatCurrency(totalPaid, currencyCode)}</div>
          </div>
          <div class="meta-card" style="border-left: 4px solid #0d1b2f;">
            <div class="meta-label">Actual Payoff Term</div>
            <div class="meta-value">${months} Months</div>
          </div>
        </div>

        <h2 class="summary-title">Payment Schedule</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">Month</th>
              <th>Payment</th>
              <th>Principal Paid</th>
              <th>Interest Paid</th>
              <th>Remaining Balance</th>
            </tr>
          </thead>
          <tbody>
            ${schedule
              .map(
                (entry) => `
              <tr>
                <td>${entry.month}</td>
                <td>${formatCurrency(entry.emi, currencyCode)}</td>
                <td>${formatCurrency(entry.principalComponent, currencyCode)}</td>
                <td>${formatCurrency(entry.interestComponent, currencyCode)}</td>
                <td>${formatCurrency(entry.outstandingBalance, currencyCode)}</td>
              </tr>
            `
              )
              .join('')}
            <tr class="totals-row">
              <td>Total</td>
              <td>${formatCurrency(totalPaid, currencyCode)}</td>
              <td>${formatCurrency(principal, currencyCode)}</td>
              <td>${formatCurrency(totalInterest, currencyCode)}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `${loanName} Schedule` });
    return { success: true };
  } catch (error) {
    console.error('Failed to export PDF:', error);
    return { success: false, error };
  }
}

