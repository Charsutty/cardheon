import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider, Theme } from 'tamagui'
import { cardheonConfig } from '@cardheon/ui'

export default function RootLayout() {
  return (
    <TamaguiProvider config={cardheonConfig} defaultTheme="cardheon">
      <Theme name="cardheon">
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#FBF6EA' },
            }}
          />
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </Theme>
    </TamaguiProvider>
  )
}
