import Animated from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import Typography from './Typography';
import { useScalePress, useFadeSlideIn } from '@/lib/animations/presets';

type MetricCardProps = {
  label: string;
  value: string | number;
  description?: string;
  valueColor?: 'default' | 'emerald' | 'amber' | 'red' | 'muted';
  isEmpty?: boolean;
  style?: ViewStyle;
  onPress?: () => void;
  /** Item index for entrance stagger (0 = no delay) */
  index?: number;
};

const valueColors = {
  default: 'navy',
  emerald: 'emerald',
  amber: 'amber',
  red: 'red',
  muted: 'textMuted',
};

export function MetricCard({
  label,
  value,
  description,
  valueColor = 'default',
  isEmpty = false,
  style,
  onPress,
  index = 0,
}: MetricCardProps) {
  const actualValueColor = isEmpty ? 'textMuted' : valueColors[valueColor];
  const { animatedStyle: scaleStyle, gesture } = useScalePress(onPress);
  const entranceStyle = useFadeSlideIn(true, 0, 18 + index * 6);

  const card = (
    <Animated.View style={[styles.container, style, entranceStyle, scaleStyle]}>
      <Typography variant="sm" weight="medium" color="slate" style={styles.label}>
        {label}
      </Typography>
      <Typography
        variant="xl"
        weight="semiBold"
        color={actualValueColor as any}
        numberOfLines={1}
        adjustsFontSizeToFit
        style={styles.value}
      >
        {isEmpty ? '-' : value}
      </Typography>
      {description && (
        <Typography variant="xs" color="textMuted" numberOfLines={2} style={styles.description}>
          {description}
        </Typography>
      )}
    </Animated.View>
  );

  if (onPress) {
    return <GestureDetector gesture={gesture}>{card}</GestureDetector>;
  }

  return card;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    padding: Spacing.base,
    ...Shadows.metric,
    overflow: 'hidden',
  },
  label: {
    marginBottom: 6,
  },
  value: {},
  description: {
    marginTop: 4,
  },
});
