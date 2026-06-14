import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useInView } from '@/hooks/useInView';
import { getAffordabilityZoneLabel } from '@/lib/calculations';
import Typography from '../ui/Typography';
import { Colors } from '@/constants/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

type AffordabilityGaugeProps = {
  score: number;
};

function getGaugeColor(score: number) {
  if (score >= 75) return '#059669';
  if (score >= 50) return '#F59E0B';
  return '#DC2626';
}

export default function AffordabilityGauge({ score }: AffordabilityGaugeProps) {
  const containerRef = useRef<View>(null);
  const isInView = useInView(containerRef);
  const normalizedScore = Number.isFinite(score) ? score : 0;
  const safeScore = Math.min(100, Math.max(0, normalizedScore));
  const radius = 62;
  const cx = 80;
  const cy = 80;
  const circumference = Math.PI * radius;
  
  const animatedProgress = useSharedValue(circumference);

  useEffect(() => {
    if (!isInView) return;
    const progress = circumference * (1 - safeScore / 100);
    animatedProgress.value = circumference; // Reset on load
    animatedProgress.value = withDelay(150, withTiming(progress, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    }));
  }, [safeScore, circumference, isInView]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedProgress.value,
  }));

  const zoneLabel = getAffordabilityZoneLabel(safeScore);

  return (
    <View ref={containerRef} collapsable={false} style={styles.container}>
      <Svg width={160} height={90} viewBox="0 0 160 90">
        {/* Background Arc */}
        <Path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Progress Arc */}
        <AnimatedPath
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={getGaugeColor(safeScore)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
        />
      </Svg>

      <View style={styles.textContainer}>
        <Typography variant="h2" weight="bold" color="navy" style={styles.scoreText}>
          {Math.round(safeScore)}
        </Typography>
        <Typography variant="xs" color="slate">
          {zoneLabel}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    alignSelf: 'center',
  },
  textContainer: {
    marginTop: -30,
    alignItems: 'center',
  },
  scoreText: {
    lineHeight: 32,
  },
});

