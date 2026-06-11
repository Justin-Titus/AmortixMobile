import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';
import Typography from '../ui/Typography';
import { formatCurrency } from '@/lib/calculations';

type LoanLeak = {
  id: string;
  name: string;
  interestRate: number;
  monthlyInterest: number;
  pctOfTotalLeak: number;
};

type InterestLeakDetectorProps = {
  leaks: LoanLeak[];
  totalInterestPerMonth: number;
  currencyCode?: string;
};

export default function InterestLeakDetector({ leaks, totalInterestPerMonth, currencyCode = 'INR' }: InterestLeakDetectorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={18} color={Colors.amber} />
        <Typography variant="body" weight="bold" color="navy" fontFamily="heading">
          Avoidable Interest Analysis
        </Typography>
      </View>
      <Typography variant="sm" color="slate" style={styles.subText}>
        Monthly interest bleeding from each loan
      </Typography>

      {leaks.map((loan) => (
        <View key={loan.id} style={styles.leakRow}>
          <View style={styles.leakInfo}>
            <View style={styles.leakLabelRow}>
              <Typography weight="medium" color="navy">{loan.name}</Typography>
              <Typography variant="caption" weight="bold" color={loan.interestRate >= 15 ? 'red' : 'amber'}>
                {loan.interestRate}%
              </Typography>
            </View>
            <Typography variant="sm" color="slate">
              {formatCurrency(loan.monthlyInterest, currencyCode)} / mo
            </Typography>
          </View>
          
          <View style={styles.barContainer}>
            <View style={styles.barBg}>
              <View style={[styles.barFill, {
                width: `${Math.min(100, loan.pctOfTotalLeak)}%`,
                backgroundColor: loan.interestRate >= 15 ? Colors.red : loan.interestRate >= 12 ? Colors.amber : Colors.emerald,
              }]} />
            </View>
            <Typography variant="xs" color="slate" style={styles.pctText}>
              {Math.round(loan.pctOfTotalLeak)}%
            </Typography>
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Typography variant="sm" color="slate">Monthly Interest Cost:</Typography>
        <Typography variant="lg" weight="bold" color="red" fontFamily="heading">
          {formatCurrency(totalInterestPerMonth, currencyCode)}
        </Typography>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  subText: {
    marginBottom: Spacing.lg,
  },
  leakRow: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leakInfo: {
    marginBottom: 8,
  },
  leakLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  pctText: {
    width: 30,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});

