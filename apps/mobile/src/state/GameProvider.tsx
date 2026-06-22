import { attemptDiscovery, type Card, type DiscoveryResult, type GameCatalog } from '@cardheon/game-engine'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCardConnections, loadCatalog, type CardConnection } from '../db/catalogRepository'
import { bundledCatalog } from '../game/catalog'
import { initialProgress, type GameProgress } from '../game/progress'
import { loadProgress, saveProgress } from '../services/progressStorage'

type GameContextValue = GameProgress & {
  isReady: boolean
  catalog: GameCatalog
  figureCards: Card[]
  playableCards: Card[]
  getCard: (cardId: string) => Card | undefined
  getConnections: (cardId: string) => Promise<CardConnection[]>
  refreshCatalog: () => Promise<void>
  discover: (inputCardIds: string[]) => DiscoveryResult
  resetProgress: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<GameCatalog>(bundledCatalog)
  const [progress, setProgress] = useState<GameProgress>(initialProgress)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    Promise.all([loadCatalog(), loadProgress()])
      .then(([storedCatalog, storedProgress]) => {
        setCatalog(storedCatalog)
        setProgress(storedProgress)
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

  const discover = useCallback(
    (inputCardIds: string[]) => {
      const result = attemptDiscovery(
        catalog,
        { discoveredCardIds: progress.discoveredCardIds },
        inputCardIds,
        {
          minInputs: catalog.gameplay.discovery.minInputs,
          maxInputs: catalog.gameplay.discovery.maxInputs,
        },
      )

      setProgress((current) => {
        const next: GameProgress = { ...current, attempts: current.attempts + 1 }

        if (result.type === 'new_figure') {
          const xpReward = result.rewards.find((reward) => reward.type === 'xp')?.value
          next.discoveredCardIds = [...current.discoveredCardIds, result.cardId]
          next.lastDiscoveryId = result.cardId
          next.xp = current.xp + (typeof xpReward === 'number' ? xpReward : 0)
        }

        return next
      })

      return result
    },
    [catalog, progress.discoveredCardIds],
  )

  const resetProgress = useCallback(() => {
    setProgress(initialProgress)
  }, [])

  const figureCards = useMemo(
    () => catalog.cards.filter((card) => card.kind === 'figure'),
    [catalog.cards],
  )
  const playableCards = useMemo(
    () => catalog.cards.filter((card) => card.kind !== 'figure'),
    [catalog.cards],
  )
  const getCard = useCallback(
    (cardId: string) => catalog.cards.find((card) => card.id === cardId),
    [catalog.cards],
  )
  const refreshCatalog = useCallback(async () => {
    setCatalog(await loadCatalog())
  }, [])

  const value = useMemo(
    () => ({
      ...progress,
      isReady,
      catalog,
      figureCards,
      playableCards,
      getCard,
      getConnections: getCardConnections,
      refreshCatalog,
      discover,
      resetProgress,
    }),
    [catalog, discover, figureCards, getCard, isReady, playableCards, progress, refreshCatalog, resetProgress],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const value = useContext(GameContext)
  if (!value) throw new Error('useGame must be used inside GameProvider')
  return value
}
