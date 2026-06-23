import type { DiscoveryResult, Reward } from '@cardheon/game-engine'

export type { DiscoveryResult, Reward }

export type CardProgressState =
  | 'locked'
  | 'unlocked'
  | 'seen'
  | 'usable_in_atelier'
  | 'discovered'
  | 'mastered'

export type PlayerCardState = {
  cardId: string
  state: CardProgressState
  usableInAtelier: boolean
  unlockedAt?: string
  discoveredAt?: string
  masteredAt?: string
  sourceReason?: string
}

export type AttemptRecord = {
  id: string
  inputCardIds: string[]
  resultType: string
  resultCardId?: string
  score?: number
  createdAt: string
}

export type PlayerPackState = {
  packId: string
  state: 'locked' | 'unopened' | 'opened'
  openedAt?: string
}

export type PlayerConstellationState = {
  constellationId: string
  state: 'hidden' | 'revealed' | 'in_progress' | 'completed' | 'mastered'
  progress: number
  total: number
  rewardClaimedAt?: string
}

export type GameProgress = {
  /** Indexed player state for every known card. */
  cardStates: Record<string, PlayerCardState>
  /** Total XP earned. */
  xp: number
  /** Number of attempts performed. */
  attempts: number
  /** Last figure discovered, used by the celebration screen. */
  lastDiscoveryId?: string
  /** Full result of the last discovery, used to render rewards and hints. */
  lastDiscoveryResult?: DiscoveryResult
  /** Recently claimed reward ids (to avoid double-claiming). */
  claimedRewardIds: string[]
  /** History of attempts in the Atelier. */
  attemptHistory: AttemptRecord[]
  /** Player packs. */
  packs: PlayerPackState[]
  /** Player constellation progress. */
  constellations: Record<string, PlayerConstellationState>
}

export const initialProgress: GameProgress = {
  cardStates: {},
  xp: 0,
  attempts: 0,
  claimedRewardIds: [],
  attemptHistory: [],
  packs: [],
  constellations: {},
}

export function getPlayerCardState(
  progress: GameProgress,
  cardId: string,
): PlayerCardState {
  return (
    progress.cardStates[cardId] ?? {
      cardId,
      state: 'locked',
      usableInAtelier: false,
    }
  )
}

export function isCardPlayable(state: PlayerCardState): boolean {
  if (state.usableInAtelier) return true
  return state.state === 'unlocked' || state.state === 'discovered' || state.state === 'mastered'
}

export function getDiscoveredFigureIds(progress: GameProgress): string[] {
  return Object.values(progress.cardStates)
    .filter((state) => state.state === 'discovered' || state.state === 'mastered')
    .map((state) => state.cardId)
}

export function getUnlockedCardIds(progress: GameProgress): string[] {
  return Object.values(progress.cardStates)
    .filter((state) => isCardPlayable(state))
    .map((state) => state.cardId)
}

export function getCompletion(progress: GameProgress, totalFigures: number) {
  return {
    discovered: getDiscoveredFigureIds(progress).length,
    total: totalFigures,
  }
}

export function getCompletionPercentage(progress: GameProgress, totalFigures: number) {
  const { discovered, total } = getCompletion(progress, totalFigures)
  return total === 0 ? 0 : Math.round((discovered / total) * 100)
}

export function createCardState(
  cardId: string,
  state: CardProgressState,
  sourceReason?: string,
): PlayerCardState {
  const usableInAtelier =
    state === 'unlocked' || state === 'discovered' || state === 'mastered'
  return {
    cardId,
    state,
    usableInAtelier,
    sourceReason,
  }
}

export function unlockCard(
  progress: GameProgress,
  cardId: string,
  sourceReason?: string,
): GameProgress {
  const existing = getPlayerCardState(progress, cardId)
  if (existing.state !== 'locked') return progress

  return {
    ...progress,
    cardStates: {
      ...progress.cardStates,
      [cardId]: {
        ...existing,
        state: 'unlocked',
        usableInAtelier: true,
        unlockedAt: new Date().toISOString(),
        sourceReason,
      },
    },
  }
}

export function discoverCard(
  progress: GameProgress,
  cardId: string,
  sourceReason?: string,
): GameProgress {
  const existing = getPlayerCardState(progress, cardId)

  return {
    ...progress,
    cardStates: {
      ...progress.cardStates,
      [cardId]: {
        ...existing,
        state: 'discovered',
        usableInAtelier: true,
        discoveredAt: new Date().toISOString(),
        sourceReason,
      },
    },
  }
}

export function addXp(progress: GameProgress, amount: number): GameProgress {
  return { ...progress, xp: progress.xp + amount }
}

export function recordAttempt(
  progress: GameProgress,
  inputCardIds: string[],
  resultType: string,
  resultCardId?: string,
  score?: number,
): GameProgress {
  const record: AttemptRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    inputCardIds,
    resultType,
    resultCardId,
    score,
    createdAt: new Date().toISOString(),
  }
  return {
    ...progress,
    attempts: progress.attempts + 1,
    attemptHistory: [record, ...progress.attemptHistory].slice(0, 50),
  }
}
