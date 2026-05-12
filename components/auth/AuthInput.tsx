import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Input } from '@/components/ui/Input';
import { Colors, Spacing } from '@/constants/theme';
import Typography from '@/components/ui/Typography';

interface AuthInputProps extends React.ComponentProps<typeof Input> {
  rightLink?: {
    text: string;
    onPress: () => void;
  };
}

export function AuthInput({ label, rightLink, ...props }: AuthInputProps) {
  return (
    <View style={styles.container}>
      {(label || rightLink) && (
        <View style={styles.header}>
          {label && (
            <Typography variant="body" weight="semiBold" color="slateDark" style={styles.label}>
              {label}
            </Typography>
          )}
          {rightLink && (
            <TouchableOpacity onPress={rightLink.onPress} activeOpacity={0.7}>
              <Typography variant="caption" weight="semiBold" color="emerald" style={styles.rightLinkText}>
                {rightLink.text}
              </Typography>
            </TouchableOpacity>
          )}
        </View>
      )}
      <Input
        {...props}
        label={undefined} // We handle the label here for better control
        containerStyle={[styles.inputContainer, props.containerStyle]}
        style={[styles.textInput, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  label: {
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  rightLinkText: {
    lineHeight: 16,
  },
  inputContainer: {
  },
  textInput: {
  },
});
