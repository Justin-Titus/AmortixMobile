import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { Colors, FontSizes, FontFamilies } from '@/constants/theme';

export type TypographyVariant = 
  | 'hero' 
  | 'h1' | 'h2' | 'h3' 
  | 'xl' | 'lg' | 'base' | 'md' | 'body' | 'caption' | 'sm' | 'xs';

export type TypographyWeight = 'regular' | 'medium' | 'semiBold' | 'bold';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: keyof typeof Colors | string;
  align?: 'left' | 'center' | 'right';
  fontFamily?: 'heading' | 'body' | 'mono';
}

/**
 * Custom Typography component that enforces the Amortix design system.
 * Use this instead of the standard React Native Text component.
 */
const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  weight = 'regular',
  color = 'textPrimary',
  align = 'left',
  fontFamily,
  style,
  children,
  ...props
}) => {
  // Determine actual font family based on variant and weight
  const getFontFamily = () => {
    // If explicit fontFamily is provided, use it. Otherwise, headings use SpaceGrotesk.
    const isHeading = fontFamily === 'heading' || (!fontFamily && ['hero', 'h1', 'h2', 'h3'].includes(variant));
    const isMono = fontFamily === 'mono';
    
    if (isMono) {
      return weight === 'bold' || weight === 'semiBold' || weight === 'medium' 
        ? FontFamilies.monoMedium 
        : FontFamilies.mono;
    }

    if (isHeading) {
      switch (weight) {
        case 'bold': return FontFamilies.headingBold;
        case 'semiBold': return FontFamilies.headingSemiBold;
        case 'medium': return FontFamilies.headingMedium;
        default: return FontFamilies.heading;
      }
    }

    // Default to Body (Manrope)
    switch (weight) {
      case 'bold': return FontFamilies.bodyBold;
      case 'semiBold': return FontFamilies.bodySemiBold;
      case 'medium': return FontFamilies.bodyMedium;
      default: return FontFamilies.body;
    }
  };

  // Calculate a proportional default line height to prevent descender clipping
  // and improve general reading rhythm (headings ~1.3x, body ~1.45x).
  const defaultLineHeight = ['hero', 'h1', 'h2', 'h3'].includes(variant)
    ? Math.round(FontSizes[variant] * 1.3)
    : Math.round(FontSizes[variant] * 1.45);

  const textStyle: TextStyle = {
    fontSize: FontSizes[variant],
    fontFamily: getFontFamily(),
    color: (Colors as any)[color] || color, // Fallback to literal color if not in theme
    textAlign: align,
    lineHeight: defaultLineHeight,
    includeFontPadding: true,
  };

  return (
    <RNText
      style={[textStyle, style]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Typography;
