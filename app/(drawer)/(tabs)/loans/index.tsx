import React, { useCallback } from 'react';
import {
  View, ScrollView, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getLoans, type LoanRecord } from '@/services/loans';
import { getProfile } from '@/services/profile';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { useOfflineData } from '@/hooks/useOfflineData';
import {
  saveOfflineLoans, getOfflineLoans,
  saveOfflineProfile, getOfflineProfile,
} from '@/lib/offline/cache';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { formatCurrency } from '@/lib/calculations';
import { Info, Plus, ExternalLink } from 'lucide-react-native';
import { Skeleton } from '@/components/ui/Skeleton';

export default function LoansScreen() {
  const router = useRouter();

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

  const loans = data?.loans ?? [];
  const currencyCode = data?.profile?.currency ?? 'INR';

  const activeLoans = loans.filter(l => l.outstandingBalance > 0);
  const totalOutstanding = activeLoans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalEMI = activeLoans.reduce((s, l) => s + l.emiAmount, 0);
  const avgRate = totalOutstanding > 0
    ? activeLoans.reduce((s, l) => s + l.interestRate * l.outstandingBalance, 0) / totalOutstanding : 0;
  const highRateLoans = activeLoans.filter(l => l.interestRate >= 12).length;
  const loanColors = ['#059669', '#1E3A5F', '#F59E0B', '#378ADD', '#DC2626', '#34D399'];

  if (loading) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Skeleton width={120} height={16} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width={180} height={32} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width="100%" height={40} style={{ marginBottom: Spacing.lg }} />
          <Skeleton width={120} height={40} borderRadius={Radius.button} />
        </View>

        <View style={s.metricsGrid}>
          {[1, 2, 3, 4].map(i => (
            <Card key={i} style={[s.metricHalf, { padding: Spacing.md }]}>
              <Skeleton width={80} height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={24} style={{ marginBottom: 4 }} />
            </Card>
          ))}
        </View>

        <View style={s.loanGrid}>
          {[1, 2, 3].map(i => (
            <Card key={i} style={s.loanCard}>
              <View style={s.loanTop}>
                <View style={s.loanNameCol}>
                  <Skeleton width={60} height={20} borderRadius={10} style={{ marginBottom: 8 }} />
                  <Skeleton width={150} height={24} style={{ marginBottom: 4 }} />
                  <Skeleton width={100} height={12} />
                </View>
              </View>
              <Skeleton width="100%" height={6} borderRadius={3} style={{ marginBottom: Spacing.base }} />
              <View style={s.loanStats}>
                <View><Skeleton width={60} height={12} style={{ marginBottom: 4 }}/><Skeleton width={80} height={20} /></View>
                <View><Skeleton width={40} height={12} style={{ marginBottom: 4 }}/><Skeleton width={60} height={20} /></View>
                <View><Skeleton width={40} height={12} style={{ marginBottom: 4 }}/><Skeleton width={60} height={20} /></View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.emerald} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Offline Alert Banner */}
      {isOffline && <OfflineBanner lastSync={lastSync} />}

      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroRow}>
          <View style={{ flex: 1 }}>
            <View style={s.badgeRow}>
              <Info size={12} color={Colors.slate} />
              <Typography variant="xs" weight="medium" color="slate" style={s.badgeText}>
                PORTFOLIO VIEW
              </Typography>
            </View>
            <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={s.heroTitle}>
              My Loans
            </Typography>
            <Typography variant="md" color="slate" style={s.heroSub}>
              Review every balance, compare monthly burden, and keep high-interest debt visible.
            </Typography>
          </View>
        </View>
        <TouchableOpacity 
          style={[s.addBtn, { opacity: isOffline ? 0.6 : 1 }]} 
          onPress={() => !isOffline && router.push('/(drawer)/(tabs)/loans/add')}
          disabled={isOffline}
        >
          <Plus size={14} color={Colors.white} />
          <Typography variant="body" weight="semiBold" color="white">Add loan</Typography>
        </TouchableOpacity>
      </View>

      {/* Metrics */}
      <View style={s.metricsGrid}>
        <MetricCard label="Active loans" value={activeLoans.length} isEmpty={!activeLoans.length} style={s.metricHalf} />
        <MetricCard label="Outstanding" value={formatCurrency(totalOutstanding, currencyCode)} isEmpty={!activeLoans.length} style={s.metricHalf} />
        <MetricCard label="Monthly EMI" value={formatCurrency(totalEMI, currencyCode)} isEmpty={!activeLoans.length} style={s.metricHalf} />
        <MetricCard label="Avg rate" value={`${avgRate.toFixed(2)}%`} isEmpty={!activeLoans.length} style={s.metricHalf} />
      </View>

      {/* Risk watch */}
      {activeLoans.length > 0 && (
        <View style={[s.riskBanner, highRateLoans > 0 ? s.riskWarn : s.riskOk]}>
          <View style={[s.riskDot, { backgroundColor: highRateLoans > 0 ? '#f59e0b' : '#059669' }]} />
          <View style={{ flex: 1 }}>
            <Typography variant="caption" weight="medium" color="slate">Risk watch</Typography>
            <Typography variant="md" weight="medium" color="navy" style={s.riskText}>
              {highRateLoans > 0 ? `${highRateLoans} loan${highRateLoans > 1 ? 's' : ''} above 12% interest` : 'No loans above 12% interest'}
            </Typography>
          </View>
          <TouchableOpacity onPress={() => router.push('/(drawer)/(tabs)/strategy')}>
            <Typography variant="body" weight="medium" color="emerald">Strategy →</Typography>
          </TouchableOpacity>
        </View>
      )}

      {/* Loans list */}
      {activeLoans.length === 0 ? (
        <Card>
          <EmptyState icon={<Info size={20} color={Colors.slate} />}
            title="No loans tracked yet"
            description="Add your first loan to start comparing repayment strategies."
            action={isOffline ? undefined : { label: 'Add your first loan', href: '/(drawer)/(tabs)/loans/add' }} />
        </Card>
      ) : (
        <View style={s.loanGrid}>
          {activeLoans.map((loan, i) => {
            const color = loanColors[i % 6];
            const pct = Math.round((1 - loan.outstandingBalance / Math.max(loan.principal, 1)) * 100);
            const loanCurrency = loan.currency || currencyCode;
            return (
              <TouchableOpacity key={loan.id} style={s.loanCard}
                onPress={() => router.push({ pathname: '/(drawer)/(tabs)/loans/[id]', params: { id: loan.id } })}>
                <View style={s.loanTop}>
                  <View style={s.loanNameCol}>
                    <View style={[s.loanDot, { backgroundColor: color }]} />
                    <View style={{ flex: 1 }}>
                      <Typography variant="xs" weight="bold" color="slate" style={s.loanType}>
                        {loan.loanType.toUpperCase()}
                      </Typography>
                      <Typography variant="xl" weight="bold" color="navy" fontFamily="heading" style={s.loanName} numberOfLines={1}>
                        {loan.name}
                      </Typography>
                      <Typography variant="caption" color="slate">{loan.lender || 'Unknown lender'}</Typography>
                    </View>
                  </View>
                  <View style={s.loanArrow}><ExternalLink size={14} color={Colors.slate} /></View>
                </View>
                <View style={s.progressBg}><View style={[s.progressFill, { width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }]} /></View>
                <View style={s.loanStats}>
                  <View>
                    <Typography variant="sm" color="slateLight">Outstanding</Typography>
                    <Typography variant="md" weight="medium" color="navy" style={s.loanStatValue}>
                      {formatCurrency(loan.outstandingBalance, loanCurrency)}
                    </Typography>
                  </View>
                  <View>
                    <Typography variant="sm" color="slateLight">Rate</Typography>
                    <Typography variant="md" weight="medium" color="navy" style={s.loanStatValue}>
                      {loan.interestRate}%
                    </Typography>
                  </View>
                  <View>
                    <Typography variant="sm" color="slateLight">EMI</Typography>
                    <Typography variant="md" weight="medium" color="navy" style={s.loanStatValue}>
                      {formatCurrency(loan.emiAmount, loanCurrency)}
                    </Typography>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.base, gap: Spacing.base },
  hero: {
    backgroundColor: Colors.white, borderRadius: Radius.card, padding: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...Shadows.card,
  },
  heroRow: { flexDirection: 'row', gap: Spacing.md },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  badgeText: { letterSpacing: 0.6 },
  heroTitle: { letterSpacing: -0.5, marginBottom: 4 },
  heroSub: { lineHeight: 22 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.emerald,
    borderRadius: Radius.button, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start', marginTop: Spacing.base,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metricHalf: { width: '47%', flexGrow: 1 },
  riskBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.lg,
    borderWidth: 1, padding: Spacing.base,
  },
  riskWarn: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  riskOk: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  riskDot: { width: 8, height: 8, borderRadius: 4 },
  riskText: { marginTop: 2 },
  loanGrid: { gap: Spacing.base },
  loanCard: {
    backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: Spacing.lg,
  },
  loanTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.base },
  loanNameCol: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, flex: 1 },
  loanDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  loanType: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, overflow: 'hidden', alignSelf: 'flex-start' },
  loanName: { marginTop: Spacing.sm },
  loanArrow: { width: 36, height: 36, borderRadius: 14, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  progressBg: { height: 6, borderRadius: 3, backgroundColor: '#f1f5f9', overflow: 'hidden', marginBottom: Spacing.base },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#059669' },
  loanStats: { flexDirection: 'row', gap: Spacing.lg },
  loanStatValue: { marginTop: 4 },
});

