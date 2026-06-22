import type { SQLiteDatabase } from 'expo-sqlite'

const DATABASE_VERSION = 1

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
}
