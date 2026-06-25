import { CategoryPill, DiscoveryCard } from '@cardheon/ui'
import type { DiscoveryCardModel } from '@cardheon/ui'
import { useState } from 'react'
import { Input, ScrollView, Text, XStack, YStack } from 'tamagui'
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$paper" padding="$3" gap="$3">
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

      <XStack alignItems="center" gap="$2" borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$surface" paddingHorizontal="$3" minHeight={40}>
        <Text color="$goldDark" fontSize={12}>⌕</Text>
        <Input
          flex={1}
          unstyled
          value={searchQuery}
          onChangeText={onSearch}
          placeholder="Rechercher une carte..."
          placeholderTextColor="$muted"
          color="$ink"
          fontSize={12}
          returnKeyType="search"
        />
      </XStack>

      <XStack gap="$2">
        <CategoryPill label="Grille" active={viewMode === 'grid'} onPress={() => setViewMode('grid')} />
        <CategoryPill label="Liste" active={viewMode === 'list'} onPress={() => setViewMode('list')} />
      </XStack>

      {cards.length === 0 ? (
        <YStack minHeight={120} alignItems="center" justifyContent="center" borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$surface">
          <Text color="$muted" fontSize={11}>Aucune carte ne correspond à ce filtre.</Text>
        </YStack>
      ) : viewMode === 'grid' ? (
        <XStack flexWrap="wrap" columnGap="$2" rowGap="$3" justifyContent="space-between">
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
      ) : (
        <YStack gap="$2">
          {cards.map((card) => (
            <HandListRow
              key={card.id}
              card={card}
              selected={selectedIds.includes(card.id)}
              onPress={() => onToggle(card.id)}
            />
          ))}
        </YStack>
      )}
    </YStack>
  )
}

function HandListRow({
  card,
  selected,
  onPress,
}: {
  card: DiscoveryCardModel
  selected: boolean
  onPress: () => void
}) {
  return (
    <XStack
      onPress={onPress}
      pressStyle={{ scale: 0.99 }}
      minHeight={54}
      borderRadius="$2"
      borderWidth={1}
      borderColor={selected ? '$gold' : '$border'}
      backgroundColor={selected ? '$goldPale' : '$surface'}
      padding="$2"
      alignItems="center"
      gap="$3"
    >
      <YStack width={36} height={36} borderRadius={18} backgroundColor={selected ? '$gold' : '$surfaceMuted'} alignItems="center" justifyContent="center">
        <Text color={selected ? '$white' : '$goldDark'} fontFamily="$heading" fontSize={16} fontWeight="700">
          {card.title.charAt(0).toUpperCase()}
        </Text>
      </YStack>
      <YStack flex={1} minWidth={0}>
        <Text color="$ink" fontSize={11} lineHeight={15} fontWeight="800" numberOfLines={1}>
          {card.title.toUpperCase()}
        </Text>
        <Text color="$muted" fontSize={9} lineHeight={13} numberOfLines={1}>
          {card.subtitle}
        </Text>
      </YStack>
      <Text color={selected ? '$goldDark' : '$muted'} fontSize={9} fontWeight="800">
        {selected ? 'RETIRER' : 'AJOUTER'}
      </Text>
    </XStack>
  )
}
