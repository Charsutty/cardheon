import type { DiscoveryResult } from '@cardheon/game-engine'
import { useMemo, useState } from 'react'
import { playableCards, toDiscoveryCard } from '../../../game/catalog'
import { useGame } from '../../../state/GameProvider'

export const MIN_SELECTION = 2
export const MAX_SELECTION = 5

export function useAtelier() {
  const game = useGame()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const cards = useMemo(() => playableCards.map(toDiscoveryCard), [])

  const toggleCard = (cardId: string) => {
    setResult(null)
    setSelectedIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId)
      if (current.length >= MAX_SELECTION) return current
      return [...current, cardId]
    })
  }

  const clearSelection = () => {
    setSelectedIds([])
    setResult(null)
  }

  const attempt = () => {
    const nextResult = game.discover(selectedIds)
    setResult(nextResult)
    if (nextResult.type === 'new_figure') setSelectedIds([])
    return nextResult
  }

  return {
    cards,
    selectedIds,
    result,
    canAttempt: selectedIds.length >= MIN_SELECTION,
    toggleCard,
    clearSelection,
    attempt,
  }
}
