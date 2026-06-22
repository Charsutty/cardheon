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
      shadowOpacity={0.08}
      shadowRadius={9}
      shadowOffset={{ width: 0, height: 4 }}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$3">
          <XStack width={40} height={40} borderRadius={20} borderWidth={1} borderColor="$gold" backgroundColor="$goldPale" alignItems="center" justifyContent="center">
            <Text color="$goldDark" fontSize={20} fontWeight="900">❧</Text>
          </XStack>
          <YStack>
            <Text color="$ink" fontFamily="$heading" fontSize={20} fontWeight="700">{discovered} / {total}</Text>
            <Text color="$muted" fontSize={10}>figures découvertes</Text>
          </YStack>
        </XStack>
        <XStack alignItems="center" gap="$2">
          <YStack width={1} height={40} backgroundColor="$border" />
          <Text color="$goldDark" fontSize={15}>▥</Text>
          <Text color="$goldDark" fontSize={9} fontWeight="800">{actionLabel}</Text>
        </XStack>
      </XStack>
      <YStack height={5} borderRadius={999} backgroundColor="$surfaceMuted" overflow="hidden">
        <YStack width={`${progress * 100}%`} height="100%" backgroundColor="$gold" />
      </YStack>
    </YStack>
  )
}
