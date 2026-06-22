import { figureCards } from './catalog'

export type GameProgress = {
  discoveredCardIds: string[]
  xp: number
  attempts: number
  lastDiscoveryId?: string
}

export const initialProgress: GameProgress = {
  discoveredCardIds: [],
  xp: 0,
  attempts: 0,
}

export function getCompletion(discoveredCardIds: string[]) {
  return {
    discovered: discoveredCardIds.length,
    total: figureCards.length,
  }
}

export function getCompletionPercentage(discoveredCardIds: string[]) {
  const { discovered, total } = getCompletion(discoveredCardIds)
  return total === 0 ? 0 : Math.round((discovered / total) * 100)
}
