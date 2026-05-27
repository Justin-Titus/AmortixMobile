import React, { useState, useCallback, useMemo, forwardRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Colors, Radius, FontSizes, Spacing, FontFamilies } from '@/constants/theme';
import Typography from './Typography';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Custom Input component that integrates with the Typography system.
 */
export const Input = React.memo(forwardRef<TextInput, InputProps>(({
  label,
  error,
  hint,
  icon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  }, [onBlur]);

  const inputStyles = useMemo(() => [
    styles.input,
    icon ? styles.inputWithIcon : null,
    rightIcon ? styles.inputWithRightIcon : null,
    style as any,
  ], [icon, rightIcon, style]);

  const containerStyles = useMemo(() => [
    styles.inputContainer,
    isFocused && styles.inputFocused,
    error ? styles.inputError : null,
  ], [isFocused, error]);


  return (
    <View style={containerStyle}>
      {label && (
        <Typography variant="body" weight="semiBold" color="slateDark" style={styles.label}>
          {label}
        </Typography>
      )}
      <View style={containerStyles}>
        {icon && <View style={styles.iconLeft}>{icon}</View>}
        <TextInput
          ref={ref}
          style={inputStyles}
          placeholderTextColor={Colors.slate}
          {...props}
          onFocus={handleFocus}
          onBlur={handleBlur}
          underlineColorAndroid="transparent"
          importantForAutofill="no"
          autoComplete="off"
          textContentType="none"
        />
        {rightIcon && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={onRightIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <View style={styles.errorRow}>
          <View style={styles.errorDot} />
          <Typography variant="caption" weight="medium" color="red" style={styles.errorText}>
            {error}
          </Typography>
        </View>
      )}
      {hint && !error && (
        <Typography variant="sm" color="slate" style={styles.hintText}>
          {hint}
        </Typography>
      )}
    </View>
  );
}));

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.xs,
    paddingHorizontal: 2,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderMid,
    backgroundColor: Colors.white,
  },
  inputFocused: {
    borderColor: Colors.emerald,
  },
  inputError: {
    borderColor: Colors.red,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: FontFamilies.body,
    color: Colors.navy,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'center',
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  iconLeft: {
    paddingLeft: 14,
    paddingRight: 10,
  },
  iconRight: {
    paddingRight: 14,
    paddingLeft: 10,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  errorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.red,
  },
  errorText: {
    flexShrink: 1,
  },
  hintText: {
    marginTop: 4,
  },
});
