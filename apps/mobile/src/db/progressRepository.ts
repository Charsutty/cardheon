import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SQLiteDatabase } from 'expo-sqlite'
import { initialProgress, type GameProgress } from '../game/progress'
import { getDatabase } from './database'

const LEGACY_STORAGE_KEY = 'cardheon.progress.v1'
const LEGACY_MIGRATION_KEY = 'legacy_progress_migrated'

export async function loadProgress(database?: SQLiteDatabase): Promise<GameProgress> {
  const db = database ?? await getDatabase()
  await migrateLegacyProgress(db)

  const [profile, discoveries] = await Promise.all([
    db.getFirstAsync<{
      xp: number
      attempts: number
      last_discovery_id: string | null
    }>('SELECT xp, attempts, last_discovery_id FROM player_profile WHERE id = 1'),
    db.getAllAsync<{ card_id: string }>(
      'SELECT card_id FROM player_discoveries ORDER BY discovered_at, card_id',
    ),
  ])

  return {
    discoveredCardIds: discoveries.map((row) => row.card_id),
    xp: profile?.xp ?? 0,
    attempts: profile?.attempts ?? 0,
    lastDiscoveryId: profile?.last_discovery_id ?? undefined,
  }
}

export async function saveProgress(
  progress: GameProgress,
  database?: SQLiteDatabase,
): Promise<void> {
  const db = database ?? await getDatabase()
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO player_profile (id, xp, attempts, last_discovery_id, updated_at)
       VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         xp = excluded.xp,
         attempts = excluded.attempts,
         last_discovery_id = excluded.last_discovery_id,
         updated_at = CURRENT_TIMESTAMP`,
      progress.xp,
      progress.attempts,
      progress.lastDiscoveryId ?? null,
    )

    await db.runAsync('DELETE FROM player_discoveries')
    for (const cardId of progress.discoveredCardIds) {
      await db.runAsync(
        'INSERT INTO player_discoveries (card_id) VALUES (?)',
        cardId,
      )
    }
  })
}

async function migrateLegacyProgress(db: SQLiteDatabase): Promise<void> {
  const migrated = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_metadata WHERE key = ?',
    LEGACY_MIGRATION_KEY,
  )
  if (migrated) return

  const stored = await AsyncStorage.getItem(LEGACY_STORAGE_KEY)
  if (stored) {
    const parsed = JSON.parse(stored) as Partial<GameProgress>
    await saveProgress({
      discoveredCardIds: parsed.discoveredCardIds ?? initialProgress.discoveredCardIds,
      xp: parsed.xp ?? initialProgress.xp,
      attempts: parsed.attempts ?? initialProgress.attempts,
      lastDiscoveryId: parsed.lastDiscoveryId,
    }, db)
  }

  await db.runAsync(
    `INSERT INTO app_metadata (key, value)
     VALUES (?, '1')
     ON CONFLICT(key) DO UPDATE SET value = '1', updated_at = CURRENT_TIMESTAMP`,
    LEGACY_MIGRATION_KEY,
  )

  if (stored) await AsyncStorage.removeItem(LEGACY_STORAGE_KEY)
}
