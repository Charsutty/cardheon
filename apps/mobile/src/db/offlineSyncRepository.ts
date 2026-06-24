import type { SQLiteDatabase } from 'expo-sqlite'
import type { GameProgress } from '../game/progress'
import { getDatabase } from './database'

// Reserved for future offline-first sync. Not used by the connected-first MVP flow.

export type PendingSyncMutation = {
  clientMutationId: string
  type: 'progress_snapshot'
  createdAt: string
  payload: {
    catalogVersion: string
    progress: GameProgress
  }
}

export async function enqueueProgressSnapshot(
  catalogVersion: string,
  progress: GameProgress,
  database?: SQLiteDatabase,
): Promise<void> {
  const db = database ?? await getDatabase()
  const createdAt = new Date().toISOString()
  const clientMutationId = `${createdAt}-${Math.random().toString(36).slice(2, 10)}`
  const mutation: PendingSyncMutation = {
    clientMutationId,
    type: 'progress_snapshot',
    createdAt,
    payload: { catalogVersion, progress },
  }

  await db.runAsync(
    `INSERT INTO sync_events (client_mutation_id, mutation_type, payload_json, created_at)
     VALUES (?, ?, ?, ?)`,
    mutation.clientMutationId,
    mutation.type,
    JSON.stringify(mutation.payload),
    mutation.createdAt,
  )
}

export async function listPendingSyncMutations(
  limit = 25,
  database?: SQLiteDatabase,
): Promise<PendingSyncMutation[]> {
  const db = database ?? await getDatabase()
  const rows = await db.getAllAsync<{
    client_mutation_id: string
    mutation_type: PendingSyncMutation['type']
    payload_json: string
    created_at: string
  }>(
    `SELECT client_mutation_id, mutation_type, payload_json, created_at
     FROM sync_events
     WHERE synced_at IS NULL
     ORDER BY created_at ASC
     LIMIT ?`,
    limit,
  )

  return rows.map((row) => ({
    clientMutationId: row.client_mutation_id,
    type: row.mutation_type,
    createdAt: row.created_at,
    payload: JSON.parse(row.payload_json) as PendingSyncMutation['payload'],
  }))
}

export async function countPendingSyncMutations(database?: SQLiteDatabase): Promise<number> {
  const db = database ?? await getDatabase()
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count
     FROM sync_events
     WHERE synced_at IS NULL`,
  )

  return row?.count ?? 0
}

export async function markSyncMutationsSynced(
  clientMutationIds: string[],
  database?: SQLiteDatabase,
): Promise<void> {
  if (clientMutationIds.length === 0) return
  const db = database ?? await getDatabase()
  await db.withTransactionAsync(async () => {
    for (const clientMutationId of clientMutationIds) {
      await db.runAsync(
        `UPDATE sync_events
         SET synced_at = CURRENT_TIMESTAMP, last_error = NULL
         WHERE client_mutation_id = ?`,
        clientMutationId,
      )
    }
  })
}

export async function markSyncMutationFailed(
  clientMutationId: string,
  error: string,
  database?: SQLiteDatabase,
): Promise<void> {
  const db = database ?? await getDatabase()
  await db.runAsync(
    `UPDATE sync_events
     SET retry_count = retry_count + 1, last_error = ?
     WHERE client_mutation_id = ?`,
    error,
    clientMutationId,
  )
}
