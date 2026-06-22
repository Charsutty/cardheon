import { DiscoveryCard } from '@cardheon/ui'
import { CardGrid } from '../../../components/layout/CardGrid'
import { figureCards, toDiscoveryCard } from '../../../game/catalog'

type FigureCollectionGridProps = {
  discoveredCardIds: string[]
}

export function FigureCollectionGrid({ discoveredCardIds }: FigureCollectionGridProps) {
  return (
    <CardGrid>
      {figureCards.map((card) => (
        <DiscoveryCard
          key={card.id}
          {...toDiscoveryCard(card)}
          state={discoveredCardIds.includes(card.id) ? 'default' : 'locked'}
        />
      ))}
    </CardGrid>
  )
}
