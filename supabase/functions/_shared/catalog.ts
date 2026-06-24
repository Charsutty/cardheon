import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type GameCatalog = {
  version: string
  cards: Card[]
  relationships: Relationship[]
  constellations: Constellation[]
  packs: Pack[]
  sources: Source[]
  gameplay: {
    discovery: { minInputs: number; maxInputs: number }
    crafting?: CraftingRecipe[]
    progression: { xpPerLevel: number; initialLevel: number }
  }
}

export type CardKind =
  | 'figure' | 'period' | 'region' | 'place' | 'civilization'
  | 'role' | 'domain' | 'concept' | 'event' | 'work'
  | 'movement' | 'relation' | 'symbol'

export type Card = {
  id: string
  slug: string
  kind: CardKind
  status: string
  rarity?: string
  localization: Record<string, { title: string; subtitle?: string }>
  tags?: { tag: string; weight?: number }[]
  discovery?: {
    figureId: string
    minScore?: number
    ambiguityMargin?: number
    evidence: { card?: string; tag?: string; weight: number; reason?: string }[]
    synergies?: { id: string; whenAll: string[]; weight: number; reason: string }[]
    contradictions?: { id: string; whenAll: string[]; weight: number; reason: string }[]
    minEvidenceCount?: number
  }
  unlocksToolCardIds?: string[]
  constellationIds?: string[]
}

export type Relationship = {
  source: string
  predicate: string
  target: string
  weight?: number
}

export type Constellation = {
  id: string
  slug: string
  localization: Record<string, { title: string }>
  cardIds: string[]
  reward?: { xp?: number; unlockCardIds?: string[] }
}

export type Pack = {
  id: string
  slug: string
  localization: Record<string, { title: string }>
  starterCardIds: string[]
  cardPoolIds: string[]
}

export type Source = {
  id: string
  title: string
  type: string
  url?: string
}

export type CraftingRecipe = {
  id: string
  inputs: string[]
  outputCardId: string
}

export type DiscoveryResult =
  | { type: 'new_figure'; cardId: string; score: number; reasons: ScoreReason[]; rewards: Reward[] }
  | { type: 'already_discovered'; cardId: string; score: number; reasons: ScoreReason[]; rewards: Reward[] }
  | { type: 'craft'; recipeId: string; outputCardId: string; rewards: Reward[] }
  | { type: 'near_miss'; hints: Hint[]; candidates: CandidateScore[]; nearestConstellations: string[] }
  | { type: 'ambiguous'; hints: Hint[]; candidateCount: number; candidates: CandidateScore[] }
  | { type: 'invalid'; reason: string }

export type ScoreReason = {
  kind: 'evidence' | 'synergy' | 'contradiction'
  label: string
  weight: number
}

export type Reward = {
  type: string
  value: string | number
  meta?: Record<string, unknown>
}

export type Hint = {
  type: string
  message: string
  cardIds?: string[]
}

export type CandidateScore = {
  cardId: string
  title: string
  score: number
  evidenceCount: number
  reasons: ScoreReason[]
}

export async function loadPublishedCatalog(supabase: ReturnType<typeof createClient>): Promise<GameCatalog | null> {
  const { data: versionData, error: versionError } = await supabase
    .from('catalog_versions')
    .select('id, gameplay')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (versionError || !versionData) return null

  const version = versionData.id
  const gameplay = versionData.gameplay as GameCatalog['gameplay']

  interface CardRow {
    id: string; slug: string; kind: CardKind; status: string
    rarity: string | null; localization: Record<string, { title: string; subtitle?: string }>
    tags: { tag: string; weight?: number }[] | null
    discovery: Card['discovery'] | null
    unlocks_tool_card_ids: string[] | null
    source_ids: string[] | null
    constellation_ids: string[] | null
  }

  interface RelationshipRow {
    source_card_id: string; predicate: string; target_card_id: string
    weight: number | null
  }

  interface ConstellationRow {
    id: string; slug: string
    localization: Record<string, { title: string }>
    card_ids: string[]
    reward: Constellation['reward'] | null
  }

  interface PackRow {
    id: string; slug: string
    localization: Record<string, { title: string }>
    starter_card_ids: string[]
    card_pool_ids: string[]
  }

  interface SourceRow {
    id: string; title: string; type: string; url: string | null
  }

  const [cardRows, relationshipRows, constellationRows, packRows, sourceRows] = await Promise.all([
    supabase.from('catalog_cards').select('*').eq('catalog_version_id', version).order('id', { ascending: true }),
    supabase.from('catalog_relationships').select('*').eq('catalog_version_id', version).order('source_card_id', { ascending: true }),
    supabase.from('catalog_constellations').select('*').eq('catalog_version_id', version).order('id', { ascending: true }),
    supabase.from('catalog_packs').select('*').eq('catalog_version_id', version).order('id', { ascending: true }),
    supabase.from('catalog_sources').select('*').eq('catalog_version_id', version).order('id', { ascending: true }),
  ])

  const cards = (cardRows.data ?? []).map((row: CardRow) => ({
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    status: row.status,
    rarity: row.rarity ?? undefined,
    localization: row.localization,
    tags: row.tags ?? [],
    discovery: row.discovery ?? undefined,
    unlocksToolCardIds: row.unlocks_tool_card_ids ?? undefined,
    sourceIds: row.source_ids ?? undefined,
    constellationIds: row.constellation_ids ?? undefined,
  }))

  // Build constellation-to-card mapping for cards that don't have constellation_ids
  const constellationIdsByCard = new Map<string, string[]>()
  for (const constellation of (constellationRows.data ?? []) as ConstellationRow[]) {
    for (const cardId of constellation.card_ids) {
      const existing = constellationIdsByCard.get(cardId) ?? []
      existing.push(constellation.id)
      constellationIdsByCard.set(cardId, existing)
    }
  }
  for (const card of cards) {
    if (!card.constellationIds) {
      card.constellationIds = constellationIdsByCard.get(card.id)
    }
  }

  return {
    version,
    gameplay,
    cards,
    relationships: (relationshipRows.data ?? []).map((row: RelationshipRow) => ({
      source: row.source_card_id,
      predicate: row.predicate,
      target: row.target_card_id,
      weight: row.weight ?? undefined,
    })),
    constellations: (constellationRows.data ?? []).map((row: ConstellationRow) => ({
      id: row.id,
      slug: row.slug,
      localization: row.localization,
      cardIds: row.card_ids,
      reward: row.reward ?? undefined,
    })),
    packs: (packRows.data ?? []).map((row: PackRow) => ({
      id: row.id,
      slug: row.slug,
      localization: row.localization,
      starterCardIds: row.starter_card_ids,
      cardPoolIds: row.card_pool_ids,
    })),
    sources: (sourceRows.data ?? []).map((row: SourceRow) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      url: row.url ?? undefined,
    })),
  }
}
