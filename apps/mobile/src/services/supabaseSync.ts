import {
  listPendingSyncMutations,
  markSyncMutationFailed,
  markSyncMutationsSynced,
} from '../db/syncRepository'

type SyncProgressResponse = {
  acceptedMutationIds: string[]
  rejectedMutations: Array<{ clientMutationId: string; reason: string }>
  serverCursor: string
  patch: unknown
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL

export async function syncPendingProgress(accessToken: string): Promise<SyncProgressResponse | undefined> {
  if (!SUPABASE_URL) return undefined

  const mutations = await listPendingSyncMutations()
  if (mutations.length === 0) return undefined

  const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-progress`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deviceId: 'local-device',
      mutations: mutations.map((mutation) => ({
        clientMutationId: mutation.clientMutationId,
        type: mutation.type,
        createdAt: mutation.createdAt,
        payload: mutation.payload,
      })),
    }),
  })

  if (!response.ok) {
    const message = `sync_failed_${response.status}`
    await Promise.all(mutations.map((mutation) => markSyncMutationFailed(mutation.clientMutationId, message)))
    throw new Error(message)
  }

  const body = await response.json() as SyncProgressResponse
  await markSyncMutationsSynced(body.acceptedMutationIds)
  for (const rejected of body.rejectedMutations) {
    await markSyncMutationFailed(rejected.clientMutationId, rejected.reason)
  }

  return body
}
