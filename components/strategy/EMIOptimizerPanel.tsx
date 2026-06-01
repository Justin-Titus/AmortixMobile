import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  optimizeEMIAllocation,
  formatCurrency,
} from '@/lib/calculations';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Badge } from '@/components/ui/Badge';
import SliderField from '@/components/ui/SliderField';
import { Colors, Spacing, Radius } from '@/constants/theme';

type LoanRecord = {
  id: string;
  name: string;
  outstandingBalance: number;
  interestRate: number;
  emiAmount: number;
};

type EMIOptimizerPanelProps = {
  loans: LoanRecord[];
  extraBudget: number;
  onExtraBudgetChange: (val: number) => void;
  oneTimePayment?: number;
  onOneTimePaymentChange?: (val: number) => void;
  currencyCode?: string;
};

function confidenceLabel(score: number): string {
  if (score >= 70) return 'High confidence';
  if (score >= 40) return 'Medium confidence';
  return 'Low confidence';
}

export default function EMIOptimizerPanel({
  loans,
  extraBudget,
  onExtraBudgetChange,
  oneTimePayment = 0,
  onOneTimePaymentChange,
  currencyCode = 'INR',
}: EMIOptimizerPanelProps) {
  const loanStates = useMemo(() => {
    return loans.map(l => ({
      id: l.id,
      name: l.name,
      outstanding: l.outstandingBalance,
      annualRate: l.interestRate,
      emi: l.emiAmount,
    }));
  }, [loans]);

  const result = useMemo(
    () => optimizeEMIAllocation(loanStates, extraBudget, currencyCode, 240, oneTimePayment),
    [loanStates, extraBudget, currencyCode, oneTimePayment]
  );

  // Derive which loan is the current primary target (highest extra allocation)
  const targetLoan = useMemo(() => {
    if (!result.allocations.length) return null;
    const top = result.allocations.reduce((best, curr) =>
      curr.extraAllocation > best.extraAllocation ? curr : best
    );
    return top.extraAllocation > 0 ? top.loanName : null;
  }, [result.allocations]);

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Badge text="Smart Engine" variant="green" />
        <Typography variant="body" weight="bold" color="textPrimary" fontFamily="heading" style={styles.title}>
          Smart Payment Engine
        </Typography>
        <Typography variant="sm" color="textMuted" style={styles.subText}>
          Split your extra budget optimally based on rates and balances.
        </Typography>
      </View>

      <SliderField
        label="Extra monthly budget"
        value={extraBudget}
        min={0}
        max={100000}
        step={1000}
        displayValue={formatCurrency(extraBudget, currencyCode)}
        onChange={onExtraBudgetChange}
      />

      {onOneTimePaymentChange && (
        <SliderField
          label="One-time prepayment"
          value={oneTimePayment}
          min={0}
          max={1000000}
          step={10000}
          displayValue={formatCurrency(oneTimePayment, currencyCode)}
          onChange={onOneTimePaymentChange}
        />
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <View>
          <View style={[styles.tableHeader, { borderBottomColor: Colors.borderLight }]}>
            <Typography variant="xs" weight="bold" color="textMuted" style={[styles.cell, { width: 100 }]}>Loan</Typography>
            <Typography variant="xs" weight="bold" color="textMuted" style={[styles.cell, { width: 90 }]}>Base EMI</Typography>
            <Typography variant="xs" weight="bold" color="textMuted" style={[styles.cell, { width: 90 }]}>+ Extra</Typography>
            <Typography variant="xs" weight="bold" color="textMuted" style={[styles.cell, { width: 100 }]}>Total Pay</Typography>
          </View>

          {result.allocations.map((allocation) => (
            <View key={allocation.loanId} style={[styles.tableRow, { borderBottomColor: Colors.borderLight }]}>
              <Typography variant="xs" color="textPrimary" weight="medium" style={[styles.cell, { width: 100 }]} numberOfLines={1}>{allocation.loanName}</Typography>
              <Typography variant="xs" color="textMuted" style={[styles.cell, { width: 90 }]}>{formatCurrency(allocation.baseEMI, currencyCode)}</Typography>
              <Typography variant="xs" color={allocation.extraAllocation > 0 ? 'emerald' : 'textMuted'} weight="medium" style={[styles.cell, { width: 90 }]}>
                {allocation.extraAllocation > 0 ? `+${formatCurrency(allocation.extraAllocation, currencyCode)}` : '-'}
              </Typography>
              <Typography variant="xs" color="textPrimary" weight="bold" style={[styles.cell, { width: 100 }]}>{formatCurrency(allocation.totalPayment, currencyCode)}</Typography>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.badgeRow}>
        {/* Target loan chip — shows which loan gets the extra allocation */}
        {targetLoan && extraBudget > 0 && (
          <View style={[styles.footerBadge, { backgroundColor: Colors.emeraldBg }]}>
            <Typography variant="xs" color="emerald" weight="bold">
              Target: {targetLoan}
            </Typography>
          </View>
        )}

        {/* One-time prepayment active indicator */}
        {oneTimePayment > 0 && (
          <View style={[styles.footerBadge, { backgroundColor: '#fef9c3' }]}>
            <Typography variant="xs" color="amber" weight="bold">
              +{formatCurrency(oneTimePayment, currencyCode)} prepaid
            </Typography>
          </View>
        )}

        <View style={[
          styles.footerBadge,
          {
            backgroundColor: Colors.surface,
            borderWidth: 1,
            borderColor: result.confidenceScore >= 70 ? Colors.emerald : result.confidenceScore >= 40 ? Colors.amber : Colors.borderMid
          }
        ]}>
          <Typography
            variant="xs"
            color={result.confidenceScore >= 70 ? 'emerald' : result.confidenceScore >= 40 ? 'amber' : 'textMuted'}
            weight="bold"
          >
            {confidenceLabel(result.confidenceScore)}
          </Typography>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    marginBottom: Spacing.base,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    marginTop: Spacing.xs,
    marginBottom: 2,
  },
  subText: {
    lineHeight: 18,
  },
  scroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  cell: {
    paddingRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  footerBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
});

