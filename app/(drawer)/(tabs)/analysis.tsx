import React, { useCallback, useMemo } from 'react';
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
import { useOfflineData } from '@/hooks/useOfflineData';
import {
  saveOfflineLoans, getOfflineLoans,
  saveOfflineProfile, getOfflineProfile,
} from '@/lib/offline/cache';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { formatCurrency } from '@/lib/calculations';
import { TrendingUp } from 'lucide-react-native';
import InterestLeakDetector from '@/components/analysis/InterestLeakDetector';
import { Skeleton } from '@/components/ui/Skeleton';

export default function AnalysisScreen() {
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
      refresh();
    }, [refresh])
  );

  const loans = data?.loans ?? [];
  const profile = data?.profile ?? null;

  const currencyCode = profile?.currency ?? 'INR';

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
      <ScrollView style={{ backgroundColor: Colors.background }} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={[s.hero, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}>
          <Skeleton width={100} height={16} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width={180} height={32} style={{ marginBottom: 4 }} />
          <Skeleton width={250} height={16} />
        </View>

        <View style={s.metricsGrid}>
          {[1, 2, 3, 4].map(i => (
            <Card key={i} style={[s.half, { padding: Spacing.md }]}>
              <Skeleton width={80} height={12} style={{ marginBottom: 8 }} />
              <Skeleton width="80%" height={24} style={{ marginBottom: 4 }} />
              <Skeleton width={100} height={10} />
            </Card>
          ))}
        </View>

        {/* Avoidable Interest Analysis Skeleton */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Skeleton width={18} height={18} borderRadius={9} />
            <Skeleton width={180} height={18} />
          </View>
          <Skeleton width={220} height={12} style={{ marginBottom: Spacing.lg }} />
          
          {[1, 2].map(i => (
            <View key={i} style={{ marginBottom: Spacing.md, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Skeleton width={100} height={14} />
                <Skeleton width={40} height={14} />
              </View>
              <Skeleton width={70} height={12} style={{ marginBottom: 8 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Skeleton width="85%" height={8} borderRadius={4} />
                <Skeleton width={25} height={12} />
              </View>
            </View>
          ))}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
            <Skeleton width={120} height={14} />
            <Skeleton width={90} height={22} />
          </View>
        </Card>

        <Card>
          <Skeleton width={150} height={24} style={{ marginBottom: Spacing.md }} />
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={s.profileRow}>
              <Skeleton width={120} height={16} />
              <Skeleton width={80} height={16} />
            </View>
          ))}
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={{ backgroundColor: Colors.background }}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.emerald} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Offline Alert Banner */}
      {isOffline && <OfflineBanner lastSync={lastSync} />}

      <View style={[s.hero, { backgroundColor: Colors.surface, borderColor: Colors.borderLight }]}>
        <View style={s.badgeRow}>
          <TrendingUp size={12} color={Colors.emerald} />
          <Typography variant="xs" weight="bold" color="emerald" style={s.badgeText}>
            DEEP ANALYSIS
          </Typography>
        </View>
        <Typography variant="h2" weight="bold" color="textPrimary" fontFamily="heading" style={s.heroTitle}>
          Analysis
        </Typography>
        <Typography color="textMuted" style={s.heroSub}>
          Real-time debt health signals and affordability insights.
        </Typography>
      </View>

      {loans.length === 0 ? (
        <Card>
          <EmptyState icon={<TrendingUp size={20} color={Colors.textMuted} />}
            title="No data yet" description="Add loans to see detailed analysis."
            action={isOffline ? undefined : { label: 'Add a loan', href: '/(drawer)/(tabs)/loans/add' }} />
        </Card>
      ) : (
        <>
          <View style={s.metricsGrid}>
            <MetricCard label="Debt-to-Income" value={`${dti.toFixed(1)}%`}
              valueColor={dti > 40 ? 'red' : dti > 30 ? 'amber' : 'emerald'}
              description={dti > 40 ? 'Above safe threshold' : 'Within safe range'} style={s.half} />
            <MetricCard label="Monthly surplus" value={formatCurrency(Math.max(0, surplus), currencyCode)}
              valueColor={surplus < 0 ? 'red' : 'emerald'}
              description={surplus < 0 ? 'Deficit detected' : 'After EMI + expenses'} style={s.half} />
            <MetricCard label="Monthly interest cost" value={formatCurrency(totalInterestPerMonth, currencyCode)}
              description="Total interest expense" valueColor="amber" style={s.half} />
            <MetricCard label="High-risk loans" value={highRiskLoans.length}
              description={`Loans above 15% rate`}
              valueColor={highRiskLoans.length > 0 ? 'red' : 'emerald'} style={s.half} />
          </View>

          <InterestLeakDetector 
            leaks={leakData} 
            totalInterestPerMonth={totalInterestPerMonth} 
            currencyCode={currencyCode}
          />

          {profile && (
            <Card>
              <Typography variant="body" weight="bold" color="textPrimary" fontFamily="heading" style={s.sectionTitle}>
                Financial profile
              </Typography>
              {[
                ['Monthly income', formatCurrency(profile.monthlyIncome, currencyCode)],
                ['Monthly expenses', formatCurrency(profile.monthlyExpenses, currencyCode)],
                ['Total EMI', formatCurrency(totalEMI, currencyCode)],
                ['Net surplus', formatCurrency(Math.max(0, surplus), currencyCode)],
                ['Credit score range', profile.creditScoreRange],
                ['Emergency fund', profile.hasEmergencyFund ? `${profile.emergencyFundMonths} months` : 'No'],
              ].map(([l, v]) => (
                <View key={l} style={[s.profileRow, { borderBottomColor: Colors.borderLight }]}>
                  <Typography variant="body" color="textMuted">{l}</Typography>
                  <Typography variant="body" weight="medium" color="textPrimary">{v}</Typography>
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
    borderRadius: Radius.card, padding: Spacing.lg,
    borderWidth: 1,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  badgeText: { letterSpacing: 0.6 },
  heroTitle: { letterSpacing: -0.5, marginBottom: 4 },
  heroSub: { lineHeight: 22 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  half: { width: '47%', flexGrow: 1 },
  sectionTitle: { marginBottom: Spacing.sm },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
});

