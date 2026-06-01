import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@/constants/theme';

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'dark' | 'glass' | 'metric';
};

export function Card({ children, style, variant = 'default' }: CardProps) {
  const variantStyle = variants[variant];
  return (
    <View style={[styles.base, variantStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.card,
    padding: Spacing.lg,
    borderWidth: 1,
  },
});

const variants = StyleSheet.create({
  default: {
    backgroundColor: Colors.white,
    borderColor: 'rgba(255,255,255,0.7)',
    ...Shadows.card,
  },
  dark: {
    backgroundColor: Colors.navy,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Shadows.dark,
  },
  glass: {
    backgroundColor: Colors.white,
    borderColor: 'rgba(255,255,255,0.8)',
    borderRadius: Radius.xxl,
    ...Shadows.glass,
  },
  metric: {
    backgroundColor: Colors.white,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 18,
    padding: Spacing.base,
    ...Shadows.metric,
  },
});
