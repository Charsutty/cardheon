import type {
  Card,
  Constellation,
  GameCatalog,
  Pack,
  Relationship,
  Source,
} from '@cardheon/game-engine'
import type { CatalogManifest } from './catalogManifest'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

type CardRow = {
  id: string
  slug: string
  kind: Card['kind']
  status: Card['status']
  rarity: Card['rarity'] | null
  localization: Card['localization']
  tags: Card['tags'] | null
  discovery: Card['discovery'] | null
  unlocks_tool_card_ids: string[] | null
  source_ids: string[] | null
  constellation_ids: string[] | null
}

type RelationshipRow = {
  source_card_id: string
  predicate: string
  target_card_id: string
  weight: number | null
  source_ids: string[] | null
}

type ConstellationRow = {
  id: string
  slug: string
  localization: Constellation['localization']
  card_ids: string[]
  reward: Constellation['reward'] | null
}

type PackRow = {
  id: string
  slug: string
  localization: Pack['localization']
  starter_card_ids: string[]
  card_pool_ids: string[]
}

type SourceRow = Source & {
  url: string | null
}

export async function fetchRemoteCatalog(
  manifest: CatalogManifest,
  gameplay: GameCatalog['gameplay'],
): Promise<GameCatalog | undefined> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return undefined

  const version = manifest.catalogVersion
  const [cardRows, relationshipRows, constellationRows, packRows, sourceRows] = await Promise.all([
    fetchTable<CardRow>('catalog_cards', version, 'id.asc'),
    fetchTable<RelationshipRow>('catalog_relationships', version, 'source_card_id.asc,predicate.asc,target_card_id.asc'),
    fetchTable<ConstellationRow>('catalog_constellations', version, 'id.asc'),
    fetchTable<PackRow>('catalog_packs', version, 'id.asc'),
    fetchTable<SourceRow>('catalog_sources', version, 'id.asc'),
  ])

  const constellationIdsByCard = new Map<string, string[]>()
  for (const constellation of constellationRows) {
    for (const cardId of constellation.card_ids) {
      constellationIdsByCard.set(cardId, [
        ...(constellationIdsByCard.get(cardId) ?? []),
        constellation.id,
      ])
    }
  }

  return {
    version,
    gameplay,
    cards: cardRows.map((row) => ({
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
      constellationIds: row.constellation_ids ?? constellationIdsByCard.get(row.id),
    })),
    relationships: relationshipRows.map<Relationship>((row) => ({
      source: row.source_card_id,
      predicate: row.predicate,
      target: row.target_card_id,
      weight: row.weight ?? undefined,
      sourceIds: row.source_ids ?? undefined,
    })),
    constellations: constellationRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      localization: row.localization,
      cardIds: row.card_ids,
      reward: row.reward ?? undefined,
    })),
    packs: packRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      localization: row.localization,
      starterCardIds: row.starter_card_ids,
      cardPoolIds: row.card_pool_ids,
    })),
    sources: sourceRows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      url: row.url ?? undefined,
    })),
  }
}

async function fetchTable<Row>(
  table: string,
  catalogVersion: string,
  order: string,
): Promise<Row[]> {
  const search = new URLSearchParams({
    catalog_version_id: `eq.${catalogVersion}`,
    order,
  })
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${search.toString()}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY ?? '',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })

  if (!response.ok) throw new Error(`remote_catalog_${table}_${response.status}`)
  return await response.json() as Row[]
}
