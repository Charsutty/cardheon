import AsyncStorage from '@react-native-async-storage/async-storage'

const ACCESS_TOKEN_KEY = 'cardheon.supabase.access_token'

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
}

export async function getStoredSupabaseAccessToken(): Promise<string | undefined> {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY)
  return token ?? undefined
}

export async function saveSupabaseAccessToken(accessToken: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
}

export async function clearSupabaseAccessToken(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY)
}
