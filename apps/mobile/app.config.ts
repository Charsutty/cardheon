import type { ExpoConfig } from 'expo/config'

const config: ExpoConfig = {
  name: 'Cardhéon',
  slug: 'cardheon',
  scheme: 'cardheon',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
  },
  web: {
    bundler: 'metro',
  },
  plugins: ['expo-router'],
  experiments: {
    typedRoutes: true,
  },
}

export default config
