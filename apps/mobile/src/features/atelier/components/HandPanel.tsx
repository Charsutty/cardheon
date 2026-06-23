import { CategoryPill, DiscoveryCard } from '@cardheon/ui'
import type { DiscoveryCardModel } from '@cardheon/ui'
import { ScrollView, Text, XStack, YStack } from 'tamagui'
import type { HandFilter } from '../hooks/useAtelier'

const FILTERS: { key: HandFilter; label: string }[] = [
  { key: 'all', label: 'Toutes' },
  { key: 'recent', label: 'Récentes' },
  { key: 'period', label: 'Époques' },
  { key: 'place', label: 'Lieux' },
  { key: 'domain', label: 'Domaines' },
  { key: 'concept', label: 'Concepts' },
  { key: 'figure', label: 'Personnages' },
]

type HandPanelProps = {
  cards: DiscoveryCardModel[]
  selectedIds: string[]
  filter: HandFilter
  searchQuery: string
  onFilter: (filter: HandFilter) => void
  onSearch: (query: string) => void
  onToggle: (cardId: string) => void
}

export function HandPanel({
  cards,
  selectedIds,
  filter,
  searchQuery,
  onFilter,
  onSearch,
  onToggle,
}: HandPanelProps) {
  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>MAIN DU JOUEUR</Text>
        <Text color="$muted" fontSize={9}>{cards.length} carte{cards.length > 1 ? 's' : ''}</Text>
      </XStack>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$2" paddingRight="$4">
          {FILTERS.map((item) => (
            <CategoryPill
              key={item.key}
              label={item.label}
              active={filter === item.key}
              onPress={() => onFilter(item.key)}
            />
          ))}
        </XStack>
      </ScrollView>

      <XStack
        alignItems="center"
        gap="$2"
        borderRadius="$2"
        borderWidth={1}
        borderColor="$border"
        backgroundColor="$surface"
        paddingHorizontal="$3"
        minHeight={40}
      >
        <Text color="$goldDark" fontSize={12}>⌕</Text>
        <Text color="$ink" fontSize={12} flex={1}>
          {searchQuery || 'Rechercher une carte...'}
        </Text>
      </XStack>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$3" paddingRight="$4" paddingVertical="$1">
          {cards.length === 0 ? (
            <Text color="$muted" fontSize={11}>Aucune carte ne correspond à ce filtre.</Text>
          ) : (
            cards.map((card) => (
              <DiscoveryCard
                key={card.id}
                {...card}
                size="compact"
                state={selectedIds.includes(card.id) ? 'selected' : 'default'}
                onPress={() => onToggle(card.id)}
              />
            ))
          )}
        </XStack>
      </ScrollView>
    </YStack>
  )
}
