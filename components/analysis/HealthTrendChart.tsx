import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';
import { TrendingUp, Activity } from 'lucide-react-native';

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
    return `Your health score dropped ${Math.abs(deltaScore).toFixed(0)} points. Consider identifying interest leaks.`;
  }
  if (deltaDTI < -5) {
    return 'Your health score is stable, but your Debt-to-Income ratio is improving. Good progress!';
  }

  return 'Your financial health has stayed stable. A consistent trend is a good sign for lenders.';
}

export default function HealthTrendChart({ snapshots }: { snapshots: HealthSnapshotPoint[] }) {
  const [range, setRange] = useState<RangeKey>('6M');

  const processedSnapshots = useMemo(() => {
    // 1. Sort by date
    const sorted = [...snapshots].sort(
      (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime()
    );

    // 2. Group by month-year to ensure one point per month
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

  // Dimension mapping
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - Spacing.base * 4; // Margin adjustments
  const chartHeight = 180;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 25;

  const paths = useMemo(() => {
    if (chartData.length < 2) return { healthArea: '', healthLine: '', dtiLine: '', projectionLine: '' };

    const getX = (idx: number) => {
      const scaleWidth = chartWidth - paddingLeft - paddingRight;
      return paddingLeft + (idx / (chartData.length - 1)) * scaleWidth;
    };

    const getYHealth = (score: number) => {
      const scaleHeight = chartHeight - paddingTop - paddingBottom;
      return chartHeight - paddingBottom - (score / 100) * scaleHeight;
    };

    const getYDti = (dti: number) => {
      const scaleHeight = chartHeight - paddingTop - paddingBottom;
      return chartHeight - paddingBottom - (dti / 100) * scaleHeight;
    };

    // 1. Health Area & Line
    let healthAreaPoints: string[] = [];
    let healthLinePoints: string[] = [];
    let dtiLinePoints: string[] = [];
    
    // We only map actual entries (not projected nulls)
    const actualLength = processedSnapshots.length;

    for (let i = 0; i < actualLength; i++) {
      const x = getX(i);
      const yH = getYHealth(chartData[i].affordabilityScore);
      const yD = getYDti(chartData[i].dtiRatioPercent);

      if (i === 0) {
        healthAreaPoints.push(`M ${x} ${chartHeight - paddingBottom}`);
        healthAreaPoints.push(`L ${x} ${yH}`);
        healthLinePoints.push(`M ${x} ${yH}`);
        dtiLinePoints.push(`M ${x} ${yD}`);
      } else {
        healthAreaPoints.push(`L ${x} ${yH}`);
        healthLinePoints.push(`L ${x} ${yH}`);
        dtiLinePoints.push(`L ${x} ${yD}`);
      }
    }

    if (healthAreaPoints.length > 0) {
      const lastX = getX(actualLength - 1);
      healthAreaPoints.push(`L ${lastX} ${chartHeight - paddingBottom}`);
      healthAreaPoints.push('Z');
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
      healthArea: healthAreaPoints.join(' '),
      healthLine: healthLinePoints.join(' '),
      dtiLine: dtiLinePoints.join(' '),
      projectionLine
    };
  }, [chartData, processedSnapshots.length, projected.length, chartWidth]);

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

  // Generate grid values
  const yTicks = [0, 25, 50, 75, 100];
  const scaleHeight = chartHeight - paddingTop - paddingBottom;
  const getTickY = (val: number) => chartHeight - paddingBottom - (val / 100) * scaleHeight;

  return (
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
              <Typography
                variant="xs"
                weight="bold"
                color={range === option ? 'navy' : 'slate'}
              >
                {option}
              </Typography>
            </TouchableOpacity>
          ))}
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

          {/* Health Area Fill */}
          {paths.healthArea ? <Path d={paths.healthArea} fill="url(#healthGrad)" /> : null}

          {/* Health Line */}
          {paths.healthLine ? <Path d={paths.healthLine} fill="none" stroke="#10B981" strokeWidth="3" /> : null}

          {/* Projection Line */}
          {paths.projectionLine ? <Path d={paths.projectionLine} fill="none" stroke="#10B981" strokeWidth="2.5" strokeDasharray="4,4" /> : null}

          {/* DTI Line */}
          {paths.dtiLine ? <Path d={paths.dtiLine} fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeDasharray="4,4" /> : null}

          {/* Plot Data Dots */}
          {chartData.map((d, i) => {
            const getX = (idx: number) => paddingLeft + (idx / (chartData.length - 1)) * (chartWidth - paddingLeft - paddingRight);
            const x = getX(i);

            const isProjection = d.affordabilityScore === null;
            const scoreVal = isProjection ? d.projectedScore : d.affordabilityScore;
            const dtiVal = d.dtiRatioPercent;

            const yH = getTickY(scoreVal);
            const yD = getTickY(dtiVal);

            return (
              <React.Fragment key={i}>
                {/* Health Dot */}
                <Circle
                  cx={x}
                  cy={yH}
                  r={isProjection ? 3.5 : 4}
                  fill={isProjection ? Colors.white : '#10B981'}
                  stroke={isProjection ? '#10B981' : Colors.white}
                  strokeWidth={isProjection ? 2.2 : 1.5}
                />
                
                {/* DTI Dot (only for actual data, not projection) */}
                {!isProjection && (
                  <Circle
                    cx={x}
                    cy={yD}
                    r={3}
                    fill={Colors.white}
                    stroke="#F59E0B"
                    strokeWidth={1.5}
                  />
                )}

                {/* X labels */}
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
