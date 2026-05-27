import React, { useState, useCallback, useMemo } from 'react';
import {
  View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getLoans, type LoanRecord } from '@/services/loans';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { formatCurrency } from '@/lib/calculations/emi';
import { Target, Zap, Snowflake } from 'lucide-react-native';
import { compareAllStrategies } from '@/lib/calculations/strategies';
import ExtraPaymentSimulator from '@/components/strategy/ExtraPaymentSimulator';
import AmortizationTable from '@/components/strategy/AmortizationTable';
import StrategyComparisonChart from '@/components/strategy/StrategyComparisonChart';

type StrategyType = 'avalanche' | 'snowball' | 'hybrid';

export default function StrategyScreen() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [strategy, setStrategy] = useState<StrategyType>('avalanche');
  const [extraPayment, setExtraPayment] = useState(0);
  const [oneTimePayment, setOneTimePayment] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await getLoans();
    setLoans(data.filter(l => l.outstandingBalance > 0));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().finally(() => setLoading(false));
    }, [load])
  );
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const results = useMemo(() => {
    if (loans.length === 0) return null;
    const strategyLoans = loans.map(l => ({
      id: l.id,
      name: l.name,
      outstanding: l.outstandingBalance,
      annualRate: l.interestRate,
      emi: l.emiAmount,
    }));
    return compareAllStrategies(strategyLoans, extraPayment, oneTimePayment);
  }, [loans, extraPayment, oneTimePayment]);

  const activeResult = useMemo(() => {
    if (!results) return null;
    return results[strategy];
  }, [results, strategy]);

  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emiAmount, 0);

  const bestStrategy = useMemo(() => {
    if (!results) return null;
    const entries = [
      { key: 'avalanche', saved: results.avalanche.totalSavedVsMinimum },
      { key: 'snowball', saved: results.snowball.totalSavedVsMinimum },
      { key: 'hybrid', saved: results.hybrid.totalSavedVsMinimum },
    ];
    return entries.reduce((best, curr) => curr.saved > best.saved ? curr : best, entries[0]).key;
  }, [results]);

  if (loading) {
    return (
      <View style={s.center}>
        <Typography color="slate">Loading strategies...</Typography>
      </View>
    );
  }

  const sortedLoans = [...loans].sort((a, b) => {
    if (strategy === 'avalanche') return b.interestRate - a.interestRate;
    if (strategy === 'snowball') return a.outstandingBalance - b.outstandingBalance;
    // Hybrid: for display, we'll just show snowball-ish first but logic is smarter
    return a.outstandingBalance - b.outstandingBalance;
  });

  const chartData = results ? [
    { name: 'Baseline', interest: results.baseline.totalInterest, color: '#94A3B8' },
    { name: 'Avalanche', interest: results.avalanche.totalInterestPaid, color: Colors.emerald },
    { name: 'Snowball', interest: results.snowball.totalInterestPaid, color: '#3B82F6' },
    { name: 'Hybrid', interest: results.hybrid.totalInterestPaid, color: '#F59E0B' },
  ] : [];

  return (
    <View style={s.safe}>
      <ScrollView contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />}
        showsVerticalScrollIndicator={false}>

        <View style={s.hero}>
          <View style={s.badgeRow}>
            <Target size={12} color={Colors.emerald} />
            <Typography variant="xs" weight="medium" color="slate" style={s.badgeText}>
              STRATEGY ENGINE
            </Typography>
          </View>
          <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={s.heroTitle}>
            Repayment Strategy
          </Typography>
          <Typography variant="md" color="slate" style={s.heroSub}>
            Compare methods and prioritize your debt payoff for maximum savings.
          </Typography>
        </View>

        {loans.length === 0 ? (
          <Card>
            <EmptyState icon={<Target size={20} color={Colors.slate} />}
              title="No active loans" description="Add loans to compare repayment strategies."
              action={{ label: 'Add a loan', href: '/(drawer)/(tabs)/loans/add' }} />
          </Card>
        ) : (
          <>
            <ExtraPaymentSimulator
              extraPayment={extraPayment}
              oneTimePayment={oneTimePayment}
              onExtraPaymentChange={setExtraPayment}
              onOneTimePaymentChange={setOneTimePayment}
            />

            {/* Savings Overview */}
            {activeResult && (
              <View style={s.savingsRow}>
                <Card style={s.savingsCard}>
                  <Typography variant="xs" color="slate" weight="medium">INTEREST SAVED</Typography>
                  <Typography variant="xl" weight="bold" color="emerald">
                    {formatCurrency(activeResult.totalSavedVsMinimum)}
                  </Typography>
                  <Typography variant="caption" color="slate">vs baseline</Typography>
                </Card>
                <Card style={s.savingsCard}>
                  <Typography variant="xs" color="slate" weight="medium">PAYOFF EARLIER</Typography>
                  <Typography variant="xl" weight="bold" color="navy">
                    {results ? results.baseline.months - activeResult.monthsToPayoff : 0}
                    <Typography variant="sm" weight="medium" color="slate"> mo</Typography>
                  </Typography>
                  <Typography variant="caption" color="slate">
                    {activeResult.payoffDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </Typography>
                </Card>
              </View>
            )}

            {/* Strategy Comparison Chart */}
            {results && (
              <StrategyComparisonChart data={chartData} activeStrategy={strategy} />
            )}

            {/* Strategy Toggle */}
            <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitleAbove}>
              Select Strategy
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.toggleScroll}>
              <TouchableOpacity style={[s.toggle, strategy === 'avalanche' && s.toggleActive]}
                onPress={() => setStrategy('avalanche')}>
                <Zap size={16} color={strategy === 'avalanche' ? Colors.white : Colors.emerald} />
                <View>
                  <Typography weight="bold" color={strategy === 'avalanche' ? 'white' : 'navy'}>
                    Avalanche {bestStrategy === 'avalanche' && <Typography variant="xs" color="emerald" weight="bold"> BEST</Typography>}
                  </Typography>
                  <Typography variant="xs" color={strategy === 'avalanche' ? 'slateLight' : 'slate'}>
                    Highest rate first
                  </Typography>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[s.toggle, strategy === 'snowball' && s.toggleActive]}
                onPress={() => setStrategy('snowball')}>
                <Snowflake size={16} color={strategy === 'snowball' ? Colors.white : '#3B82F6'} />
                <View>
                  <Typography weight="bold" color={strategy === 'snowball' ? 'white' : 'navy'}>
                    Snowball {bestStrategy === 'snowball' && <Typography variant="xs" color="emerald" weight="bold"> BEST</Typography>}
                  </Typography>
                  <Typography variant="xs" color={strategy === 'snowball' ? 'slateLight' : 'slate'}>
                    Smallest balance first
                  </Typography>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[s.toggle, strategy === 'hybrid' && s.toggleActive]}
                onPress={() => setStrategy('hybrid')}>
                <Target size={16} color={strategy === 'hybrid' ? Colors.white : '#F59E0B'} />
                <View>
                  <Typography weight="bold" color={strategy === 'hybrid' ? 'white' : 'navy'}>
                    Hybrid {bestStrategy === 'hybrid' && <Typography variant="xs" color="emerald" weight="bold"> BEST</Typography>}
                  </Typography>
                  <Typography variant="xs" color={strategy === 'hybrid' ? 'slateLight' : 'slate'}>
                    Quick win then rate
                  </Typography>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Priority Order */}
            <Card>
              <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
                Priority order
              </Typography>
              <Typography variant="caption" color="slate" style={s.sectionSub}>
                {strategy === 'avalanche'
                  ? 'Mathematical optimal. Pay highest interest rate first.'
                  : strategy === 'snowball'
                  ? 'Psychological boost. Pay smallest balance first.'
                  : 'Quick win first, then switch to highest interest rate.'}
              </Typography>
              {sortedLoans.map((loan, i) => (
                <View key={loan.id} style={s.priorityRow}>
                  <View style={s.priorityNum}>
                    <Typography variant="caption" weight="bold" color="navy">#{i + 1}</Typography>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="medium" color="navy">{loan.name}</Typography>
                    <Typography variant="sm" color="slate" style={s.priorityMeta}>
                      {formatCurrency(loan.outstandingBalance)} · {loan.interestRate}%
                    </Typography>
                  </View>
                  <Badge text={i === 0 ? 'Target' : 'Minimum'} variant={i === 0 ? 'green' : 'slate'} />
                </View>
              ))}
            </Card>

            {activeResult && (
              <AmortizationTable schedule={activeResult.schedule} />
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
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
  savingsRow: { flexDirection: 'row', gap: Spacing.md },
  savingsCard: { flex: 1, padding: Spacing.md, alignItems: 'center' },
  sectionTitleAbove: { marginTop: Spacing.md, marginBottom: Spacing.sm },
  toggleScroll: { gap: Spacing.md, paddingRight: Spacing.xl },
  toggle: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.base, 
    borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.borderMid, backgroundColor: Colors.white,
    minWidth: 160,
  },
  toggleActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  sectionTitle: { marginBottom: Spacing.sm },
  sectionSub: { marginBottom: Spacing.base, lineHeight: 18 },
  priorityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  priorityNum: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#f1f5f9',
    alignItems: 'center', justifyContent: 'center',
  },
  priorityMeta: { marginTop: 2, },
});
