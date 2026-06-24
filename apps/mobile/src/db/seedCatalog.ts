import type { GameCatalog } from '@cardheon/game-engine'
import type { SQLiteDatabase } from 'expo-sqlite'
import catalogJson from '../../../../content/catalog.dev.json'

const bundledCatalog = catalogJson as GameCatalog

export async function seedCatalogIfNeeded(db: SQLiteDatabase): Promise<void> {
  const metadata = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    'active_catalog_version',
  )

  if (metadata?.value === bundledCatalog.version) {
    const needsBackfill = await hasMissingUnlocks(db, bundledCatalog)
    if (!needsBackfill) return
  }

  await db.withTransactionAsync(async () => {
    await seedCards(db, bundledCatalog)
    await seedSources(db, bundledCatalog)
    await seedCardSources(db, bundledCatalog)
    await seedRelationships(db, bundledCatalog)
    await seedConstellations(db, bundledCatalog)
    await seedPacks(db, bundledCatalog)

    await db.runAsync(
      `INSERT INTO app_metadata (key, value, updated_at)
       VALUES ('active_catalog_version', ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      bundledCatalog.version,
    )
  })
}

async function hasMissingUnlocks(db: SQLiteDatabase, catalog: GameCatalog): Promise<boolean> {
  for (const card of catalog.cards) {
    if (!card.unlocksToolCardIds || card.unlocksToolCardIds.length === 0) continue

    const row = await db.getFirstAsync<{ unlocks_tool_card_ids_json: string | null }>(
      `SELECT unlocks_tool_card_ids_json
       FROM cards
       WHERE catalog_version = ? AND id = ?`,
      catalog.version,
      card.id,
    )

    if (row?.unlocks_tool_card_ids_json !== JSON.stringify(card.unlocksToolCardIds)) {
      return true
    }
  }

  return false
}

async function seedCards(db: SQLiteDatabase, catalog: GameCatalog) {
  for (const card of catalog.cards) {
    await db.runAsync(
      `INSERT OR REPLACE INTO cards (
        catalog_version, id, slug, kind, status, rarity, localization_json, discovery_json,
        unlocks_tool_card_ids_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      catalog.version,
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
      catalog.version,
      card.id,
    )

    for (const tag of card.tags ?? []) {
      await db.runAsync(
        `INSERT INTO card_tags (catalog_version, card_id, tag, weight)
         VALUES (?, ?, ?, ?)`,
        catalog.version,
        card.id,
        tag.tag,
        tag.weight ?? null,
      )
    }
  }
}

async function seedSources(db: SQLiteDatabase, catalog: GameCatalog) {
  for (const source of catalog.sources) {
    await db.runAsync(
      `INSERT OR REPLACE INTO sources (catalog_version, id, title, type, url)
       VALUES (?, ?, ?, ?, ?)`,
      catalog.version,
      source.id,
      source.title,
      source.type,
      source.url ?? null,
    )
  }
}

async function seedCardSources(db: SQLiteDatabase, catalog: GameCatalog) {
  await db.runAsync('DELETE FROM card_sources WHERE catalog_version = ?', catalog.version)

  for (const card of catalog.cards) {
    for (const sourceId of card.sourceIds ?? []) {
      await db.runAsync(
        `INSERT INTO card_sources (catalog_version, card_id, source_id)
         VALUES (?, ?, ?)`,
        catalog.version,
        card.id,
        sourceId,
      )
    }
  }
}

async function seedRelationships(db: SQLiteDatabase, catalog: GameCatalog) {
  await db.runAsync('DELETE FROM relationships WHERE catalog_version = ?', catalog.version)

  for (const relationship of catalog.relationships) {
    await db.runAsync(
      `INSERT INTO relationships (
        catalog_version, source_card_id, predicate, target_card_id, weight, source_ids_json
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      catalog.version,
      relationship.source,
      relationship.predicate,
      relationship.target,
      relationship.weight ?? null,
      relationship.sourceIds ? JSON.stringify(relationship.sourceIds) : null,
    )
  }
}

async function seedConstellations(db: SQLiteDatabase, catalog: GameCatalog) {
  for (const constellation of catalog.constellations) {
    await db.runAsync(
      `INSERT OR REPLACE INTO constellations (
        catalog_version, id, slug, localization_json, reward_json
      ) VALUES (?, ?, ?, ?, ?)`,
      catalog.version,
      constellation.id,
      constellation.slug,
      JSON.stringify(constellation.localization),
      constellation.reward ? JSON.stringify(constellation.reward) : null,
    )
    await db.runAsync(
      'DELETE FROM constellation_cards WHERE catalog_version = ? AND constellation_id = ?',
      catalog.version,
      constellation.id,
    )

    for (const [position, cardId] of constellation.cardIds.entries()) {
      await db.runAsync(
        `INSERT INTO constellation_cards (
          catalog_version, constellation_id, card_id, position
        ) VALUES (?, ?, ?, ?)`,
        catalog.version,
        constellation.id,
        cardId,
        position,
      )
    }
  }
}

async function seedPacks(db: SQLiteDatabase, catalog: GameCatalog) {
  for (const pack of catalog.packs) {
    await db.runAsync(
      `INSERT OR REPLACE INTO packs (catalog_version, id, slug, localization_json)
       VALUES (?, ?, ?, ?)`,
      catalog.version,
      pack.id,
      pack.slug,
      JSON.stringify(pack.localization),
    )
    await db.runAsync(
      'DELETE FROM pack_cards WHERE catalog_version = ? AND pack_id = ?',
      catalog.version,
      pack.id,
    )

    for (const [position, cardId] of pack.starterCardIds.entries()) {
      await db.runAsync(
        `INSERT INTO pack_cards (
          catalog_version, pack_id, card_id, section, position
        ) VALUES (?, ?, ?, 'starter', ?)`,
        catalog.version,
        pack.id,
        cardId,
        position,
      )
    }

    for (const [position, cardId] of pack.cardPoolIds.entries()) {
      await db.runAsync(
        `INSERT INTO pack_cards (
          catalog_version, pack_id, card_id, section, position
        ) VALUES (?, ?, ?, 'pool', ?)`,
        catalog.version,
        pack.id,
        cardId,
        position,
      )
    }
  }
}
