import { attemptDiscovery, type DiscoveryResult } from '@cardheon/game-engine'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { catalog } from '../game/catalog'
import { initialProgress, type GameProgress } from '../game/progress'
import { loadProgress, saveProgress } from '../services/progressStorage'

type GameContextValue = GameProgress & {
  isReady: boolean
  discover: (inputCardIds: string[]) => DiscoveryResult
  resetProgress: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<GameProgress>(initialProgress)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    loadProgress()
      .then(setProgress)
      .catch(() => {
        // A fresh local game remains fully playable if storage is unavailable.
      })
      .finally(() => setIsReady(true))
  }, [])

  useEffect(() => {
    if (!isReady) return
    saveProgress(progress).catch(() => undefined)
  }, [isReady, progress])

  const discover = useCallback(
    (inputCardIds: string[]) => {
      const result = attemptDiscovery(catalog, { discoveredCardIds: progress.discoveredCardIds }, inputCardIds)

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
    [progress.discoveredCardIds],
  )

  const resetProgress = useCallback(() => {
    setProgress(initialProgress)
  }, [])

  const value = useMemo(
    () => ({ ...progress, isReady, discover, resetProgress }),
    [discover, isReady, progress, resetProgress],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const value = useContext(GameContext)
  if (!value) throw new Error('useGame must be used inside GameProvider')
  return value
}
