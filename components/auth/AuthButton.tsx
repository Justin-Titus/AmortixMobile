import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Spacing, Colors, Shadows } from '@/constants/theme';

interface AuthButtonProps extends React.ComponentProps<typeof Button> {
  containerStyle?: any;
}

export function AuthButton({ style, containerStyle, ...props }: AuthButtonProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Button
        {...props}
        style={[styles.button, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
    width: '100%',
  },
  button: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: Colors.navy,
    ...Shadows.dark,
    shadowOpacity: 0.15,
    shadowRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16, // Added missing horizontal padding
  },
});
