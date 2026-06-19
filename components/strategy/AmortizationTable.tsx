import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import Typography from '../ui/Typography';
import { formatCurrency, type MonthlyAllocation } from '@/lib/calculations';

type AmortizationTableProps = {
  schedule: MonthlyAllocation[];
  currencyCode?: string;
};

export default function AmortizationTable({ schedule, currencyCode = 'INR' }: AmortizationTableProps) {
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

      <View style={styles.list}>
        {displaySchedule.map((row) => {
          const totalPayment = row.allocations.reduce((s: number, a: { payment: number }) => s + a.payment, 0);
          const totalPrincipal = row.allocations.reduce((s: number, a: { principal: number }) => s + a.principal, 0);
          const totalInterest = row.allocations.reduce((s: number, a: { interest: number }) => s + a.interest, 0);

          return (
            <View key={row.month} style={styles.card}>
              <View style={styles.cardHeader}>
                <Typography variant="sm" weight="bold" color="navy" fontFamily="heading">
                  Month {row.month}
                </Typography>
                <Typography variant="sm" weight="medium" color="slate">
                  {formatCurrency(row.totalDebtRemaining, currencyCode)} left
                </Typography>
              </View>
              
              <View style={styles.cardBody}>
                <View style={styles.metric}>
                  <Typography variant="xs" color="slate" style={{ marginBottom: 2 }}>Payment</Typography>
                  <Typography variant="body" weight="bold" color="navy">{formatCurrency(totalPayment, currencyCode)}</Typography>
                </View>
                <View style={styles.metric}>
                  <Typography variant="xs" color="slate" style={{ marginBottom: 2 }}>Principal</Typography>
                  <Typography variant="body" weight="bold" color="emerald">{formatCurrency(totalPrincipal, currencyCode)}</Typography>
                </View>
                <View style={styles.metric}>
                  <Typography variant="xs" color="slate" style={{ marginBottom: 2 }}>Interest</Typography>
                  <Typography variant="body" weight="bold" color="amber">{formatCurrency(totalInterest, currencyCode)}</Typography>
                </View>
              </View>
            </View>
          );
        })}
      </View>
      
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
  list: {
    gap: Spacing.md,
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
  },
  footer: {
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
});


