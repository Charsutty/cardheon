import type { DiscoveryResult } from '@cardheon/game-engine'
import type { GameProgress } from '../game/progress'

type AttemptDiscoveryResponse = {
  result: DiscoveryResult
  progressSnapshot: GameProgress
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL

export async function callAttemptDiscovery(
  accessToken: string,
  inputCardIds: string[],
): Promise<AttemptDiscoveryResponse> {
  if (!SUPABASE_URL) {
    throw new Error('Supabase URL not configured')
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/attempt-discovery`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputCardIds,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `attempt_discovery_failed_${response.status}`)
  }

  return await response.json() as AttemptDiscoveryResponse
}
