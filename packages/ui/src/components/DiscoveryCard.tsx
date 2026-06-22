import { Text, XStack, YStack } from 'tamagui'
import type { CardRarity, CardSize, CardState, CardType } from '../types'

export type DiscoveryCardProps = {
  title: string
  subtitle: string
  type: CardType
  state?: CardState
  rarity?: CardRarity
  size?: CardSize
  onPress?: () => void
}

const sizeMap = {
  compact: { width: 96, height: 132, artHeight: 68, title: 9, subtitle: 8 },
  regular: { width: 112, height: 154, artHeight: 84, title: 10, subtitle: 10 },
  large: { width: 136, height: 184, artHeight: 108, title: 12, subtitle: 11 },
} as const

const raritySymbol: Record<CardRarity, string> = {
  common: '•',
  rare: '✦',
  epic: '✧',
  legendary: '◆',
}

function getIcon(type: CardType) {
  switch (type) {
    case 'concept':
      return '⚗'
    case 'civilization':
      return '△'
    case 'place':
      return '⌖'
    case 'era':
      return '◷'
    case 'event':
      return '✹'
    case 'character':
    default:
      return '◖'
  }
}

export function DiscoveryCard({
  title,
  subtitle,
  type,
  state = 'default',
  rarity = 'common',
  size = 'regular',
  onPress,
}: DiscoveryCardProps) {
  const s = sizeMap[size]
  const locked = state === 'locked'
  const selected = state === 'selected'
  const fresh = state === 'new'

  return (
    <YStack
      accessibilityRole="button"
      onPress={onPress}
      pressStyle={{ scale: 0.97, backgroundColor: '$surfaceMuted' }}
      width={s.width}
      height={s.height}
      borderRadius="$2"
      borderWidth={selected ? 2 : 1}
      borderColor={selected ? '$goldDark' : fresh ? '$gold' : '$border'}
      backgroundColor="$surface"
      padding="$2"
      gap="$2"
      alignItems="center"
      justifyContent="space-between"
      shadowColor="$goldDark"
      shadowOpacity={selected ? 0.16 : 0.06}
      shadowRadius={selected ? 10 : 4}
    >
      <YStack width="100%" height={s.artHeight} borderRadius="$1" borderWidth={1} borderColor={locked ? '$locked' : '$border'} backgroundColor={locked ? '$locked' : '$surfaceMuted'} opacity={locked ? 0.58 : 1} alignItems="center" justifyContent="center" overflow="hidden">
        {fresh ? (
          <XStack position="absolute" right={5} top={5} backgroundColor="$gold" borderColor="$goldDark" borderWidth={1} borderRadius={999} paddingHorizontal={6} paddingVertical={2}>
            <Text color="$white" fontSize={7} fontWeight="800">NEW</Text>
          </XStack>
        ) : null}
        <Text color={locked ? '$surface' : '$goldDark'} fontSize={type === 'civilization' ? 38 : 30} fontWeight="900">
          {locked ? '?' : getIcon(type)}
        </Text>
      </YStack>

      <YStack alignItems="center" gap={2} width="100%">
        <Text color="$ink" fontSize={s.title} fontWeight="800" textAlign="center" numberOfLines={2}>
          {locked ? '????' : title.toUpperCase()}
        </Text>
        <Text color="$muted" fontSize={s.subtitle} textAlign="center" numberOfLines={1}>
          {locked ? 'À découvrir' : subtitle}
        </Text>
      </YStack>

      <Text color={rarity === 'common' ? '$muted' : '$goldDark'} fontSize={10} fontWeight="900">
        {raritySymbol[rarity]}
      </Text>
    </YStack>
  )
}
