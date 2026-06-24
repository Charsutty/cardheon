import type {
  Card,
  CardKind,
  CandidateScore,
  CraftingRecipe,
  DiscoveryResult,
  GameCatalog,
  Hint,
  Reward,
  ScoreReason,
  UserGameState,
} from './catalog.ts'

export type { DiscoveryResult, Hint, ScoreReason, Reward, CandidateScore }

export type UserGameState = {
  discoveredCardIds: string[]
  unlockedCardIds: string[]
}

type WeightedTag = { tag: string; weight?: number }

type DiscoveryEvidence = {
  card?: string
  tag?: string
  weight: number
  reason?: string
}

type DiscoveryModifier = {
  id: string
  whenAll: string[]
  weight: number
  reason: string
}

type DiscoveryRule = {
  figureId: string
  minScore?: number
  ambiguityMargin?: number
  evidence: DiscoveryEvidence[]
  synergies?: DiscoveryModifier[]
  contradictions?: DiscoveryModifier[]
  minEvidenceCount?: number
}

type CatalogIndex = {
  cardsById: Map<string, Card>
  playableCardsById: Map<string, Card>
}

type DiscoveryOptions = {
  minInputs?: number
  maxInputs?: number
  defaultMinScore?: number
  defaultAmbiguityMargin?: number
  includeDraftFigures?: boolean
}

const DEFAULT_OPTIONS: Required<DiscoveryOptions> = {
  minInputs: 2,
  maxInputs: 5,
  defaultMinScore: 85,
  defaultAmbiguityMargin: 12,
  includeDraftFigures: false,
}

export function attemptCraft(catalog: GameCatalog, inputCardIds: string[]): DiscoveryResult | null {
  const recipes = catalog.gameplay.crafting ?? []
  const normalizedInputs = [...new Set(inputCardIds)].sort()
  if (normalizedInputs.length < 2) return null

  const recipe = recipes.find((candidate) => {
    const normalizedRecipe = [...new Set(candidate.inputs)].sort()
    if (normalizedRecipe.length !== normalizedInputs.length) return false
    return normalizedRecipe.every((id, index) => id === normalizedInputs[index])
  })

  if (!recipe) return null

  return {
    type: 'craft',
    recipeId: recipe.id,
    outputCardId: recipe.outputCardId,
    rewards: [{ type: 'new_tool_card', value: recipe.outputCardId }],
  }
}

