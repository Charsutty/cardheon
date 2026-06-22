import { DiscoveryCard } from '@cardheon/ui'
import type { DiscoveryCardModel } from '@cardheon/ui'
import { CardGrid } from '../../../components/layout/CardGrid'
import { toDiscoveryCard } from '../../../game/catalog'
import { useGame } from '../../../state/GameProvider'

type FigureCollectionGridProps = {
  discoveredCardIds: string[]
}

export function FigureCollectionGrid({ discoveredCardIds }: FigureCollectionGridProps) {
  const { figureCards } = useGame()
  const visibleCards: DiscoveryCardModel[] = figureCards.map((card) => ({
    ...toDiscoveryCard(card),
    state: discoveredCardIds.includes(card.id) ? 'default' : 'locked',
  }))

  return (
    <CardGrid>
      {visibleCards.map((card) => (
        <DiscoveryCard key={card.id} {...card} size="compact" />
      ))}
    </CardGrid>
  )
}
