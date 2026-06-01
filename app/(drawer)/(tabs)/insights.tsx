import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { Sparkles, Lock, Check, TrendingDown, ArrowRight } from 'lucide-react-native';
import { getLoans } from '@/services/loans';
import { getProfile, type FinancialProfile } from '@/services/profile';
import { detectInterestLeaks, predictDefaultRisk, monthsSince, formatCurrency } from '@/lib/calculations';
import { MetricCard } from '@/components/ui/MetricCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import Typography from '@/components/ui/Typography';
import { useRouter } from 'expo-router';
import { Skeleton } from '@/components/ui/Skeleton';

export default function InsightsScreen() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [loansData, profileData] = await Promise.all([getLoans(), getProfile()]);
      setLoans(loansData);
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to load insights data:', err);
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const currencyCode = profile?.currency ?? 'INR';

  const totals = useMemo(() => {
    const outstanding = loans.reduce((sum, loan) => sum + loan.outstandingBalance, 0);
    const emi = loans.reduce((sum, loan) => sum + loan.emiAmount, 0);
    const avgRate = loans.length > 0
      ? loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length
      : 0;
    return { outstanding, emi, avgRate };
  }, [loans]);

  const leaks = useMemo(() => {
    if (!profile) return [];
    return detectInterestLeaks(
      loans.map(l => ({
        id: l.id,
        name: l.name,
        interestRate: l.interestRate,
        rateType: l.rateType,
        tenureMonths: l.tenureMonths,
        outstandingBalance: l.outstandingBalance,
        emiAmount: l.emiAmount,
        loanType: l.loanType,
        startDate: l.startDate
      })),
      {
        monthlyIncome: profile.monthlyIncome,
        monthlyExpenses: profile.monthlyExpenses,
        hasEmergencyFund: profile.hasEmergencyFund,
        emergencyFundMonths: profile.emergencyFundMonths,
      },
      currencyCode
    );
  }, [loans, profile, currencyCode]);

  const riskRows = useMemo(() => {
    if (!profile) return [];
    return loans.map(loan => {
      const result = predictDefaultRisk({
        monthlyIncome: profile.monthlyIncome,
        monthlyExpenses: profile.monthlyExpenses,
        employmentType: profile.employmentType as any,
        hasEmergencyFund: profile.hasEmergencyFund,
        emergencyFundMonths: profile.emergencyFundMonths,
        creditScoreRange: profile.creditScoreRange,
        loanType: loan.loanType,
        interestRate: loan.interestRate,
        rateType: loan.rateType,
        tenureMonths: loan.tenureMonths,
        outstandingBalance: loan.outstandingBalance,
        emiAmount: loan.emiAmount,
        monthsActive: monthsSince(loan.startDate),
        totalMonthlyEMI: totals.emi,
        numberOfActiveLoans: loans.length,
        debtToIncomeRatio: profile.monthlyIncome > 0 ? totals.emi / profile.monthlyIncome : 1,
      }, currencyCode);

      return {
        loanId: loan.id,
        loanName: loan.name,
        risk: result,
      };
    }).sort((a, b) => b.risk.riskScore - a.risk.riskScore).slice(0, 3);
  }, [loans, profile, totals.emi, currencyCode]);

  if (loading) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Skeleton width={130} height={16} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width={180} height={32} style={{ marginBottom: Spacing.sm }} />
          <Skeleton width="100%" height={20} style={{ marginBottom: Spacing.lg }} />
          <View style={styles.metricsGrid}>
            <Skeleton width="48%" height={60} borderRadius={Radius.card} />
            <Skeleton width="48%" height={60} borderRadius={Radius.card} />
          </View>
        </View>

        <Card style={{ marginBottom: Spacing.md }}>
          <Skeleton width={150} height={20} style={{ marginBottom: Spacing.md }} />
          <Skeleton width="100%" height={80} />
        </Card>
      </ScrollView>
    );
  }

  if (loans.length === 0) {
    return (
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />}
      >
        <HeroSection totals={totals} currencyCode={currencyCode} />
        <Card>
          <EmptyState
            icon={<Sparkles size={20} color={Colors.slate} />}
            title="Add a loan to unlock insights"
            description="Insights are generated from your live loan data. Add your first loan to see risk watchlists and leak detection." 
            action={{ label: "Add your first loan", href: "/(drawer)/(tabs)/dashboard" }}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />}
    >
      <HeroSection totals={totals} currencyCode={currencyCode} />

      {!profile ? (
        <View style={styles.profileLocked}>
          <Card style={styles.lockCard}>
            <View style={styles.lockHeader}>
              <Lock size={16} color={Colors.amber} />
              <Typography variant="body" weight="medium" color="navy" fontFamily="heading">
                Complete your profile to unlock insights
              </Typography>
            </View>
            {[
              { label: "Monthly income and expenses", done: false },
              { label: "Emergency fund status", done: false },
              { label: "At least one active loan", done: loans.length > 0 },
            ].map((item, i) => (
              <View key={i} style={styles.lockItem}>
                <View style={[styles.checkCircle, item.done && styles.checkCircleDone]}>
                  {item.done && <Check size={12} color={Colors.white} />}
                </View>
                <Typography color={item.done ? 'slateLight' : 'slate'} style={[styles.lockItemText, item.done && styles.lockItemTextDone]}>
                  {item.label}
                </Typography>
                {!item.done && (
                  <TouchableOpacity onPress={() => router.push('/(drawer)/(tabs)/profile')}>
                    <Typography variant="caption" weight="bold" color="emerald">Set up →</Typography>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Card>
          
          <View style={styles.lockedPlaceholder}>
            <Lock size={20} color={Colors.slateLight} style={{ marginBottom: 8 }} />
            <Typography weight="medium" color="slate">Interest leak detector</Typography>
            <Typography variant="caption" color="slateLight">Unlocks once loans and profile are complete</Typography>
          </View>
        </View>
      ) : (
        <View style={styles.insightsList}>
          {riskRows.length > 0 && (
            <View style={styles.section}>
              <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={styles.sectionTitle}>
                Risk Watchlist
              </Typography>
              {riskRows.map(row => (
                <Card key={row.loanId} style={styles.riskCard}>
                  <View style={styles.riskHeader}>
                    <View>
                      <Typography weight="medium" color="navy" fontFamily="heading" style={styles.riskLoanName}>
                        {row.loanName}
                      </Typography>
                      <Typography variant="caption" color="slate">
                        Risk Level: <Typography variant="caption" weight="bold" color={getRiskColor(row.risk.riskLevel)}>{row.risk.riskLevel.toUpperCase()}</Typography>
                      </Typography>
                    </View>
                    <View style={[styles.riskScore, { borderColor: Colors[getRiskColor(row.risk.riskLevel)] }]}>
                      <Typography variant="md" weight="bold" color={getRiskColor(row.risk.riskLevel)}>{row.risk.riskScore}</Typography>
                    </View>
                  </View>
                  <Typography variant="caption" color="slate" style={styles.riskRecommendation}>
                    {row.risk.recommendation}
                  </Typography>
                </Card>
              ))}
            </View>
          )}

          {leaks.length > 0 ? (
            <View style={styles.section}>
              <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={styles.sectionTitle}>
                Interest Leaks
              </Typography>
              {leaks.map((leak, i) => (
                <Card key={i} style={styles.leakCard}>
                  <View style={styles.leakHeader}>
                    <View style={styles.leakIconBox}>
                      <TrendingDown size={18} color={Colors.red} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Typography weight="bold" color="navy" fontFamily="heading">
                        {formatCurrency(leak.annualLeakAmount, currencyCode)} annual leak
                      </Typography>
                      <Typography variant="caption" color="slate">{leak.loanName}</Typography>
                    </View>
                    <View style={[styles.severityBadge, { backgroundColor: leak.severity === 'high' ? '#fee2e2' : '#fef3c7' }]}>
                      <Typography variant="xs" weight="bold" color={leak.severity === 'high' ? 'red' : 'amber'}>
                        {leak.severity.toUpperCase()}
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="caption" color="slate" style={styles.leakDesc}>{leak.fixDescription}</Typography>
                  <TouchableOpacity style={styles.leakAction} onPress={() => router.push(leak.actionRoute as any)}>
                    <Typography variant="caption" weight="bold" color="emerald">
                      {leak.actionLabel}
                    </Typography>
                    <ArrowRight size={14} color={Colors.emerald} />
                  </TouchableOpacity>
                </Card>
              ))}
            </View>
          ) : (
            <View style={styles.noLeaks}>
              <View style={styles.successIcon}>
                <Check size={24} color={Colors.white} />
              </View>
              <Typography variant="md" weight="bold" color="navy" fontFamily="heading">
                No major interest leaks found!
              </Typography>
              <Typography color="slate" align="center" style={styles.noLeaksDesc}>
                Your portfolio allocation is efficient. Keep maintaining your repayment strategy.
              </Typography>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function HeroSection({ totals, currencyCode = 'INR' }: { totals: any; currencyCode?: string }) {
  return (
    <View style={styles.hero}>
      <View style={styles.badge}>
        <Sparkles size={12} color={Colors.emerald} />
        <Typography variant="xs" weight="bold" color="emerald" style={styles.badgeText}>
          ACTIONABLE SIGNALS
        </Typography>
      </View>
      <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={styles.title}>
        Insights
      </Typography>
      <Typography color="slate" style={styles.description}>
        Track portfolio pressure and identify the next action with the biggest repayment impact.
      </Typography>
      <View style={styles.metricsGrid}>
        <MetricCard 
          label="Total debt" 
          value={formatCurrency(totals.outstanding, currencyCode)} 
          style={styles.metricHalf} 
          isEmpty={totals.outstanding === 0}
        />
        <MetricCard 
          label="Monthly EMI" 
          value={formatCurrency(totals.emi, currencyCode)} 
          style={styles.metricHalf}
          isEmpty={totals.emi === 0}
        />
      </View>
    </View>
  );
}

function getRiskColor(level: string) {
  switch (level) {
    case 'critical': return 'red';
    case 'high': return 'amber';
    case 'medium': return 'slate';
    default: return 'emerald';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.base, paddingTop: Spacing.md },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radius.card,
    marginBottom: Spacing.lg, ...Shadows.card,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.emeraldBg,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.badge,
    alignSelf: 'flex-start', marginBottom: Spacing.md, gap: 4,
  },
  badgeText: { letterSpacing: 0.5 },
  title: { marginBottom: Spacing.sm },
  description: { lineHeight: 20, marginBottom: Spacing.lg },
  metricsGrid: { flexDirection: 'row', gap: Spacing.md },
  metricHalf: { flex: 1 },
  profileLocked: { gap: Spacing.lg },
  lockCard: { padding: Spacing.lg, borderLeftWidth: 4, borderLeftColor: Colors.amber },
  lockHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.lg },
  lockItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#E2E8F0',
    marginRight: 12, justifyContent: 'center', alignItems: 'center',
  },
  checkCircleDone: { backgroundColor: Colors.emerald, borderColor: Colors.emerald },
  lockItemText: { flex: 1 },
  lockItemTextDone: { textDecorationLine: 'line-through' },
  lockedPlaceholder: {
    backgroundColor: '#F1F5F9', borderRadius: Radius.card, padding: 32,
    alignItems: 'center', opacity: 0.6,
  },
  insightsList: { gap: Spacing.xl },
  section: { gap: Spacing.md },
  sectionTitle: { marginLeft: 4 },
  riskCard: { padding: Spacing.md },
  riskLoanName: { marginBottom: 4 },
  riskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  riskScore: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  riskRecommendation: { lineHeight: 18, backgroundColor: '#F8FAFC', padding: 8, borderRadius: Radius.md },
  leakCard: { padding: Spacing.md },
  leakHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.md },
  leakIconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#FEF2F2',
    justifyContent: 'center', alignItems: 'center',
  },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.badge },
  leakDesc: { lineHeight: 18, marginBottom: Spacing.md },
  leakAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  noLeaks: {
    backgroundColor: Colors.white, borderRadius: Radius.card, padding: 32,
    alignItems: 'center', ...Shadows.card,
  },
  successIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.emerald,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  noLeaksDesc: { lineHeight: 20 },
});

