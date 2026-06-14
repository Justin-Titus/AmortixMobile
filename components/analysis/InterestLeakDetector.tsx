import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Colors, Spacing, Radius } from '@/constants/theme';
import Typography from '../ui/Typography';
import { formatCurrency } from '@/lib/calculations';
import { useInView } from '@/hooks/useInView';

type LoanLeak = {
  id: string;
  name: string;
  interestRate: number;
  monthlyInterest: number;
  pctOfTotalLeak: number;
};

type InterestLeakDetectorProps = {
  leaks: LoanLeak[];
  totalInterestPerMonth: number;
  currencyCode?: string;
};

const BAR_TRACK_WIDTH = Dimensions.get('window').width - Spacing.base * 4 - Spacing.lg * 2 - 50;

/**
 * Animated progress bar that fills from 0 to target pixel width.
 * Uses pixel width (not % string) for compatibility with Reanimated.
 */
function AnimatedLeakBar({
  targetPercent,
  color,
  delayMs,
  animKey,
  isInView,
}: {
  targetPercent: number;
  color: string;
  delayMs: number;
  animKey: string;
  isInView: boolean;
}) {
  const progress = useSharedValue(0);
  const targetRef = useRef(targetPercent);
  targetRef.current = targetPercent;

  useEffect(() => {
    if (!isInView) return;
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withDelay(
      delayMs,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
  }, [animKey, isInView]);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const pct = Math.min(100, Math.max(0, targetRef.current));
    return {
      width: BAR_TRACK_WIDTH * (pct / 100) * progress.value,
    };
  });

  return <Animated.View style={[styles.barFill, { backgroundColor: color }, animatedStyle]} />;
}

export default function InterestLeakDetector({
  leaks,
  totalInterestPerMonth,
  currencyCode = 'INR',
}: InterestLeakDetectorProps) {
  const containerRef = useRef<View>(null);
  const isInView = useInView(containerRef);
  const animKey = leaks.map((l) => `${l.id}:${l.pctOfTotalLeak.toFixed(2)}`).join('|');

  return (
    <View ref={containerRef} collapsable={false} style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle size={18} color={Colors.amber} />
        <Typography variant="body" weight="bold" color="navy" fontFamily="heading">
          Avoidable Interest Analysis
        </Typography>
      </View>
      <Typography variant="sm" color="slate" style={styles.subText}>
        Monthly interest bleeding from each loan
      </Typography>

      {leaks.map((loan, index) => (
        <View key={loan.id} style={styles.leakRow}>
          <View style={styles.leakInfo}>
            <View style={styles.leakLabelRow}>
              <Typography weight="medium" color="navy">{loan.name}</Typography>
              <Typography
                variant="caption"
                weight="bold"
                color={loan.interestRate >= 15 ? 'red' : 'amber'}
              >
                {loan.interestRate}%
              </Typography>
            </View>
            <Typography variant="sm" color="slate">
              {formatCurrency(loan.monthlyInterest, currencyCode)} / mo
            </Typography>
          </View>

          <View style={styles.barContainer}>
            <View style={styles.barBg}>
              <AnimatedLeakBar
                targetPercent={loan.pctOfTotalLeak}
                color={
                  loan.interestRate >= 15
                    ? Colors.red
                    : loan.interestRate >= 12
                    ? Colors.amber
                    : Colors.emerald
                }
                delayMs={index * 150}
                animKey={animKey}
                isInView={isInView}
              />
            </View>
            <Typography variant="xs" color="slate" style={styles.pctText}>
              {Math.round(loan.pctOfTotalLeak)}%
            </Typography>
          </View>
        </View>
      ))}

      <View style={styles.footer}>
        <Typography variant="sm" color="slate">Monthly Interest Cost:</Typography>
        <Typography variant="lg" weight="bold" color="red" fontFamily="heading">
          {formatCurrency(totalInterestPerMonth, currencyCode)}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.lg,
    marginTop: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  subText: {
    marginBottom: Spacing.lg,
  },
  leakRow: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  leakInfo: {
    marginBottom: 8,
  },
  leakLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  pctText: {
    width: 30,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
});
