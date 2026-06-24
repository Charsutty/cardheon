import type { SQLiteDatabase } from 'expo-sqlite'

const DATABASE_VERSION = 4

const V1_SCHEMA = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cards (
    catalog_version TEXT NOT NULL,
    id TEXT NOT NULL,
    slug TEXT NOT NULL,
    kind TEXT NOT NULL,
    status TEXT NOT NULL,
    rarity TEXT,
    localization_json TEXT NOT NULL,
    discovery_json TEXT,
    unlocks_tool_card_ids_json TEXT,
    PRIMARY KEY (catalog_version, id),
    UNIQUE (catalog_version, slug)
  );

  CREATE TABLE IF NOT EXISTS card_tags (
    catalog_version TEXT NOT NULL,
    card_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    weight INTEGER,
    PRIMARY KEY (catalog_version, card_id, tag),
    FOREIGN KEY (catalog_version, card_id)
      REFERENCES cards(catalog_version, id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sources (
    catalog_version TEXT NOT NULL,
    id TEXT NOT NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT,
    PRIMARY KEY (catalog_version, id)
  );

  CREATE TABLE IF NOT EXISTS card_sources (
    catalog_version TEXT NOT NULL,
    card_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    PRIMARY KEY (catalog_version, card_id, source_id),
    FOREIGN KEY (catalog_version, card_id)
      REFERENCES cards(catalog_version, id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_version, source_id)
      REFERENCES sources(catalog_version, id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS relationships (
    catalog_version TEXT NOT NULL,
    source_card_id TEXT NOT NULL,
    predicate TEXT NOT NULL,
    target_card_id TEXT NOT NULL,
    weight INTEGER,
    source_ids_json TEXT,
    PRIMARY KEY (catalog_version, source_card_id, predicate, target_card_id),
    FOREIGN KEY (catalog_version, source_card_id)
      REFERENCES cards(catalog_version, id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_version, target_card_id)
      REFERENCES cards(catalog_version, id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS constellations (
    catalog_version TEXT NOT NULL,
    id TEXT NOT NULL,
    slug TEXT NOT NULL,
    localization_json TEXT NOT NULL,
    reward_json TEXT,
    PRIMARY KEY (catalog_version, id)
  );

  CREATE TABLE IF NOT EXISTS constellation_cards (
    catalog_version TEXT NOT NULL,
    constellation_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    PRIMARY KEY (catalog_version, constellation_id, card_id),
    FOREIGN KEY (catalog_version, constellation_id)
      REFERENCES constellations(catalog_version, id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_version, card_id)
      REFERENCES cards(catalog_version, id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS packs (
    catalog_version TEXT NOT NULL,
    id TEXT NOT NULL,
    slug TEXT NOT NULL,
    localization_json TEXT NOT NULL,
    PRIMARY KEY (catalog_version, id)
  );

  CREATE TABLE IF NOT EXISTS pack_cards (
    catalog_version TEXT NOT NULL,
    pack_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    section TEXT NOT NULL CHECK (section IN ('starter', 'pool')),
    position INTEGER NOT NULL,
    PRIMARY KEY (catalog_version, pack_id, card_id, section),
    FOREIGN KEY (catalog_version, pack_id)
      REFERENCES packs(catalog_version, id) ON DELETE CASCADE,
    FOREIGN KEY (catalog_version, card_id)
      REFERENCES cards(catalog_version, id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS player_profile (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
    xp INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    last_discovery_id TEXT,
    last_discovery_result_json TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS player_discoveries (
    card_id TEXT PRIMARY KEY NOT NULL,
    discovered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_cards_kind
    ON cards(catalog_version, kind);
  CREATE INDEX IF NOT EXISTS idx_card_tags_tag
    ON card_tags(catalog_version, tag);
  CREATE INDEX IF NOT EXISTS idx_relationships_source
    ON relationships(catalog_version, source_card_id);
  CREATE INDEX IF NOT EXISTS idx_relationships_target
    ON relationships(catalog_version, target_card_id);

  INSERT OR IGNORE INTO player_profile (id) VALUES (1);
`

const V2_SCHEMA = `
  CREATE TABLE IF NOT EXISTS player_cards (
    card_id TEXT PRIMARY KEY NOT NULL,
    state TEXT NOT NULL DEFAULT 'locked',
    usable_in_atelier INTEGER NOT NULL DEFAULT 0,
    unlocked_at TEXT,
    discovered_at TEXT,
    mastered_at TEXT,
    source_reason TEXT
  );

  CREATE TABLE IF NOT EXISTS player_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    input_card_ids_json TEXT NOT NULL,
    result_type TEXT NOT NULL,
    result_card_id TEXT,
    score INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS player_rewards (
    id TEXT PRIMARY KEY NOT NULL,
    reward_type TEXT NOT NULL,
    reward_value TEXT NOT NULL,
    claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS player_packs (
    pack_id TEXT PRIMARY KEY NOT NULL,
    state TEXT NOT NULL DEFAULT 'unopened',
    opened_at TEXT
  );

  CREATE TABLE IF NOT EXISTS player_constellations (
    constellation_id TEXT PRIMARY KEY NOT NULL,
    state TEXT NOT NULL DEFAULT 'hidden',
    progress INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    reward_claimed_at TEXT
  );
`

const V3_SCHEMA = `
  ALTER TABLE cards ADD COLUMN unlocks_tool_card_ids_json TEXT;
`

const V4_SCHEMA = `
  CREATE TABLE IF NOT EXISTS sync_events (
    client_mutation_id TEXT PRIMARY KEY NOT NULL,
    mutation_type TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced_at TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_sync_events_pending
    ON sync_events(created_at)
    WHERE synced_at IS NULL;
`

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version')
  const currentVersion = row?.user_version ?? 0

  if (currentVersion > DATABASE_VERSION) {
    throw new Error(`La base locale (v${currentVersion}) est plus récente que l’application (v${DATABASE_VERSION}).`)
  }

  if (currentVersion < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(V1_SCHEMA)
      await db.execAsync('PRAGMA user_version = 1')
    })
  }

  if (currentVersion < 2) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(V2_SCHEMA)

      // Ensure player_profile has the result column.
      const profileColumns = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(player_profile)",
      )
      const hasResultColumn = profileColumns.some((column) => column.name === 'last_discovery_result_json')
      if (!hasResultColumn) {
        await db.execAsync(
          'ALTER TABLE player_profile ADD COLUMN last_discovery_result_json TEXT',
        )
      }

      // Migrate legacy player_discoveries into player_cards.
      const discoveries = await db.getAllAsync<{ card_id: string; discovered_at: string }>(
        'SELECT card_id, discovered_at FROM player_discoveries',
      )
      for (const row of discoveries) {
        await db.runAsync(
          `INSERT INTO player_cards (card_id, state, usable_in_atelier, discovered_at, source_reason)
           VALUES (?, 'discovered', 1, ?, 'migration')
           ON CONFLICT(card_id) DO UPDATE SET
             state = 'discovered',
             usable_in_atelier = 1,
             discovered_at = excluded.discovered_at`,
          row.card_id,
          row.discovered_at,
        )
      }

      await db.execAsync('PRAGMA user_version = 2')
    })
  }

  if (currentVersion < 3) {
    await db.withTransactionAsync(async () => {
      const cardColumns = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(cards)",
      )
      const hasUnlocksColumn = cardColumns.some((column) => column.name === 'unlocks_tool_card_ids_json')
      if (!hasUnlocksColumn) {
        await db.execAsync(V3_SCHEMA)
      }

      await db.execAsync('PRAGMA user_version = 3')
    })
  }

  if (currentVersion < 4) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(V4_SCHEMA)
      await db.execAsync('PRAGMA user_version = 4')
    })
  }
}
