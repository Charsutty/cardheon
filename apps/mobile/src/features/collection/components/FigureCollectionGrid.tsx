import { DiscoveryCard } from '@cardheon/ui'
import type { DiscoveryCardModel } from '@cardheon/ui'
import { CardGrid } from '../../../components/layout/CardGrid'
import { figureCards, toDiscoveryCard } from '../../../game/catalog'

type FigureCollectionGridProps = {
  discoveredCardIds: string[]
}

const lockedCards: DiscoveryCardModel[] = [
  { id: 'locked-1', title: '??????', subtitle: 'A decouvrir', type: 'character', state: 'locked' },
  { id: 'locked-2', title: '??????', subtitle: 'A decouvrir', type: 'character', state: 'locked' },
  { id: 'locked-3', title: '??????', subtitle: 'A decouvrir', type: 'civilization', state: 'locked' },
  { id: 'locked-4', title: '??????', subtitle: 'A decouvrir', type: 'concept', state: 'locked' },
  { id: 'locked-5', title: '??????', subtitle: 'A decouvrir', type: 'place', state: 'locked' },
  { id: 'locked-6', title: '??????', subtitle: 'A decouvrir', type: 'era', state: 'locked' },
]

export function FigureCollectionGrid({ discoveredCardIds }: FigureCollectionGridProps) {
  const visibleCards = [
    ...figureCards.map((card) => ({ ...toDiscoveryCard(card), state: discoveredCardIds.includes(card.id) ? 'default' : 'locked' })),
    ...lockedCards,
  ] satisfies DiscoveryCardModel[]

  return (
    <CardGrid>
      {visibleCards.map((card) => (
        <DiscoveryCard key={card.id} {...card} />
      ))}
    </CardGrid>
  )
}
