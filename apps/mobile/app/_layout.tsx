import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider, Theme } from 'tamagui'
import { cardheonConfig } from '@cardheon/ui'
import { GameProvider } from '../src/state/GameProvider'
import { BottomNavigation } from '../src/components/navigation/BottomNavigation'

export default function RootLayout() {
  return (
    <TamaguiProvider config={cardheonConfig} defaultTheme="cardheon">
      <Theme name="cardheon">
        <SafeAreaProvider>
          <GameProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#F2EEE6' },
              }}
            />
            <BottomNavigation />
          </GameProvider>
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </Theme>
    </TamaguiProvider>
  )
}
