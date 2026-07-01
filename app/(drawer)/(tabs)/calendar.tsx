import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { CalendarDays, ChevronLeft, ChevronRight, Info } from 'lucide-react-native';
import { getLoansWithPayments } from '@/services/loans';
import { getProfile } from '@/services/profile';
import { buildCalendarData, formatDateKey, formatCurrency, getCurrencyConfig } from '@/lib/calculations';
import { EmptyState } from '@/components/ui/EmptyState';
import Typography from '@/components/ui/Typography';
import { useOfflineData } from '@/hooks/useOfflineData';
import { 
  saveOfflineLoansWithPayments, getOfflineLoansWithPayments,
  saveOfflineProfile, getOfflineProfile
} from '@/lib/offline/cache';
import OfflineBanner from '@/components/ui/OfflineBanner';
import { Skeleton } from '@/components/ui/Skeleton';

export default function CalendarScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const fetcher = useCallback(async () => {
    const [loansData, profileData] = await Promise.all([
      getLoansWithPayments(),
      getProfile()
    ]);
    return { loans: loansData, profile: profileData };
  }, []);

  const cacher = useCallback(async (data: { loans: any[], profile: any }) => {
    await saveOfflineLoansWithPayments(data.loans);
    if (data.profile) await saveOfflineProfile(data.profile);
  }, []);

  const reader = useCallback(async () => {
    const loans = await getOfflineLoansWithPayments();
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

  const formatDateToYMD = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    return dateStr.substring(0, 10);
  };

  const loans = useMemo(() => {
    const rawLoans = data?.loans ?? [];
    return rawLoans
      .filter(l => l.outstandingBalance > 0)
      .map(l => ({
      id: l.id,
      name: l.name,
      emiAmount: l.emiAmount,
      nextEmiDate: formatDateToYMD(l.nextEmiDate),
      startDate: formatDateToYMD(l.startDate) ?? new Date().toISOString().substring(0, 10),
      payments: (l.payments || []).map(p => ({
        amount: p.amount,
        date: formatDateToYMD(p.paymentDate) ?? new Date().toISOString().substring(0, 10),
        type: p.type
      }))
    }));
  }, [data]);

  const currencyCode = data?.profile?.currency ?? 'INR';

  const { days } = useMemo(
    () => buildCalendarData(loans, currentMonth, today),
    [loans, currentMonth, today]
  );

  const { dueThisMonth, totalDueThisMonth } = useMemo(() => {
    const list: { loanId: string; loanName: string; amount: number; dueDate: Date; status: string }[] = [];
    for (const dateKey of Object.keys(days)) {
      for (const loan of days[dateKey].loans) {
        list.push({
          loanId: loan.loanId,
          loanName: loan.loanName,
          amount: loan.emiAmount,
          dueDate: new Date(dateKey),
          status: loan.status,
        });
      }
    }
    list.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return {
      dueThisMonth: list,
      totalDueThisMonth: list.reduce((s, e) => s + e.amount, 0),
    };
  }, [days]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const changeMonth = (offset: number) => {
    const next = new Date(year, month + offset, 1);
    setCurrentMonth(next);
    setSelectedDate(null);
  };

  const selectedDay = selectedDate ? days[selectedDate] ?? null : null;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.emerald} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Offline Alert Banner */}
      {isOffline && (
        <View style={{ marginBottom: Spacing.base }}>
          <OfflineBanner lastSync={lastSync} />
        </View>
      )}

      <View style={styles.hero}>
        <View style={styles.badge}>
          <CalendarDays size={12} color={Colors.emerald} />
          <Typography variant="xs" weight="bold" color="emerald" style={styles.badgeText}>
            CASHFLOW TIMELINE
          </Typography>
        </View>
        <Typography variant="h2" weight="bold" color="navy" fontFamily="heading" style={styles.title}>
          EMI Calendar
        </Typography>
        <Typography color="slate" style={styles.description}>
          Plan upcoming dues across all loans and avoid payment pileups.
        </Typography>
        
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            {loading ? <Skeleton width={100} height={24} style={{ marginBottom: 4 }} /> : (
              <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
                {formatCurrency(totalDueThisMonth, currencyCode)}
              </Typography>
            )}
            <Typography variant="xs" color="slate">Due this month</Typography>
          </View>
          <View style={styles.heroStat}>
            {loading ? <Skeleton width={40} height={24} style={{ marginBottom: 4 }} /> : (
              <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
                {dueThisMonth.length}
              </Typography>
            )}
            <Typography variant="xs" color="slate">Payments</Typography>
          </View>
        </View>
      </View>

      {!loading && loans.length === 0 && (
        <Card style={{ marginBottom: Spacing.xl }}>
          <EmptyState
            icon={<Info size={20} color={Colors.slate} />}
            title="No loans yet"
            description="Add loans to see your EMI due dates appear on the calendar."
            action={isOffline ? undefined : { label: "Add a loan", href: "/(drawer)/(tabs)/dashboard" }}
          />
        </Card>
      )}

      {loading ? (
        <View style={styles.calendarCard}>
          <Skeleton width="100%" height={320} />
        </View>
      ) : (
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Typography variant="md" weight="medium" color="navy" fontFamily="heading">
              {currentMonth.toLocaleDateString(getCurrencyConfig(currencyCode).locale, { month: 'long', year: 'numeric' })}
            </Typography>
            <View style={styles.monthControls}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.controlBtn}>
                <ChevronLeft size={20} color={Colors.navy} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.controlBtn}>
                <ChevronRight size={20} color={Colors.navy} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.weekHeader}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <Typography key={d} variant="xs" weight="medium" color="slate" align="center" style={styles.weekDay}>
                {d.toUpperCase()}
              </Typography>
            ))}
          </View>

          <View style={styles.grid}>
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`pad-${i}`} style={styles.cellEmpty} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const date = new Date(year, month, dayNum);
              const dateKey = formatDateKey(date);
              const entry = days[dateKey];
              const isToday = formatDateKey(today) === dateKey;
              const isSelected = selectedDate === dateKey;

              let cellStyle = {};
              if (entry) {
                const hasOverdue = entry.loans.some(l => l.status === 'overdue');
                const allPaid = entry.loans.every(l => l.status === 'paid');
                if (hasOverdue) cellStyle = { backgroundColor: '#fef2f2' };
                else if (allPaid) cellStyle = { backgroundColor: '#ecfdf5' };
                else cellStyle = { backgroundColor: '#fffbeb' };
              }

              return (
                <TouchableOpacity 
                  key={i} 
                  style={[
                    styles.cell, 
                    cellStyle,
                    isSelected && styles.cellSelected
                  ]}
                  onPress={() => setSelectedDate(dateKey)}
                >
                  <View style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                    <Typography variant="xs" weight="bold" color={isToday ? 'white' : 'slateDark'}>
                      {dayNum}
                    </Typography>
                  </View>
                  <View style={styles.dotRow}>
                    {entry?.loans.slice(0, 2).map((l, idx) => (
                      <View 
                        key={idx} 
                        style={[
                          styles.dot, 
                          { backgroundColor: l.status === 'paid' ? Colors.emerald : l.status === 'overdue' ? Colors.red : Colors.amber }
                        ]} 
                      />
                    ))}
                  </View>
                  {entry && (
                    <Typography variant="xs" weight="medium" color="slate" align="center" style={styles.cellAmount} numberOfLines={1}>
                      {formatCurrency(entry.totalDue, currencyCode, { compact: true })}
                    </Typography>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.detailsSection}>
        <View style={styles.detailsHeader}>
          <Typography variant="md" weight="medium" color="navy" fontFamily="heading">
            {selectedDay 
              ? new Date(selectedDay.date).toLocaleDateString(getCurrencyConfig(currencyCode).locale, { day: 'numeric', month: 'short', year: 'numeric' })
              : "This month's dues"}
          </Typography>
        </View>

        {loading ? (
          <View style={styles.dayList}>
            {[1, 2, 3].map(i => (
              <View key={i} style={styles.dueItem}>
                <View style={styles.dueMain}>
                  <Skeleton width={100} height={20} style={{ marginBottom: 4 }} />
                  <Skeleton width={60} height={14} />
                </View>
                <Skeleton width={80} height={20} />
              </View>
            ))}
          </View>
        ) : selectedDay ? (
          <View style={styles.dayList}>
            {selectedDay.loans.map(l => (
              <TouchableOpacity
                key={l.loanId}
                style={styles.dueItem}
                onPress={() => router.push({ pathname: '/(drawer)/(tabs)/loans/[id]', params: { id: l.loanId } })}
              >
                <View style={styles.dueMain}>
                  <Typography weight="medium" color="navy" fontFamily="heading">{l.loanName}</Typography>
                  <Typography weight="bold" color="navy" fontFamily="heading">{formatCurrency(l.emiAmount, currencyCode)}</Typography>
                </View>
                <View style={styles.dueStatus}>
                  <Typography variant="xs" weight="bold" color={l.status === 'paid' ? 'emerald' : l.status === 'overdue' ? 'red' : 'amber'}>
                    {l.status.toUpperCase()}
                  </Typography>
                  <Typography variant="xs" color="slate">Paid {formatCurrency(l.paidAmount, currencyCode)}</Typography>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.dayList}>
            {dueThisMonth.length === 0 ? (
              <Typography color="slate" align="center" style={styles.emptyListText}>
                No payments due this month.
              </Typography>
            ) : (
              dueThisMonth.map((item: any, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dueItem, item.status === 'paid' ? {backgroundColor: '#ecfdf5', opacity: 0.8} : item.status === 'overdue' ? {backgroundColor: '#fef2f2'} : {}]}
                  onPress={() => router.push({ pathname: '/(drawer)/(tabs)/loans/[id]', params: { id: item.loanId } })}
                >
                  <View style={styles.dueMain}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Typography weight="medium" color={item.status === 'paid' ? 'emerald' : item.status === 'overdue' ? 'red' : 'navy'} fontFamily="heading" style={item.status === 'paid' ? {textDecorationLine: 'line-through'} : {}}>
                        {item.loanName}
                      </Typography>
                      {item.status === 'overdue' && (
                        <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                          <Typography variant="xs" weight="bold" color="red">OVERDUE</Typography>
                        </View>
                      )}
                      {item.status === 'paid' && (
                        <View style={{ backgroundColor: '#d1fae5', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 }}>
                          <Typography variant="xs" weight="bold" color="emerald">PAID</Typography>
                        </View>
                      )}
                    </View>
                    <Typography variant="caption" color={item.status === 'overdue' ? 'red' : 'slate'}>
                      {item.dueDate.toLocaleDateString(getCurrencyConfig(currencyCode).locale, { day: 'numeric', month: 'short' })}
                    </Typography>
                  </View>
                  <Typography weight="bold" color={item.status === 'paid' ? 'emerald' : item.status === 'overdue' ? 'red' : 'navy'} fontFamily="heading">{formatCurrency(item.amount, currencyCode)}</Typography>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingTop: Spacing.md, paddingBottom: 40 },
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
  heroStats: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F1F5F9',
    paddingTop: Spacing.lg, gap: Spacing.xl,
  },
  heroStat: { flex: 1 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.card, padding: Spacing.lg, ...Shadows.metric },
  calendarCard: {
    backgroundColor: Colors.white, borderRadius: Radius.card, overflow: 'hidden',
    ...Shadows.card, marginBottom: Spacing.lg,
  },
  calendarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  monthControls: { flexDirection: 'row', gap: 8 },
  controlBtn: {
    width: 32, height: 32, borderRadius: Radius.md, backgroundColor: '#F8FAFC',
    justifyContent: 'center', alignItems: 'center',
  },
  weekHeader: { flexDirection: 'row', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  weekDay: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%', height: 64, borderRightWidth: 1, borderBottomWidth: 1,
    borderColor: '#F8FAFC', padding: 4, justifyContent: 'space-between',
  },
  cellEmpty: {
    width: '14.28%', height: 64, backgroundColor: '#FBFCFD', borderColor: '#F8FAFC',
    borderRightWidth: 1, borderBottomWidth: 1,
  },
  cellSelected: { borderColor: Colors.navy, borderWidth: 1 },
  dayLabel: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayLabelToday: { backgroundColor: Colors.navy },
  dotRow: { flexDirection: 'row', gap: 2, justifyContent: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2 },
  cellAmount: { fontSize: 8 },
  detailsSection: { gap: Spacing.md },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayList: { gap: Spacing.sm },
  dueItem: {
    backgroundColor: Colors.white, padding: Spacing.md, borderRadius: Radius.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...Shadows.metric,
  },
  dueMain: { gap: 2 },
  dueStatus: { alignItems: 'flex-end', gap: 2 },
  emptyListText: { marginTop: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
});

