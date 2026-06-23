import { DiscoveryCard } from '@cardheon/ui'
import type { DiscoveryCardModel } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'

type ClueGridProps = {
  cards: DiscoveryCardModel[]
  selectedIds: string[]
  maxSelection?: number
  onToggle: (cardId: string) => void
}

export function ClueGrid({ cards, selectedIds, maxSelection = 5, onToggle }: ClueGridProps) {
  const selected = selectedIds
    .map((id) => cards.find((card) => card.id === id))
    .filter((card): card is DiscoveryCardModel => Boolean(card))
  const slots = Array.from({ length: maxSelection }, (_, index) => selected[index])

  return (
    <YStack
      borderRadius="$3"
      borderWidth={1}
      borderColor="$border"
      backgroundColor="$paper"
      padding="$3"
      gap="$3"
      shadowColor="$ink"
      shadowOpacity={0.06}
      shadowRadius={8}
    >
      <XStack alignItems="center" justifyContent="space-between">
        <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>ZONE HYPOTHÈSE</Text>
        <Text color="$muted" fontSize={10}>{selected.length} / {maxSelection} indices</Text>
      </XStack>

      <XStack minHeight={106} alignItems="center" justifyContent="center" flexWrap="wrap" gap="$2">
        {slots.map((card, index) => (
          <XStack key={card?.id ?? `empty-${index}`} alignItems="center">
            {card ? (
              <DiscoveryCard
                {...card}
                size="mini"
                state="selected"
                onPress={() => onToggle(card.id)}
              />
            ) : (
              <EmptyClueSlot index={index} />
            )}
          </XStack>
        ))}
      </XStack>

      <Text color="$muted" fontSize={9} lineHeight={13} textAlign="center">
        Appuie sur une carte de ta main pour l’ajouter, ou sur une carte sélectionnée pour la retirer.
      </Text>
    </YStack>
  )
}

function EmptyClueSlot({ index }: { index: number }) {
  return (
    <YStack
      width={58}
      height={96}
      borderRadius="$2"
      borderWidth={1}
      borderStyle="dashed"
      borderColor="$border"
      backgroundColor="$surface"
      opacity={0.72}
      alignItems="center"
      justifyContent="center"
      gap="$1"
    >
      <Text color="$gold" fontSize={19} lineHeight={22}>+</Text>
      <Text color="$muted" fontSize={7} lineHeight={10}>INDICE {index + 1}</Text>
    </YStack>
  )
}
