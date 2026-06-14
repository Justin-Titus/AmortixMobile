import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
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

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type StrategyComparisonChartProps = {
  data: {
    name: string;
    interest: number;
    color: string;
  }[];
  activeStrategy: string;
  currencyCode?: string;
};

const CHART_WIDTH = Dimensions.get('window').width - Spacing.base * 4 - 32;

/**
 * A single animated bar Rect that grows from 0 → targetWidth.
 */
function AnimatedBar({
  x,
  y,
  targetWidth,
  height,
  fill,
  delayMs,
  animKey,
  isInView,
}: {
  x: number;
  y: number;
  targetWidth: number;
  height: number;
  fill: string;
  delayMs: number;
  animKey: string;
  isInView: boolean;
}) {
  const progress = useSharedValue(0);
  const targetRef = useRef(targetWidth);
  targetRef.current = targetWidth;

  useEffect(() => {
    if (!isInView) return;
    cancelAnimation(progress);
    progress.value = 0;
    if (targetWidth > 0) {
      progress.value = withDelay(
        delayMs,
        withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [animKey, isInView]);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    return { width: targetRef.current * progress.value };
  });

  return (
    <AnimatedRect
      x={x}
      y={y}
      height={height}
      fill={fill}
      rx={4}
      animatedProps={animatedProps}
    />
  );
}

export default function StrategyComparisonChart({
  data,
  activeStrategy,
  currencyCode = 'INR',
}: StrategyComparisonChartProps) {
  const containerRef = useRef<View>(null);
  const isInView = useInView(containerRef);
  const maxInterest = Math.max(...data.map((d) => d.interest), 1);
  const barHeight = 24;
  const gap = 30;
  const CHART_HEIGHT = data.length * (barHeight + gap) + 20;

  // Stable key so bars retrigger when data changes
  const animKey = data.map((d) => `${d.name}:${d.interest}`).join('|');

  return (
    <View ref={containerRef} collapsable={false} style={styles.container}>
      <Typography variant="body" weight="bold" color="navy" fontFamily="heading" style={styles.title}>
        Interest Comparison
      </Typography>

      <View style={styles.chart}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {data.map((item, i) => {
            const barWidth = (item.interest / maxInterest) * (CHART_WIDTH - 100);
            const y = i * (barHeight + gap) + 20;
            const isActive = activeStrategy.toLowerCase() === item.name.toLowerCase();

            return (
              <React.Fragment key={item.name}>
                <SvgText x="0" y={y - 8} fontSize="11" fontWeight="bold" fill={Colors.navy}>
                  {item.name}
                </SvgText>

                {/* Static background bar */}
                <Rect
                  x="0"
                  y={y}
                  width={CHART_WIDTH - 80}
                  height={barHeight}
                  fill="#f1f5f9"
                  rx={4}
                />

                {/* Animated foreground bar */}
                <AnimatedBar
                  x={0}
                  y={y}
                  targetWidth={barWidth}
                  height={barHeight}
                  fill={isActive ? item.color : '#94A3B8'}
                  delayMs={i * 200}
                  animKey={animKey}
                  isInView={isInView}
                />

                <SvgText
                  x={CHART_WIDTH - 70}
                  y={y + 16}
                  fontSize="11"
                  fontWeight="bold"
                  fill={Colors.navy}
                >
                  {formatCurrency(item.interest, currencyCode)}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.base,
  },
  title: {
    marginBottom: Spacing.md,
  },
  chart: {
    alignItems: 'center',
  },
});
