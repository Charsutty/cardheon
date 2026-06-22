import { Text, XStack, YStack } from 'tamagui'

export type CardheonHeaderProps = {
  title?: string
  subtitle?: string
  coins?: number
}

export function CardheonHeader({
  title = 'Cardhéon',
  subtitle = 'L’HISTOIRE PREND VIE',
  coins = 142,
}: CardheonHeaderProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between" paddingTop="$2">
      <XStack width={44} height={44} borderRadius={22} borderWidth={1} borderColor="$border" backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center">
        <Text color="$goldDark" fontSize={18} fontWeight="800">◉</Text>
      </XStack>

      <YStack alignItems="center" gap="$1">
        <Text color="$goldDark" fontSize={30} fontWeight="800" letterSpacing={-0.8}>{title}</Text>
        <Text color="$goldDark" fontSize={9} fontWeight="700" letterSpacing={1.8}>{subtitle}</Text>
      </YStack>

      <XStack minWidth={44} height={44} borderRadius={22} borderWidth={1} borderColor="$border" backgroundColor="$surface" alignItems="center" justifyContent="center" paddingHorizontal="$2">
        <Text color="$goldDark" fontSize={12} fontWeight="800">{coins}</Text>
      </XStack>
    </XStack>
  )
}
