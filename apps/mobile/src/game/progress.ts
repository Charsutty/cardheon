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

export function getCompletion(discoveredCardIds: string[], totalFigures: number) {
  return {
    discovered: discoveredCardIds.length,
    total: totalFigures,
  }
}

export function getCompletionPercentage(discoveredCardIds: string[], totalFigures: number) {
  const { discovered, total } = getCompletion(discoveredCardIds, totalFigures)
  return total === 0 ? 0 : Math.round((discovered / total) * 100)
}
