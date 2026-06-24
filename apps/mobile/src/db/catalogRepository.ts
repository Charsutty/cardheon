import type {
  Card,
  Constellation,
  GameCatalog,
  Pack,
  Relationship,
  Source,
} from '@cardheon/game-engine'
import type { SQLiteDatabase } from 'expo-sqlite'
import { getDatabase } from './database'
import { bundledCatalog } from '../game/catalog'

type CardRow = {
  id: string
  slug: string
  kind: Card['kind']
  status: Card['status']
  rarity: Card['rarity'] | null
  localization_json: string
  discovery_json: string | null
  unlocks_tool_card_ids_json: string | null
}

type RelationshipRow = {
  source_card_id: string
  predicate: string
  target_card_id: string
  weight: number | null
  source_ids_json: string | null
}

export type CardConnection = {
  direction: 'outgoing' | 'incoming'
  predicate: string
  weight?: number
  card: Card
}

export async function saveCard(card: Card, database?: SQLiteDatabase): Promise<void> {
  const db = database ?? await getDatabase()
  const version = await getActiveCatalogVersion(db)

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO cards (
        catalog_version, id, slug, kind, status, rarity, localization_json, discovery_json,
        unlocks_tool_card_ids_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(catalog_version, id) DO UPDATE SET
        slug = excluded.slug,
        kind = excluded.kind,
        status = excluded.status,
        rarity = excluded.rarity,
        localization_json = excluded.localization_json,
        discovery_json = excluded.discovery_json,
        unlocks_tool_card_ids_json = excluded.unlocks_tool_card_ids_json`,
      version,
      card.id,
      card.slug,
      card.kind,
      card.status,
      card.rarity ?? null,
      JSON.stringify(card.localization),
      card.discovery ? JSON.stringify(card.discovery) : null,
      card.unlocksToolCardIds ? JSON.stringify(card.unlocksToolCardIds) : null,
    )

    await db.runAsync(
      'DELETE FROM card_tags WHERE catalog_version = ? AND card_id = ?',
      version,
      card.id,
    )
    for (const tag of card.tags ?? []) {
      await db.runAsync(
        `INSERT INTO card_tags (catalog_version, card_id, tag, weight)
         VALUES (?, ?, ?, ?)`,
        version,
        card.id,
        tag.tag,
        tag.weight ?? null,
      )
    }
  })
}

export async function saveSource(source: Source, database?: SQLiteDatabase): Promise<void> {
  const db = database ?? await getDatabase()
  const version = await getActiveCatalogVersion(db)
  await db.runAsync(
    `INSERT INTO sources (catalog_version, id, title, type, url)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(catalog_version, id) DO UPDATE SET
       title = excluded.title,
       type = excluded.type,
       url = excluded.url`,
    version,
    source.id,
    source.title,
    source.type,
    source.url ?? null,
  )
}

export async function setCardSources(
  cardId: string,
  sourceIds: string[],
  database?: SQLiteDatabase,
): Promise<void> {
  const db = database ?? await getDatabase()
  const version = await getActiveCatalogVersion(db)

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'DELETE FROM card_sources WHERE catalog_version = ? AND card_id = ?',
      version,
      cardId,
    )
    for (const sourceId of [...new Set(sourceIds)]) {
      await db.runAsync(
        `INSERT INTO card_sources (catalog_version, card_id, source_id)
         VALUES (?, ?, ?)`,
        version,
        cardId,
        sourceId,
      )
    }
  })
}

export async function saveRelationship(
  relationship: Relationship,
  database?: SQLiteDatabase,
): Promise<void> {
  const db = database ?? await getDatabase()
  const version = await getActiveCatalogVersion(db)
  await db.runAsync(
    `INSERT INTO relationships (
      catalog_version, source_card_id, predicate, target_card_id, weight, source_ids_json
    ) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(catalog_version, source_card_id, predicate, target_card_id) DO UPDATE SET
      weight = excluded.weight,
      source_ids_json = excluded.source_ids_json`,
    version,
    relationship.source,
    relationship.predicate,
    relationship.target,
    relationship.weight ?? null,
    relationship.sourceIds ? JSON.stringify(relationship.sourceIds) : null,
  )
}

export async function deleteRelationship(
  relationship: Pick<Relationship, 'source' | 'predicate' | 'target'>,
  database?: SQLiteDatabase,
): Promise<void> {
  const db = database ?? await getDatabase()
  const version = await getActiveCatalogVersion(db)
  await db.runAsync(
    `DELETE FROM relationships
     WHERE catalog_version = ?
       AND source_card_id = ?
       AND predicate = ?
       AND target_card_id = ?`,
    version,
    relationship.source,
    relationship.predicate,
    relationship.target,
  )
}

export async function loadCatalog(database?: SQLiteDatabase): Promise<GameCatalog> {
  const db = database ?? await getDatabase()
  const version = await getActiveCatalogVersion(db)
  const [cardRows, tagRows, cardSourceRows, relationshipRows, constellationRows, constellationCardRows, packRows, packCardRows, sourceRows] =
    await Promise.all([
      db.getAllAsync<CardRow>('SELECT * FROM cards WHERE catalog_version = ? ORDER BY rowid', version),
      db.getAllAsync<{ card_id: string; tag: string; weight: number | null }>(
        'SELECT card_id, tag, weight FROM card_tags WHERE catalog_version = ? ORDER BY rowid',
        version,
      ),
      db.getAllAsync<{ card_id: string; source_id: string }>(
        'SELECT card_id, source_id FROM card_sources WHERE catalog_version = ? ORDER BY rowid',
        version,
      ),
      db.getAllAsync<RelationshipRow>(
        'SELECT * FROM relationships WHERE catalog_version = ? ORDER BY rowid',
        version,
      ),
      db.getAllAsync<{
        id: string
        slug: string
        localization_json: string
        reward_json: string | null
      }>('SELECT * FROM constellations WHERE catalog_version = ? ORDER BY rowid', version),
      db.getAllAsync<{ constellation_id: string; card_id: string }>(
        `SELECT constellation_id, card_id
         FROM constellation_cards
         WHERE catalog_version = ?
         ORDER BY constellation_id, position`,
        version,
      ),
      db.getAllAsync<{ id: string; slug: string; localization_json: string }>(
        'SELECT * FROM packs WHERE catalog_version = ? ORDER BY rowid',
        version,
      ),
      db.getAllAsync<{ pack_id: string; card_id: string; section: 'starter' | 'pool' }>(
        `SELECT pack_id, card_id, section
         FROM pack_cards
         WHERE catalog_version = ?
         ORDER BY pack_id, section, position`,
        version,
      ),
      db.getAllAsync<Source & { url: string | null }>(
        'SELECT id, title, type, url FROM sources WHERE catalog_version = ? ORDER BY rowid',
        version,
      ),
    ])

  const cards = cardRows.map<Card>((row) => ({
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    status: row.status,
    rarity: row.rarity ?? undefined,
    localization: JSON.parse(row.localization_json) as Card['localization'],
    discovery: row.discovery_json
      ? (JSON.parse(row.discovery_json) as Card['discovery'])
      : undefined,
    unlocksToolCardIds: row.unlocks_tool_card_ids_json
      ? (JSON.parse(row.unlocks_tool_card_ids_json) as string[])
      : undefined,
    tags: tagRows
      .filter((tag) => tag.card_id === row.id)
      .map((tag) => ({ tag: tag.tag, weight: tag.weight ?? undefined })),
    sourceIds: cardSourceRows
      .filter((source) => source.card_id === row.id)
      .map((source) => source.source_id),
  }))

  const constellations = constellationRows.map<Constellation>((row) => ({
    id: row.id,
    slug: row.slug,
    localization: JSON.parse(row.localization_json) as Constellation['localization'],
    cardIds: constellationCardRows
      .filter((item) => item.constellation_id === row.id)
      .map((item) => item.card_id),
    reward: row.reward_json
      ? (JSON.parse(row.reward_json) as Constellation['reward'])
      : undefined,
  }))

  const constellationIdsByCard = new Map<string, string[]>()
  for (const constellation of constellations) {
    for (const cardId of constellation.cardIds) {
      constellationIdsByCard.set(cardId, [
        ...(constellationIdsByCard.get(cardId) ?? []),
        constellation.id,
      ])
    }
  }
  for (const card of cards) {
    card.constellationIds = constellationIdsByCard.get(card.id)
  }

  const relationships = relationshipRows.map<Relationship>(toRelationship)
  const packs = packRows.map<Pack>((row) => ({
    id: row.id,
    slug: row.slug,
    localization: JSON.parse(row.localization_json) as Pack['localization'],
    starterCardIds: packCardRows
      .filter((item) => item.pack_id === row.id && item.section === 'starter')
      .map((item) => item.card_id),
    cardPoolIds: packCardRows
      .filter((item) => item.pack_id === row.id && item.section === 'pool')
      .map((item) => item.card_id),
  }))

  const sources = sourceRows.map<Source>((source) => ({
    ...source,
    url: source.url ?? undefined,
  }))

  return {
    version,
    cards,
    relationships,
    constellations,
    packs,
    sources,
    gameplay: bundledCatalog.gameplay,
  }
}

export async function getCardConnections(cardId: string): Promise<CardConnection[]> {
  const catalog = await loadCatalog()
  const cardsById = new Map(catalog.cards.map((card) => [card.id, card]))

  return catalog.relationships.flatMap<CardConnection>((relationship) => {
    if (relationship.source === cardId) {
      const card = cardsById.get(relationship.target)
      return card
        ? [{ direction: 'outgoing', predicate: relationship.predicate, weight: relationship.weight, card }]
        : []
    }
    if (relationship.target === cardId) {
      const card = cardsById.get(relationship.source)
      return card
        ? [{ direction: 'incoming', predicate: relationship.predicate, weight: relationship.weight, card }]
        : []
    }
    return []
  })
}

async function getActiveCatalogVersion(db: SQLiteDatabase): Promise<string> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_metadata WHERE key = 'active_catalog_version'`,
  )
  if (!row) throw new Error('Aucun catalogue actif dans la base locale.')
  return row.value
}

function toRelationship(row: RelationshipRow): Relationship {
  return {
    source: row.source_card_id,
    predicate: row.predicate,
    target: row.target_card_id,
    weight: row.weight ?? undefined,
    sourceIds: row.source_ids_json
      ? (JSON.parse(row.source_ids_json) as string[])
      : undefined,
  }
}
