import type { Card, GameCatalog } from '@cardheon/game-engine'
import type { CardRarity, CardType, DiscoveryCardModel } from '@cardheon/ui'
import catalogJson from '../../../../content/catalog.dev.json'

export const catalog = catalogJson as GameCatalog

export const playableCards = catalog.cards.filter((card) => card.kind !== 'figure')
export const figureCards = catalog.cards.filter((card) => card.kind === 'figure')

export function getCard(cardId: string): Card | undefined {
  return catalog.cards.find((card) => card.id === cardId)
}

export function getFrenchTitle(card: Card): string {
  return card.localization.fr?.title ?? card.slug
}

export function getFrenchSubtitle(card: Card): string {
  return card.localization.fr?.subtitle ?? kindLabel(card.kind)
}

export function toDiscoveryCard(card: Card): DiscoveryCardModel {
  return {
    id: card.id,
    title: getFrenchTitle(card),
    subtitle: getFrenchSubtitle(card),
    type: toCardType(card),
    rarity: toCardRarity(card.rarity),
  }
}

function toCardType(card: Card): CardType {
  switch (card.kind) {
    case 'figure':
    case 'role':
    case 'relation':
      return 'character'
    case 'period':
      return 'era'
    case 'place':
    case 'region':
      return 'place'
    case 'civilization':
      return 'civilization'
    case 'event':
    case 'work':
    case 'movement':
      return 'event'
    default:
      return 'concept'
  }
}

function toCardRarity(rarity: Card['rarity']): CardRarity {
  if (rarity === 'uncommon') return 'common'
  return rarity ?? 'common'
}

function kindLabel(kind: Card['kind']): string {
  const labels: Record<Card['kind'], string> = {
    figure: 'Personnage',
    period: 'Époque',
    region: 'Région',
    place: 'Lieu',
    civilization: 'Civilisation',
    role: 'Rôle',
    domain: 'Domaine',
    concept: 'Concept',
    event: 'Événement',
    work: 'Œuvre',
    movement: 'Mouvement',
    relation: 'Relation',
    symbol: 'Symbole',
  }

  return labels[kind]
}
