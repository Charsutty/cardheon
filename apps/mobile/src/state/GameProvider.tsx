import {
  attemptCraft,
  attemptDiscovery,
  type Card,
  type DiscoveryResult,
  type GameCatalog,
  type Reward,
} from '@cardheon/game-engine'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCardConnections, loadCatalog, type CardConnection } from '../db/catalogRepository'
import { bundledCatalog } from '../game/catalog'
import {
  addXp,
  createCardState,
  discoverCard,
  getDiscoveredFigureIds,
  getUnlockedCardIds,
  initialProgress,
  recordAttempt,
  type GameProgress,
  type PlayerCardState,
} from '../game/progress'
import { loadProgress, saveProgress } from '../services/progressStorage'

type GameContextValue = {
  isReady: boolean
  progress: GameProgress
  catalog: GameCatalog
  figureCards: Card[]
  toolCards: Card[]
  playableCards: Card[]
  getCard: (cardId: string) => Card | undefined
  getCardState: (cardId: string) => PlayerCardState
  getConnections: (cardId: string) => Promise<CardConnection[]>
  refreshCatalog: () => Promise<void>
  discover: (inputCardIds: string[]) => DiscoveryResult
  resetProgress: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<GameCatalog>(bundledCatalog)
  const [progress, setProgress] = useState<GameProgress>(() => initializeProgressWithStarter(bundledCatalog, initialProgress))
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    Promise.all([loadCatalog(), loadProgress(catalog)])
      .then(([storedCatalog, storedProgress]) => {
        setCatalog(storedCatalog)
        setProgress(initializeProgressWithStarter(storedCatalog, storedProgress))
      })
      .catch(() => {
        // Le catalogue embarqué garde le jeu utilisable si SQLite est indisponible.
      })
      .finally(() => setIsReady(true))
  }, [])

  useEffect(() => {
    if (!isReady) return
    saveProgress(progress).catch(() => undefined)
  }, [isReady, progress])

  const discoveredCardIds = useMemo(() => getDiscoveredFigureIds(progress), [progress])
  const unlockedCardIds = useMemo(() => getUnlockedCardIds(progress), [progress])

  const discover = useCallback(
    (inputCardIds: string[]) => {
      const craftResult = attemptCraft(catalog, inputCardIds)
      const result: DiscoveryResult = craftResult ?? attemptDiscovery(
        catalog,
        { discoveredCardIds, unlockedCardIds },
        inputCardIds,
        {
          minInputs: catalog.gameplay.discovery.minInputs,
          maxInputs: catalog.gameplay.discovery.maxInputs,
        },
      )

      setProgress((current) => {
        let next = recordAttempt(
          current,
          inputCardIds,
          result.type,
          result.type === 'new_figure' || result.type === 'already_discovered' ? result.cardId : undefined,
          result.type === 'new_figure' || result.type === 'already_discovered' ? result.score : undefined,
        )

        if (result.type === 'new_figure') {
          next = discoverCard(next, result.cardId, 'discovery')
          next = applyRewards(next, result.rewards)
          next = { ...next, lastDiscoveryId: result.cardId, lastDiscoveryResult: result }
        } else if (result.type === 'craft') {
          next = applyRewards(next, result.rewards)
          next = { ...next, lastDiscoveryResult: result }
        }

        return next
      })

      return result
    },
    [catalog, discoveredCardIds, unlockedCardIds],
  )

  const resetProgress = useCallback(() => {
    setProgress(initializeProgressWithStarter(catalog, initialProgress))
  }, [catalog])

  const figureCards = useMemo(
    () => catalog.cards.filter((card) => card.kind === 'figure'),
    [catalog.cards],
  )
  const toolCards = useMemo(
    () => catalog.cards.filter((card) => card.kind !== 'figure'),
    [catalog.cards],
  )
  const playableCards = useMemo(
    () => catalog.cards.filter((card) => unlockedCardIds.includes(card.id)),
    [catalog.cards, unlockedCardIds],
  )
  const getCard = useCallback(
    (cardId: string) => catalog.cards.find((card) => card.id === cardId),
    [catalog.cards],
  )
  const getCardState = useCallback(
    (cardId: string) => progress.cardStates[cardId] ?? createCardState(cardId, 'locked'),
    [progress.cardStates],
  )
  const refreshCatalog = useCallback(async () => {
    const newCatalog = await loadCatalog()
    setCatalog(newCatalog)
    setProgress((current) => initializeProgressWithStarter(newCatalog, current))
  }, [])

  const value = useMemo(
    () => ({
      isReady,
      progress,
      catalog,
      figureCards,
      toolCards,
      playableCards,
      getCard,
      getCardState,
      getConnections: getCardConnections,
      refreshCatalog,
      discover,
      resetProgress,
    }),
    [
      catalog,
      discover,
      figureCards,
      getCard,
      getCardState,
      isReady,
      playableCards,
      progress,
      refreshCatalog,
      resetProgress,
      toolCards,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const value = useContext(GameContext)
  if (!value) throw new Error('useGame must be used inside GameProvider')
  return value
}

function initializeProgressWithStarter(catalog: GameCatalog, base: GameProgress): GameProgress {
  const starterPack = catalog.packs.find((pack) => pack.id === 'pack.starter')
  if (!starterPack) return base

  const cardStates = { ...base.cardStates }
  for (const cardId of starterPack.starterCardIds) {
    const existing = cardStates[cardId]
    if (existing && existing.state !== 'locked') continue
    cardStates[cardId] = {
      ...(existing ?? createCardState(cardId, 'locked')),
      state: 'unlocked',
      usableInAtelier: true,
      unlockedAt: existing?.unlockedAt ?? new Date().toISOString(),
      sourceReason: existing?.sourceReason ?? 'starter_pack',
    }
  }

  return { ...base, cardStates }
}

function applyRewards(progress: GameProgress, rewards: Reward[]): GameProgress {
  let next = progress

  for (const reward of rewards) {
    switch (reward.type) {
      case 'xp': {
        if (typeof reward.value === 'number') {
          next = addXp(next, reward.value)
        }
        break
      }
      case 'new_figure_card': {
        if (typeof reward.value === 'string') {
          next = discoverCard(next, reward.value, 'discovery')
        }
        break
      }
      case 'new_tool_card':
      case 'unlock_card': {
        if (typeof reward.value === 'string') {
          const existing = next.cardStates[reward.value]
          if (!existing || existing.state === 'locked') {
            next = {
              ...next,
              cardStates: {
                ...next.cardStates,
                [reward.value]: {
                  ...(existing ?? createCardState(reward.value, 'locked')),
                  state: 'unlocked',
                  usableInAtelier: true,
                  unlockedAt: new Date().toISOString(),
                  sourceReason: 'reward',
                },
              },
            }
          }
        }
        break
      }
      case 'constellation_progress':
      case 'constellation_unlock': {
        if (reward.meta && typeof reward.meta.constellationId === 'string') {
          const { constellationId, discoveredCount, totalCount, isComplete } = reward.meta as {
            constellationId: string
            discoveredCount: number
            totalCount: number
            isComplete: boolean
          }
          next = {
            ...next,
            constellations: {
              ...next.constellations,
              [constellationId]: {
                constellationId,
                state: isComplete ? 'completed' : 'in_progress',
                progress: discoveredCount,
                total: totalCount,
              },
            },
          }
        }
        break
      }
      default:
        break
    }
  }

  return next
}
