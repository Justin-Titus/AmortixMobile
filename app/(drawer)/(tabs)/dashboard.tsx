import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, ScrollView, RefreshControl, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getLoans, type LoanRecord } from '@/services/loans';
import { getProfile, getHealthSnapshots, type FinancialProfile, type HealthSnapshot } from '@/services/profile';
import { getUserWorkspaces, type WorkspaceRecord } from '@/services/workspace';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { useOfflineData } from '@/hooks/useOfflineData';
import {
  saveOfflineLoans, getOfflineLoans,
  saveOfflineProfile, getOfflineProfile,
  saveOfflineSnapshots, getOfflineSnapshots
} from '@/lib/offline/cache';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { formatCurrency, formatCompactCurrency, calculateAffordabilityScore, calculateStrategy, getCurrencyConfig, getProjectedPayoffDate } from '@/lib/calculations';
import {
  Sparkles, ArrowRight, Plus, MessageSquarePlus, AlertTriangle, Briefcase, ChevronDown,
} from 'lucide-react-native';
import AffordabilityGauge from '@/components/dashboard/AffordabilityGauge';
import DebtDistribution from '@/components/dashboard/DebtDistribution';
import HealthTrendChart from '@/components/analysis/HealthTrendChart';
import { Skeleton } from '@/components/ui/Skeleton';

