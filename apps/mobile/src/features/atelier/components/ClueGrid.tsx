import { DiscoveryCard } from '@cardheon/ui'
import type { DiscoveryCardModel } from '@cardheon/ui'
import { ScrollView, Text, XStack, YStack } from 'tamagui'

type ClueGridProps = {
  cards: DiscoveryCardModel[]
  selectedIds: string[]
  onToggle: (cardId: string) => void
}

export function ClueGrid({ cards, selectedIds, onToggle }: ClueGridProps) {
  const selected = cards.filter((card) => selectedIds.includes(card.id))
  const heroCards = selected.length > 0 ? selected.slice(0, 2) : cards.slice(0, 2)

  return (
    <YStack gap="$4">
      <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$paper" padding="$3" gap="$3" shadowColor="$ink" shadowOpacity={0.06} shadowRadius={8}>
        <XStack alignItems="center" justifyContent="space-between">
          <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>ATELIER</Text>
          <Text color="$muted" fontSize={10}>{selected.length} indice{selected.length > 1 ? 's' : ''}</Text>
        </XStack>

        <XStack minHeight={172} alignItems="center" justifyContent="center" gap="$3">
          {heroCards[0] ? (
            <DiscoveryCard {...heroCards[0]} size="regular" state={selectedIds.includes(heroCards[0].id) ? 'selected' : 'default'} onPress={() => onToggle(heroCards[0].id)} />
          ) : null}

          <XStack width={36} height={36} borderRadius={18} backgroundColor="$gold" alignItems="center" justifyContent="center" shadowColor="$goldDark" shadowOpacity={0.2} shadowRadius={8}>
            <Text color="$white" fontSize={24} fontWeight="900">+</Text>
          </XStack>

          {heroCards[1] ? (
            <DiscoveryCard {...heroCards[1]} size="regular" state={selectedIds.includes(heroCards[1].id) ? 'selected' : 'default'} onPress={() => onToggle(heroCards[1].id)} />
          ) : (
            <YStack width={104} height={150} borderRadius="$2" borderWidth={1} borderColor="$borderStrong" alignItems="center" justifyContent="center" backgroundColor="$surface">
              <Text color="$gold" fontSize={24}>+</Text>
              <Text color="$muted" fontSize={9}>Indice</Text>
            </YStack>
          )}
        </XStack>
      </YStack>

      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>CARTES DISPONIBLES</Text>
          <Text color="$goldDark" fontSize={9} fontWeight="800">TOUTES</Text>
        </XStack>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$3" paddingRight="$4">
            {cards.map((card) => (
              <DiscoveryCard
                key={card.id}
                {...card}
                size="compact"
                state={selectedIds.includes(card.id) ? 'selected' : 'default'}
                onPress={() => onToggle(card.id)}
              />
            ))}
          </XStack>
        </ScrollView>
      </YStack>
    </YStack>
  )
}
