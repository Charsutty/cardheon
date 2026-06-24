import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type ProgressSnapshot = {
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

export type SaveResult = {
  success: boolean
  error?: string
}

export async function saveProgressSnapshot(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  catalogVersion: string,
  progress: ProgressSnapshot,
): Promise<SaveResult> {
  // 1. Upsert profile
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      user_id: userId,
      xp: progress.xp,
      attempts: progress.attempts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (profileError) return { success: false, error: profileError.message }

  // 2. Upsert cards
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
    if (cardError) return { success: false, error: cardError.message }
  }

  // 3. Delete stale cards
  const { error: staleCardError } = await deleteRowsMissingFromSnapshot(
    supabase, 'player_cards', 'card_id', userId,
    cardRows.map((row) => row.card_id),
  )
  if (staleCardError) return { success: false, error: staleCardError.message }

  // 4. Upsert constellations
  const constellationRows = Object.values(progress.constellations).map((c) => ({
    user_id: userId,
    constellation_id: c.constellationId,
    state: c.state,
    progress: c.progress,
    total: c.total,
    reward_claimed_at: c.rewardClaimedAt ?? null,
    updated_at: new Date().toISOString(),
  }))

  if (constellationRows.length > 0) {
    const { error: constellationError } = await supabase
      .from('player_constellations')
      .upsert(constellationRows, { onConflict: 'user_id,constellation_id' })
    if (constellationError) return { success: false, error: constellationError.message }
  }

  // 5. Delete stale constellations
  const { error: staleConstellationError } = await deleteRowsMissingFromSnapshot(
    supabase, 'player_constellations', 'constellation_id', userId,
    constellationRows.map((row) => row.constellation_id),
  )
  if (staleConstellationError) return { success: false, error: staleConstellationError.message }

  // 6. Upsert attempts
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
    if (attemptError) return { success: false, error: attemptError.message }
  }

  // 7. Delete stale attempts
  const { error: staleAttemptError } = await deleteRowsMissingFromSnapshot(
    supabase, 'player_attempts', 'client_attempt_id', userId,
    attemptRows.map((row) => row.client_attempt_id),
  )
  if (staleAttemptError) return { success: false, error: staleAttemptError.message }

  // 8. Upsert rewards
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
    if (rewardError) return { success: false, error: rewardError.message }
  }

  // 9. Delete stale rewards
  const { error: staleRewardError } = await deleteRowsMissingFromSnapshot(
    supabase, 'player_rewards', 'reward_id', userId,
    rewardRows.map((row) => row.reward_id),
  )
  if (staleRewardError) return { success: false, error: staleRewardError.message }

  return { success: true }
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
