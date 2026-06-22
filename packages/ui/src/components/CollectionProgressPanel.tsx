import { Text, XStack, YStack } from 'tamagui'

export type CollectionProgressPanelProps = {
  discovered: number
  total: number
  actionLabel?: string
}

export function CollectionProgressPanel({ discovered, total, actionLabel = 'COLLECTION' }: CollectionProgressPanelProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between" minHeight={68} borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$surface" paddingHorizontal="$4">
      <XStack alignItems="center" gap="$3">
        <Text color="$goldDark" fontSize={28} fontWeight="900">❧</Text>
        <YStack>
          <Text color="$ink" fontSize={18} fontWeight="800">{discovered} / {total}</Text>
          <Text color="$muted" fontSize={11}>figures découvertes</Text>
        </YStack>
      </XStack>

      <YStack width={1} height={42} backgroundColor="$border" />

      <Text color="$brown" fontSize={11} fontWeight="800">▣ {actionLabel}</Text>
    </XStack>
  )
}