export function attemptDiscovery(
  catalog: GameCatalog,
  userState: UserGameState,
  inputCardIds: string[],
  options: DiscoveryOptions = {},
): DiscoveryResult {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options }
  const normalizedInputs = [...new Set(inputCardIds)]
  const index = buildCatalogIndex(catalog, userState)

  if (normalizedInputs.length < resolvedOptions.minInputs) {
    return { type: 'invalid', reason: `At least ${resolvedOptions.minInputs} cards are required.` }
  }

  if (normalizedInputs.length > resolvedOptions.maxInputs) {
    return { type: 'invalid', reason: `At most ${resolvedOptions.maxInputs} cards can be combined.` }
  }

  const unknownInput = normalizedInputs.find((cardId) => !index.playableCardsById.has(cardId))
  if (unknownInput) {
    return { type: 'invalid', reason: `Unknown or non-playable input card: ${unknownInput}` }
  }

  const discoveredIds = new Set(userState.discoveredCardIds)
  const allCandidateScores: CandidateScore[] = catalog.cards
    .filter((card) => card.kind === 'figure' && card.discovery)
    .filter((figure) => isFigureEligible(figure, resolvedOptions))
    .map((figure) => scoreFigure(figure, normalizedInputs, index))
    .filter((candidate) => candidate.evidenceCount > 0)
    .sort((left, right) => right.score - left.score)

  const undiscoveredScores = allCandidateScores.filter((candidate) => !discoveredIds.has(candidate.cardId))
  const discoveredScores = allCandidateScores.filter((candidate) => discoveredIds.has(candidate.cardId))

  const [bestUndiscovered, secondUndiscovered] = undiscoveredScores

  if (bestUndiscovered) {
    const bestFigure = index.cardsById.get(bestUndiscovered.cardId)
    if (bestFigure?.discovery) {
      const minScore = bestFigure.discovery.minScore ?? resolvedOptions.defaultMinScore
      const ambiguityMargin = bestFigure.discovery.ambiguityMargin ?? resolvedOptions.defaultAmbiguityMargin
      const scoreDelta = bestUndiscovered.score - (secondUndiscovered?.score ?? 0)
      const minEvidenceCount = bestFigure.discovery.minEvidenceCount ?? 1

      if (bestUndiscovered.score >= minScore && scoreDelta < ambiguityMargin) {
        return {
          type: 'ambiguous',
          hints: [buildAmbiguityHint(undiscoveredScores.slice(0, 3), index)],
          candidateCount: undiscoveredScores.filter((c) => bestUndiscovered.score - c.score < ambiguityMargin).length,
          candidates: undiscoveredScores.slice(0, 5),
        }
      }

      if (bestUndiscovered.score >= minScore && bestUndiscovered.evidenceCount >= minEvidenceCount) {
        const rewards = buildRewards(bestFigure, catalog, userState)
        return {
          type: 'new_figure',
          cardId: bestUndiscovered.cardId,
          score: bestUndiscovered.score,
          reasons: bestUndiscovered.reasons,
          rewards,
        }
      }
    }
  }

  const [bestRediscovered] = discoveredScores
  if (bestRediscovered) {
    const bestFigure = index.cardsById.get(bestRediscovered.cardId)
    if (bestFigure?.discovery) {
      const minScore = bestFigure.discovery.minScore ?? resolvedOptions.defaultMinScore
      const minEvidenceCount = bestFigure.discovery.minEvidenceCount ?? 1
      if (bestRediscovered.score >= minScore && bestRediscovered.evidenceCount >= minEvidenceCount) {
        return {
          type: 'already_discovered',
          cardId: bestRediscovered.cardId,
          score: bestRediscovered.score,
          reasons: bestRediscovered.reasons,
          rewards: [],
        }
      }
    }
  }

  const best = bestUndiscovered ?? bestRediscovered
  if (!best) {
    return {
      type: 'near_miss',
      hints: [buildBroadHint(normalizedInputs, index)],
      candidates: [],
      nearestConstellations: [],
    }
  }

  const bestFigure = index.cardsById.get(best.cardId)
  if (!bestFigure?.discovery) {
    return { type: 'invalid', reason: `Best candidate has no discovery rule: ${best.cardId}` }
  }

  return {
    type: 'near_miss',
    hints: buildNearMissHints(best, bestFigure, normalizedInputs, index),
    candidates: allCandidateScores.slice(0, 5),
    nearestConstellations: bestFigure.constellationIds ?? [],
  }
}

function scoreFigure(figure: Card, inputCardIds: string[], index: CatalogIndex): CandidateScore {
  const inputCards = inputCardIds.map((cardId) => index.cardsById.get(cardId)).filter(Boolean) as Card[]
  const inputTokens = buildInputTokens(inputCards)
  const reasons: ScoreReason[] = []
  let score = 0
  let evidenceCount = 0

  for (const evidence of figure.discovery?.evidence ?? []) {
    const matchedWeight = scoreEvidence(evidence, inputCards, inputTokens)
    if (matchedWeight > 0) {
      evidenceCount += 1
      score += matchedWeight
      reasons.push({
        kind: 'evidence',
        label: evidence.reason ?? evidence.card ?? evidence.tag ?? 'evidence',
        weight: matchedWeight,
      })
    }
  }

  for (const synergy of figure.discovery?.synergies ?? []) {
    if (modifierMatches(synergy, inputTokens)) {
      score += synergy.weight
      reasons.push({ kind: 'synergy', label: synergy.reason, weight: synergy.weight })
    }
  }

  for (const contradiction of figure.discovery?.contradictions ?? []) {
    if (modifierMatches(contradiction, inputTokens)) {
      score += contradiction.weight
      reasons.push({ kind: 'contradiction', label: contradiction.reason, weight: contradiction.weight })
    }
  }

  return {
    cardId: figure.id,
    title: figure.localization.fr?.title ?? figure.slug,
    score: Math.max(0, Math.round(score)),
    evidenceCount,
    reasons,
  }
}

