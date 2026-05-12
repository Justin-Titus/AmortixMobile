import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';
import Typography from './Typography';

type MetricCardProps = {
  label: string;
  value: string | number;
  description?: string;
  valueColor?: 'default' | 'emerald' | 'amber' | 'red' | 'muted';
  isEmpty?: boolean;
  style?: ViewStyle;
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
}: MetricCardProps) {
  const actualValueColor = isEmpty ? 'textMuted' : valueColors[valueColor];

  return (
    <View style={[styles.container, style]}>
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
        <Typography variant="xs" color="textMuted" numberOfLines={1} style={styles.description}>
          {description}
        </Typography>
      )}
    </View>
  );
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
  value: {
  },
  description: {
    marginTop: 4,
  },
});
