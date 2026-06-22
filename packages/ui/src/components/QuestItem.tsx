import { Text, XStack, YStack } from 'tamagui'

export type QuestItemProps = {
  title: string
  description: string
  current: number
  target: number
  reward: number
}

export function QuestItem({ title, description, current, target, reward }: QuestItemProps) {
  const progress = Math.max(0, Math.min(1, current / target))

  return (
    <XStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$4" gap="$3" alignItems="center">
      <XStack width={42} height={42} borderRadius={21} borderWidth={1} borderColor="$border" backgroundColor="$surfaceMuted" alignItems="center" justifyContent="center">
        <Text color="$goldDark" fontSize={17} fontWeight="900">✦</Text>
      </XStack>

      <YStack flex={1} gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <Text color="$ink" fontSize={12} fontWeight="800" letterSpacing={0.5}>{title.toUpperCase()}</Text>
          <Text color="$goldDark" fontSize={11} fontWeight="800">● {reward}</Text>
        </XStack>
        <Text color="$muted" fontSize={10}>{description}</Text>
        <XStack alignItems="center" gap="$3">
          <YStack flex={1} height={6} borderRadius={999} backgroundColor="$surfaceMuted" overflow="hidden">
            <YStack width={`${progress * 100}%`} height="100%" backgroundColor="$gold" />
          </YStack>
          <Text color="$goldDark" fontSize={11} fontWeight="800">{current} / {target}</Text>
        </XStack>
      </YStack>
    </XStack>
  )
}
