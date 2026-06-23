import { DiscoveryCard } from '@cardheon/ui'
import type { DiscoveryCardModel } from '@cardheon/ui'
import { CardGrid } from '../../../components/layout/CardGrid'
import { toDiscoveryCard } from '../../../game/catalog'
import { useGame } from '../../../state/GameProvider'

type FigureCollectionGridProps = {
  filter?: 'all' | 'discovered' | 'locked'
}

export function FigureCollectionGrid({ filter = 'all' }: FigureCollectionGridProps) {
  const { figureCards, getCardState } = useGame()

  const visibleCards: DiscoveryCardModel[] = figureCards
    .filter((card) => {
      const state = getCardState(card.id).state
      if (filter === 'discovered') return state === 'discovered' || state === 'mastered'
      if (filter === 'locked') return state !== 'discovered' && state !== 'mastered'
      return true
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
        <DiscoveryCard key={card.id} {...card} size="compact" />
      ))}
    </CardGrid>
  )
}
