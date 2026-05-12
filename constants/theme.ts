/**
 * Amortix Design System — Theme Constants
 * Ported from web app globals.css for visual consistency
 */

export const Colors = {
  // Primary palette
  navy: '#0d1b2f',
  navyMid: '#17314f',
  navyDeep: '#08111f',
  emerald: '#118c76',
  emeraldLight: '#4de0b3',
  emeraldBg: '#e4fbf4',
  emeraldDark: '#0c6a5a',
  amber: '#f59f3a',
  amberLight: '#ffd089',
  amberBg: '#fff4df',
  red: '#d14d5b',
  redBg: '#fff0f2',

  // Neutrals
  frost: '#f7f5ef',
  surface: '#fffdfa',
  slate: '#64748b',
  slateLight: '#98a4b3',
  slateDark: '#334155',
  borderLight: '#dfddd5',
  borderMid: '#c9ced6',
  textPrimary: '#0f1b2d',
  textMuted: '#8290a1',

  // Utility
  white: '#ffffff',
  black: '#000000',
  background: '#f8fafc',
  transparent: 'transparent',

  // Status
  successBg: 'rgba(77, 224, 179, 0.2)',
  warningBg: 'rgba(245, 159, 58, 0.18)',
  dangerBg: 'rgba(209, 77, 91, 0.15)',
} as const;

export const Radius = {
  card: 20,
  button: 14,
  input: 14,
  badge: 999,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  xxl: 28,
  full: 9999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const FontSizes = {
  xs: 10,
  sm: 11,
  caption: 12,
  body: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  h3: 20,
  h2: 24,
  h1: 28,
  hero: 34,
} as const;

export const FontFamilies = {
  heading: 'SpaceGrotesk',
  headingMedium: 'SpaceGrotesk-Medium',
  headingSemiBold: 'SpaceGrotesk-SemiBold',
  headingBold: 'SpaceGrotesk-Bold',
  body: 'Manrope',
  bodyMedium: 'Manrope-Medium',
  bodySemiBold: 'Manrope-SemiBold',
  bodyBold: 'Manrope-Bold',
  mono: 'IBMPlexMono',
  monoMedium: 'IBMPlexMono-Medium',
} as const;

export const Shadows = {
  card: {
    shadowColor: '#09111f',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },
  cardHover: {
    shadowColor: '#09111f',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 6,
  },
  metric: {
    shadowColor: '#09111f',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  button: {
    shadowColor: '#118c76',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 5,
  },
  buttonSecondary: {
    shadowColor: '#0d1b2f',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  dark: {
    shadowColor: '#08111f',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.38,
    shadowRadius: 35,
    elevation: 8,
  },
  glass: {
    shadowColor: '#09111f',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 6,
  },
  bottomNav: {
    shadowColor: '#09111f',
    shadowOffset: { width: 0, height: -9 },
    shadowOpacity: 0.18,
    shadowRadius: 19,
    elevation: 8,
  },
} as const;
