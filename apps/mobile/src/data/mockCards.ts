import type { DiscoveryCardModel, QuestModel } from '@cardheon/ui'

export const collectionStats = {
  discovered: 142,
  total: 600,
}

export const atelierCards: DiscoveryCardModel[] = [
  { id: 'egypt', title: 'Égypte', subtitle: 'Civilisation', type: 'civilization', rarity: 'common' },
  { id: 'leader', title: 'Dirigeante', subtitle: 'Rôle', type: 'character', rarity: 'common' },
]

export const recentDiscoveries: DiscoveryCardModel[] = [
  { id: 'cleopatra', title: 'Cléopâtre', subtitle: 'Égypte antique', type: 'character', rarity: 'rare' },
  { id: 'ramses-ii', title: 'Ramsès II', subtitle: 'Égypte antique', type: 'civilization', rarity: 'common' },
  { id: 'hypatia', title: 'Hypatie', subtitle: 'Mathématiques', type: 'concept', state: 'new', rarity: 'rare' },
]

export const collectionCards: DiscoveryCardModel[] = [
  { id: 'cleopatra', title: 'Cléopâtre', subtitle: 'Égypte antique', type: 'character', rarity: 'rare' },
  { id: 'marie-curie', title: 'Marie Curie', subtitle: 'Physique', type: 'concept', rarity: 'legendary' },
  { id: 'egypt', title: 'Égypte', subtitle: 'Civilisation', type: 'civilization', rarity: 'common' },
  { id: 'hypatia', title: 'Hypatie', subtitle: 'Mathématiques', type: 'concept', state: 'new', rarity: 'rare' },
  { id: 'isaac-newton', title: 'Newton', subtitle: 'Physique', type: 'concept', state: 'selected', rarity: 'epic' },
  { id: 'unknown-1', title: '????', subtitle: 'À découvrir', type: 'character', state: 'locked' },
  { id: 'unknown-2', title: '????', subtitle: 'À découvrir', type: 'place', state: 'locked' },
  { id: 'unknown-3', title: '????', subtitle: 'À découvrir', type: 'event', state: 'locked' },
  { id: 'unknown-4', title: '????', subtitle: 'À découvrir', type: 'era', state: 'locked' },
]

export const quests: QuestModel[] = [
  { id: 'women-science', title: 'Femmes de science', description: 'Découvrir 5 femmes scientifiques', current: 3, target: 5, reward: 100 },
  { id: 'ancient-egypt', title: 'Égypte antique', description: 'Découvrir 8 éléments liés à l’Égypte', current: 5, target: 8, reward: 120 },
  { id: 'nobel', title: 'Lauréats Nobel', description: 'Découvrir 3 lauréats Nobel', current: 1, target: 3, reward: 80 },
  { id: 'explorer', title: 'Explorateur', description: 'Découvrir 10 lieux historiques', current: 4, target: 10, reward: 100 },
]
