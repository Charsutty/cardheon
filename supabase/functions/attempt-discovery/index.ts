import { handleOptions, json } from '../_shared/cors.ts'
import { getAuthenticatedUser } from '../_shared/auth.ts'
import { loadPublishedCatalog, type GameCatalog } from '../_shared/catalog.ts'
import { saveProgressSnapshot, type ProgressSnapshot } from '../_shared/progress.ts'
import { attemptCraft, attemptDiscovery, type DiscoveryResult } from '../_shared/discovery.ts'

type AttemptDiscoveryRequest = {
  inputCardIds: string[]
  clientAttemptId?: string
}

type AttemptDiscoveryResponse = {
  result: DiscoveryResult
  progress: {
    xp: number
    attempts: number
    discoveredFigureIds: string[]
  }
}

Deno.serve(async (request) => {
  const optionsResponse = handleOptions(request)
  if (optionsResponse) return optionsResponse

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const { userId, supabase } = await getAuthenticatedUser(request)

    const body = await request.json() as AttemptDiscoveryRequest
    const inputCardIds = body.inputCardIds
    const clientAttemptId = body.clientAttemptId ?? `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`

    if (!Array.isArray(inputCardIds) || inputCardIds.length === 0) {
      return json({ error: 'inputCardIds is required' }, 400)
    }

    // 1. Load published catalog
    const catalog = await loadPublishedCatalog(supabase)
    if (!catalog) {
      return json({ error: 'No published catalog available' }, 503)
    }

    // 2. Load player progress from Supabase
    const playerProgress = await loadPlayerProgress(supabase, userId, catalog)
    if (!playerProgress) {
      return json({ error: 'Failed to load player progress' }, 500)
    }

    const discoveredCardIds = Object.values(playerProgress.cardStates)
      .filter((s) => s.state === 'discovered' || s.state === 'mastered')
      .map((s) => s.cardId)

    const unlockedCardIds = Object.values(playerProgress.cardStates)
      .filter((s) => s.usableInAtelier || s.state === 'unlocked' || s.state === 'discovered' || s.state === 'mastered')
      .map((s) => s.cardId)

    // 3. Run discovery
    const craftResult = attemptCraft(catalog, inputCardIds)
    const result: DiscoveryResult = craftResult ?? attemptDiscovery(
      catalog,
      { discoveredCardIds, unlockedCardIds },
      inputCardIds,
      {
        minInputs: catalog.gameplay.discovery.minInputs,
        maxInputs: catalog.gameplay.discovery.maxInputs,
      },
    )

    // 4. Apply result to progress snapshot
    const updatedProgress = applyResultToSnapshot(playerProgress, inputCardIds, clientAttemptId, result, catalog)

    // 5. Save the snapshot on the server
    const saveResult = await saveProgressSnapshot(supabase, userId, catalog.version, updatedProgress)
    if (!saveResult.success) {
      return json({ error: `Save failed: ${saveResult.error}` }, 500)
    }

    // 6. Return result + progress summary
    const response: AttemptDiscoveryResponse = {
      result,
      progress: {
        xp: updatedProgress.xp,
        attempts: updatedProgress.attempts,
        discoveredFigureIds: Object.values(updatedProgress.cardStates)
          .filter((s) => s.state === 'discovered' || s.state === 'mastered')
          .map((s) => s.cardId),
      },
    }

    return json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error'
    return json({ error: message }, 401)
  }
})

