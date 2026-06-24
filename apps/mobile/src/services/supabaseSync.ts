import type {
  GameProgress,
  PlayerCardState,
  PlayerConstellationState,
} from '../game/progress'

type SyncProgressResponse = {
  acceptedMutationIds: string[]
  rejectedMutations: Array<{ clientMutationId: string; reason: string }>
  serverCursor: string
  patch: unknown
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export async function saveRemoteProgress(
  accessToken: string,
  catalogVersion: string,
  progress: GameProgress,
): Promise<SyncProgressResponse | undefined> {
  if (!SUPABASE_URL) return undefined

  const createdAt = new Date().toISOString()
  const clientMutationId = `${createdAt}-snapshot`

  const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-progress`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deviceId: 'local-device',
      mutations: [{
        clientMutationId,
        type: 'progress_snapshot',
        createdAt,
        payload: { catalogVersion, progress },
      }],
    }),
  })

  if (!response.ok) {
    throw new Error(`sync_failed_${response.status}`)
  }

  const body = await response.json() as SyncProgressResponse
  if (body.rejectedMutations.length > 0) {
    throw new Error(body.rejectedMutations[0]?.reason ?? 'sync_rejected')
  }

  return body
}

export async function fetchRemoteProgress(accessToken: string): Promise<GameProgress | undefined> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return undefined

  const [profile, cards, attempts, constellations, rewards] = await Promise.all([
    fetchTable<ProfileRow>('profiles', accessToken, 'select=xp,attempts&limit=1'),
    fetchTable<PlayerCardRow>(
      'player_cards',
      accessToken,
      'select=card_id,state,usable_in_atelier,unlocked_at,discovered_at,mastered_at,source_reason&order=card_id.asc',
    ),
    fetchTable<PlayerAttemptRow>(
      'player_attempts',
      accessToken,
      'select=client_attempt_id,input_card_ids,result_type,result_card_id,score,created_at&order=created_at.desc&limit=50',
    ),
    fetchTable<PlayerConstellationRow>(
      'player_constellations',
      accessToken,
      'select=constellation_id,state,progress,total,reward_claimed_at&order=constellation_id.asc',
    ),
    fetchTable<PlayerRewardRow>(
      'player_rewards',
      accessToken,
      'select=reward_id&order=claimed_at.asc',
    ),
  ])

  if (
    profile.length === 0 &&
    cards.length === 0 &&
    attempts.length === 0 &&
    constellations.length === 0 &&
    rewards.length === 0
  ) {
    return undefined
  }

  return {
    cardStates: Object.fromEntries(cards.map((row) => [
      row.card_id,
      {
        cardId: row.card_id,
        state: normalizeCardState(row.state),
        usableInAtelier: row.usable_in_atelier,
        unlockedAt: row.unlocked_at ?? undefined,
        discoveredAt: row.discovered_at ?? undefined,
        masteredAt: row.mastered_at ?? undefined,
        sourceReason: row.source_reason ?? undefined,
      } satisfies PlayerCardState,
    ])),
    xp: profile[0]?.xp ?? 0,
    attempts: profile[0]?.attempts ?? attempts.length,
    claimedRewardIds: rewards.map((row) => row.reward_id),
    attemptHistory: attempts.map((row) => ({
      id: row.client_attempt_id,
      inputCardIds: row.input_card_ids,
      resultType: row.result_type,
      resultCardId: row.result_card_id ?? undefined,
      score: row.score ?? undefined,
      createdAt: row.created_at,
    })),
    packs: [],
    constellations: Object.fromEntries(constellations.map((row) => [
      row.constellation_id,
      {
        constellationId: row.constellation_id,
        state: normalizeConstellationState(row.state),
        progress: row.progress,
        total: row.total,
        rewardClaimedAt: row.reward_claimed_at ?? undefined,
      } satisfies PlayerConstellationState,
    ])),
  }
}

async function fetchTable<Row>(
  table: string,
  accessToken: string,
  query: string,
): Promise<Row[]> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY ?? '',
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`remote_progress_${table}_${response.status}`)
  }

  return await response.json() as Row[]
}

function normalizeCardState(state: string): PlayerCardState['state'] {
  if (
    state === 'locked' ||
    state === 'unlocked' ||
    state === 'seen' ||
    state === 'usable_in_atelier' ||
    state === 'discovered' ||
    state === 'mastered'
  ) {
    return state
  }

  return 'locked'
}

function normalizeConstellationState(state: string): PlayerConstellationState['state'] {
  if (
    state === 'hidden' ||
    state === 'revealed' ||
    state === 'in_progress' ||
    state === 'completed' ||
    state === 'mastered'
  ) {
    return state
  }

  return 'hidden'
}

type ProfileRow = {
  xp: number
  attempts: number
}

type PlayerCardRow = {
  card_id: string
  state: string
  usable_in_atelier: boolean
  unlocked_at: string | null
  discovered_at: string | null
  mastered_at: string | null
  source_reason: string | null
}

type PlayerAttemptRow = {
  client_attempt_id: string
  input_card_ids: string[]
  result_type: string
  result_card_id: string | null
  score: number | null
  created_at: string
}

type PlayerConstellationRow = {
  constellation_id: string
  state: string
  progress: number
  total: number
  reward_claimed_at: string | null
}

type PlayerRewardRow = {
  reward_id: string
}
