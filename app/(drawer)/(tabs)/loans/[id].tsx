import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, ScrollView, TouchableOpacity, Alert, StyleSheet, RefreshControl, Vibration,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getLoan, deleteLoan, getLoans, type LoanRecord } from '@/services/loans';
import { getProfile, type FinancialProfile } from '@/services/profile';
import { clearCachedLoans, getOfflineLoans, getOfflineLoansWithPayments, getOfflineProfile } from '@/lib/offline/cache';
import { useOfflineData } from '@/hooks/useOfflineData';
import { loanHealthScore, monthsSince, formatCurrency, getCurrencyConfig } from '@/lib/calculations';
import LoanHealthScoreBadge from '@/components/analysis/LoanHealthScoreBadge';
import DefaultRiskCard from '@/components/ml/DefaultRiskCard';
import PrepaymentSimulator from '@/components/analysis/PrepaymentSimulator';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Typography from '@/components/ui/Typography';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { Trash2, Edit3 } from 'lucide-react-native';
import { LogPaymentCard } from '@/components/loans/LogPaymentCard';
import { Skeleton } from '@/components/ui/Skeleton';

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const fetcher = useCallback(async () => {
    if (!id) throw new Error('No id');
    const [loanData, profileData, allLoans] = await Promise.all([
      getLoan(id as string),
      getProfile(),
      getLoans()
    ]);
    return { loan: loanData, profile: profileData, allLoans };
  }, [id]);

  const cacher = useCallback(async () => {}, []);

  const reader = useCallback(async () => {
    const allLoansWithPayments = await getOfflineLoansWithPayments();
    let loanData = allLoansWithPayments.find(l => l.id === id);
    if (!loanData) {
      const allLoans = await getOfflineLoans();
      loanData = allLoans.find(l => l.id === id);
    }
    const profileData = await getOfflineProfile();
    const allLoansList = await getOfflineLoans();
    return { loan: loanData || null, profile: profileData, allLoans: allLoansList };
  }, [id]);

  const { data, loading, refreshing, refresh, isOffline } = useOfflineData({ fetcher, cacher, reader });

  const loan = data?.loan ?? null;
  const profile = data?.profile ?? null;
  const totalEMI = data?.allLoans?.reduce((sum, l) => sum + l.emiAmount, 0) ?? 0;
  const loansCount = data?.allLoans?.length ?? 0;

  const loadData = refresh; // For LogPaymentCard onSuccess

  const onRefresh = () => refresh();


  const healthScore = useMemo(() => {
    if (!profile || !loan || !(profile.monthlyIncome > 0)) return null;
    return loanHealthScore({
      interestRate: loan.interestRate,
      rateType: loan.rateType as any,
      tenureMonths: loan.tenureMonths,
      emiAmount: loan.emiAmount,
      monthlyIncome: profile.monthlyIncome,
      outstandingBalance: loan.outstandingBalance,
      principal: loan.principal,
    });
  }, [loan, profile]);

  const riskInput = useMemo(() => {
    if (!profile || !loan || !(profile.monthlyIncome > 0)) return null;
    return {
      monthlyIncome: profile.monthlyIncome,
      monthlyExpenses: profile.monthlyExpenses,
      employmentType: profile.employmentType as any,
      hasEmergencyFund: profile.hasEmergencyFund,
      emergencyFundMonths: profile.emergencyFundMonths,
      creditScoreRange: profile.creditScoreRange,
      loanType: loan.loanType,
      interestRate: loan.interestRate,
      rateType: loan.rateType as any,
      tenureMonths: loan.tenureMonths,
      outstandingBalance: loan.outstandingBalance,
      emiAmount: loan.emiAmount,
      monthsActive: monthsSince(loan.startDate),
      totalMonthlyEMI: totalEMI,
      numberOfActiveLoans: loansCount,
      debtToIncomeRatio: totalEMI / profile.monthlyIncome,
    };
  }, [loan, profile, totalEMI, loansCount]);



  const handleDelete = () => {
    Alert.alert('Delete Loan', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          if (!id) return;
          // Warning haptic feedback
          Vibration.vibrate(60);
          const result = await deleteLoan(id);
          if (result.success) {
            // Invalidate the loan cache so the next offline read is fresh
            await clearCachedLoans();
            router.back();
          } else {
            Alert.alert('Error', result.error ?? 'Failed to delete');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.headerActions}>
           <Skeleton width="48%" height={40} borderRadius={Radius.md} />
           <Skeleton width="48%" height={40} borderRadius={Radius.md} />
        </View>

        <Card style={{ marginBottom: Spacing.md }}>
          <View style={s.topRow}>
            <Skeleton width={80} height={24} borderRadius={12} style={{ marginBottom: Spacing.sm }} />
            <Skeleton width={200} height={32} style={{ marginBottom: 4 }} />
            <Skeleton width={120} height={16} style={{ marginBottom: Spacing.md }} />
            <Skeleton width={100} height={24} borderRadius={12} />
          </View>
          <View style={s.progressSection}>
            <View style={s.progressRow}>
              <Skeleton width={60} height={12} />
              <Skeleton width={80} height={12} />
            </View>
            <Skeleton width="100%" height={8} borderRadius={4} />
          </View>
        </Card>

        <Card style={{ marginBottom: Spacing.md }}>
           <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md }}>
             <Skeleton width={24} height={24} borderRadius={12} style={{ marginRight: Spacing.sm }} />
             <Skeleton width={150} height={20} />
           </View>
           <Skeleton width="100%" height={60} borderRadius={Radius.sm} style={{ marginBottom: Spacing.sm }} />
           <Skeleton width="80%" height={14} />
        </Card>

        <Card style={{ marginBottom: Spacing.md }}>
           <View style={{ flexDirection: 'row', gap: 2, backgroundColor: Colors.frost, padding: 4, borderRadius: Radius.full, marginBottom: Spacing.md }}>
              <Skeleton width="33%" height={32} borderRadius={16} />
              <Skeleton width="33%" height={32} borderRadius={16} />
              <Skeleton width="33%" height={32} borderRadius={16} />
           </View>
           <Skeleton width={120} height={14} style={{ marginBottom: Spacing.xs }} />
           <Skeleton width="100%" height={48} borderRadius={Radius.sm} style={{ marginBottom: Spacing.md }} />
           
           <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg }}>
             {[1, 2, 3, 4].map(i => (
               <View key={i} style={{ flex: 1, minWidth: '46%', padding: Spacing.sm, backgroundColor: Colors.frost, borderRadius: Radius.md }}>
                 <Skeleton width={60} height={12} style={{ marginBottom: 4 }} />
                 <Skeleton width={80} height={20} />
               </View>
             ))}
           </View>

           <Skeleton width="100%" height={120} borderRadius={Radius.md} style={{ marginBottom: Spacing.md }} />
           <Skeleton width="100%" height={40} />
        </Card>
      </ScrollView>
    );
  }

  if (!loan) {
    return (
      <View style={s.center}>
        <Typography color="slate">Loan not found</Typography>
      </View>
    );
  }

  const paidPct = Math.round(((loan.principal - loan.outstandingBalance) / Math.max(loan.principal, 1)) * 100);
  const loanCurrency = loan.currency || 'INR';
  const currencyConfig = getCurrencyConfig(loanCurrency);

  return (
    <ScrollView 
      style={s.container}
      contentContainerStyle={s.content} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />}
    >
      <View style={s.headerActions}>
        <TouchableOpacity 
          style={[s.actionBtn, isOffline && { opacity: 0.5 }]} 
          onPress={() => !isOffline && router.push({ pathname: '/(drawer)/(tabs)/loans/add', params: { id: loan.id } })}
          disabled={isOffline}
        >
          <Edit3 size={16} color={isOffline ? Colors.slate : Colors.emerald} />
          <Typography variant="caption" weight="bold" color={isOffline ? 'slate' : 'emerald'}>Edit loan</Typography>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.actionBtn, s.deleteBtn, isOffline && { opacity: 0.5 }]} 
          onPress={() => !isOffline && handleDelete()} 
          disabled={isOffline}
        >
          <Trash2 size={16} color={isOffline ? Colors.slate : Colors.red} />
          <Typography variant="caption" weight="bold" color={isOffline ? 'slate' : 'red'}>Delete</Typography>
        </TouchableOpacity>
      </View>

      <Card>
        <View style={s.topRow}>
          <View>
            <Badge text={loan.loanType} variant="slate" style={{ alignSelf: 'flex-start' }} />
            <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={s.loanName}>
              {loan.name}
            </Typography>
            {loan.lender && (
              <Typography variant="md" color="slate" style={s.lender}>
                {loan.lender}
              </Typography>
            )}
            {healthScore !== null && (
              <View style={{ marginTop: Spacing.sm }}>
                <LoanHealthScoreBadge score={healthScore} />
              </View>
            )}
          </View>
        </View>

        <View style={s.progressSection}>
          <View style={s.progressRow}>
            <Typography variant="caption" weight="medium" color="slate">{paidPct}% paid</Typography>
            <Typography variant="caption" weight="medium" color="slate">{formatCurrency(loan.outstandingBalance, loanCurrency)} left</Typography>
          </View>
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${Math.max(0, Math.min(100, paidPct))}%` }]} />
          </View>
        </View>
      </Card>

      {/* Default Risk Card */}
      {riskInput && <DefaultRiskCard riskInput={riskInput} currencyCode={loanCurrency} />}

      {/* Prepayment Simulator */}
      <PrepaymentSimulator
        outstandingBalance={loan.outstandingBalance}
        interestRate={loan.interestRate}
        tenureMonths={loan.tenureMonths}
        emiAmount={loan.emiAmount}
        currencyCode={loanCurrency}
      />

      {/* Record Payment */}
      <LogPaymentCard loanId={loan.id} defaultAmount={loan.emiAmount} onSuccess={loadData} currencyCode={loanCurrency} isOffline={isOffline} />

      {/* Payment History */}
      <Card>
        <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
          Recent payments
        </Typography>
        {(!loan.payments || loan.payments.length === 0) ? (
          <Typography variant="sm" color="slate" align="center" style={{ paddingVertical: 20 }}>
            No payments recorded yet.
          </Typography>
        ) : (
          loan.payments.map((p) => (
            <View key={p.id} style={s.historyRow}>
              <View>
                <Typography variant="body" weight="medium" color="navy">
                  {new Date(p.paymentDate).toLocaleDateString(currencyConfig.locale, { day: 'numeric', month: 'short' })}
                </Typography>
                <Typography variant="xs" color="slate">{p.type}</Typography>
              </View>
              <Typography variant="body" weight="bold" color="emerald">
                {formatCurrency(p.amount, loanCurrency)}
              </Typography>
            </View>
          ))
        )}
      </Card>

      <Card>
        <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
          Loan details
        </Typography>
        {[
          ['Principal', formatCurrency(loan.principal, loanCurrency)],
          ['Outstanding', formatCurrency(loan.outstandingBalance, loanCurrency)],
          ['Interest rate', `${loan.interestRate}% (${loan.rateType})`],
          ['Tenure', `${loan.tenureMonths} months`],
          ['Monthly EMI', formatCurrency(loan.emiAmount, loanCurrency)],
          ['Start date', new Date(loan.startDate).toLocaleDateString(currencyConfig.locale, { day: 'numeric', month: 'short', year: 'numeric' })],
        ].map(([label, value]) => (
          <View key={label} style={s.detailRow}>
            <Typography variant="body" color="slate">{label}</Typography>
            <Typography variant="body" weight="medium" color="navy">{value}</Typography>
          </View>
        ))}
      </Card>

      {loan.notes && (
        <Card>
          <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
            Notes
          </Typography>
          <Typography variant="md" color="slate" style={s.notesText}>
            {loan.notes}
          </Typography>
        </Card>
      )}

      <View style={{ height: 120 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  headerActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  actionBtn: { 
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: Radius.md, backgroundColor: Colors.white,
    borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.metric
  },
  deleteBtn: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  content: { padding: Spacing.base, gap: Spacing.base, paddingTop: Spacing.md },
  topRow: { marginBottom: Spacing.md },
  loanName: { marginTop: Spacing.md },
  lender: { marginTop: 4 },
  progressSection: { marginTop: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressBg: { height: 8, borderRadius: 4, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4, backgroundColor: Colors.emerald },
  sectionTitle: { marginBottom: Spacing.base },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  notesText: { lineHeight: 22 },
  historyRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
});
