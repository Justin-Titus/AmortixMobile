import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Typography from '@/components/ui/Typography';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useInView } from '@/hooks/useInView';
import {
  formatCurrency,
  getCurrencyConfig,
  generateAmortizationSchedule,
  getScheduleSummary,
} from '@/lib/calculations';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function estimateRemainingMonths(
  outstanding: number,
  annualRate: number,
  emi: number,
  fallback: number
): number {
  if (outstanding <= 0 || emi <= 0) return Math.max(1, fallback);
  if (annualRate <= 0) return Math.max(1, Math.ceil(outstanding / emi));
  const r = annualRate / 12 / 100;
  const denominator = emi - outstanding * r;
  if (denominator <= 0) return Math.max(1, fallback);
  const months = Math.log(emi / denominator) / Math.log(1 + r);
  if (!Number.isFinite(months) || months <= 0) return Math.max(1, fallback);
  return Math.max(1, Math.ceil(months));
}

function calcPathLen(d: string): number {
  if (!d) return 0;
  const tokens = d.split(/[\s,]+/);
  const coords: number[] = [];
  for (const t of tokens) {
    const n = parseFloat(t);
    if (!isNaN(n)) coords.push(n);
  }
  let len = 0;
  for (let i = 2; i < coords.length - 1; i += 2) {
    const dx = coords[i] - coords[i - 2];
    const dy = coords[i + 1] - coords[i - 1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len > 0 ? len : 0;
}

type TabKey = 'lump' | 'monthly' | 'hybrid';

type PrepaymentSimulatorProps = {
  outstandingBalance: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  currencyCode?: string;
};

export default function PrepaymentSimulator({
  outstandingBalance,
  interestRate,
  tenureMonths,
  emiAmount,
  currencyCode = 'INR',
}: PrepaymentSimulatorProps) {
  const containerRef = useRef<View>(null);
  const isInView = useInView(containerRef);
  const [tab, setTab] = useState<TabKey>('lump');
  const [lumpSum, setLumpSum] = useState('10000');
  const [monthlyExtra, setMonthlyExtra] = useState('2000');
  const [hybridLump, setHybridLump] = useState('10000');
  const [hybridMonthly, setHybridMonthly] = useState('1000');

  const remainingMonths = useMemo(
    () => estimateRemainingMonths(outstandingBalance, interestRate, emiAmount, tenureMonths),
    [outstandingBalance, interestRate, emiAmount, tenureMonths]
  );

  const baselineSchedule = useMemo(
    () => generateAmortizationSchedule(outstandingBalance, interestRate, remainingMonths, 0),
    [outstandingBalance, interestRate, remainingMonths]
  );

  const baselineSummary = useMemo(() => getScheduleSummary(baselineSchedule), [baselineSchedule]);

  const scenario = useMemo(() => {
    const lump =
      tab === 'lump' ? Number(lumpSum) || 0 : tab === 'hybrid' ? Number(hybridLump) || 0 : 0;
    const extra =
      tab === 'monthly'
        ? Number(monthlyExtra) || 0
        : tab === 'hybrid'
        ? Number(hybridMonthly) || 0
        : 0;
    const adjustedOutstanding = Math.max(0, outstandingBalance - lump);
    const schedule = generateAmortizationSchedule(
      adjustedOutstanding,
      interestRate,
      remainingMonths,
      extra,
      emiAmount
    );
    const summary = getScheduleSummary(schedule);
    return { lump, extra, schedule, summary };
  }, [tab, lumpSum, monthlyExtra, hybridLump, hybridMonthly, outstandingBalance, interestRate, remainingMonths]);

  const monthsSaved = Math.max(0, baselineSummary.months - scenario.summary.months);
  const interestSaved = Math.max(0, baselineSummary.totalInterest - scenario.summary.totalInterest);

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + scenario.summary.months);

  // SVG chart
  const chartWidth = 320;
  const chartHeight = 120;
  const paddingLeft = 10;
  const paddingRight = 10;
  const paddingTop = 10;
  const paddingBottom = 10;

  const chartPaths = useMemo(() => {
    const maxMonths = Math.max(baselineSchedule.length, scenario.schedule.length);
    if (maxMonths <= 1 || outstandingBalance <= 0) return { baselinePath: '', scenarioPath: '' };

    const getX = (idx: number) => {
      const scaleWidth = chartWidth - paddingLeft - paddingRight;
      return paddingLeft + (idx / (maxMonths - 1)) * scaleWidth;
    };
    const getY = (bal: number) => {
      const scaleHeight = chartHeight - paddingTop - paddingBottom;
      return chartHeight - paddingBottom - (bal / outstandingBalance) * scaleHeight;
    };

    let baselinePath = `M ${getX(0)} ${getY(outstandingBalance)}`;
    baselineSchedule.forEach((entry, idx) => {
      baselinePath += ` L ${getX(idx)} ${getY(entry.outstandingBalance)}`;
    });

    const startBal = Math.max(0, outstandingBalance - scenario.lump);
    let scenarioPath = `M ${getX(0)} ${getY(outstandingBalance)} L ${getX(0)} ${getY(startBal)}`;
    scenario.schedule.forEach((entry, idx) => {
      scenarioPath += ` L ${getX(idx)} ${getY(entry.outstandingBalance)}`;
    });

    return { baselinePath, scenarioPath };
  }, [baselineSchedule, scenario.schedule, scenario.lump, outstandingBalance]);

  // Store path lengths in refs so worklet can read them without closure issues
  const baselineLenRef = useRef(0);
  const scenarioLenRef = useRef(0);
  baselineLenRef.current = calcPathLen(chartPaths.baselinePath);
  scenarioLenRef.current = calcPathLen(chartPaths.scenarioPath);

  // Single progress value 0→1 per line
  const baselineProgress = useSharedValue(0);
  const scenarioProgress = useSharedValue(0);

  // Stable key to detect data changes
  const pathKey = `${chartPaths.baselinePath.length}|${chartPaths.scenarioPath.length}|${scenario.lump}`;

  useEffect(() => {
    if (!isInView) return;
    const easing = Easing.out(Easing.cubic);
    cancelAnimation(baselineProgress);
    cancelAnimation(scenarioProgress);
    baselineProgress.value = 0;
    scenarioProgress.value = 0;

    baselineProgress.value = withTiming(1, { duration: 900, easing });
    scenarioProgress.value = withDelay(300, withTiming(1, { duration: 1000, easing }));
  }, [pathKey, isInView]);

  const baselineAnimProps = useAnimatedProps(() => {
    'worklet';
    const len = baselineLenRef.current;
    return {
      strokeDasharray: `${len} ${len}`,
      strokeDashoffset: len * (1 - baselineProgress.value),
    };
  });

  const scenarioAnimProps = useAnimatedProps(() => {
    'worklet';
    const len = scenarioLenRef.current;
    return {
      strokeDasharray: `${len} ${len}`,
      strokeDashoffset: len * (1 - scenarioProgress.value),
    };
  });

  // Investment comparison
  const fdRate = 0.07;
  const months = scenario.summary.months;
  const monthlyRate = fdRate / 12;
  const scenarioCapital = scenario.lump + scenario.extra * months;
  const futureValueLump = scenario.lump * Math.pow(1 + monthlyRate, months);
  const futureValueMonthly =
    scenario.extra > 0
      ? scenario.extra * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
      : 0;
  const futureValue = futureValueLump + futureValueMonthly;
  const fdInterestEarned = Math.max(0, Math.round((futureValue - scenarioCapital) * 100) / 100);
  const netAdvantage = interestSaved - fdInterestEarned;

  const investmentActionText =
    tab === 'lump'
      ? `${formatCurrency(scenario.lump, currencyCode)} upfront in a 7% FD`
      : tab === 'monthly'
      ? `${formatCurrency(scenario.extra, currencyCode)} monthly in a 7% RD`
      : `${formatCurrency(scenario.lump, currencyCode)} upfront in a 7% FD and ${formatCurrency(scenario.extra, currencyCode)} monthly in a 7% RD`;

  return (
    <View ref={containerRef} collapsable={false}>
      <Card style={styles.container}>
      {/* Segment Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'lump', label: 'Lump sum' },
          { key: 'monthly', label: 'Monthly extra' },
          { key: 'hybrid', label: 'Hybrid' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => setTab(item.key as TabKey)}
            style={[styles.tabButton, tab === item.key && styles.tabButtonActive]}
            activeOpacity={0.8}
          >
            <Typography
              variant="xs"
              weight="bold"
              color={tab === item.key ? 'white' : 'slate'}
            >
              {item.label}
            </Typography>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input Fields */}
      <View style={styles.inputSection}>
        {tab === 'lump' && (
          <Input
            label="Lump sum amount"
            keyboardType="numeric"
            value={lumpSum}
            onChangeText={setLumpSum}
            placeholder="e.g. 10000"
          />
        )}
        {tab === 'monthly' && (
          <Input
            label="Monthly extra amount"
            keyboardType="numeric"
            value={monthlyExtra}
            onChangeText={setMonthlyExtra}
            placeholder="e.g. 2000"
          />
        )}
        {tab === 'hybrid' && (
          <View style={styles.hybridGrid}>
            <View style={styles.halfInput}>
              <Input
                label="Lump sum today"
                keyboardType="numeric"
                value={hybridLump}
                onChangeText={setHybridLump}
                placeholder="e.g. 10000"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Monthly extra"
                keyboardType="numeric"
                value={hybridMonthly}
                onChangeText={setHybridMonthly}
                placeholder="e.g. 1000"
              />
            </View>
          </View>
        )}
      </View>

      {/* Saving Metric Cards */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Typography variant="xs" color="slate">Months saved</Typography>
          <Typography variant="lg" weight="bold" color="emerald" style={styles.metricVal}>
            {monthsSaved}
          </Typography>
        </View>
        <View style={styles.metricCard}>
          <Typography variant="xs" color="slate">Interest saved</Typography>
          <Typography variant="lg" weight="bold" color="emerald" style={styles.metricVal}>
            {formatCurrency(interestSaved, currencyCode)}
          </Typography>
        </View>
        <View style={styles.metricCard}>
          <Typography variant="xs" color="slate">New payoff</Typography>
          <Typography variant="sm" weight="bold" color="navy" style={styles.metricVal}>
            {payoffDate.toLocaleDateString(getCurrencyConfig(currencyCode).locale, {
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
        </View>
        <View style={styles.metricCard}>
          <Typography variant="xs" color="slate">New tenure</Typography>
          <Typography variant="sm" weight="bold" color="navy" style={styles.metricVal}>
            {scenario.summary.months} mos
          </Typography>
        </View>
      </View>

      {/* SVG Trajectory Chart */}
      <View style={styles.chartContainer}>
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Line x1="10" y1="10" x2="310" y2="10" stroke="#F1F5F9" strokeWidth="1" />
          <Line x1="10" y1="60" x2="310" y2="60" stroke="#F1F5F9" strokeWidth="1" />
          <Line x1="10" y1="110" x2="310" y2="110" stroke="#F1F5F9" strokeWidth="1" />

          {chartPaths.baselinePath ? (
            <AnimatedPath
              d={chartPaths.baselinePath}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="2"
              animatedProps={baselineAnimProps}
            />
          ) : null}

          {chartPaths.scenarioPath ? (
            <AnimatedPath
              d={chartPaths.scenarioPath}
              fill="none"
              stroke={Colors.emerald}
              strokeWidth="3"
              animatedProps={scenarioAnimProps}
            />
          ) : null}
        </Svg>
      </View>

      {/* Financial Comparison Tip */}
      <View style={styles.advContainer}>
        <Typography variant="xs" color="slate" style={styles.advText}>
          If you invested {investmentActionText} instead for the next {months} months, you'd earn{' '}
          {formatCurrency(fdInterestEarned, currencyCode)} in interest. Prepaying saves{' '}
          {formatCurrency(interestSaved, currencyCode)} in interest, giving you a net advantage of{' '}
          {formatCurrency(netAdvantage, currencyCode)}.
        </Typography>
      </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.frost,
    padding: 4,
    borderRadius: Radius.full,
    gap: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: Colors.navy,
  },
  inputSection: {
    marginTop: Spacing.xs,
  },
  hybridGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: Colors.frost,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  metricVal: {
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFCFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    overflow: 'hidden',
  },
  advContainer: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.emerald,
    paddingLeft: Spacing.sm,
  },
  advText: {
    lineHeight: 16,
  },
});
