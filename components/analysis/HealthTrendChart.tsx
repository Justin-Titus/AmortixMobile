import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';
import { TrendingUp } from 'lucide-react-native';
import { useInView } from '@/hooks/useInView';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type HealthSnapshotPoint = {
  id: string;
  capturedAt: string;
  affordabilityScore: number;
  dtiRatio: number;
  totalOutstanding: number;
};

type RangeKey = '3M' | '6M' | '1Y';

function formatMonthLabel(dateText: string): string {
  const date = new Date(dateText);
  return date.toLocaleDateString('en-GB', {
    month: 'short',
    year: '2-digit',
  });
}

function monthsForRange(range: RangeKey): number {
  if (range === '3M') return 3;
  if (range === '6M') return 6;
  return 12;
}

function projectPoints(points: HealthSnapshotPoint[]): HealthSnapshotPoint[] {
  if (points.length < 2) return [];
  const last = points[points.length - 1];
  const previous = points[points.length - 2];
  const delta = last.affordabilityScore - previous.affordabilityScore;
  const futureDate = new Date(last.capturedAt);
  futureDate.setMonth(futureDate.getMonth() + 1);
  return [
    {
      id: `${last.id}-projection`,
      capturedAt: futureDate.toISOString(),
      affordabilityScore: Math.max(0, Math.min(100, Math.round(last.affordabilityScore + delta))),
      dtiRatio: Math.max(0, last.dtiRatio),
      totalOutstanding: Math.max(0, last.totalOutstanding - Math.max(0, last.totalOutstanding * 0.03)),
    },
  ];
}

export function getTrendInsight(snapshots: HealthSnapshotPoint[]): string {
  if (snapshots.length < 2) {
    return 'Keep using Amortix monthly to build your health trend.';
  }
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const deltaScore = last.affordabilityScore - first.affordabilityScore;
  const deltaDTI = (last.dtiRatio - first.dtiRatio) * 100;
  if (deltaScore > 5) {
    return `Your financial health improved by ${deltaScore.toFixed(0)} points. You're building solid momentum.`;
  }
  if (deltaScore < -5) {
    return `Your health score dropped ${Math.abs(deltaScore).toFixed(0)} points. Consider identifying avoidable interest costs.`;
  }
  if (deltaDTI < -5) {
    return 'Your health score is stable, but your Debt-to-Income ratio is improving. Good progress!';
  }
  return 'Your financial health has stayed stable. A consistent trend is a good sign for lenders.';
}

/**
 * Approximate SVG path length by summing Euclidean distances between
 * consecutive coordinate pairs parsed from the path string.
 */
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

