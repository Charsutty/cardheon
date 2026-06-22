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
    <XStack alignItems="center" justifyContent="space-between" minHeight={54}>
      <XStack
        width={40}
        height={40}
        borderRadius={20}
        borderWidth={1}
        borderColor="$borderStrong"
        backgroundColor="$surfaceMuted"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="$goldDark" fontSize={17} fontWeight="800">✦</Text>
      </XStack>

      <YStack alignItems="center" gap={2} flex={1} paddingHorizontal="$2">
        <Text color="$goldDark" fontFamily="$heading" fontSize={25} lineHeight={28} fontWeight="700" letterSpacing={-0.5}>
          {title}
        </Text>
        <XStack alignItems="center" gap="$2">
          <YStack width={22} height={1} backgroundColor="$borderStrong" />
          <Text color="$goldDark" fontSize={7} lineHeight={10} fontWeight="700" letterSpacing={1.2} numberOfLines={1}>{subtitle}</Text>
          <YStack width={22} height={1} backgroundColor="$borderStrong" />
        </XStack>
      </YStack>

      <XStack
        minWidth={50}
        height={36}
        borderRadius={18}
        borderWidth={1}
        borderColor="$border"
        backgroundColor="$surface"
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="$2"
        gap={5}
      >
        <Text color="$gold" fontSize={13}>●</Text>
        <Text color="$ink" fontSize={12} fontWeight="800">{coins}</Text>
      </XStack>
    </XStack>
  )
}