function buildCatalogIndex(catalog: GameCatalog, userState?: UserGameState): CatalogIndex {
  const cardsById = new Map(catalog.cards.map((card) => [card.id, card]))
  const unlockedIds = new Set(userState?.unlockedCardIds ?? [])
  const discoveredIds = new Set(userState?.discoveredCardIds ?? [])

  const playableCardsById = new Map(
    catalog.cards
      .filter((card) => {
        if (card.kind !== 'figure') return unlockedIds.has(card.id)
        return discoveredIds.has(card.id)
      })
      .map((card) => [card.id, card]),
  )

  return { cardsById, playableCardsById }
}

function isFigureEligible(figure: Card, options: Required<DiscoveryOptions>): boolean {
  if (options.includeDraftFigures) return figure.status !== 'deprecated'
  return ['reviewed', 'approved', 'published'].includes(figure.status)
}

function scoreEvidence(evidence: DiscoveryEvidence, inputCards: Card[], inputTokens: Set<string>): number {
  if (evidence.card && inputTokens.has(`card:${evidence.card}`)) return evidence.weight
  if (!evidence.tag) return 0
  if (inputTokens.has(`tag:${evidence.tag}`)) return evidence.weight

  const matchingWeightedTag = inputCards
    .flatMap((card) => card.tags ?? [])
    .filter((wt) => wt.tag === evidence.tag)
    .sort((left, right) => (right.weight ?? 1) - (left.weight ?? 1))[0]

  if (!matchingWeightedTag) return 0
  return Math.round(evidence.weight * normalizeTagStrength(matchingWeightedTag))
}

function normalizeTagStrength(weightedTag: WeightedTag): number {
  if (weightedTag.weight === undefined) return 1
  return Math.max(0.25, Math.min(1, weightedTag.weight / 100))
}

function modifierMatches(modifier: DiscoveryModifier, inputTokens: Set<string>): boolean {
  return modifier.whenAll.every((token) => inputTokens.has(token))
}

function buildInputTokens(inputCards: Card[]): Set<string> {
  const tokens = new Set<string>()
  for (const card of inputCards) {
    tokens.add(`card:${card.id}`)
    tokens.add(`kind:${card.kind}`)
    for (const weightedTag of card.tags ?? []) {
      tokens.add(`tag:${weightedTag.tag}`)
    }
  }
  return tokens
}

function buildRewards(figure: Card, catalog: GameCatalog, userState: UserGameState): Reward[] {
  const xp = rarityXp(figure.rarity)
  const rewards: Reward[] = [
    { type: 'new_figure_card', value: figure.id, meta: { title: figure.localization.fr?.title ?? figure.slug } },
    { type: 'xp', value: xp },
  ]

  for (const toolCardId of figure.unlocksToolCardIds ?? []) {
    const toolCard = catalog.cards.find((card) => card.id === toolCardId)
    if (toolCard) {
      rewards.push({
        type: 'new_tool_card',
        value: toolCardId,
        meta: { title: toolCard.localization.fr?.title ?? toolCardId },
      })
    }
  }

  for (const constellationId of figure.constellationIds ?? []) {
    const constellation = catalog.constellations.find((c) => c.id === constellationId)
    if (!constellation) continue

    const discoveredCount = constellation.cardIds.filter(
      (cardId) => cardId === figure.id || userState.discoveredCardIds.includes(cardId),
    ).length

    const isComplete = discoveredCount === constellation.cardIds.length
    rewards.push({
      type: isComplete ? 'constellation_unlock' : 'constellation_progress',
      value: `${constellationId}:${discoveredCount}/${constellation.cardIds.length}`,
      meta: {
        constellationId,
        discoveredCount,
        totalCount: constellation.cardIds.length,
        isComplete,
        reward: constellation.reward,
      },
    })

    if (isComplete && constellation.reward?.unlockCardIds) {
      for (const unlockCardId of constellation.reward.unlockCardIds) {
        rewards.push({ type: 'new_tool_card', value: unlockCardId })
      }
    }

    if (isComplete && constellation.reward?.xp) {
      rewards.push({ type: 'xp', value: constellation.reward.xp, meta: { reason: 'constellation_complete' } })
    }
  }

  return rewards
}

