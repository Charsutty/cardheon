import { DiscoveryCard } from '@cardheon/ui'
import type { DiscoveryCardModel } from '@cardheon/ui'
import { CardGrid } from '../../../components/layout/CardGrid'
import { toDiscoveryCard } from '../../../game/catalog'
import { useGame } from '../../../state/GameProvider'

type FigureCollectionGridProps = {
  filter?: 'all' | 'discovered' | 'locked'
  searchQuery?: string
  rarity?: 'all' | 'common' | 'rare' | 'epic' | 'legendary'
  constellationId?: string
  onOpenCard?: (cardId: string) => void
}

export function FigureCollectionGrid({
  filter = 'all',
  searchQuery = '',
  rarity = 'all',
  constellationId,
  onOpenCard,
}: FigureCollectionGridProps) {
  const { figureCards, getCardState } = useGame()
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const visibleCards: DiscoveryCardModel[] = figureCards
    .filter((card) => {
      const state = getCardState(card.id).state
      if (filter === 'discovered') return state === 'discovered' || state === 'mastered'
      if (filter === 'locked') return state !== 'discovered' && state !== 'mastered'
      return true
    })
    .filter((card) => {
      if (rarity === 'all') return true
      const normalizedRarity = card.rarity === 'uncommon' ? 'common' : card.rarity ?? 'common'
      return normalizedRarity === rarity
    })
    .filter((card) => {
      if (!constellationId) return true
      return card.constellationIds?.includes(constellationId)
    })
    .filter((card) => {
      if (!normalizedQuery) return true
      const model = toDiscoveryCard(card)
      return `${model.title} ${model.subtitle}`.toLowerCase().includes(normalizedQuery)
    })
    .map((card) => {
      const state = getCardState(card.id).state
      const isDiscovered = state === 'discovered' || state === 'mastered'
      return {
        ...toDiscoveryCard(card),
        state: isDiscovered ? 'default' : 'locked',
      }
    })

  return (
    <CardGrid>
      {visibleCards.map((card) => (
        <DiscoveryCard
          key={card.id}
          {...card}
          size="compact"
          onPress={card.state === 'locked' ? undefined : () => onOpenCard?.(card.id)}
        />
      ))}
    </CardGrid>
  )
}
