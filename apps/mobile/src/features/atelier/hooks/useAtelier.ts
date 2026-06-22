import type { DiscoveryResult } from '@cardheon/game-engine'
import { useMemo, useState } from 'react'
import { toDiscoveryCard } from '../../../game/catalog'
import { useGame } from '../../../state/GameProvider'

export function useAtelier() {
  const game = useGame()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const cards = useMemo(() => game.playableCards.map(toDiscoveryCard), [game.playableCards])
  const minSelection = game.catalog.gameplay.discovery.minInputs
  const maxSelection = game.catalog.gameplay.discovery.maxInputs

  const toggleCard = (cardId: string) => {
    setResult(null)
    setSelectedIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId)
      if (current.length >= maxSelection) return current
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
    minSelection,
    maxSelection,
    canAttempt: selectedIds.length >= minSelection,
    toggleCard,
    clearSelection,
    attempt,
  }
}
