import React, { useState, useCallback } from 'react';
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
import { Target } from 'lucide-react-native';

type StrategyType = 'avalanche' | 'snowball';

export default function StrategyScreen() {
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [strategy, setStrategy] = useState<StrategyType>('avalanche');
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

  const sortedLoans = [...loans].sort((a, b) =>
    strategy === 'avalanche' ? b.interestRate - a.interestRate : a.outstandingBalance - b.outstandingBalance
  );

  const totalOutstanding = loans.reduce((s, l) => s + l.outstandingBalance, 0);
  const totalEMI = loans.reduce((s, l) => s + l.emiAmount, 0);

  if (loading) {
    return (
      <View style={s.center}>
        <Typography color="slate">Loading...</Typography>
      </View>
    );
  }

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
            {/* Strategy Toggle */}
            <View style={s.toggleRow}>
              <TouchableOpacity style={[s.toggle, strategy === 'avalanche' && s.toggleActive]}
                onPress={() => setStrategy('avalanche')}>
                <Typography weight="bold" color={strategy === 'avalanche' ? 'white' : 'navy'}>
                  Avalanche
                </Typography>
                <Typography variant="xs" color={strategy === 'avalanche' ? '#cbd5e1' as any : 'slate'}>
                  Highest rate first
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity style={[s.toggle, strategy === 'snowball' && s.toggleActive]}
                onPress={() => setStrategy('snowball')}>
                <Typography weight="bold" color={strategy === 'snowball' ? 'white' : 'navy'}>
                  Snowball
                </Typography>
                <Typography variant="xs" color={strategy === 'snowball' ? '#cbd5e1' as any : 'slate'}>
                  Smallest balance first
                </Typography>
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <Card>
              <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
                Strategy summary
              </Typography>
              <View style={s.summaryRow}>
                <View style={s.summaryItem}>
                  <Typography variant="sm" color="slate">Total debt</Typography>
                  <Typography variant="xl" weight="bold" color="navy" style={s.summaryValue}>
                    {formatCurrency(totalOutstanding)}
                  </Typography>
                </View>
                <View style={s.summaryItem}>
                  <Typography variant="sm" color="slate">Monthly EMI</Typography>
                  <Typography variant="xl" weight="bold" color="navy" style={s.summaryValue}>
                    {formatCurrency(totalEMI)}
                  </Typography>
                </View>
              </View>
            </Card>

            {/* Priority Order */}
            <Card>
              <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={s.sectionTitle}>
                Priority order
              </Typography>
              <Typography variant="caption" color="slate" style={s.sectionSub}>
                {strategy === 'avalanche'
                  ? 'Pay minimums on all, then throw extra at the highest-rate loan.'
                  : 'Pay minimums on all, then throw extra at the smallest-balance loan.'}
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
  toggleRow: { flexDirection: 'row', gap: Spacing.md },
  toggle: {
    flex: 1, padding: Spacing.base, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.borderMid, backgroundColor: Colors.white,
  },
  toggleActive: { backgroundColor: Colors.navy, borderColor: Colors.navy },
  sectionTitle: { marginBottom: Spacing.sm },
  sectionSub: { marginBottom: Spacing.base, lineHeight: 18 },
  summaryRow: { flexDirection: 'row', gap: Spacing.lg },
  summaryItem: { flex: 1 },
  summaryValue: { marginTop: 4 },
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
