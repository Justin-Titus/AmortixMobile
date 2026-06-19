
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import Typography from './Typography';

type BadgeProps = {
  text: string;
  variant?: 'green' | 'amber' | 'red' | 'slate';
  style?: ViewStyle;
};

export function Badge({ text, variant = 'slate', style }: BadgeProps) {
  const textColor = textColors[variant];
  
  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      <Typography variant="sm" weight="semiBold" color={textColor as any}>{text}</Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});

const variantStyles = StyleSheet.create({
  green: { backgroundColor: 'rgba(77,224,179,0.2)' },
  amber: { backgroundColor: 'rgba(245,159,58,0.18)' },
  red: { backgroundColor: 'rgba(209,77,91,0.15)' },
  slate: { backgroundColor: 'rgba(100,116,139,0.12)' },
});

const textColors = {
  green: '#064e3b',
  amber: '#78350f',
  red: '#881337',
  slate: Colors.slateDark,
} as const;
