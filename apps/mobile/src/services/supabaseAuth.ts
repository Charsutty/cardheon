import AsyncStorage from '@react-native-async-storage/async-storage'

const SESSION_KEY = 'cardheon.supabase.session'
const ACCESS_TOKEN_KEY = 'cardheon.supabase.access_token'

export type SupabaseAuthSession = {
  accessToken: string
  refreshToken: string
  expiresAt?: number
  userId: string
  isAnonymous: boolean
}

export type SupabaseAuthState =
  | { status: 'local_only'; message?: string }
  | { status: 'authenticated'; session: SupabaseAuthSession }
  | { status: 'error'; message: string }

type AuthResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: {
    id?: string
    is_anonymous?: boolean
  }
  error?: string
  error_description?: string
  msg?: string
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
}

export async function getStoredSupabaseAccessToken(): Promise<string | undefined> {
  const session = await getStoredSupabaseSession()
  return session?.accessToken
}

export async function saveSupabaseAccessToken(accessToken: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
}

export async function clearSupabaseAccessToken(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
}

export async function restoreOrSignInAnonymously(): Promise<SupabaseAuthState> {
  if (!isSupabaseConfigured()) {
    return { status: 'local_only', message: 'Supabase non configuré' }
  }

  try {
    const stored = await getStoredSupabaseSession()
    if (stored && !isExpired(stored)) {
      return { status: 'authenticated', session: stored }
    }

    if (stored?.refreshToken) {
      const refreshed = await refreshSession(stored.refreshToken)
      if (refreshed) return { status: 'authenticated', session: refreshed }
    }

    const session = await signInAnonymously()
    return { status: 'authenticated', session }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'auth_error',
    }
  }
}

export async function signOutSupabase(): Promise<void> {
  const session = await getStoredSupabaseSession()
  if (session && isSupabaseConfigured()) {
    await fetch(`${supabaseUrl()}/auth/v1/logout`, {
      method: 'POST',
      headers: authHeaders(session.accessToken),
    }).catch(() => undefined)
  }

  await AsyncStorage.multiRemove([SESSION_KEY, ACCESS_TOKEN_KEY])
}

async function getStoredSupabaseSession(): Promise<SupabaseAuthSession | undefined> {
  const raw = await AsyncStorage.getItem(SESSION_KEY)
  if (!raw) {
    const legacyAccessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
    return legacyAccessToken
      ? {
          accessToken: legacyAccessToken,
          refreshToken: '',
          userId: 'unknown',
          isAnonymous: true,
        }
      : undefined
  }

  return JSON.parse(raw) as SupabaseAuthSession
}

async function signInAnonymously(): Promise<SupabaseAuthSession> {
  const response = await fetch(`${supabaseUrl()}/auth/v1/signup`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ data: { source: 'cardheon_mobile' } }),
  })

  return persistAuthResponse(response)
}

async function refreshSession(refreshToken: string): Promise<SupabaseAuthSession | undefined> {
  if (!refreshToken) return undefined

  const response = await fetch(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  return persistAuthResponse(response)
}

async function persistAuthResponse(response: Response): Promise<SupabaseAuthSession> {
  const body = await response.json() as AuthResponse
  if (!response.ok) {
    throw new Error(body.error_description ?? body.msg ?? body.error ?? `auth_failed_${response.status}`)
  }

  if (!body.access_token || !body.refresh_token || !body.user?.id) {
    throw new Error('auth_response_incomplete')
  }

  const session: SupabaseAuthSession = {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: body.expires_in ? Math.floor(Date.now() / 1000) + body.expires_in : undefined,
    userId: body.user.id,
    isAnonymous: body.user.is_anonymous ?? true,
  }

  await AsyncStorage.multiSet([
    [SESSION_KEY, JSON.stringify(session)],
    [ACCESS_TOKEN_KEY, session.accessToken],
  ])
  return session
}

function authHeaders(accessToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey(),
    'Content-Type': 'application/json',
  }

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  return headers
}

function isExpired(session: SupabaseAuthSession): boolean {
  if (!session.expiresAt) return false
  return session.expiresAt <= Math.floor(Date.now() / 1000) + 60
}

function supabaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('missing_supabase_url')
  return url.replace(/\/$/, '')
}

function supabaseAnonKey(): string {
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('missing_supabase_anon_key')
  return key
}
