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
    <XStack alignItems="center" justifyContent="space-between" paddingTop="$1">
      <XStack
        width={42}
        height={42}
        borderRadius={21}
        borderWidth={1}
        borderColor="$borderStrong"
        backgroundColor="$surfaceMuted"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="$goldDark" fontSize={17} fontWeight="800">✦</Text>
      </XStack>

      <YStack alignItems="center" gap={1}>
        <Text color="$goldDark" fontFamily="$heading" fontSize={27} fontWeight="700" letterSpacing={-0.6}>
          {title}
        </Text>
        <XStack alignItems="center" gap="$2">
          <YStack width={22} height={1} backgroundColor="$borderStrong" />
          <Text color="$goldDark" fontSize={8} fontWeight="700" letterSpacing={1.5}>{subtitle}</Text>
          <YStack width={22} height={1} backgroundColor="$borderStrong" />
        </XStack>
      </YStack>

      <XStack
        minWidth={52}
        height={38}
        borderRadius={19}
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
