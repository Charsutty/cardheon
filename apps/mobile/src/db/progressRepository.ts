import AsyncStorage from '@react-native-async-storage/async-storage'
import type { SQLiteDatabase } from 'expo-sqlite'
import {
  createCardState,
  initialProgress,
  type AttemptRecord,
  type DiscoveryResult,
  type GameProgress,
  type PlayerCardState,
  type PlayerConstellationState,
  type PlayerPackState,
} from '../game/progress'
import { getDatabase } from './database'

const LEGACY_STORAGE_KEY = 'cardheon.progress.v1'
const LEGACY_MIGRATION_KEY = 'legacy_progress_migrated'

export async function loadProgress(
  catalog?: { packs: { id: string; starterCardIds: string[] }[] },
  database?: SQLiteDatabase,
): Promise<GameProgress> {
  const db = database ?? await getDatabase()
  await migrateLegacyProgress(db)

  const [profile, cardRows, attemptRows, packRows, constellationRows] = await Promise.all([
    db.getFirstAsync<{
      xp: number
      attempts: number
      last_discovery_id: string | null
      last_discovery_result_json: string | null
    }>('SELECT xp, attempts, last_discovery_id, last_discovery_result_json FROM player_profile WHERE id = 1'),
    db.getAllAsync<{
      card_id: string
      state: PlayerCardState['state']
      usable_in_atelier: number
      unlocked_at: string | null
      discovered_at: string | null
      mastered_at: string | null
      source_reason: string | null
    }>('SELECT * FROM player_cards ORDER BY card_id'),
    db.getAllAsync<{
      id: number
      input_card_ids_json: string
      result_type: string
      result_card_id: string | null
      score: number | null
      created_at: string
    }>('SELECT * FROM player_attempts ORDER BY created_at DESC'),
    db.getAllAsync<{
      pack_id: string
      state: PlayerPackState['state']
      opened_at: string | null
    }>('SELECT * FROM player_packs ORDER BY pack_id'),
    db.getAllAsync<{
      constellation_id: string
      state: PlayerConstellationState['state']
      progress: number
      total: number
      reward_claimed_at: string | null
    }>('SELECT * FROM player_constellations ORDER BY constellation_id'),
  ])

  const cardStates: Record<string, PlayerCardState> = {}
  for (const row of cardRows) {
    cardStates[row.card_id] = {
      cardId: row.card_id,
      state: row.state,
      usableInAtelier: Boolean(row.usable_in_atelier),
      unlockedAt: row.unlocked_at ?? undefined,
      discoveredAt: row.discovered_at ?? undefined,
      masteredAt: row.mastered_at ?? undefined,
      sourceReason: row.source_reason ?? undefined,
    }
  }

  // Ensure starter pack cards are always present if no explicit state exists yet.
  for (const pack of catalog?.packs ?? []) {
    if (pack.id !== 'pack.starter') continue
    for (const cardId of pack.starterCardIds) {
      if (cardStates[cardId]) continue
      cardStates[cardId] = {
        cardId,
        state: 'unlocked',
        usableInAtelier: true,
        sourceReason: 'starter_pack',
      }
    }
  }

  const attemptHistory: AttemptRecord[] = attemptRows.map((row) => ({
    id: String(row.id),
    inputCardIds: JSON.parse(row.input_card_ids_json) as string[],
    resultType: row.result_type,
    resultCardId: row.result_card_id ?? undefined,
    score: row.score ?? undefined,
    createdAt: row.created_at,
  }))

  const packs: PlayerPackState[] = packRows.map((row) => ({
    packId: row.pack_id,
    state: row.state,
    openedAt: row.opened_at ?? undefined,
  }))

  const constellations: Record<string, PlayerConstellationState> = {}
  for (const row of constellationRows) {
    const progressValue = Number.isFinite(row.progress) ? row.progress : 0
    const totalValue = Number.isFinite(row.total) ? row.total : 0
    const state: PlayerConstellationState['state'] =
      row.state === 'hidden' ||
      row.state === 'revealed' ||
      row.state === 'in_progress' ||
      row.state === 'completed' ||
      row.state === 'mastered'
        ? row.state
        : 'hidden'

    const newState: PlayerConstellationState = {
      constellationId: row.constellation_id,
      state,
      progress: progressValue,
      total: totalValue,
      rewardClaimedAt: row.reward_claimed_at ?? undefined,
    }
    constellations[row.constellation_id] = newState
  }

  return {
    cardStates,
    xp: profile?.xp ?? 0,
    attempts: profile?.attempts ?? 0,
    lastDiscoveryId: profile?.last_discovery_id ?? undefined,
    lastDiscoveryResult: profile?.last_discovery_result_json
      ? (JSON.parse(profile.last_discovery_result_json) as DiscoveryResult)
      : undefined,
    claimedRewardIds: [],
    attemptHistory,
    packs,
    constellations,
  }
}

