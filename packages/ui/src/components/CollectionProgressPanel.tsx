import { Text, XStack, YStack } from 'tamagui'

export type CollectionProgressPanelProps = {
  discovered: number
  total: number
  actionLabel?: string
}

export function CollectionProgressPanel({ discovered, total, actionLabel = 'COLLECTION' }: CollectionProgressPanelProps) {
  const progress = Math.max(0, Math.min(1, discovered / total))

  return (
    <YStack
      borderRadius="$3"
      borderWidth={1}
      borderColor="$border"
      backgroundColor="$surface"
      padding="$3"
      gap="$3"
      shadowColor="$ink"
      shadowOpacity={0.06}
      shadowRadius={7}
      shadowOffset={{ width: 0, height: 3 }}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$3">
          <XStack width={38} height={38} borderRadius={19} backgroundColor="$goldPale" alignItems="center" justifyContent="center">
            <Text color="$goldDark" fontSize={18} fontWeight="900">❧</Text>
          </XStack>
          <YStack>
            <Text color="$ink" fontFamily="$heading" fontSize={18} fontWeight="700">{discovered} / {total}</Text>
            <Text color="$muted" fontSize={10}>figures découvertes</Text>
          </YStack>
        </XStack>
        <Text color="$goldDark" fontSize={9} fontWeight="800">▥ {actionLabel}</Text>
      </XStack>
      <YStack height={4} borderRadius={999} backgroundColor="$surfaceMuted" overflow="hidden">
        <YStack width={`${progress * 100}%`} height="100%" backgroundColor="$gold" />
      </YStack>
    </YStack>
  )
}
