import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type SyncMutation = {
  clientMutationId: string
  type: 'progress_snapshot'
  createdAt: string
  payload: {
    catalogVersion: string
    progress: {
      cardStates: Record<string, {
        cardId: string
        state: string
        usableInAtelier: boolean
        unlockedAt?: string
        discoveredAt?: string
        masteredAt?: string
        sourceReason?: string
      }>
      xp: number
      attempts: number
      claimedRewardIds?: string[]
      attemptHistory: Array<{
        id: string
        inputCardIds: string[]
        resultType: string
        resultCardId?: string
        score?: number
        createdAt: string
      }>
      constellations: Record<string, {
        constellationId: string
        state: string
        progress: number
        total: number
        rewardClaimedAt?: string
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
  patch: {
    cardStates: Record<string, unknown>
    xp?: number
    attempts?: number
    constellations?: Record<string, unknown>
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

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

    const progress = mutation.payload.progress
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

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        xp: progress.xp,
        attempts: progress.attempts,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (profileError) {
      rejectedMutations.push({
        clientMutationId: mutation.clientMutationId,
        reason: profileError.message,
      })
      continue
    }

    const cardRows = Object.values(progress.cardStates).map((state) => ({
      user_id: userId,
      card_id: state.cardId,
      state: state.state,
      usable_in_atelier: state.usableInAtelier,
      unlocked_at: state.unlockedAt ?? null,
      discovered_at: state.discoveredAt ?? null,
      mastered_at: state.masteredAt ?? null,
      source_reason: state.sourceReason ?? null,
      updated_at: new Date().toISOString(),
    }))
    if (cardRows.length > 0) {
      const { error: cardError } = await supabase
        .from('player_cards')
        .upsert(cardRows, { onConflict: 'user_id,card_id' })
      if (cardError) {
        rejectedMutations.push({
          clientMutationId: mutation.clientMutationId,
          reason: cardError.message,
        })
        continue
      }
    }
    const { error: staleCardError } = await deleteRowsMissingFromSnapshot(
      supabase,
      'player_cards',
      'card_id',
      userId,
      cardRows.map((row) => row.card_id),
    )
    if (staleCardError) {
      rejectedMutations.push({
        clientMutationId: mutation.clientMutationId,
        reason: staleCardError.message,
      })
      continue
    }

    const constellationRows = Object.values(progress.constellations).map((constellation) => ({
      user_id: userId,
      constellation_id: constellation.constellationId,
      state: constellation.state,
      progress: constellation.progress,
      total: constellation.total,
      reward_claimed_at: constellation.rewardClaimedAt ?? null,
      updated_at: new Date().toISOString(),
    }))
    if (constellationRows.length > 0) {
      const { error: constellationError } = await supabase
        .from('player_constellations')
        .upsert(constellationRows, { onConflict: 'user_id,constellation_id' })
      if (constellationError) {
        rejectedMutations.push({
          clientMutationId: mutation.clientMutationId,
          reason: constellationError.message,
        })
        continue
      }
    }
    const { error: staleConstellationError } = await deleteRowsMissingFromSnapshot(
      supabase,
      'player_constellations',
      'constellation_id',
      userId,
      constellationRows.map((row) => row.constellation_id),
    )
    if (staleConstellationError) {
      rejectedMutations.push({
        clientMutationId: mutation.clientMutationId,
        reason: staleConstellationError.message,
      })
      continue
    }

    const attemptRows = progress.attemptHistory.map((attempt) => ({
      user_id: userId,
      client_attempt_id: attempt.id,
      input_card_ids: attempt.inputCardIds,
      result_type: attempt.resultType,
      result_card_id: attempt.resultCardId ?? null,
      score: attempt.score ?? null,
      created_at: attempt.createdAt,
    }))
    if (attemptRows.length > 0) {
      const { error: attemptError } = await supabase
        .from('player_attempts')
        .upsert(attemptRows, { onConflict: 'user_id,client_attempt_id' })
      if (attemptError) {
        rejectedMutations.push({
          clientMutationId: mutation.clientMutationId,
          reason: attemptError.message,
        })
        continue
      }
    }
    const { error: staleAttemptError } = await deleteRowsMissingFromSnapshot(
      supabase,
      'player_attempts',
      'client_attempt_id',
      userId,
      attemptRows.map((row) => row.client_attempt_id),
    )
    if (staleAttemptError) {
      rejectedMutations.push({
        clientMutationId: mutation.clientMutationId,
        reason: staleAttemptError.message,
      })
      continue
    }

    const rewardRows = (progress.claimedRewardIds ?? []).map((rewardId) => ({
      user_id: userId,
      reward_id: rewardId,
      reward_type: 'unknown',
      reward_value: rewardId,
    }))
    if (rewardRows.length > 0) {
      const { error: rewardError } = await supabase
        .from('player_rewards')
        .upsert(rewardRows, { onConflict: 'user_id,reward_id' })
      if (rewardError) {
        rejectedMutations.push({
          clientMutationId: mutation.clientMutationId,
          reason: rewardError.message,
        })
        continue
      }
    }
    const { error: staleRewardError } = await deleteRowsMissingFromSnapshot(
      supabase,
      'player_rewards',
      'reward_id',
      userId,
      rewardRows.map((row) => row.reward_id),
    )
    if (staleRewardError) {
      rejectedMutations.push({
        clientMutationId: mutation.clientMutationId,
        reason: staleRewardError.message,
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

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders })
}

async function deleteRowsMissingFromSnapshot(
  supabase: ReturnType<typeof createClient>,
  table: string,
  idColumn: string,
  userId: string,
  ids: string[],
) {
  let query = supabase
    .from(table)
    .delete()
    .eq('user_id', userId)

  if (ids.length > 0) {
    query = query.not(idColumn, 'in', toPostgrestTuple(ids))
  }

  return await query
}

function toPostgrestTuple(values: string[]): string {
  return `(${values.map((value) => `"${value.replace(/"/g, '\\"')}"`).join(',')})`
}
