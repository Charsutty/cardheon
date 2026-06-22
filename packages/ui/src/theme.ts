import { createTamagui, createTokens } from 'tamagui'
import { config as baseConfig } from '@tamagui/config/v3'

export const cardheonColors = {
  background: '#FBF6EA',
  surface: '#FFFDF7',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F6EBD7',
  gold: '#C99A2E',
  goldSoft: '#E7C66B',
  goldDark: '#8B6218',
  ink: '#2B2118',
  muted: '#7C6A55',
  border: '#E2C98F',
  borderStrong: '#B98A29',
  brown: '#5A3B1B',
  locked: '#8F806B',
  success: '#5E7C46',
  danger: '#A24C3A',
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
  1: 8,
  2: 12,
  3: 16,
  4: 22,
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
    surface: cardheonColors.surface,
    surfaceMuted: cardheonColors.surfaceMuted,
    gold: cardheonColors.gold,
    goldSoft: cardheonColors.goldSoft,
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
