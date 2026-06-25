import { DiscoveryCard } from '@cardheon/ui'
import type { DiscoveryCardModel } from '@cardheon/ui'
import { ScrollView, Text, XStack, YStack } from 'tamagui'

type RecommendedCardsPanelProps = {
  cards: DiscoveryCardModel[]
  selectedIds: string[]
  onToggle: (cardId: string) => void
}

export function RecommendedCardsPanel({ cards, selectedIds, onToggle }: RecommendedCardsPanelProps) {
  if (cards.length === 0) return null

  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>PISTES RÉCENTES</Text>
        <Text color="$muted" fontSize={9}>non-spoilant</Text>
      </XStack>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$3" paddingRight="$4" paddingVertical="$1">
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
  )
}