const loanColors = ['#1E3A5F', '#059669', '#F59E0B', '#378ADD', '#DC2626', '#34D399'];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<{ workspaceId: string; workspace: WorkspaceRecord }[]>([]);
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);

  const loadSelectedWorkspace = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('amortix_selected_workspace_id');
      const wsList = await getUserWorkspaces();
      setWorkspaces(wsList);

      if (stored) {
        const exists = wsList.some(w => w.workspaceId === stored);
        if (exists) {
          setSelectedWorkspaceId(stored);
        } else {
          await AsyncStorage.removeItem('amortix_selected_workspace_id');
          setSelectedWorkspaceId(null);
        }
      } else {
        setSelectedWorkspaceId(null);
      }
    } catch (err) {
      console.error('Failed to load selected workspace:', err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSelectedWorkspace();
    }, [loadSelectedWorkspace])
  );

  const handleSelectWorkspace = async (id: string | null) => {
    try {
      if (id === null) {
        await AsyncStorage.removeItem('amortix_selected_workspace_id');
      } else {
        await AsyncStorage.setItem('amortix_selected_workspace_id', id);
      }
      setSelectedWorkspaceId(id);
      setShowWorkspaceDropdown(false);
    } catch (err) {
      console.error('Failed to save selected workspace:', err);
    }
  };

  // Define offline-aware fetchers, cachers, and readers
  const fetcher = useCallback(async () => {
    const [loansData, profileData, snapshotsData] = await Promise.all([
      getLoans(),
      getProfile(),
      getHealthSnapshots()
    ]);
    return { loans: loansData, profile: profileData, snapshots: snapshotsData };
  }, []);

  const cacher = useCallback(async (data: { loans: LoanRecord[], profile: FinancialProfile | null, snapshots: HealthSnapshot[] }) => {
    await saveOfflineLoans(data.loans);
    if (data.profile) await saveOfflineProfile(data.profile);
    await saveOfflineSnapshots(data.snapshots);
  }, []);

  const reader = useCallback(async () => {
    const loans = await getOfflineLoans();
    const profile = await getOfflineProfile();
    const snapshots = await getOfflineSnapshots();
    return { loans, profile, snapshots };
  }, []);

  const { data, loading, refreshing, isOffline, lastSync, refresh } = useOfflineData({
    fetcher,
    cacher,
    reader
  });

  // Re-fetch when dashboard comes into focus — but only if data is stale (>5 min)
  useFocusEffect(
    useCallback(() => {
      const STALE_MS = 5 * 60 * 1000;
      const lastSyncTs = lastSync ? new Date(lastSync).getTime() : 0;
      if (Date.now() - lastSyncTs > STALE_MS) {
        refresh();
      }
    }, [refresh, lastSync])
  );

  const loans = data?.loans ?? [];
  const profile = data?.profile ?? null;
  const snapshots = data?.snapshots ?? [];

  const filteredLoans = useMemo(() => {
    return loans.filter(l => l.workspaceId === selectedWorkspaceId);
  }, [loans, selectedWorkspaceId]);

  const currencyCode = profile?.currency ?? 'INR';
  const currencyConfig = getCurrencyConfig(currencyCode);

  const totalOutstanding = filteredLoans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalEMI = filteredLoans.reduce((s, l) => s + l.emiAmount, 0);
  const avgRate = totalOutstanding > 0
    ? filteredLoans.reduce((s, l) => s + l.interestRate * l.outstandingBalance, 0) / totalOutstanding : 0;
  const activeLoans = useMemo(() => filteredLoans.filter(l => l.outstandingBalance > 0), [filteredLoans]);
  const hasLoans = activeLoans.length > 0;
  const debtFreeDate = hasLoans ? getProjectedPayoffDate(activeLoans) : null;
  const projectedMonths = debtFreeDate ? Math.max(0, (debtFreeDate.getFullYear() - new Date().getFullYear()) * 12 + debtFreeDate.getMonth() - new Date().getMonth()) : 0;

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
      loans: activeLoans.map(l => ({
        annualRate: l.interestRate,
        tenureMonths: l.tenureMonths,
        rateType: l.rateType,
      })),
    });
  }, [activeLoans, profile, totalEMI]);

  const strategyResults = useMemo(() => {
    if (!hasLoans) return null;
    const strategyLoans = activeLoans
      .filter(l => l.emiAmount > 0)
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
  }, [activeLoans, hasLoans]);

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
      parts.push(`Optimal strategy (${best}) saves you ${formatCurrency(saved, currencyCode)}.`);
    }
    if (months > 0) {
      parts.push(`You can be debt-free ${months} months earlier.`);
    }
    if (affordability) {
      parts.push(`Financial health is in the ${affordability.zone.toLowerCase()} zone.`);
    }

    return parts.join(' ') || `Managing ${formatCurrency(totalOutstanding, currencyCode)} across ${activeLoans.length} active loans.`;
  }, [hasLoans, strategyResults, affordability, totalOutstanding, activeLoans.length, currencyCode]);

  const distributionData = useMemo(() => {
    return filteredLoans
      .filter(l => l.outstandingBalance > 0)
      .map((l, idx) => ({
        name: l.name,
        balance: l.outstandingBalance,
        color: loanColors[idx % loanColors.length],
      }));
  }, [filteredLoans]);

  if (loading) {
    return (
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Skeleton width={120} height={16} style={{ marginBottom: Spacing.md }} />
          <Skeleton width={200} height={32} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width="100%" height={44} style={{ marginBottom: Spacing.lg }} />
          
          <View style={s.statsRow}>
            {[1, 2, 3].map(i => (
              <View key={i} style={s.statItem}>
                <Skeleton width={60} height={24} style={{ marginBottom: 4 }} />
                <Skeleton width={80} height={12} />
              </View>
            ))}
          </View>
          
          <View style={s.heroActions}>
            <Skeleton width={120} height={44} borderRadius={Radius.button} />
            <Skeleton width={120} height={44} borderRadius={Radius.button} />
          </View>
        </View>

        <View style={s.metricsGrid}>
          {[1, 2, 3, 4].map(i => (
            <Card key={i} style={[s.metricHalf, { padding: Spacing.md }]}>
              <Skeleton width={80} height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={24} style={{ marginBottom: 4 }} />
              <Skeleton width={100} height={10} />
            </Card>
          ))}
        </View>

        {/* Health Trend Chart Skeleton */}
        <Card>
          <Skeleton width={150} height={20} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width={220} height={14} style={{ marginBottom: Spacing.md }} />
          <Skeleton width="100%" height={180} borderRadius={Radius.lg} />
        </Card>

        <Card>
          <Skeleton width={120} height={20} style={{ marginBottom: 6 }} />
          <Skeleton width={200} height={14} style={{ marginBottom: Spacing.md }} />
          {[1, 2].map(i => (
            <View key={i} style={s.loanRow}>
              <View style={s.loanHeader}>
                <Skeleton width={120} height={16} />
                <Skeleton width={40} height={20} borderRadius={10} />
              </View>
              <View style={s.loanMeta}>
                <Skeleton width={80} height={12} />
                <Skeleton width={80} height={12} />
              </View>
              <Skeleton width="100%" height={4} borderRadius={2} />
            </View>
          ))}
        </Card>

        {/* Analytics Row Skeleton (Affordability + Distribution) */}
        <View style={s.analyticsRow}>
          <Card style={s.affordabilityCard}>
            <Skeleton width={150} height={20} style={{ marginBottom: 6 }} />
            <Skeleton width={200} height={14} style={{ marginBottom: Spacing.lg }} />
            <View style={{ alignItems: 'center', marginVertical: Spacing.md }}>
              <Skeleton width={140} height={140} borderRadius={70} />
            </View>
            <View style={{ marginTop: Spacing.md }}>
              {[1, 2, 3].map(i => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight }}>
                  <Skeleton width={100} height={12} />
                  <Skeleton width={60} height={12} />
                </View>
              ))}
            </View>
          </Card>

          <Card style={s.distributionCard}>
            <Skeleton width={120} height={20} style={{ marginBottom: 6 }} />
            <Skeleton width={180} height={14} style={{ marginBottom: Spacing.xl }} />
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 180 }}>
              <Skeleton width={140} height={140} borderRadius={70} />
            </View>
          </Card>
        </View>

        {/* AI Insight Card Skeleton */}
        <Card style={s.aiCard}>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <Skeleton width={44} height={44} borderRadius={14} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width={100} height={18} />
              <Skeleton width="100%" height={14} />
              <Skeleton width="80%" height={14} />
            </View>
          </View>
        </Card>
      </ScrollView>
    );
  }

  const activeWorkspaceName = workspaces.find(w => w.workspaceId === selectedWorkspaceId)?.workspace.name || 'Personal Space';

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.emerald} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Offline Alert Banner */}
      {isOffline && <OfflineBanner lastSync={lastSync} />}

      {/* Workspace Switcher */}
      {workspaces.length > 0 && (
        <View style={s.switcherContainer}>
          <TouchableOpacity
            style={s.switcherBtn}
            onPress={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
              <Briefcase size={14} color={Colors.emerald} />
              <Typography variant="body" weight="bold" color="navy">
                {activeWorkspaceName}
              </Typography>
            </View>
            <ChevronDown size={14} color={Colors.slate} />
          </TouchableOpacity>

          {showWorkspaceDropdown && (
            <View style={s.dropdownList}>
              <TouchableOpacity
                style={[s.dropdownItem, selectedWorkspaceId === null && s.dropdownItemActive]}
                onPress={() => handleSelectWorkspace(null)}
              >
                <Typography variant="caption" weight="medium" color={selectedWorkspaceId === null ? 'white' : 'navy'}>
                  Personal Space
                </Typography>
              </TouchableOpacity>

              {workspaces.map((w) => (
                <TouchableOpacity
                  key={w.workspaceId}
                  style={[s.dropdownItem, selectedWorkspaceId === w.workspaceId && s.dropdownItemActive]}
                  onPress={() => handleSelectWorkspace(w.workspaceId)}
                >
                  <Typography variant="caption" weight="medium" color={selectedWorkspaceId === w.workspaceId ? 'white' : 'navy'}>
                    {w.workspace.name}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

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
            { label: 'Open loans', value: String(activeLoans.length) },
            { label: 'Outstanding', value: formatCompactCurrency(totalOutstanding, currencyCode) },
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

        <View style={s.heroActions}>
          <TouchableOpacity style={[s.primaryBtn, isOffline && { opacity: 0.5 }]} onPress={() => !isOffline && router.push('/(drawer)/(tabs)/loans/add')} disabled={isOffline}>
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
        <MetricCard label="Total outstanding" value={formatCurrency(totalOutstanding, currencyCode)}
          description="Across every active balance" isEmpty={!hasLoans} style={s.metricHalf} />
        <MetricCard label="Monthly EMI" value={formatCurrency(totalEMI, currencyCode)}
          description="Current recurring outflow" isEmpty={!hasLoans} style={s.metricHalf} />
        <MetricCard label="Avg rate" value={`${avgRate.toFixed(2)}%`}
          description="Weighted average" isEmpty={!hasLoans} style={s.metricHalf}
          valueColor={avgRate > 12 ? 'amber' : 'default'} />
        <MetricCard label="Debt-free by"
          value={debtFreeDate ? debtFreeDate.toLocaleDateString(currencyConfig.locale, { month: 'short', year: 'numeric' }) : '-'}
          description={debtFreeDate ? 'Baseline strategy' : 'Add loans to see'}
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
            action={isOffline ? undefined : { label: 'Add your first loan', href: '/(drawer)/(tabs)/loans/add' }}
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
            {activeLoans.map((loan, index) => {
              const pct = Math.max(0, Math.min(100, ((loan.principal - loan.outstandingBalance) / Math.max(loan.principal, 1)) * 100));
              const color = loanColors[index % loanColors.length];
              const loanCurrency = loan.currency || currencyCode;
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
                    <Typography variant="caption" color="slate">{formatCurrency(loan.outstandingBalance, loanCurrency)} left</Typography>
                    <Typography variant="caption" color="slate">{formatCurrency(loan.emiAmount, loanCurrency)}/mo</Typography>
                  </View>
                  <View style={s.progressBg}>
                    <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity 
            style={[s.cardActionBtn, isOffline && { opacity: 0.5 }]} 
            onPress={() => !isOffline && router.push('/(drawer)/(tabs)/loans/add')}
            disabled={isOffline}
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
            <View style={{ marginBottom: Spacing.sm }}>
              <Typography variant="body" weight="bold" color="navy" fontFamily="heading">
                Affordability score
              </Typography>
              <Typography variant="xs" color="slate">
                A quick read on repayment sustainability.
              </Typography>
            </View>
            {affordability ? (
              <>
                <AffordabilityGauge score={affordability.score} />
                <View style={s.affordabilityDetails}>
                  <View style={s.detailRow}>
                    <Typography variant="xs" color="slate">EMI to debt ratio</Typography>
                    <Typography variant="xs" weight="medium" color="slateDark" fontFamily="mono">
                      {((totalEMI / Math.max(totalOutstanding, 1)) * 100).toFixed(2)}%
                    </Typography>
                  </View>
                  <View style={s.detailRow}>
                    <Typography variant="xs" color="slate">Average interest rate</Typography>
                    <Typography variant="xs" weight="medium" color="amber" fontFamily="mono">
                      {avgRate.toFixed(2)}%
                    </Typography>
                  </View>
                  <View style={s.detailRow}>
                    <Typography variant="xs" color="slate">Current monthly burn</Typography>
                    <Typography variant="xs" weight="medium" color="slateDark" fontFamily="mono">
                      {formatCurrency(totalEMI, currencyCode)}
                    </Typography>
                  </View>
                  <View style={s.detailRow}>
                    <Typography variant="xs" color="slate">Estimated payoff horizon</Typography>
                    <Typography variant="xs" weight="medium" color="emerald" fontFamily="mono">
                      {projectedMonths || 0} months
                    </Typography>
                  </View>
                  <View style={[s.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Typography variant="xs" color="slate">Risk signal</Typography>
                    <Typography 
                      variant="xs" 
                      weight="semiBold" 
                      color={affordability.score >= 70 ? 'emerald' : 'red'}
                      fontFamily="mono"
                    >
                      {affordability.score >= 70 ? 'Stable' : 'Monitor'}
                    </Typography>
                  </View>
                </View>
              </>
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
                  : activeLoans.length > 1
                  ? `You have ${activeLoans.length} active loans. Avalanche strategy saves the most interest.`
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
  affordabilityDetails: {
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  switcherContainer: {
    zIndex: 10,
    width: '100%',
    marginBottom: Spacing.xs,
    position: 'relative'
  },
  switcherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    shadowColor: '#09111f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 6,
    shadowColor: '#09111f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    zIndex: 20
  },
  dropdownItem: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm
  },
  dropdownItemActive: {
    backgroundColor: Colors.emerald
  }
});

