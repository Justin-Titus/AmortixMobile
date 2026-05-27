import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, ScrollView, RefreshControl, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getLoans, type LoanRecord } from '@/services/loans';
import { getProfile, getHealthSnapshots, type FinancialProfile, type HealthSnapshot } from '@/services/profile';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { formatCurrency, formatCompactCurrency } from '@/lib/calculations/emi';
import {
  Sparkles, ArrowRight, Plus, MessageSquarePlus, AlertTriangle, TrendingUp,
} from 'lucide-react-native';
import { calculateAffordabilityScore } from '@/lib/calculations/affordability';
import { calculateStrategy } from '@/lib/calculations/strategies';
import AffordabilityGauge from '@/components/dashboard/AffordabilityGauge';
import DebtDistribution from '@/components/dashboard/DebtDistribution';
import HealthTrendChart from '@/components/analysis/HealthTrendChart';

const loanColors = ['#1E3A5F', '#059669', '#F59E0B', '#378ADD', '#DC2626', '#34D399'];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [snapshots, setSnapshots] = useState<HealthSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [loansData, profileData, snapshotsData] = await Promise.all([
      getLoans(),
      getProfile(),
      getHealthSnapshots()
    ]);
    setLoans(loansData);
    setProfile(profileData);
    setSnapshots(snapshotsData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData().finally(() => setLoading(false));
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emiAmount, 0);
  const avgRate = totalOutstanding > 0
    ? loans.reduce((s, l) => s + l.interestRate * l.outstandingBalance, 0) / totalOutstanding : 0;
  const hasLoans = loans.length > 0;
  const projectedMonths = totalEMI > 0 ? Math.max(1, Math.ceil(totalOutstanding / totalEMI)) : 0;
  const debtFreeDate = projectedMonths > 0
    ? new Date(new Date().setMonth(new Date().getMonth() + projectedMonths)) : null;

  const emiToIncomeRatio = profile?.monthlyIncome
    ? Math.round((totalEMI / profile.monthlyIncome) * 100) : 0;


  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = (user?.user_metadata?.full_name ?? 'there').split(' ')[0];

  const affordability = useMemo(() => {
    if (!profile?.monthlyIncome || profile.monthlyIncome <= 0) return null;
    return calculateAffordabilityScore({
      monthlyIncome: profile.monthlyIncome,
      monthlyExpenses: profile.monthlyExpenses,
      totalMonthlyEMI: totalEMI,
      creditScoreRange: profile.creditScoreRange ?? 'Not provided',
      hasEmergencyFund: Boolean(profile.hasEmergencyFund),
      emergencyFundMonths: profile.emergencyFundMonths ?? 0,
      loans: loans.map(l => ({
        annualRate: l.interestRate,
        tenureMonths: l.tenureMonths,
        rateType: l.rateType,
      })),
    });
  }, [loans, profile, totalEMI]);

  const strategyResults = useMemo(() => {
    if (!hasLoans) return null;
    const strategyLoans = loans
      .filter(l => l.outstandingBalance > 0 && l.emiAmount > 0)
      .map(l => ({
        id: l.id,
        name: l.name,
        outstanding: l.outstandingBalance,
        annualRate: l.interestRate,
        emi: l.emiAmount,
      }));
    if (strategyLoans.length === 0) return null;
    
    return {
      avalanche: calculateStrategy(strategyLoans, 0, 'avalanche'),
      snowball: calculateStrategy(strategyLoans, 0, 'snowball'),
      baseline: calculateStrategy(strategyLoans, 0, 'avalanche'), // Minimum payments
    };
  }, [loans, hasLoans]);

  const dynamicInsight = useMemo(() => {
    if (!hasLoans) return 'Add your first loan to see AI-powered debt insights.';
    if (!strategyResults) return 'Calculating payoff strategies...';

    const parts: string[] = [];
    const avalancheSaved = strategyResults.baseline.totalInterestPaid - strategyResults.avalanche.totalInterestPaid;
    const snowballSaved = strategyResults.baseline.totalInterestPaid - strategyResults.snowball.totalInterestPaid;
    
    const best = avalancheSaved >= snowballSaved ? 'Avalanche' : 'Snowball';
    const saved = Math.max(avalancheSaved, snowballSaved);
    const months = strategyResults.baseline.monthsToPayoff - Math.min(strategyResults.avalanche.monthsToPayoff, strategyResults.snowball.monthsToPayoff);

    if (saved > 0) {
      parts.push(`Optimal strategy (${best}) saves you ${formatCurrency(saved)}.`);
    }
    if (months > 0) {
      parts.push(`You can be debt-free ${months} months earlier.`);
    }
    if (affordability) {
      parts.push(`Financial health is in the ${affordability.zone.toLowerCase()} zone.`);
    }

    return parts.join(' ') || `Managing ${formatCurrency(totalOutstanding)} across ${loans.length} active loans.`;
  }, [hasLoans, strategyResults, affordability, totalOutstanding, loans.length]);


  const distributionData = useMemo(() => {
    return loans
      .filter(l => l.outstandingBalance > 0)
      .map((l, i) => ({
        name: l.name,
        balance: l.outstandingBalance,
        color: loanColors[i % loanColors.length],
      }));
  }, [loans]);

  if (loading) {
    return (
      <View style={s.loadingBox}>
        <Typography color="slate">Loading dashboard...</Typography>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Page Hero */}
      <View style={s.hero}>
        <View style={s.badgeRow}>
          <Sparkles size={12} color={Colors.emerald} />
          <Typography variant="xs" weight="medium" color="slate" style={s.badgeText}>
            PORTFOLIO OVERVIEW
          </Typography>
        </View>
        <Typography variant="hero" weight="bold" color="navy" fontFamily="heading" style={s.heroTitle}>
          Dashboard
        </Typography>
        <Typography variant="md" color="slate" style={s.heroDesc}>
          {greeting}, {firstName}. Your workspace is optimized with smart tools for efficient loan payoff.
        </Typography>

        {/* Quick stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Open loans', value: String(loans.length) },
            { label: 'Outstanding', value: formatCompactCurrency(totalOutstanding) },
            { label: 'Avg rate', value: `${avgRate.toFixed(1)}%` },
          ].map((st) => (
            <View key={st.label} style={s.statItem}>
              <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
                {st.value}
              </Typography>
              <Typography variant="xs" color="slate">
                {st.label}
              </Typography>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.heroActions}>
          <TouchableOpacity style={s.primaryBtn} onPress={() => router.push('/(drawer)/(tabs)/loans/add')}>
            <Typography weight="bold" color="white">Add loan</Typography>
            <ArrowRight size={14} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => router.push('/(drawer)/(tabs)/insights')}>
            <Typography weight="bold" color="navy">Open insights</Typography>
          </TouchableOpacity>
        </View>

        {/* Banners */}
        {emiToIncomeRatio > 100 ? (
          <View style={s.criticalBanner}>
            <AlertTriangle size={14} color="#dc2626" />
            <Typography variant="caption" weight="bold" color="red">
              Critical: EMI exceeds your monthly income.
            </Typography>
          </View>
        ) : hasLoans ? (
          <View style={s.insightBanner}>
            <View style={s.insightDot} />
            <Typography variant="sm" weight="medium" color="navy" style={s.insightText} numberOfLines={2}>
              {dynamicInsight}
            </Typography>
          </View>
        ) : null}
      </View>

      {/* Metric Cards */}
      <View style={s.metricsGrid}>
        <MetricCard label="Total outstanding" value={formatCurrency(totalOutstanding)}
          description="Across every active balance" isEmpty={!hasLoans} style={s.metricHalf} />
        <MetricCard label="Monthly EMI" value={formatCurrency(totalEMI)}
          description="Current recurring outflow" isEmpty={!hasLoans} style={s.metricHalf} />
        <MetricCard label="Avg rate" value={`${avgRate.toFixed(2)}%`}
          description="Weighted average" isEmpty={!hasLoans} style={s.metricHalf}
          valueColor={avgRate > 12 ? 'amber' : 'default'} />
        <MetricCard label="Debt-free by"
          value={debtFreeDate ? debtFreeDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '-'}
          description={debtFreeDate ? 'With current strategy' : 'Add loans to see'}
          isEmpty={!hasLoans} style={s.metricHalf} valueColor={debtFreeDate ? 'amber' : 'muted'} />
      </View>

      {/* Health Trend Chart */}
      {hasLoans && (
        <HealthTrendChart snapshots={snapshots} />
      )}

      {/* Active Loans or Empty State */}
      {!hasLoans ? (
        <Card>
          <EmptyState
            icon={<MessageSquarePlus size={20} color={Colors.emerald} />}
            title="Your cockpit is ready"
            description="Add your first loan to start tracking repayment progress."
            action={{ label: 'Add your first loan', href: '/(drawer)/(tabs)/loans/add' }}
          />
        </Card>
      ) : (
        <Card>
          <View style={s.sectionHeader}>
            <View>
              <Typography variant="body" weight="bold" color="navy" fontFamily="heading">
                Active loans
              </Typography>
              <Typography variant="sm" color="slate">
                See payoff progress and prioritize faster wins.
              </Typography>
            </View>
          </View>

          <View style={s.loansList}>
            {loans.map((loan, index) => {
              const pct = Math.max(0, Math.min(100, ((loan.principal - loan.outstandingBalance) / Math.max(loan.principal, 1)) * 100));
              const color = loanColors[index % loanColors.length];
              return (
                <TouchableOpacity
                  key={loan.id}
                  style={s.loanRow}
                  onPress={() => router.push({ pathname: '/(drawer)/(tabs)/loans/[id]', params: { id: loan.id } })}
                >
                  <View style={s.loanHeader}>
                    <View style={s.loanNameRow}>
                      <View style={[s.loanDot, { backgroundColor: color }]} />
                      <Typography variant="body" color="navy" weight="medium" numberOfLines={1} style={s.loanName}>
                        {loan.name}
                      </Typography>
                    </View>
                    <Badge text={`${loan.interestRate.toFixed(2)}%`} variant="slate" />
                  </View>
                  <View style={s.loanMeta}>
                    <Typography variant="caption" color="slate">{formatCurrency(loan.outstandingBalance)} left</Typography>
                    <Typography variant="caption" color="slate">{formatCurrency(loan.emiAmount)}/mo</Typography>
                  </View>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={s.cardActionBtn} 
            onPress={() => router.push('/(drawer)/(tabs)/loans/add')}
          >
            <Plus size={16} color={Colors.emerald} />
            <Typography variant="body" weight="semiBold" color="emerald">
              Add another loan
            </Typography>
          </TouchableOpacity>
        </Card>
      )}

      {/* Analytics Row */}
      {hasLoans && (
        <View style={s.analyticsRow}>
          <Card style={s.affordabilityCard}>
            <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
              Affordability
            </Typography>
            {affordability ? (
              <AffordabilityGauge score={affordability.score} />
            ) : (
              <View style={s.emptyGauge}>
                <Typography variant="xs" color="slate" style={{ textAlign: 'center' }}>
                  Update profile to see score
                </Typography>
              </View>
            )}
          </Card>

          <Card style={s.distributionCard}>
            <DebtDistribution loans={distributionData} />
          </Card>
        </View>
      )}

      {/* AI Insight Card */}
      {hasLoans && (
        <Card style={s.aiCard}>
          <View style={s.aiHeader}>
            <View style={s.aiIcon}>
              <Sparkles size={18} color={Colors.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography variant="body" weight="bold" color="navy" fontFamily="heading">
                AI insight
              </Typography>
              <Typography variant="caption" color="slate" style={s.aiText}>
                {emiToIncomeRatio > 40
                  ? `Your EMI obligations consume ${emiToIncomeRatio}% of income. Focus on high-cost balances.`
                  : loans.length > 1
                  ? `You have ${loans.length} active loans. Avalanche strategy saves the most interest.`
                  : `Allocating extra toward your outstanding debt can shorten payoff significantly.`}
              </Typography>
            </View>
          </View>
          <TouchableOpacity style={s.aiAction} onPress={() => router.push('/(drawer)/(tabs)/chat')}>
            <Typography variant="caption" weight="medium" color="emerald">Ask AI advisor</Typography>
            <ArrowRight size={14} color={Colors.emerald} />
          </TouchableOpacity>
        </Card>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, gap: Spacing.base, paddingTop: Spacing.md },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: {
    backgroundColor: Colors.white, borderRadius: Radius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#09111f', shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.08, shadowRadius: 22, elevation: 4,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  badgeText: { letterSpacing: 0.6 },
  heroTitle: { letterSpacing: -0.8, marginBottom: Spacing.sm },
  heroDesc: { lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: Spacing.base, marginTop: Spacing.lg },
  statItem: { flex: 1 },
  heroActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.emerald, borderRadius: Radius.button,
    paddingHorizontal: 18, paddingVertical: 12,
    shadowColor: '#118c76', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 15, elevation: 4,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: Radius.button, paddingHorizontal: 16, paddingVertical: 12,
  },
  criticalBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(220,38,38,0.2)', backgroundColor: '#fef2f2',
    paddingHorizontal: 14, paddingVertical: 8, marginTop: Spacing.base,
  },
  insightBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.frost,
    paddingHorizontal: 14, paddingVertical: 8, marginTop: Spacing.base,
  },
  insightDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.emerald },
  insightText: { flex: 1 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metricHalf: { width: '48%', flexGrow: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.base },
  loansList: { marginBottom: Spacing.md },
  cardActionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    marginTop: Spacing.sm, marginBottom: -Spacing.xs,
  },
  loanRow: {
    borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.borderLight,
    backgroundColor: 'rgba(255,255,255,0.8)', padding: Spacing.md, marginBottom: Spacing.md,
  },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  loanNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  loanDot: { width: 8, height: 8, borderRadius: 4 },
  loanName: { flex: 1 },
  loanMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressBg: { height: 4, borderRadius: 2, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  aiCard: { marginTop: 0 },
  aiHeader: { flexDirection: 'row', gap: Spacing.md },
  aiIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#ecfdf5',
    alignItems: 'center', justifyContent: 'center',
  },
  aiText: { lineHeight: 20, marginTop: 4 },
  aiAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  analyticsRow: { flexDirection: 'column', gap: Spacing.base },
  affordabilityCard: { flex: 1 },
  distributionCard: { flex: 1 },
  sectionTitle: { marginBottom: Spacing.sm },
  emptyGauge: { height: 90, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: Colors.borderMid, borderRadius: Radius.lg },
});
