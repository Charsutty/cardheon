import { attemptCraft, type Card, type DiscoveryResult } from '@cardheon/game-engine'
import { useMemo, useState } from 'react'
import { toDiscoveryCard } from '../../../game/catalog'
import { useGame } from '../../../state/GameProvider'

export type HandFilter = 'all' | 'recent' | Card['kind']

export function useAtelier() {
  const game = useGame()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const [filter, setFilter] = useState<HandFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const allCards = useMemo(() => game.playableCards.map(toDiscoveryCard), [game.playableCards])

  const recentlyGainedIds = useMemo(() => {
    const unlocked = Object.values(game.progress.cardStates)
      .filter((s) => s.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 6)
      .map((s) => s.cardId)

    const discovered = Object.values(game.progress.cardStates)
      .filter((s) => s.discoveredAt)
      .sort((a, b) => new Date(b.discoveredAt!).getTime() - new Date(a.discoveredAt!).getTime())
      .slice(0, 6)
      .map((s) => s.cardId)

    return [...new Set([...discovered, ...unlocked])]
  }, [game.progress.cardStates])

  const filteredCards = useMemo(() => {
    let cards = allCards

    if (filter === 'recent') {
      const recentSet = new Set(recentlyGainedIds)
      cards = cards.filter((card) => recentSet.has(card.id))
    } else if (filter !== 'all') {
      cards = cards.filter((card) => {
        // Map DiscoveryCardModel type back to approximate engine kinds.
        const kindMap: Record<string, string> = {
          character: 'figure',
          era: 'period',
          place: 'place',
          civilization: 'civilization',
          event: 'event',
          concept: 'concept',
        }
        return kindMap[card.type] === filter
      })
    }

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      cards = cards.filter(
        (card) =>
          card.title.toLowerCase().includes(query) ||
          card.subtitle.toLowerCase().includes(query),
      )
    }

    return cards
  }, [allCards, filter, recentlyGainedIds, searchQuery])

  const recommendedCards = useMemo(() => {
    const recentSet = new Set(recentlyGainedIds)
    return allCards.filter((card) => recentSet.has(card.id)).slice(0, 6)
  }, [allCards, recentlyGainedIds])

  const minSelection = game.catalog.gameplay.discovery.minInputs
  const maxSelection = game.catalog.gameplay.discovery.maxInputs

  const craftPreview = useMemo(() => {
    if (selectedIds.length < 2) return null
    return attemptCraft(game.catalog, selectedIds)
  }, [game.catalog, selectedIds])

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
    cards: filteredCards,
    allCards,
    recommendedCards,
    selectedIds,
    result,
    filter,
    searchQuery,
    minSelection,
    maxSelection,
    craftPreview,
    canAttempt: selectedIds.length >= minSelection || Boolean(craftPreview),
    setFilter,
    setSearchQuery,
    toggleCard,
    clearSelection,
    attempt,
  }
}
