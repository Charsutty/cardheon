import { corsHeaders, handleOptions, json } from '../_shared/cors.ts'
import { saveProgressSnapshot } from '../_shared/progress.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

type SyncMutation = {
  clientMutationId: string
  type: 'progress_snapshot'
  createdAt: string
  payload: {
    catalogVersion: string
    progress: {
      cardStates: Record<string, {
        cardId: string; state: string; usableInAtelier: boolean
        unlockedAt?: string; discoveredAt?: string; masteredAt?: string; sourceReason?: string
      }>
      xp: number; attempts: number
      claimedRewardIds?: string[]
      attemptHistory: Array<{
        id: string; inputCardIds: string[]; resultType: string
        resultCardId?: string; score?: number; createdAt: string
      }>
      constellations: Record<string, {
        constellationId: string; state: string; progress: number; total: number; rewardClaimedAt?: string
      }>
    }
  }
}

type SyncProgressRequest = {
  deviceId: string
  lastServerCursor?: string
  mutations: SyncMutation[]
}

type SyncProgressResponse = {
  acceptedMutationIds: string[]
  rejectedMutations: Array<{ clientMutationId: string; reason: string }>
  serverCursor: string
  patch: { cardStates: Record<string, unknown> }
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: 'Supabase environment is not configured' }, 500)
  }

  const authorization = request.headers.get('Authorization')
  if (!authorization) {
    return json({ error: 'Missing Authorization header' }, 401)
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return json({ error: 'Invalid user token' }, 401)
  }

  const userId = userData.user.id
  const body = await request.json() as SyncProgressRequest
  const acceptedMutationIds: string[] = []
  const rejectedMutations: SyncProgressResponse['rejectedMutations'] = []

  for (const mutation of body.mutations ?? []) {
    if (!mutation.clientMutationId || mutation.type !== 'progress_snapshot') {
      rejectedMutations.push({
        clientMutationId: mutation.clientMutationId,
        reason: 'unsupported_mutation',
      })
      continue
    }

    const { error: syncEventError } = await supabase
      .from('sync_events')
      .upsert({
        user_id: userId,
        client_mutation_id: mutation.clientMutationId,
        mutation_type: mutation.type,
        payload: mutation.payload,
      }, { onConflict: 'user_id,client_mutation_id' })

    if (syncEventError) {
      rejectedMutations.push({
        clientMutationId: mutation.clientMutationId,
        reason: syncEventError.message,
      })
      continue
    }

    const result = await saveProgressSnapshot(
      supabase,
      userId,
      mutation.payload.catalogVersion,
      mutation.payload.progress,
    )

    if (!result.success) {
      rejectedMutations.push({
        clientMutationId: mutation.clientMutationId,
        reason: result.error ?? 'save_failed',
      })
      continue
    }

    acceptedMutationIds.push(mutation.clientMutationId)
  }

  const response: SyncProgressResponse = {
    acceptedMutationIds,
    rejectedMutations,
    serverCursor: new Date().toISOString(),
    patch: { cardStates: {} },
  }

  return json(response)
})
