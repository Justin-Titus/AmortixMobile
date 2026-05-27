import React from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { Colors, Radius, Shadows } from '@/constants/theme';
import Typography from './Typography';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  size?: 'default' | 'sm';
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  size = 'default',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const variantStyles = buttonVariants[variant];
  const textColor = textColors[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        variantStyles,
        size === 'sm' && styles.sm,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' || variant === 'ghost' ? Colors.navy : Colors.white}
        />
      ) : (
        <View style={styles.content}>
          {icon}
          <Typography
            variant={size === 'sm' ? 'caption' : 'md'}
            weight="bold"
            color={textColor as any}
            align="center"
            style={[styles.text, textStyle]}
          >
            {title}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    width: '100%', // Ensure button takes full width
    borderRadius: Radius.button,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sm: {
    minHeight: 38,
    width: 'auto',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  text: {
    flexShrink: 1, // Crucial for preventing horizontal clipping
  },
  disabled: {
    opacity: 0.5,
  },
});

const buttonVariants = StyleSheet.create({
  primary: {
    backgroundColor: Colors.emerald,
    ...Shadows.button,
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Shadows.buttonSecondary,
  },
  danger: {
    backgroundColor: Colors.red,
    shadowColor: '#d14d5b',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 13,
    elevation: 4,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});

const textColors = {
  primary: Colors.white,
  secondary: Colors.navy,
  danger: Colors.white,
  ghost: Colors.emerald,
} as const;
