import AsyncStorage from '@react-native-async-storage/async-storage'
import { initialProgress, type GameProgress } from '../game/progress'

const STORAGE_KEY = 'cardheon.progress.v1'

export async function loadProgress(): Promise<GameProgress> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY)
  if (!stored) return initialProgress

  const parsed = JSON.parse(stored) as Partial<GameProgress>
  return {
    discoveredCardIds: parsed.discoveredCardIds ?? [],
    xp: parsed.xp ?? 0,
    attempts: parsed.attempts ?? 0,
    lastDiscoveryId: parsed.lastDiscoveryId,
  }
}

export function saveProgress(progress: GameProgress) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}
