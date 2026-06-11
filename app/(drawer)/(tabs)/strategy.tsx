import React, { useState, useCallback, useMemo } from 'react';
import {
  View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getLoans, type LoanRecord } from '@/services/loans';
import { getProfile } from '@/services/profile';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { useOfflineData } from '@/hooks/useOfflineData';
import {
  saveOfflineLoans, getOfflineLoans,
  saveOfflineProfile, getOfflineProfile,
} from '@/lib/offline/cache';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { exportAmortizationSchedulePDF } from '@/lib/export/pdf';
import { formatCurrency, compareAllStrategies, getCurrencyConfig } from '@/lib/calculations';
import { Target, Zap, Snowflake, FileText } from 'lucide-react-native';
import EMIOptimizerPanel from '@/components/strategy/EMIOptimizerPanel';
import ExtraPaymentSimulator from '@/components/strategy/ExtraPaymentSimulator';
import AmortizationTable from '@/components/strategy/AmortizationTable';
import StrategyComparisonChart from '@/components/strategy/StrategyComparisonChart';
import { Skeleton } from '@/components/ui/Skeleton';

type StrategyType = 'avalanche' | 'snowball' | 'hybrid';

export default function StrategyScreen() {
  const [strategy, setStrategy] = useState<StrategyType>('avalanche');
  const [extraPayment, setExtraPayment] = useState(0);
  const [oneTimePayment, setOneTimePayment] = useState(0);
  const [extraBudget, setExtraBudget] = useState(0);

  const fetcher = useCallback(async () => {
    const [loansData, profileData] = await Promise.all([getLoans(), getProfile()]);
    return { loans: loansData, profile: profileData };
  }, []);

  const cacher = useCallback(async (data: { loans: LoanRecord[], profile: any }) => {
    await saveOfflineLoans(data.loans);
    if (data.profile) await saveOfflineProfile(data.profile);
  }, []);

  const reader = useCallback(async () => {
    const loans = await getOfflineLoans();
    const profile = await getOfflineProfile();
    return { loans, profile };
  }, []);

  const { data, loading, refreshing, isOffline, lastSync, refresh } = useOfflineData({
    fetcher,
    cacher,
    reader
  });

  useFocusEffect(
    useCallback(() => {
      const STALE_MS = 5 * 60 * 1000;
      const lastSyncTs = lastSync ? new Date(lastSync).getTime() : 0;
      if (Date.now() - lastSyncTs > STALE_MS) {
        refresh();
      }
    }, [refresh, lastSync])
  );

  const loans = useMemo(() => {
    const allLoans = data?.loans ?? [];
    return allLoans.filter(l => l.outstandingBalance > 0);
  }, [data]);

  const currencyCode = data?.profile?.currency ?? 'INR';

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
  const avgRate = totalOutstanding > 0
    ? loans.reduce((s, l) => s + l.interestRate * l.outstandingBalance, 0) / totalOutstanding : 0;

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
      <View style={[s.safe, { backgroundColor: Colors.background }]}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={[s.hero, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}>
            <Skeleton width={120} height={16} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width={200} height={32} style={{ marginBottom: 4 }} />
            <Skeleton width="100%" height={16} />
          </View>

          <Card>
            <Skeleton width={180} height={20} style={{ marginBottom: Spacing.md }} />
            <Skeleton width="100%" height={40} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width="100%" height={40} />
          </Card>

          <View style={s.savingsRow}>
            <Card style={s.savingsCard}>
              <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
              <Skeleton width={120} height={32} style={{ marginBottom: 4 }} />
              <Skeleton width={60} height={12} />
            </Card>
            <Card style={s.savingsCard}>
              <Skeleton width={100} height={12} style={{ marginBottom: 8 }} />
              <Skeleton width={80} height={32} style={{ marginBottom: 4 }} />
              <Skeleton width={60} height={12} />
            </Card>
          </View>

          <Card>
            <Skeleton width="100%" height={200} />
          </Card>

          {/* Select Strategy Toggle Skeleton */}
          <Skeleton width={120} height={18} style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }} />
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xs }}>
            {[1, 2, 3].map(i => (
              <Card key={i} style={{ flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minWidth: 140 }}>
                <Skeleton width={30} height={16} style={{ marginBottom: 6 }} />
                <Skeleton width={80} height={16} />
              </Card>
            ))}
          </View>

          {/* Priority Order Card Skeleton */}
          <Card>
            <Skeleton width={120} height={20} style={{ marginBottom: Spacing.xs }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: Spacing.md }} />
            {[1, 2, 3].map(i => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight }}>
                <Skeleton width={32} height={32} borderRadius={10} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Skeleton width={100} height={16} />
                  <Skeleton width={140} height={12} />
                </View>
                <Skeleton width={50} height={20} borderRadius={10} />
              </View>
            ))}
          </Card>

          {/* PDF Export Button Skeleton */}
          <Skeleton width="100%" height={48} borderRadius={Radius.button} />

          {/* Amortization Table Card Skeleton */}
          <Card>
            <Skeleton width={160} height={20} style={{ marginBottom: Spacing.xs }} />
            <Skeleton width={220} height={14} style={{ marginBottom: Spacing.lg }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: 8 }}>
              <Skeleton width={40} height={14} />
              <Skeleton width={60} height={14} />
              <Skeleton width={60} height={14} />
              <Skeleton width={60} height={14} />
            </View>
            {[1, 2, 3, 4, 5].map(i => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Skeleton width={30} height={14} />
                <Skeleton width={60} height={14} />
                <Skeleton width={60} height={14} />
                <Skeleton width={60} height={14} />
              </View>
            ))}
          </Card>
        </ScrollView>
      </View>
    );
  }

  const sortedLoans = [...loans].sort((a, b) => {
    if (strategy === 'avalanche') return b.interestRate - a.interestRate;
    if (strategy === 'snowball') return a.outstandingBalance - b.outstandingBalance;
    return a.outstandingBalance - b.outstandingBalance;
  });

  const chartData = results ? [
    { name: 'Baseline', interest: results.baseline.totalInterest, color: '#94A3B8' },
    { name: 'Avalanche', interest: results.avalanche.totalInterestPaid, color: '#118c76' },
    { name: 'Snowball', interest: results.snowball.totalInterestPaid, color: '#3B82F6' },
    { name: 'Hybrid', interest: results.hybrid.totalInterestPaid, color: '#F59E0B' },
  ] : [];

  return (
    <View style={[s.safe, { backgroundColor: Colors.background }]}>
      <ScrollView 
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.emerald} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline Alert Banner */}
        {isOffline && <OfflineBanner lastSync={lastSync} />}

        <View style={[s.hero, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}>
          <View style={s.badgeRow}>
            <Target size={12} color={Colors.emerald} />
            <Typography variant="xs" weight="medium" color="textMuted" style={s.badgeText}>
              STRATEGY ENGINE
            </Typography>
          </View>
          <Typography variant="h2" weight="bold" color="textPrimary" fontFamily="heading" style={s.heroTitle}>
            Repayment Strategy
          </Typography>
          <Typography variant="md" color="textMuted" style={s.heroSub}>
            Compare methods and prioritize your debt payoff for maximum savings.
          </Typography>
        </View>

        {loans.length === 0 ? (
          <Card>
            <EmptyState icon={<Target size={20} color={Colors.textMuted} />}
              title="No active loans" description="Add loans to compare repayment strategies."
              action={isOffline ? undefined : { label: 'Add a loan', href: '/(drawer)/(tabs)/loans/add' }} />
          </Card>
        ) : (
          <>
            <EMIOptimizerPanel
              loans={loans}
              extraBudget={extraPayment}
              onExtraBudgetChange={setExtraPayment}
              oneTimePayment={oneTimePayment}
              onOneTimePaymentChange={setOneTimePayment}
              currencyCode={currencyCode}
            />

            {/* Savings Overview */}
            {activeResult && (
              <View style={s.savingsRow}>
                <Card style={s.savingsCard}>
                  <Typography variant="xs" color="textMuted" weight="medium">INTEREST SAVED</Typography>
                  <Typography variant="xl" weight="bold" color="emerald">
                    {formatCurrency(activeResult.totalSavedVsMinimum, currencyCode)}
                  </Typography>
                  <Typography variant="caption" color="textMuted">vs baseline</Typography>
                </Card>
                <Card style={s.savingsCard}>
                  <Typography variant="xs" color="textMuted" weight="medium">PAYOFF EARLIER</Typography>
                  <Typography variant="xl" weight="bold" color="textPrimary">
                    {results ? results.baseline.months - activeResult.monthsToPayoff : 0}
                    <Typography variant="sm" weight="medium" color="textMuted"> mo</Typography>
                  </Typography>
                  <Typography variant="caption" color="textMuted">
                    {activeResult.payoffDate.toLocaleDateString(getCurrencyConfig(currencyCode).locale, { month: 'short', year: 'numeric' })}
                  </Typography>
                </Card>
              </View>
            )}

            {/* Rollover Magic Explanation */}
            {activeResult && loans.length >= 2 && (
              <View style={{ marginTop: Spacing.md, padding: Spacing.md, backgroundColor: '#ecfdf5', borderRadius: Radius.card, borderWidth: 1, borderColor: '#a7f3d0', flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
                <View style={{ backgroundColor: '#d1fae5', padding: 4, borderRadius: 100, marginTop: 2 }}>
                  <Zap size={16} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Typography variant="sm" weight="bold" style={{ color: '#064e3b', marginBottom: 4 }}>The "Rollover" Magic</Typography>
                  <Typography variant="xs" style={{ color: '#065f46', lineHeight: 18 }}>
                    How are you saving so much without adding extra budget? When one loan finishes, its monthly payment is automatically rolled over into your next loan. You keep paying the exact same total amount out-of-pocket every month, but you crush your debt years earlier!
                  </Typography>
                </View>
              </View>
            )}

            {/* Strategy Comparison Chart */}
            {results && (
              <StrategyComparisonChart data={chartData} activeStrategy={strategy} currencyCode={currencyCode} />
            )}

            {/* Strategy Toggle */}
            <Typography variant="body" weight="bold" color="textPrimary" fontFamily="heading" style={s.sectionTitleAbove}>
              Select Strategy
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.toggleScroll}>
              <TouchableOpacity style={[
                s.toggle, 
                strategy === 'avalanche' && s.toggleActive,
                { borderColor: Colors.borderMid, backgroundColor: strategy === 'avalanche' ? Colors.navyDeep : Colors.surface }
              ]}
                onPress={() => setStrategy('avalanche')}>
                <Zap size={16} color={strategy === 'avalanche' ? '#ffffff' : '#118c76'} />
                <View>
                  <Typography weight="bold" color={strategy === 'avalanche' ? 'white' : 'textPrimary'}>
                    Avalanche {bestStrategy === 'avalanche' && <Typography variant="xs" color="emerald" weight="bold"> BEST</Typography>}
                  </Typography>
                  <Typography variant="xs" color={strategy === 'avalanche' ? 'slateLight' : 'textMuted'}>
                    Highest rate first
                  </Typography>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[
                s.toggle, 
                strategy === 'snowball' && s.toggleActive,
                { borderColor: Colors.borderMid, backgroundColor: strategy === 'snowball' ? Colors.navyDeep : Colors.surface }
              ]}
                onPress={() => setStrategy('snowball')}>
                <Snowflake size={16} color={strategy === 'snowball' ? '#ffffff' : '#3B82F6'} />
                <View>
                  <Typography weight="bold" color={strategy === 'snowball' ? 'white' : 'textPrimary'}>
                    Snowball {bestStrategy === 'snowball' && <Typography variant="xs" color="emerald" weight="bold"> BEST</Typography>}
                  </Typography>
                  <Typography variant="xs" color={strategy === 'snowball' ? 'slateLight' : 'textMuted'}>
                    Smallest balance first
                  </Typography>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={[
                s.toggle, 
                strategy === 'hybrid' && s.toggleActive,
                { borderColor: Colors.borderMid, backgroundColor: strategy === 'hybrid' ? Colors.navyDeep : Colors.surface }
              ]}
                onPress={() => setStrategy('hybrid')}>
                <Target size={16} color={strategy === 'hybrid' ? '#ffffff' : '#F59E0B'} />
                <View>
                  <Typography weight="bold" color={strategy === 'hybrid' ? 'white' : 'textPrimary'}>
                    Hybrid {bestStrategy === 'hybrid' && <Typography variant="xs" color="emerald" weight="bold"> BEST</Typography>}
                  </Typography>
                  <Typography variant="xs" color={strategy === 'hybrid' ? 'slateLight' : 'textMuted'}>
                    Quick win then rate
                  </Typography>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {results && results.avalanche.totalInterestPaid === results.snowball.totalInterestPaid && results.avalanche.totalInterestPaid === results.hybrid.totalInterestPaid && (
              <View style={{ marginTop: Spacing.md, padding: Spacing.md, backgroundColor: '#eff6ff', borderRadius: Radius.card, borderWidth: 1, borderColor: '#bfdbfe', flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm }}>
                <Target size={20} color="#3b82f6" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Typography variant="sm" weight="bold" style={{ color: '#1e3a8a', marginBottom: 4 }}>Why are the results identical?</Typography>
                  <Typography variant="xs" style={{ color: '#1d4ed8', lineHeight: 18 }}>
                    Your smallest balance loan also has the highest interest rate! Because of this, both Avalanche and Snowball target the exact same loan first, producing identical payoff paths.
                  </Typography>
                </View>
              </View>
            )}

            {/* Priority Order */}
            <Card>
              <Typography variant="body" weight="bold" color="textPrimary" fontFamily="heading" style={s.sectionTitle}>
                Priority order
              </Typography>
              <Typography variant="caption" color="textMuted" style={s.sectionSub}>
                {strategy === 'avalanche'
                  ? 'Mathematical optimal. Pay highest interest rate first.'
                  : strategy === 'snowball'
                  ? 'Psychological boost. Pay smallest balance first.'
                  : 'Quick win first, then switch to highest interest rate.'}
              </Typography>
              {sortedLoans.map((loan, i) => (
                <View key={loan.id} style={[s.priorityRow, { borderBottomColor: Colors.borderLight }]}>
                  <View style={[s.priorityNum, { backgroundColor: '#f1f5f9' }]}>
                    <Typography variant="caption" weight="bold" color="textPrimary">#{i + 1}</Typography>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Typography variant="body" weight="medium" color="textPrimary">{loan.name}</Typography>
                    <Typography variant="sm" color="textMuted" style={s.priorityMeta}>
                      {formatCurrency(loan.outstandingBalance, currencyCode)} · {loan.interestRate}%
                    </Typography>
                  </View>
                  <Badge text={i === 0 ? 'Target' : 'Minimum'} variant={i === 0 ? 'green' : 'slate'} />
                </View>
              ))}
            </Card>

            {/* PDF Export Button */}
            {activeResult && (
              <TouchableOpacity
                style={[s.exportBtn, { borderColor: Colors.borderLight, backgroundColor: Colors.surface }]}
                onPress={async () => {
                  const pdfSchedule = activeResult.schedule.map(row => {
                    const totalPayment = row.allocations.reduce((sum, a) => sum + a.payment, 0);
                    const totalPrincipal = row.allocations.reduce((sum, a) => sum + a.principal, 0);
                    const totalInterest = row.allocations.reduce((sum, a) => sum + a.interest, 0);
                    return {
                      month: row.month,
                      emi: totalPayment,
                      principalComponent: totalPrincipal,
                      interestComponent: totalInterest,
                      outstandingBalance: row.totalDebtRemaining,
                    };
                  });

                  await exportAmortizationSchedulePDF({
                    loanName: `Consolidated Payoff (${strategy.toUpperCase()})`,
                    principal: totalOutstanding,
                    interestRate: Number(avgRate.toFixed(2)),
                    tenureMonths: activeResult.monthsToPayoff,
                    emiAmount: totalEMI + extraPayment,
                    currencyCode,
                    schedule: pdfSchedule,
                  });
                }}
              >
                <FileText size={16} color={Colors.emerald} />
                <Typography variant="body" weight="semiBold" color="emerald">
                  Export payoff schedule PDF
                </Typography>
              </TouchableOpacity>
            )}

            {activeResult && (
              <AmortizationTable schedule={activeResult.schedule} currencyCode={currencyCode} />
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, gap: Spacing.base },
  hero: {
    borderRadius: Radius.card, padding: Spacing.lg,
    borderWidth: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base, 
    borderRadius: Radius.lg,
    borderWidth: 1,
    minWidth: 160,
  },
  toggleActive: { },
  sectionTitle: { marginBottom: Spacing.sm },
  sectionSub: { marginBottom: Spacing.base, lineHeight: 18 },
  priorityRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  priorityNum: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityMeta: { marginTop: 2, },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.button,
    paddingVertical: Spacing.base,
    shadowColor: '#09111f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginVertical: Spacing.xs,
  },
});