async function loadPlayerProgress(
  supabase: ReturnType<typeof import('https://esm.sh/@supabase/supabase-js@2').createClient>,
  userId: string,
  catalog: GameCatalog,
): Promise<ProgressSnapshot | null> {
  const [profileResult, cardsResult, attemptsResult, constellationsResult, rewardsResult] = await Promise.all([
    supabase.from('profiles').select('xp,attempts').eq('user_id', userId).maybeSingle(),
    supabase.from('player_cards').select('*').eq('user_id', userId),
    supabase.from('player_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    supabase.from('player_constellations').select('*').eq('user_id', userId),
    supabase.from('player_rewards').select('reward_id').eq('user_id', userId),
  ])

  const profile = profileResult.data
  const cardRows = cardsResult.data ?? []
  const attemptRows = attemptsResult.data ?? []
  const constellationRows = constellationsResult.data ?? []
  const rewardRows = rewardsResult.data ?? []

  // If this player has no progress at all, initialize with starter pack
  if (cardRows.length === 0) {
    return initializeStarterProgress(catalog)
  }

  return {
    cardStates: Object.fromEntries(
      cardRows.map((row: Record<string, unknown>) => [
        row.card_id,
        {
          cardId: row.card_id as string,
          state: normalizeCardState(row.state as string),
          usableInAtelier: row.usable_in_atelier as boolean,
          unlockedAt: (row.unlocked_at as string) ?? undefined,
          discoveredAt: (row.discovered_at as string) ?? undefined,
          masteredAt: (row.mastered_at as string) ?? undefined,
          sourceReason: (row.source_reason as string) ?? undefined,
        },
      ]),
    ),
    xp: (profile?.xp as number) ?? 0,
    attempts: (profile?.attempts as number) ?? attemptRows.length,
    claimedRewardIds: (rewardRows as Array<{ reward_id: string }>).map((r) => r.reward_id),
    attemptHistory: (attemptRows as Array<Record<string, unknown>>).map((row) => ({
      id: row.client_attempt_id as string,
      inputCardIds: row.input_card_ids as string[],
      resultType: row.result_type as string,
      resultCardId: row.result_card_id as string ?? undefined,
      score: row.score as number ?? undefined,
      createdAt: row.created_at as string,
    })),
    constellations: Object.fromEntries(
      (constellationRows as Array<Record<string, unknown>>).map((row) => [
        row.constellation_id,
        {
          constellationId: row.constellation_id as string,
          state: normalizeConstellationState(row.state as string),
          progress: row.progress as number,
          total: row.total as number,
          rewardClaimedAt: (row.reward_claimed_at as string) ?? undefined,
        },
      ]),
    ),
  }
}

function initializeStarterProgress(catalog: GameCatalog): ProgressSnapshot {
  const starterPack = catalog.packs.find((pack) => pack.id === 'pack.starter')
  const cardStates: ProgressSnapshot['cardStates'] = {}

  if (starterPack) {
    for (const cardId of starterPack.starterCardIds) {
      cardStates[cardId] = {
        cardId,
        state: 'unlocked',
        usableInAtelier: true,
        unlockedAt: new Date().toISOString(),
        sourceReason: 'starter_pack',
      }
    }
  }

  return {
    cardStates,
    xp: 0,
    attempts: 0,
    claimedRewardIds: [],
    attemptHistory: [],
    constellations: {},
  }
}

function applyResultToSnapshot(
  progress: ProgressSnapshot,
  inputCardIds: string[],
  clientAttemptId: string,
  result: DiscoveryResult,
  catalog: GameCatalog,
): ProgressSnapshot {
  let next: ProgressSnapshot = {
    ...progress,
    cardStates: { ...progress.cardStates },
    attemptHistory: [
      {
        id: clientAttemptId,
        inputCardIds,
        resultType: result.type,
        resultCardId: result.type === 'new_figure' || result.type === 'already_discovered'
          ? result.cardId : undefined,
        score: result.type === 'new_figure' || result.type === 'already_discovered'
          ? result.score : undefined,
        createdAt: new Date().toISOString(),
      },
      ...progress.attemptHistory,
    ].slice(0, 50),
    attempts: progress.attempts + 1,
  }

  if (result.type === 'new_figure' || result.type === 'craft') {
    for (const reward of result.rewards) {
      if (reward.type === 'new_figure_card' && typeof reward.value === 'string') {
        next.cardStates[reward.value] = {
          cardId: reward.value,
          state: 'discovered',
          usableInAtelier: true,
          discoveredAt: new Date().toISOString(),
          sourceReason: 'discovery',
        }
      } else if ((reward.type === 'new_tool_card' || reward.type === 'unlock_card') && typeof reward.value === 'string') {
        const existing = next.cardStates[reward.value]
        if (!existing || existing.state === 'locked') {
          next.cardStates[reward.value] = {
            cardId: reward.value,
            state: 'unlocked',
            usableInAtelier: true,
            unlockedAt: new Date().toISOString(),
            sourceReason: 'reward',
          }
        }
      } else if (reward.type === 'xp' && typeof reward.value === 'number') {
        next.xp += reward.value
      } else if (reward.type === 'constellation_progress' || reward.type === 'constellation_unlock') {
        const meta = reward.meta as {
          constellationId: string
          discoveredCount: number
          totalCount: number
          isComplete: boolean
        } | undefined
        if (meta?.constellationId) {
          next.constellations = {
            ...next.constellations,
            [meta.constellationId]: {
              constellationId: meta.constellationId,
              state: meta.isComplete ? 'completed' : 'in_progress',
              progress: meta.discoveredCount,
              total: meta.totalCount,
            },
          }
        }
      }
    }
  }

  if (result.type === 'already_discovered') {
    for (const reward of result.rewards) {
      if (reward.type === 'xp' && typeof reward.value === 'number') {
        next.xp += reward.value
      } else if (reward.type === 'constellation_progress' || reward.type === 'constellation_unlock') {
        const meta = reward.meta as {
          constellationId: string
          discoveredCount: number
          totalCount: number
          isComplete: boolean
        } | undefined
        if (meta?.constellationId) {
          next.constellations = {
            ...next.constellations,
            [meta.constellationId]: {
              constellationId: meta.constellationId,
              state: meta.isComplete ? 'completed' : 'in_progress',
              progress: meta.discoveredCount,
              total: meta.totalCount,
            },
          }
        }
      }
    }
  }

  return next
}

function normalizeCardState(state: string): string {
  const valid = ['locked', 'unlocked', 'seen', 'usable_in_atelier', 'discovered', 'mastered']
  return valid.includes(state) ? state : 'locked'
}

function normalizeConstellationState(state: string): string {
  const valid = ['hidden', 'revealed', 'in_progress', 'completed', 'mastered']
  return valid.includes(state) ? state : 'hidden'
}
