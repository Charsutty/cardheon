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

  return (
    <YStack gap="$4">
      <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$paper" padding="$3" gap="$3">
        <XStack alignItems="center" justifyContent="space-between">
          <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>COMBINAISON</Text>
          <Text color="$muted" fontSize={10}>{selected.length} indice{selected.length > 1 ? 's' : ''}</Text>
        </XStack>
        <XStack minHeight={146} alignItems="center" justifyContent="center" gap="$3" flexWrap="wrap">
          {selected.length ? selected.map((card) => (
            <DiscoveryCard key={card.id} {...card} size="compact" state="selected" onPress={() => onToggle(card.id)} />
          )) : (
            <YStack alignItems="center" gap="$2" paddingVertical="$5">
              <XStack width={44} height={44} borderRadius={22} borderWidth={1} borderStyle="dashed" borderColor="$borderStrong" alignItems="center" justifyContent="center">
                <Text color="$gold" fontSize={25}>＋</Text>
              </XStack>
              <Text color="$muted" fontSize={11} textAlign="center">Choisis au moins deux cartes-indices</Text>
            </YStack>
          )}
        </XStack>
      </YStack>

      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>CARTES DISPONIBLES</Text>
          <Text color="$goldDark" fontSize={9} fontWeight="800">TOUTES ›</Text>
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
