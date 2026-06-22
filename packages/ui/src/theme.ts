import { createTamagui, createTokens } from 'tamagui'
import { config as baseConfig } from '@tamagui/config/v3'

export const cardheonColors = {
  background: '#F2EEE6',
  paper: '#FBF8F1',
  surface: '#FFFCF6',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F1E7D4',
  gold: '#B98118',
  goldSoft: '#E1BE73',
  goldPale: '#F5E8C8',
  goldDark: '#80540D',
  ink: '#261C15',
  muted: '#74675A',
  border: '#DDCFB8',
  borderStrong: '#C69538',
  brown: '#563817',
  locked: '#8B8377',
  success: '#61764D',
  danger: '#9B4B3D',
  white: '#FFFFFF',
} as const

export const cardheonSpace = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
} as const

export const cardheonRadius = {
  1: 7,
  2: 11,
  3: 15,
  4: 20,
  5: 28,
  true: 16,
} as const

const tokens = createTokens({
  ...baseConfig.tokens,
  color: {
    ...baseConfig.tokens.color,
    ...cardheonColors,
  },
  space: {
    ...baseConfig.tokens.space,
    ...cardheonSpace,
  },
  size: {
    ...baseConfig.tokens.size,
    cardCompactWidth: 96,
    cardRegularWidth: 112,
    cardLargeWidth: 136,
    bottomNavHeight: 70,
  },
  radius: {
    ...baseConfig.tokens.radius,
    ...cardheonRadius,
  },
})

export const cardheonThemes = {
  ...baseConfig.themes,
  cardheon: {
    background: cardheonColors.background,
    color: cardheonColors.ink,
    paper: cardheonColors.paper,
    surface: cardheonColors.surface,
    surfaceMuted: cardheonColors.surfaceMuted,
    gold: cardheonColors.gold,
    goldSoft: cardheonColors.goldSoft,
    goldPale: cardheonColors.goldPale,
    goldDark: cardheonColors.goldDark,
    borderColor: cardheonColors.border,
    muted: cardheonColors.muted,
  },
}

export const cardheonConfig = createTamagui({
  ...baseConfig,
  tokens,
  themes: cardheonThemes,
})

export type CardheonConfig = typeof cardheonConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends CardheonConfig {}
}