function rarityXp(rarity?: string): number {
  switch (rarity) {
    case 'legendary': return 120
    case 'epic': return 80
    case 'rare': return 50
    case 'uncommon': return 30
    default: return 20
  }
}

function buildBroadHint(inputCardIds: string[], index: CatalogIndex): Hint {
  const inputKinds: string[] = inputCardIds
    .map((cardId) => index.cardsById.get(cardId)?.kind)
    .filter(Boolean) as string[]

  if (!inputKinds.includes('period')) {
    return { type: 'missing_period', message: 'Ajoute une époque pour situer ta recherche.' }
  }

  if (!inputKinds.includes('domain') && !inputKinds.includes('role')) {
    return { type: 'missing_domain', message: 'Ajoute un domaine ou un rôle pour préciser l’intention.' }
  }

  return { type: 'too_broad', message: 'La combinaison est trop générale. Ajoute un indice plus spécifique.' }
}

function buildAmbiguityHint(candidates: CandidateScore[], index: CatalogIndex): Hint {
  const titles = candidates
    .map((c) => index.cardsById.get(c.cardId)?.localization.fr?.title ?? c.cardId)
    .join(', ')

  return {
    type: 'ambiguous',
    message: `Tu es proche de plusieurs personnages (${titles}). Ajoute un indice distinctif : lieu précis, découverte, œuvre ou relation.`,
    cardIds: candidates.map((c) => c.cardId),
  }
}

function buildNearMissHints(
  best: CandidateScore,
  figure: Card,
  inputCardIds: string[],
  index: CatalogIndex,
): Hint[] {
  const hints: Hint[] = []
  const inputTokens = buildInputTokens(
    inputCardIds.map((id) => index.cardsById.get(id)).filter(Boolean) as Card[],
  )
  const missingEvidence = figure.discovery?.evidence.find((evidence) => {
    if (evidence.card && inputTokens.has(`card:${evidence.card}`)) return false
    if (evidence.tag && inputTokens.has(`tag:${evidence.tag}`)) return false
    return true
  })

  if (best.reasons.some((reason) => reason.kind === 'contradiction')) {
    hints.push({ type: 'contradictory', message: 'Un indice joué semble contredire le meilleur candidat.' })
  }

  if (missingEvidence?.tag?.startsWith('period.')) {
    hints.push({ type: 'missing_period', message: 'Tu es proche : ajoute une époque plus précise.' })
  } else if (missingEvidence?.tag?.startsWith('place.') || missingEvidence?.tag?.startsWith('region.')) {
    hints.push({ type: 'missing_region', message: 'Tu es proche : ajoute un lieu ou une région plus précise.' })
  } else if (missingEvidence?.tag?.startsWith('domain.')) {
    hints.push({ type: 'missing_domain', message: 'Tu es proche : ajoute le domaine exact du personnage.' })
  } else if (missingEvidence?.card) {
    const title = index.cardsById.get(missingEvidence.card)?.localization.fr?.title ?? missingEvidence.card
    hints.push({ type: 'missing_relation', message: `Tu es proche : essaie un indice lié à ${title}.` })
  }

  if (hints.length === 0) {
    hints.push({
      type: 'near_miss',
      message: 'Tu es proche, mais il manque encore un indice vraiment distinctif.',
    })
  }

  return hints
}
