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
  compact: { width: 96, height: 136, artHeight: 72, title: 9, subtitle: 8 },
  regular: { width: 112, height: 158, artHeight: 88, title: 10, subtitle: 9 },
  large: { width: 146, height: 202, artHeight: 120, title: 12, subtitle: 10 },
} as const

const raritySymbol: Record<CardRarity, string> = {
  common: '•',
  rare: '✦',
  epic: '✧',
  legendary: '◆',
}

const artPalette: Record<CardType, { background: string; accent: string; glyph: string }> = {
  character: { background: '#D7B777', accent: '#60401C', glyph: '♙' },
  concept: { background: '#D9C79B', accent: '#72561D', glyph: '✣' },
  civilization: { background: '#C9D2C5', accent: '#6C4D1E', glyph: '△' },
  place: { background: '#C9D8D5', accent: '#4C665E', glyph: '⌖' },
  era: { background: '#D9C8B3', accent: '#6B5142', glyph: '◷' },
  event: { background: '#D5BBA6', accent: '#754938', glyph: '✹' },
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
  const palette = artPalette[type]
  const initial = title.trim().charAt(0).toUpperCase()

  return (
    <YStack
      onPress={onPress}
      pressStyle={{ scale: 0.97, y: 1 }}
      width={s.width}
      height={s.height}
      borderRadius="$2"
      borderWidth={selected ? 2 : 1}
      borderColor={selected ? '$gold' : fresh ? '$borderStrong' : '$border'}
      backgroundColor="$surface"
      padding={5}
      gap={5}
      alignItems="center"
      justifyContent="space-between"
      shadowColor="$ink"
      shadowOpacity={selected ? 0.16 : 0.09}
      shadowRadius={selected ? 10 : 5}
      shadowOffset={{ width: 0, height: 3 }}
      overflow="hidden"
    >
      <YStack
        width="100%"
        height={s.artHeight}
        borderRadius="$1"
        borderWidth={1}
        borderColor={locked ? '$locked' : '$border'}
        backgroundColor={locked ? '#777268' : palette.background}
        opacity={locked ? 0.7 : 1}
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        <YStack position="absolute" width={s.artHeight * 0.9} height={s.artHeight * 0.9} borderRadius={999} borderWidth={1} borderColor={locked ? '#A49D91' : palette.accent} opacity={0.28} />
        <YStack position="absolute" width={s.artHeight * 0.62} height={s.artHeight * 0.62} borderRadius={999} backgroundColor={locked ? '#5F5B54' : '#F8EDD5'} opacity={0.72} />
        {fresh ? (
          <XStack position="absolute" right={5} top={5} backgroundColor="$gold" borderRadius={999} paddingHorizontal={6} paddingVertical={2} zIndex={2}>
            <Text color="$white" fontSize={7} fontWeight="800">NOUVEAU</Text>
          </XStack>
        ) : null}
        <Text color={locked ? '#D6D0C5' : palette.accent} fontSize={size === 'large' ? 47 : 34} fontFamily="$heading" fontWeight="700">
          {locked ? '?' : type === 'character' ? initial : palette.glyph}
        </Text>
        {!locked && type === 'character' ? (
          <Text position="absolute" bottom={4} color={palette.accent} opacity={0.7} fontSize={11}>{palette.glyph}</Text>
        ) : null}
      </YStack>

      <YStack alignItems="center" gap={1} width="100%" paddingHorizontal={2}>
        <Text color="$ink" fontSize={s.title} fontFamily="$heading" fontWeight="700" textAlign="center" numberOfLines={2}>
          {locked ? '????' : title.toUpperCase()}
        </Text>
        <Text color="$muted" fontSize={s.subtitle} textAlign="center" numberOfLines={1}>
          {locked ? 'À découvrir' : subtitle}
        </Text>
      </YStack>

      <Text color={rarity === 'common' ? '$muted' : '$goldDark'} fontSize={9} fontWeight="900">
        {raritySymbol[rarity]}
      </Text>
    </YStack>
  )
}
