import type { DiscoveryResult } from '@cardheon/game-engine'

type AttemptDiscoveryResponse = {
  result: DiscoveryResult
  progress: {
    xp: number
    attempts: number
    discoveredFigureIds: string[]
  }
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL

export async function callAttemptDiscovery(
  accessToken: string,
  inputCardIds: string[],
  clientAttemptId?: string,
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
      clientAttemptId,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error ?? `attempt_discovery_failed_${response.status}`)
  }

  return await response.json() as AttemptDiscoveryResponse
}
