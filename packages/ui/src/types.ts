export type CardType = 'character' | 'concept' | 'civilization' | 'place' | 'era' | 'event'

export type CardState = 'default' | 'locked' | 'new' | 'selected' | 'pressed'

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary'

export type CardSize = 'compact' | 'regular' | 'large'

export type DiscoveryCardModel = {
  id: string
  title: string
  subtitle: string
  type: CardType
  state?: CardState
  rarity?: CardRarity
  progressLabel?: string
}

export type QuestModel = {
  id: string
  title: string
  description: string
  current: number
  target: number
  reward: number
}
