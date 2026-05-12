import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '@/constants/theme';
import { CalendarDays, ChevronLeft, ChevronRight, Info } from 'lucide-react-native';
import { getLoansWithPayments } from '@/services/loans';
import { buildCalendarData, formatDateKey, RawLoan } from '@/lib/calculations/calendar';
import { formatCurrency } from '@/lib/calculations/emi';
import { EmptyState } from '@/components/ui/EmptyState';
import Typography from '@/components/ui/Typography';

export default function CalendarScreen() {
  const [loans, setLoans] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const today = useMemo(() => new Date(), []);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const loadData = useCallback(async () => {
    const data = await getLoansWithPayments();
    const transformed: RawLoan[] = data.map(l => ({
      id: l.id,
      name: l.name,
      emiAmount: l.emiAmount,
      nextEmiDate: l.nextEmiDate,
      startDate: l.startDate,
      payments: (l.payments || []).map(p => ({
        amount: p.amount,
        date: p.paymentDate,
        type: p.type
      }))
    }));
    setLoans(transformed);
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const { days, dueIn30, totalDueIn30 } = useMemo(
    () => buildCalendarData(loans, currentMonth, today),
    [loans, currentMonth, today]
  );

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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.emerald} />}
      showsVerticalScrollIndicator={false}
    >
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
            <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
              {formatCurrency(totalDueIn30)}
            </Typography>
            <Typography variant="xs" color="slate">Due in 30 days</Typography>
          </View>
          <View style={styles.heroStat}>
            <Typography variant="lg" weight="bold" color="navy" fontFamily="heading">
              {dueIn30.length}
            </Typography>
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
            action={{ label: "Add a loan", href: "/(drawer)/(tabs)/dashboard" }}
          />
        </Card>
      )}

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Typography variant="md" weight="medium" color="navy" fontFamily="heading">
            {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
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
                    ₹{entry.totalDue > 1000 ? `${Math.round(entry.totalDue / 1000)}k` : entry.totalDue}
                  </Typography>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailsHeader}>
          <Typography variant="md" weight="medium" color="navy" fontFamily="heading">
            {selectedDay 
              ? new Date(selectedDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Upcoming payments'}
          </Typography>
        </View>

        {selectedDay ? (
          <View style={styles.dayList}>
            {selectedDay.loans.map(l => (
              <View key={l.loanId} style={styles.dueItem}>
                <View style={styles.dueMain}>
                  <Typography weight="medium" color="navy" fontFamily="heading">{l.loanName}</Typography>
                  <Typography weight="bold" color="navy" fontFamily="heading">{formatCurrency(l.emiAmount)}</Typography>
                </View>
                <View style={styles.dueStatus}>
                  <Typography variant="xs" weight="bold" color={l.status === 'paid' ? Colors.emerald : l.status === 'overdue' ? Colors.red : Colors.amber}>
                    {l.status.toUpperCase()}
                  </Typography>
                  <Typography variant="xs" color="slate">Paid {formatCurrency(l.paidAmount)}</Typography>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.dayList}>
            {dueIn30.length === 0 ? (
              <Typography color="slate" align="center" style={styles.emptyListText}>
                No payments due in next 30 days.
              </Typography>
            ) : (
              dueIn30.map((item, idx) => (
                <View key={idx} style={styles.dueItem}>
                  <View style={styles.dueMain}>
                    <Typography weight="medium" color="navy" fontFamily="heading">{item.loanName}</Typography>
                    <Typography variant="caption" color="slate">
                      {item.dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Typography>
                  </View>
                  <Typography weight="bold" color="navy" fontFamily="heading">{formatCurrency(item.amount)}</Typography>
                </View>
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
});
