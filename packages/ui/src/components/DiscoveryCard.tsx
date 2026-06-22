import { Text, XStack, YStack } from 'tamagui'
import type { CardRarity, CardSize, CardState, CardType, DiscoveryCardModel } from '../types'

export type DiscoveryCardProps = Pick<
  DiscoveryCardModel,
  'title' | 'subtitle' | 'type' | 'state' | 'rarity' | 'artHint'
> & {
  size?: CardSize
  onPress?: () => void
}

const sizeMap = {
  mini: { width: 58, height: 96, artHeight: 55, title: 7, subtitle: 6, badge: 12 },
  compact: { width: 88, height: 132, artHeight: 80, title: 8, subtitle: 7, badge: 14 },
  regular: { width: 108, height: 158, artHeight: 100, title: 9, subtitle: 8, badge: 16 },
  large: { width: 154, height: 224, artHeight: 154, title: 14, subtitle: 11, badge: 22 },
} as const

const raritySymbol: Record<CardRarity, string> = {
  common: '•',
  rare: '✦',
  epic: '✧',
  legendary: '◆',
}

const artPalette: Record<CardType, { background: string; accent: string; glyph: string }> = {
  character: { background: '#CBA56C', accent: '#3F2714', glyph: '♙' },
  concept: { background: '#D7C38F', accent: '#6E5017', glyph: '✣' },
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
      pressStyle={{ scale: 0.975, y: 1 }}
      width={s.width}
      height={s.height}
      borderRadius="$2"
      borderWidth={selected ? 2 : 1}
      borderColor={selected ? '$gold' : fresh ? '$borderStrong' : '$border'}
      backgroundColor="$surface"
      padding={4}
      gap={3}
      alignItems="center"
      justifyContent="space-between"
      shadowColor="$ink"
      shadowOpacity={selected ? 0.18 : 0.11}
      shadowRadius={selected ? 12 : 6}
      shadowOffset={{ width: 0, height: 4 }}
      overflow="hidden"
    >
      <YStack position="absolute" left={3} top={3} width={11} height={11} borderLeftWidth={1} borderTopWidth={1} borderColor="$gold" opacity={0.75} />
      <YStack position="absolute" right={3} top={3} width={11} height={11} borderRightWidth={1} borderTopWidth={1} borderColor="$gold" opacity={0.75} />
      <YStack position="absolute" left={3} bottom={3} width={11} height={11} borderLeftWidth={1} borderBottomWidth={1} borderColor="$gold" opacity={0.75} />
      <YStack position="absolute" right={3} bottom={3} width={11} height={11} borderRightWidth={1} borderBottomWidth={1} borderColor="$gold" opacity={0.75} />

      <YStack
        width="100%"
        height={s.artHeight}
        borderRadius="$1"
        borderWidth={1}
        borderColor={locked ? '$locked' : '$borderStrong'}
        backgroundColor={locked ? '#767064' : palette.background}
        opacity={locked ? 0.72 : 1}
        alignItems="center"
        justifyContent="center"
        overflow="hidden"
      >
        <YStack position="absolute" left={-18} top={-18} width={s.artHeight * 0.9} height={s.artHeight * 0.9} borderRadius={999} backgroundColor="#FFF4DA" opacity={0.25} />
        <YStack position="absolute" right={-16} bottom={-16} width={s.artHeight * 0.82} height={s.artHeight * 0.82} borderRadius={999} borderWidth={1} borderColor={locked ? '#A49D91' : palette.accent} opacity={0.25} />
        <YStack width={s.artHeight * 0.6} height={s.artHeight * 0.6} borderRadius={999} backgroundColor={locked ? '#5F5B54' : '#F8EDD5'} opacity={0.82} alignItems="center" justifyContent="center">
          <Text
            color={locked ? '#D6D0C5' : palette.accent}
            fontSize={size === 'large' ? 48 : size === 'mini' ? 24 : 32}
            fontFamily="$heading"
            fontWeight="700"
          >
            {locked ? '?' : type === 'character' ? initial : palette.glyph}
          </Text>
        </YStack>

        {!locked && type === 'character' ? (
          <Text position="absolute" bottom={3} color={palette.accent} opacity={0.72} fontSize={size === 'mini' ? 8 : 11}>{palette.glyph}</Text>
        ) : null}

        {fresh ? (
          <XStack position="absolute" right={5} top={5} backgroundColor="$gold" borderRadius={999} paddingHorizontal={6} paddingVertical={2} zIndex={2}>
            <Text color="$white" fontSize={7} fontWeight="800">NEW</Text>
          </XStack>
        ) : null}

        {rarity !== 'common' && !locked ? (
          <XStack position="absolute" right={5} bottom={5} width={s.badge} height={s.badge} borderRadius={999} backgroundColor="$goldPale" borderColor="$gold" borderWidth={1} alignItems="center" justifyContent="center">
            <Text color="$goldDark" fontSize={s.badge * 0.52} fontWeight="900">{raritySymbol[rarity]}</Text>
          </XStack>
        ) : null}
      </YStack>

      <YStack alignItems="center" gap={1} width="100%" paddingHorizontal={2} paddingBottom={2}>
        <Text color="$ink" fontSize={s.title} lineHeight={s.title + 3} fontFamily="$heading" fontWeight="700" textAlign="center" numberOfLines={2}>
          {locked ? '??????' : title.toUpperCase()}
        </Text>
        <Text color="$muted" fontSize={s.subtitle} lineHeight={s.subtitle + 3} textAlign="center" numberOfLines={1}>
          {locked ? 'À découvrir' : subtitle}
        </Text>
      </YStack>
    </YStack>
  )
}
