import React, { useState, useCallback, useMemo } from 'react';
import {
  View, ScrollView, RefreshControl, StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getLoans, type LoanRecord } from '@/services/loans';
import { getProfile, type FinancialProfile } from '@/services/profile';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { EmptyState } from '@/components/ui/EmptyState';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/lib/calculations/emi';
import { TrendingUp } from 'lucide-react-native';
import InterestLeakDetector from '@/components/analysis/InterestLeakDetector';

export default function AnalysisScreen() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [l, p] = await Promise.all([getLoans(), getProfile()]);
    setLoans(l);
    setProfile(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emiAmount, 0);
  const dti = profile?.monthlyIncome ? (totalEMI / profile.monthlyIncome) * 100 : 0;
  const surplus = profile ? (profile.monthlyIncome - profile.monthlyExpenses - totalEMI) : 0;
  const highRiskLoans = loans.filter(l => l.interestRate >= 15);
  
  const totalInterestPerMonth = useMemo(() => {
    return loans.reduce((s, l) => {
      const monthlyRate = l.interestRate / 12 / 100;
      return s + (l.outstandingBalance * monthlyRate);
    }, 0);
  }, [loans]);

  const leakData = useMemo(() => {
    return loans
      .map(loan => {
        const monthlyInt = loan.outstandingBalance * (loan.interestRate / 12 / 100);
        return {
          id: loan.id,
          name: loan.name,
          interestRate: loan.interestRate,
          monthlyInterest: monthlyInt,
          pctOfTotalLeak: totalInterestPerMonth > 0 ? (monthlyInt / totalInterestPerMonth) * 100 : 0,
        };
      })
      .sort((a, b) => b.monthlyInterest - a.monthlyInterest);
  }, [loans, totalInterestPerMonth]);

  if (loading) {
    return (
      <View style={s.center}>
        <Typography color="slate">Loading analysis...</Typography>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />}
        showsVerticalScrollIndicator={false}>

        <View style={s.hero}>
          <View style={s.badgeRow}>
            <TrendingUp size={12} color={Colors.emerald} />
            <Typography variant="xs" weight="bold" color="emerald" style={s.badgeText}>
              DEEP ANALYSIS
            </Typography>
          </View>
          <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={s.heroTitle}>
            Analysis
          </Typography>
          <Typography color="slate" style={s.heroSub}>
            Real-time debt health signals and affordability insights.
          </Typography>
        </View>

        {loans.length === 0 ? (
          <Card>
            <EmptyState icon={<TrendingUp size={20} color={Colors.slate} />}
              title="No data yet" description="Add loans to see detailed analysis."
              action={{ label: 'Add a loan', href: '/(drawer)/(tabs)/loans/add' }} />
          </Card>
        ) : (
          <>
            <View style={s.metricsGrid}>
              <MetricCard label="Debt-to-Income" value={`${dti.toFixed(1)}%`}
                valueColor={dti > 40 ? 'red' : dti > 30 ? 'amber' : 'emerald'}
                description={dti > 40 ? 'Above safe threshold' : 'Within safe range'} style={s.half} />
              <MetricCard label="Monthly surplus" value={formatCurrency(Math.max(0, surplus))}
                valueColor={surplus < 0 ? 'red' : 'emerald'}
                description={surplus < 0 ? 'Deficit detected' : 'After EMI + expenses'} style={s.half} />
              <MetricCard label="Interest leak" value={formatCurrency(totalInterestPerMonth)}
                description="Monthly interest paid" valueColor="amber" style={s.half} />
              <MetricCard label="High-risk loans" value={highRiskLoans.length}
                description={`Loans above 15% rate`}
                valueColor={highRiskLoans.length > 0 ? 'red' : 'emerald'} style={s.half} />
            </View>

            <InterestLeakDetector 
              leaks={leakData} 
              totalInterestPerMonth={totalInterestPerMonth} 
            />

            {profile && (
              <Card>
                <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
                  Financial profile
                </Typography>
                {[
                  ['Monthly income', formatCurrency(profile.monthlyIncome)],
                  ['Monthly expenses', formatCurrency(profile.monthlyExpenses)],
                  ['Total EMI', formatCurrency(totalEMI)],
                  ['Net surplus', formatCurrency(Math.max(0, surplus))],
                  ['Credit score range', profile.creditScoreRange],
                  ['Emergency fund', profile.hasEmergencyFund ? `${profile.emergencyFundMonths} months` : 'No'],
                ].map(([l, v]) => (
                  <View key={l} style={s.profileRow}>
                    <Typography variant="body" color="slate">{l}</Typography>
                    <Typography variant="body" weight="medium" color="navy">{v}</Typography>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, gap: Spacing.base },
  hero: {
    backgroundColor: Colors.white, borderRadius: Radius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...Shadows.card,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  badgeText: { letterSpacing: 0.6 },
  heroTitle: { letterSpacing: -0.5, marginBottom: 4 },
  heroSub: { lineHeight: 22 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  half: { width: '47%', flexGrow: 1 },
  sectionTitle: { marginBottom: Spacing.sm },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
});
