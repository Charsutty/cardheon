import type { Card, GameCatalog } from '@cardheon/game-engine'
import type { CardRarity, CardType, DiscoveryCardModel } from '@cardheon/ui'
import catalogJson from '../../../../content/catalog.dev.json'

export const bundledCatalog = catalogJson as GameCatalog

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
    artHint: toArtHint(card),
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

function toArtHint(card: Card): DiscoveryCardModel['artHint'] {
  if (card.kind === 'figure' || card.kind === 'role') return 'portrait'
  if (card.kind === 'civilization' || card.kind === 'place' || card.kind === 'region') return 'monument'
  if (card.kind === 'domain' || card.kind === 'concept') return 'science'
  if (card.kind === 'period') return 'manuscript'
  return 'map'
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
