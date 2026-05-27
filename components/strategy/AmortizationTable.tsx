import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import Typography from '../ui/Typography';
import { formatCurrency } from '@/lib/calculations/emi';
import type { MonthlyAllocation } from '@/lib/calculations/strategies';

type AmortizationTableProps = {
  schedule: MonthlyAllocation[];
};

export default function AmortizationTable({ schedule }: AmortizationTableProps) {
  // Only show first 36 months to keep it performant
  const displaySchedule = schedule.slice(0, 36);

  return (
    <View style={styles.container}>
      <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={styles.title}>
        Payment Schedule
      </Typography>
      <Typography variant="xs" color="slate" style={styles.sub}>
        Next 3 years of your debt-free journey
      </Typography>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        <View>
          <View style={styles.tableHeader}>
            <Typography variant="xs" weight="bold" color="slate" style={[styles.cell, { width: 50 }]}>Month</Typography>
            <Typography variant="xs" weight="bold" color="slate" style={[styles.cell, { width: 100 }]}>Payment</Typography>
            <Typography variant="xs" weight="bold" color="slate" style={[styles.cell, { width: 100 }]}>Principal</Typography>
            <Typography variant="xs" weight="bold" color="slate" style={[styles.cell, { width: 100 }]}>Interest</Typography>
            <Typography variant="xs" weight="bold" color="slate" style={[styles.cell, { width: 120 }]}>Balance</Typography>
          </View>

          {displaySchedule.map((row) => {
            const totalPayment = row.allocations.reduce((s, a) => s + a.payment, 0);
            const totalPrincipal = row.allocations.reduce((s, a) => s + a.principal, 0);
            const totalInterest = row.allocations.reduce((s, a) => s + a.interest, 0);

            return (
              <View key={row.month} style={styles.tableRow}>
                <Typography variant="xs" color="navy" style={[styles.cell, { width: 50 }]}>{row.month}</Typography>
                <Typography variant="xs" color="navy" weight="medium" style={[styles.cell, { width: 100 }]}>{formatCurrency(totalPayment)}</Typography>
                <Typography variant="xs" color="emerald" style={[styles.cell, { width: 100 }]}>{formatCurrency(totalPrincipal)}</Typography>
                <Typography variant="xs" color="red" style={[styles.cell, { width: 100 }]}>{formatCurrency(totalInterest)}</Typography>
                <Typography variant="xs" color="navy" weight="semiBold" style={[styles.cell, { width: 120 }]}>{formatCurrency(row.totalDebtRemaining)}</Typography>
              </View>
            );
          })}
        </View>
      </ScrollView>
      
      {schedule.length > 36 && (
        <Typography variant="caption" color="slate" style={styles.footer}>
          + {schedule.length - 36} more months in full schedule
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginTop: Spacing.base,
  },
  title: {
    marginBottom: 4,
  },
  sub: {
    marginBottom: Spacing.lg,
  },
  scroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingVertical: Spacing.sm,
  },
  cell: {
    paddingRight: 10,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
