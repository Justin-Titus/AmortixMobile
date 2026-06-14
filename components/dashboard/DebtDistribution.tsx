import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '@/constants/theme';
import Typography from '../ui/Typography';
import { formatCurrency } from '@/lib/calculations';
import { useInView } from '@/hooks/useInView';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type DebtDistributionProps = {
  loans: Array<{
    name: string;
    balance: number;
    color: string;
  }>;
  currencyCode?: string;
};

const CHART_SIZE = 160;
const STROKE_WIDTH = 20;
const RADIUS = (CHART_SIZE - STROKE_WIDTH) / 2;
const CENTER = CHART_SIZE / 2;

/**
 * A single animated donut slice.
 * Uses a 0→1 progress shared value to animate strokeDashoffset from arcLength → 0.
 */
function AnimatedSlice({
  d,
  color,
  arcLength,
  delayMs,
  animKey,
  isInView,
}: {
  d: string;
  color: string;
  arcLength: number;
  delayMs: number;
  animKey: string;
  isInView: boolean;
}) {
  const progress = useSharedValue(0);
  const arcLenRef = useRef(arcLength);
  arcLenRef.current = arcLength;

  useEffect(() => {
    if (!isInView) return;
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [animKey, isInView]);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const len = arcLenRef.current;
    return {
      strokeDasharray: `${len} ${len}`,
      strokeDashoffset: len * (1 - progress.value),
    };
  });

  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={STROKE_WIDTH}
      animatedProps={animatedProps}
    />
  );
}

export default function DebtDistribution({ loans, currencyCode = 'INR' }: DebtDistributionProps) {
  const containerRef = useRef<View>(null);
  const isInView = useInView(containerRef);
  const total = loans.reduce((s, l) => s + l.balance, 0);

  if (total === 0) return null;

  const slices = useMemo(() => {
    let currentAngle = 0;
    return loans.map((loan) => {
      const percentage = loan.balance / total;
      const angle = percentage * 360;

      const x1 = CENTER + RADIUS * Math.cos((currentAngle * Math.PI) / 180);
      const y1 = CENTER + RADIUS * Math.sin((currentAngle * Math.PI) / 180);
      const x2 = CENTER + RADIUS * Math.cos(((currentAngle + angle) * Math.PI) / 180);
      const y2 = CENTER + RADIUS * Math.sin(((currentAngle + angle) * Math.PI) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;
      const d = `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
      const arcLength = Math.max(1, (angle / 360) * 2 * Math.PI * RADIUS);

      currentAngle += angle;
      return { name: loan.name, color: loan.color, d, arcLength };
    });
  }, [loans, total]);

  // Stable key so AnimatedSlice effects retrigger when data genuinely changes
  const animKey = loans.map(l => `${l.name}:${l.balance}`).join('|');

  return (
    <View ref={containerRef} collapsable={false} style={styles.container}>
      <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={styles.title}>
        Debt Distribution
      </Typography>

      <View style={styles.content}>
        <View style={styles.chart}>
          <Svg width={CHART_SIZE} height={CHART_SIZE}>
            <G rotation="-90" origin={`${CENTER}, ${CENTER}`}>
              {slices.map((slice, i) => (
                <AnimatedSlice
                  key={slice.name}
                  d={slice.d}
                  color={slice.color}
                  arcLength={slice.arcLength}
                  delayMs={i * 150}
                  animKey={animKey}
                  isInView={isInView}
                />
              ))}
            </G>
            <SvgText x={CENTER} y={CENTER - 5} textAnchor="middle" fontSize="10" fill={Colors.slate}>
              Total
            </SvgText>
            <SvgText
              x={CENTER}
              y={CENTER + 15}
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill={Colors.navy}
            >
              {formatCurrency(total, currencyCode, { compact: true })}
            </SvgText>
          </Svg>
        </View>

        <View style={styles.legend}>
          {loans.map((loan) => (
            <View key={loan.name} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: loan.color }]} />
              <View style={{ flex: 1 }}>
                <Typography variant="xs" weight="medium" color="navy" numberOfLines={1}>
                  {loan.name}
                </Typography>
                <Typography variant="xs" color="slate">
                  {Math.round((loan.balance / total) * 100)}%
                </Typography>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  title: {
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  chart: {
    width: CHART_SIZE,
    height: CHART_SIZE,
  },
  legend: {
    flex: 1,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
});
