import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  predictDefaultRisk,
  type DefaultRiskInput,
  type DefaultRiskResult,
} from '@/lib/calculations';
import { useInView } from '@/hooks/useInView';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react-native';

// Pixel width of the progress bar track (card padding accounted for)
const BAR_TRACK_WIDTH = Dimensions.get('window').width - Spacing.base * 6;

function riskColor(result: DefaultRiskResult): string {
  if (result.riskScore < 15) return Colors.emerald;
  if (result.riskScore < 35) return Colors.amber;
  if (result.riskScore < 60) return Colors.red;
  return '#B91C1C';
}

function riskBg(result: DefaultRiskResult): string {
  if (result.riskLevel === 'low') return Colors.emeraldBg;
  if (result.riskLevel === 'medium') return Colors.amberBg;
  return Colors.redBg;
}

function riskBorderColor(result: DefaultRiskResult): string {
  if (result.riskLevel === 'low') return Colors.emerald;
  if (result.riskLevel === 'medium') return Colors.amber;
  return Colors.red;
}

export default function DefaultRiskCard({
  riskInput,
  currencyCode = 'INR',
}: {
  riskInput: DefaultRiskInput;
  currencyCode?: string;
}) {
  const containerRef = useRef<View>(null);
  const isInView = useInView(containerRef);
  const [expanded, setExpanded] = useState(false);
  const risk = useMemo(() => predictDefaultRisk(riskInput, currencyCode), [riskInput, currencyCode]);
  const activeColor = riskColor(risk);

  // Animate progress bar using pixel width (not %)
  const progress = useSharedValue(0);
  const scoreRef = useRef(risk.riskScore);
  scoreRef.current = risk.riskScore;

  useEffect(() => {
    if (!isInView) return;
    cancelAnimation(progress);
    progress.value = 0;
    progress.value = withDelay(
      150,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [risk.riskScore, isInView]);

  const barAnimStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      width: BAR_TRACK_WIDTH * (scoreRef.current / 100) * progress.value,
      backgroundColor: activeColor,
    };
  });

  return (
    <View ref={containerRef} collapsable={false}>
      <Card style={styles.card}>
      <View style={styles.header}>
        <Typography variant="xs" weight="bold" color="slate" style={styles.label}>
          DEFAULT RISK (3M)
        </Typography>
        <View style={[styles.badge, { backgroundColor: riskBg(risk), borderColor: riskBorderColor(risk) }]}>
          <Typography
            variant="xs"
            weight="bold"
            color={
              risk.riskLevel === 'medium' ? 'amber' : risk.riskLevel === 'low' ? 'emerald' : 'red'
            }
          >
            {risk.riskLevel.toUpperCase()}
          </Typography>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, barAnimStyle]} />
        </View>
      </View>

      <Typography variant="body" color="navy" style={styles.scoreText}>
        Risk score:{' '}
        <Typography weight="bold" fontFamily="mono" color="navy">
          {risk.riskScore}%
        </Typography>
      </Typography>

      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => setExpanded((prev) => !prev)}
        activeOpacity={0.7}
      >
        <Typography variant="xs" weight="bold" color="emerald">
          3 KEY FACTORS
        </Typography>
        {expanded ? (
          <ChevronUp size={14} color={Colors.emerald} />
        ) : (
          <ChevronDown size={14} color={Colors.emerald} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.factorsList}>
          {risk.topFactors.map((factor) => (
            <View key={factor.name} style={styles.factorCard}>
              <View style={styles.factorHeader}>
                <Typography variant="xs" weight="bold" color="navy">
                  {factor.name}
                </Typography>
                {factor.impact === 'negative' ? (
                  <AlertCircle size={14} color={Colors.red} />
                ) : (
                  <CheckCircle2 size={14} color={Colors.emerald} />
                )}
              </View>
              <Typography variant="xs" color="slate" style={styles.factorDesc}>
                {factor.description}
              </Typography>
            </View>
          ))}
        </View>
      )}

      <Typography variant="xs" color="slate" style={styles.recommendation}>
        {risk.recommendation}
      </Typography>
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
    alignItems: 'center',
  },
  label: {
    letterSpacing: 0.8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.badge,
    borderWidth: 1,
  },
  progressContainer: {
    marginTop: Spacing.xs,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  scoreText: {
    marginTop: -Spacing.xs,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  factorsList: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  factorCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.sm,
    backgroundColor: '#F8FAFC',
  },
  factorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  factorDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  recommendation: {
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
});