export async function saveProgress(
  progress: GameProgress,
  database?: SQLiteDatabase,
): Promise<void> {
  const db = database ?? await getDatabase()
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO player_profile (id, xp, attempts, last_discovery_id, last_discovery_result_json, updated_at)
       VALUES (1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         xp = excluded.xp,
         attempts = excluded.attempts,
         last_discovery_id = excluded.last_discovery_id,
         last_discovery_result_json = excluded.last_discovery_result_json,
         updated_at = CURRENT_TIMESTAMP`,
      progress.xp,
      progress.attempts,
      progress.lastDiscoveryId ?? null,
      progress.lastDiscoveryResult ? JSON.stringify(progress.lastDiscoveryResult) : null,
    )

    await db.runAsync('DELETE FROM player_cards')
    for (const state of Object.values(progress.cardStates)) {
      await db.runAsync(
        `INSERT INTO player_cards (
          card_id, state, usable_in_atelier, unlocked_at, discovered_at, mastered_at, source_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        state.cardId,
        state.state,
        state.usableInAtelier ? 1 : 0,
        state.unlockedAt ?? null,
        state.discoveredAt ?? null,
        state.masteredAt ?? null,
        state.sourceReason ?? null,
      )
    }

    await db.runAsync('DELETE FROM player_attempts')
    for (const attempt of progress.attemptHistory.slice().reverse()) {
      await db.runAsync(
        `INSERT INTO player_attempts (
          input_card_ids_json, result_type, result_card_id, score, created_at
        ) VALUES (?, ?, ?, ?, ?)`,
        JSON.stringify(attempt.inputCardIds),
        attempt.resultType,
        attempt.resultCardId ?? null,
        attempt.score ?? null,
        attempt.createdAt,
      )
    }

    await db.runAsync('DELETE FROM player_packs')
    for (const pack of progress.packs) {
      await db.runAsync(
        `INSERT INTO player_packs (pack_id, state, opened_at)
         VALUES (?, ?, ?)`,
        pack.packId,
        pack.state,
        pack.openedAt ?? null,
      )
    }

    await db.runAsync('DELETE FROM player_constellations')
    for (const constellation of Object.values(progress.constellations)) {
      await db.runAsync(
        `INSERT INTO player_constellations (
          constellation_id, state, progress, total, reward_claimed_at
        ) VALUES (?, ?, ?, ?, ?)`,
        constellation.constellationId,
        constellation.state,
        constellation.progress,
        constellation.total,
        constellation.rewardClaimedAt ?? null,
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
    const parsed = JSON.parse(stored) as Partial<GameProgress> & { discoveredCardIds?: string[] }
    const legacyDiscovered = parsed.discoveredCardIds ?? []

    for (const cardId of legacyDiscovered) {
      await db.runAsync(
        `INSERT INTO player_cards (card_id, state, usable_in_atelier, discovered_at, source_reason)
         VALUES (?, 'discovered', 1, CURRENT_TIMESTAMP, 'legacy_migration')
         ON CONFLICT(card_id) DO UPDATE SET
           state = 'discovered',
           usable_in_atelier = 1,
           discovered_at = CURRENT_TIMESTAMP`,
        cardId,
      )
    }

    await db.runAsync(
      `INSERT INTO player_profile (id, xp, attempts, last_discovery_id, updated_at)
       VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         xp = excluded.xp,
         attempts = excluded.attempts,
         last_discovery_id = excluded.last_discovery_id,
         updated_at = CURRENT_TIMESTAMP`,
      parsed.xp ?? 0,
      parsed.attempts ?? 0,
      parsed.lastDiscoveryId ?? null,
    )
  }

  await db.runAsync(
    `INSERT INTO app_metadata (key, value)
     VALUES (?, '1')
     ON CONFLICT(key) DO UPDATE SET value = '1', updated_at = CURRENT_TIMESTAMP`,
    LEGACY_MIGRATION_KEY,
  )

  if (stored) await AsyncStorage.removeItem(LEGACY_STORAGE_KEY)
}
