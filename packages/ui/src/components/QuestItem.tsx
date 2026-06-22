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
    <XStack
      borderRadius="$3"
      borderWidth={1}
      borderColor="$border"
      backgroundColor="$surface"
      padding="$3"
      gap="$3"
      alignItems="center"
      minHeight={96}
      shadowColor="$ink"
      shadowOpacity={0.05}
      shadowRadius={6}
      shadowOffset={{ width: 0, height: 2 }}
    >
      <XStack width={44} height={44} borderRadius={22} borderWidth={1} borderColor="$borderStrong" backgroundColor="$goldPale" alignItems="center" justifyContent="center">
        <Text color="$goldDark" fontSize={18} fontWeight="900">✦</Text>
      </XStack>

      <YStack flex={1} gap="$2" minWidth={0}>
        <XStack alignItems="center" justifyContent="space-between">
          <Text color="$ink" fontFamily="$heading" fontSize={11} lineHeight={15} fontWeight="700" flex={1} paddingRight="$2" numberOfLines={1}>
            {title.toUpperCase()}
          </Text>
          <Text color="$goldDark" fontSize={10} fontWeight="800">● {reward}</Text>
        </XStack>
        <Text color="$muted" fontSize={10} lineHeight={15} numberOfLines={2}>{description}</Text>
        <XStack alignItems="center" gap="$3">
          <YStack flex={1} height={5} borderRadius={999} backgroundColor="$surfaceMuted" overflow="hidden">
            <YStack width={`${progress * 100}%`} height="100%" backgroundColor="$gold" />
          </YStack>
          <Text color="$goldDark" fontSize={10} fontWeight="800">{current} / {target}</Text>
        </XStack>
      </YStack>
    </XStack>
  )
}