export default function HealthTrendChart({ snapshots }: { snapshots: HealthSnapshotPoint[] }) {
  const containerRef = useRef<View>(null);
  const isInView = useInView(containerRef);
  const [range, setRange] = useState<RangeKey>('6M');

  const processedSnapshots = useMemo(() => {
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    );
    const monthlyData: Record<string, HealthSnapshotPoint> = {};
    sorted.forEach((s) => {
      const key = new Date(s.capturedAt).toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' });
      monthlyData[key] = s;
    });
    const months = Object.values(monthlyData);
    const count = monthsForRange(range);
    return months.slice(-count);
  }, [range, snapshots]);

  const projected = useMemo(() => projectPoints(processedSnapshots), [processedSnapshots]);

  const chartData = useMemo(() => {
    const hasProjection = projected.length > 0;
    const data = processedSnapshots.map((snapshot, index) => ({
      month: formatMonthLabel(snapshot.capturedAt),
      affordabilityScore: snapshot.affordabilityScore,
      projectedScore: hasProjection && index === processedSnapshots.length - 1 ? snapshot.affordabilityScore : null,
      dtiRatioPercent: Math.round(snapshot.dtiRatio * 100),
      totalOutstanding: snapshot.totalOutstanding,
    }));
    if (data.length > 0 && projected.length > 0) {
      const lastPoint = data[data.length - 1];
      const projectionRows = projected.map((snapshot) => ({
        month: formatMonthLabel(snapshot.capturedAt),
        affordabilityScore: null as any,
        projectedScore: snapshot.affordabilityScore,
        dtiRatioPercent: Math.round(snapshot.dtiRatio * 100),
        totalOutstanding: snapshot.totalOutstanding,
        lastActualScore: lastPoint.affordabilityScore,
      }));
      return [...data, ...projectionRows];
    }
    return data;
  }, [processedSnapshots, projected]);

  const trendInsight = useMemo(() => getTrendInsight(processedSnapshots), [processedSnapshots]);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - Spacing.base * 4;
  const chartHeight = 180;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

  const paths = useMemo(() => {
    if (chartData.length < 2) return { healthArea: '', healthLine: '', dtiLine: '', projectionLine: '' };

    const totalPts = chartData.length;
    const scaleW = chartWidth - paddingLeft - paddingRight;
    const scaleH = chartHeight - paddingTop - paddingBottom;

    const getX = (idx: number) => paddingLeft + (idx / (totalPts - 1)) * scaleW;
    const getYHealth = (score: number) => chartHeight - paddingBottom - (score / 100) * scaleH;
    const getYDti = (dti: number) => chartHeight - paddingBottom - (dti / 100) * scaleH;

    const actualLength = processedSnapshots.length;
    let healthAreaPts: string[] = [];
    let healthLinePts: string[] = [];
    let dtiLinePts: string[] = [];

    for (let i = 0; i < actualLength; i++) {
      const x = getX(i);
      const yH = getYHealth(chartData[i].affordabilityScore);
      const yD = getYDti(chartData[i].dtiRatioPercent);
      if (i === 0) {
        healthAreaPts.push(`M ${x} ${chartHeight - paddingBottom} L ${x} ${yH}`);
        healthLinePts.push(`M ${x} ${yH}`);
        dtiLinePts.push(`M ${x} ${yD}`);
      } else {
        healthAreaPts.push(`L ${x} ${yH}`);
        healthLinePts.push(`L ${x} ${yH}`);
        dtiLinePts.push(`L ${x} ${yD}`);
      }
    }
    if (healthAreaPts.length > 0) {
      const lastX = getX(actualLength - 1);
      healthAreaPts.push(`L ${lastX} ${chartHeight - paddingBottom} Z`);
    }

    let projectionLine = '';
    if (projected.length > 0 && actualLength > 0) {
      const startX = getX(actualLength - 1);
      const startY = getYHealth(chartData[actualLength - 1].affordabilityScore ?? 0);
      const endX = getX(chartData.length - 1);
      const endY = getYHealth(chartData[chartData.length - 1].projectedScore ?? 0);
      projectionLine = `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    return {
      healthArea: healthAreaPts.join(' '),
      healthLine: healthLinePts.join(' '),
      dtiLine: dtiLinePts.join(' '),
      projectionLine,
    };
  }, [chartData, processedSnapshots.length, projected.length, chartWidth]);

  // Store path lengths in refs so useAnimatedProps can always read the current value
  // without creating a stale closure.
  const healthLenRef = useRef(0);
  const dtiLenRef = useRef(0);
  const projLenRef = useRef(0);

  // Update refs whenever paths change
  healthLenRef.current = calcPathLen(paths.healthLine);
  dtiLenRef.current = calcPathLen(paths.dtiLine);
  projLenRef.current = calcPathLen(paths.projectionLine);

  // Single progress value 0→1 drives all line animations
  const lineProgress = useSharedValue(0);
  const areaOpacity = useSharedValue(0);
  const dotOpacity = useSharedValue(0);
  const projProgress = useSharedValue(0);

  // A string key that changes whenever the chart data changes — used as effect dep
  const chartKey = useMemo(
    () => chartData.map(d => d.month + (d.affordabilityScore ?? d.projectedScore)).join('|'),
    [chartData]
  );

  useEffect(() => {
    if (!isInView) return;
    if (processedSnapshots.length < 2) return;

    const easing = Easing.out(Easing.cubic);

    // Cancel any running animations and reset to start
    cancelAnimation(lineProgress);
    cancelAnimation(areaOpacity);
    cancelAnimation(dotOpacity);
    cancelAnimation(projProgress);

    lineProgress.value = 0;
    areaOpacity.value = 0;
    dotOpacity.value = 0;
    projProgress.value = 0;

    // Lines draw on (0→1 progress)
    lineProgress.value = withDelay(80, withTiming(1, { duration: 1000, easing }));
    // Area fades in
    areaOpacity.value = withDelay(200, withTiming(1, { duration: 700, easing }));
    // Dots appear
    dotOpacity.value = withDelay(900, withTiming(1, { duration: 400, easing }));
    // Projection line (after main lines finish)
    projProgress.value = withDelay(1050, withTiming(1, { duration: 600, easing }));
  }, [chartKey, isInView]);

  const healthLineAnimProps = useAnimatedProps(() => {
    'worklet';
    const len = healthLenRef.current;
    return {
      strokeDasharray: `${len} ${len}`,
      strokeDashoffset: len * (1 - lineProgress.value),
    };
  });

  const dtiLineAnimProps = useAnimatedProps(() => {
    'worklet';
    const len = dtiLenRef.current;
    return {
      strokeDasharray: '5,5',
      strokeDashoffset: len * (1 - lineProgress.value),
    };
  });

  const projLineAnimProps = useAnimatedProps(() => {
    'worklet';
    const len = projLenRef.current;
    return {
      strokeDasharray: '5,5',
      strokeDashoffset: len * (1 - projProgress.value),
    };
  });

  const areaAnimProps = useAnimatedProps(() => ({
    opacity: areaOpacity.value,
  }));

  const dotAnimProps = useAnimatedProps(() => ({
    opacity: dotOpacity.value,
  }));

  if (processedSnapshots.length < 2) {
    return (
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Typography variant="body" weight="bold" color="navy" fontFamily="heading">
              Financial health over time
            </Typography>
            <Typography variant="xs" color="slate">
              History builds as you use Amortix
            </Typography>
          </View>
          <View style={styles.emptyProgress}>
            <View style={styles.emptyProgressFill} />
          </View>
        </View>
        <View style={styles.emptyState}>
          <Typography variant="xs" color="slate">
            Need at least 2 monthly snapshots to show trend
          </Typography>
        </View>
      </Card>
    );
  }

  const yTicks = [0, 25, 50, 75, 100];
  const scaleHeight = chartHeight - paddingTop - paddingBottom;
  const getTickY = (val: number) => chartHeight - paddingBottom - (val / 100) * scaleHeight;
  const getX = (idx: number) =>
    paddingLeft + (idx / (chartData.length - 1)) * (chartWidth - paddingLeft - paddingRight);

  return (
    <View ref={containerRef} collapsable={false}>
      <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Typography variant="body" weight="bold" color="navy" fontFamily="heading">
            Financial health over time
          </Typography>
          <Typography variant="xs" color="slate">
            Affordability score and DTI trend
          </Typography>
        </View>
        {/* Range Selector */}
        <View style={styles.rangeSelector}>
          {(['3M', '6M', '1Y'] as RangeKey[]).map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setRange(option)}
              style={[styles.rangeBtn, range === option && styles.rangeBtnActive]}
              activeOpacity={0.8}
            >
              <Typography variant="xs" weight="bold" color={range === option ? 'navy' : 'slate'}>
                {option}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Typography variant="xs" color="slate">
            Health Score
          </Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.legendDashedLineContainer}>
            <View style={[styles.legendDashedLine, { borderColor: '#10B981' }]} />
          </View>
          <Typography variant="xs" color="slate">
            Projected
          </Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Typography variant="xs" color="slate">
            DTI Ratio (%)
          </Typography>
        </View>
      </View>

      {/* SVG Plot */}
      <View style={styles.plotContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </LinearGradient>
          </Defs>

          {/* Grid Lines */}
          {yTicks.map(t => (
            <React.Fragment key={t}>
              <Line
                x1={paddingLeft}
                y1={getTickY(t)}
                x2={chartWidth - paddingRight}
                y2={getTickY(t)}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <SvgText
                x={paddingLeft - 8}
                y={getTickY(t) + 3}
                fontSize="8"
                fill={Colors.slate}
                textAnchor="end"
              >
                {t}
              </SvgText>
            </React.Fragment>
          ))}

          {/* Reference thresholds */}
          <Line x1={paddingLeft} y1={getTickY(75)} x2={chartWidth - paddingRight} y2={getTickY(75)} stroke="#10B981" strokeWidth="1" strokeDasharray="2,2" />
          <Line x1={paddingLeft} y1={getTickY(50)} x2={chartWidth - paddingRight} y2={getTickY(50)} stroke="#F59E0B" strokeWidth="1" strokeDasharray="2,2" />

          {/* Health Area Fill — animated opacity */}
          {paths.healthArea ? (
            <AnimatedPath
              d={paths.healthArea}
              fill="url(#healthGrad)"
              animatedProps={areaAnimProps}
            />
          ) : null}

          {/* Health Line — animated draw-on via progress */}
          {paths.healthLine ? (
            <AnimatedPath
              d={paths.healthLine}
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              animatedProps={healthLineAnimProps}
            />
          ) : null}

          {/* DTI Line — animated draw-on via progress */}
          {paths.dtiLine ? (
            <AnimatedPath
              d={paths.dtiLine}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.2"
              strokeDasharray="5,5"
              animatedProps={dtiLineAnimProps}
            />
          ) : null}

          {/* Projection Line — animated draw-on */}
          {paths.projectionLine ? (
            <AnimatedPath
              d={paths.projectionLine}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeDasharray="5,5"
              animatedProps={projLineAnimProps}
            />
          ) : null}

          {/* Data Dots — fade in */}
          {chartData.map((d, i) => {
            const x = getX(i);
            const isProjection = d.affordabilityScore === null;
            const scoreVal = isProjection ? d.projectedScore : d.affordabilityScore;
            const dtiVal = d.dtiRatioPercent;
            const yH = getTickY(scoreVal);
            const yD = getTickY(dtiVal);

            return (
              <React.Fragment key={i}>
                <AnimatedCircle
                  cx={x}
                  cy={yH}
                  r={isProjection ? 3.5 : 4}
                  fill={isProjection ? Colors.white : '#10B981'}
                  stroke={isProjection ? '#10B981' : Colors.white}
                  strokeWidth={isProjection ? 2.2 : 1.5}
                  animatedProps={dotAnimProps}
                />
                {!isProjection && (
                  <AnimatedCircle
                    cx={x}
                    cy={yD}
                    r={3}
                    fill={Colors.white}
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                    animatedProps={dotAnimProps}
                  />
                )}
                {i % 2 === 0 && (
                  <SvgText
                    x={x}
                    y={chartHeight - 6}
                    fontSize="9"
                    fill={Colors.slate}
                    textAnchor="middle"
                  >
                    {d.month}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Insight row */}
      <View style={styles.insightBox}>
        <View style={styles.iconContainer}>
          <TrendingUp size={16} color={Colors.emerald} />
        </View>
        <Typography variant="xs" color="slate" style={styles.insightText}>
          {trendInsight}
        </Typography>
      </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emptyProgress: {
    height: 6,
    width: 80,
    backgroundColor: Colors.frost,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  emptyProgressFill: {
    width: '35%',
    height: '100%',
    backgroundColor: Colors.emerald,
    borderRadius: Radius.full,
  },
  emptyState: {
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.borderMid,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 245, 239, 0.2)',
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.frost,
    padding: 2,
    borderRadius: Radius.md,
  },
  rangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  rangeBtnActive: {
    backgroundColor: Colors.white,
    ...Shadows.metric,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    columnGap: Spacing.md,
    rowGap: Spacing.xs,
    marginTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
  },
  legendDashedLineContainer: {
    width: 14,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendDashedLine: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 1,
    borderStyle: 'dashed',
  },
  plotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.xs,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: Spacing.md,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.emeraldBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    flex: 1,
    lineHeight: 16,
  },
});
