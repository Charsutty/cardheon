import {
  attemptCraft,
  attemptDiscovery,
  type Card,
  type DiscoveryResult,
  type GameCatalog,
  type Reward,
} from '@cardheon/game-engine'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { loadCatalog, type CardConnection } from '../db/catalogRepository'
import { countPendingSyncMutations, enqueueProgressSnapshot } from '../db/syncRepository'
import { bundledCatalog } from '../game/catalog'
import {
  addXp,
  type AttemptRecord,
  createCardState,
  discoverCard,
  getDiscoveredFigureIds,
  getUnlockedCardIds,
  initialProgress,
  recordAttempt,
  type GameProgress,
  type PlayerCardState,
  type PlayerConstellationState,
} from '../game/progress'
import { loadProgress, saveProgress } from '../services/progressStorage'
import { fetchCatalogManifest, type CatalogManifest } from '../services/catalogManifest'
import { fetchRemoteCatalog } from '../services/remoteCatalog'
import { restoreOrSignInAnonymously, signOutSupabase, type SupabaseAuthState } from '../services/supabaseAuth'
import { fetchRemoteProgress, syncPendingProgress } from '../services/supabaseSync'

export type CatalogSyncState = {
  status: 'local' | 'checking' | 'current' | 'updated' | 'remote_available' | 'error'
  localVersion: string
  remoteVersion?: string
  checksum?: string
  publishedAt?: string
  message?: string
}

export type ProgressSyncState = {
  status: 'local_only' | 'pending' | 'syncing' | 'synced' | 'error'
  pendingMutations: number
  lastSyncedAt?: string
  message?: string
}

type GameContextValue = {
  isReady: boolean
  progress: GameProgress
  catalog: GameCatalog
  catalogSync: CatalogSyncState
  auth: SupabaseAuthState | { status: 'loading' }
  progressSync: ProgressSyncState
  figureCards: Card[]
  toolCards: Card[]
  playableCards: Card[]
  getCard: (cardId: string) => Card | undefined
  getCardState: (cardId: string) => PlayerCardState
  getConnections: (cardId: string) => Promise<CardConnection[]>
  refreshCatalog: () => Promise<void>
  syncNow: () => Promise<void>
  restoreFromCloud: () => Promise<void>
  signOut: () => Promise<void>
  discover: (inputCardIds: string[]) => DiscoveryResult
  resetProgress: () => void
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<GameCatalog>(bundledCatalog)
  const [progress, setProgress] = useState<GameProgress>(() => initializeProgressWithStarter(bundledCatalog, initialProgress))
  const [isReady, setIsReady] = useState(false)
  const [auth, setAuth] = useState<SupabaseAuthState | { status: 'loading' }>({ status: 'loading' })
  const [progressSync, setProgressSync] = useState<ProgressSyncState>({
    status: 'local_only',
    pendingMutations: 0,
  })
  const didLoadProgress = useRef(false)
  const [catalogSync, setCatalogSync] = useState<CatalogSyncState>(() => ({
    status: 'local',
    localVersion: bundledCatalog.version,
  }))

  useEffect(() => {
    Promise.all([loadCatalog(), loadProgress(catalog)])
      .then(([storedCatalog, storedProgress]) => {
        setCatalog(storedCatalog)
        setProgress(initializeProgressWithStarter(storedCatalog, storedProgress))
        setCatalogSync({ status: 'local', localVersion: storedCatalog.version })
        didLoadProgress.current = true
      })
      .catch(() => {
        // Le catalogue embarqué garde le jeu utilisable si SQLite est indisponible.
      })
      .finally(() => {
        didLoadProgress.current = true
        setIsReady(true)
      })
  }, [])

  useEffect(() => {
    if (!isReady) return
    let isActive = true

    restoreOrSignInAnonymously()
      .then((state) => {
        if (!isActive) return
        setAuth(state)
        setProgressSync((current) => ({
          ...current,
          status: state.status === 'authenticated' ? current.status : 'local_only',
          message: state.status === 'error' ? state.message : state.status === 'local_only' ? state.message : undefined,
        }))
      })
      .catch((error) => {
        if (!isActive) return
        setAuth({ status: 'error', message: error instanceof Error ? error.message : 'auth_error' })
      })

    return () => {
      isActive = false
    }
  }, [isReady])

  useEffect(() => {
    if (!isReady) return
    let isActive = true

    async function reconcileCatalog() {
      setCatalogSync((current) => ({ ...current, status: 'checking', localVersion: catalog.version }))

      try {
        const manifest = await fetchCatalogManifest()
        if (!isActive) return
        if (!manifest) {
          setCatalogSync({ status: 'local', localVersion: catalog.version })
          return
        }

        if (manifest.catalogVersion === catalog.version) {
          setCatalogSync(toCurrentCatalogSync(catalog.version, manifest))
          return
        }

        setCatalogSync({
          status: 'remote_available',
          localVersion: catalog.version,
          remoteVersion: manifest.catalogVersion,
          checksum: manifest.catalogChecksum,
          publishedAt: manifest.publishedAt,
        })

        const remoteCatalog = await fetchRemoteCatalog(manifest, catalog.gameplay)
        if (!isActive || !remoteCatalog) return

        setCatalog(remoteCatalog)
        setProgress((current) => initializeProgressWithStarter(remoteCatalog, current))
        setCatalogSync({
          status: 'updated',
          localVersion: remoteCatalog.version,
          remoteVersion: manifest.catalogVersion,
          checksum: manifest.catalogChecksum,
          publishedAt: manifest.publishedAt,
        })
      } catch (error) {
        if (!isActive) return
        setCatalogSync({
          status: 'error',
          localVersion: catalog.version,
          message: error instanceof Error ? error.message : 'catalog_sync_error',
        })
      }
    }

    reconcileCatalog()
    return () => {
      isActive = false
    }
  }, [catalog.gameplay, catalog.version, isReady])

  useEffect(() => {
    if (!isReady) return
    if (!didLoadProgress.current) return
    saveProgress(progress)
      .then(() => enqueueProgressSnapshot(catalog.version, progress))
      .then(() => refreshPendingSyncCount())
      .then((pendingMutations) => {
        setProgressSync((current) => ({
          ...current,
          status: auth.status === 'authenticated' ? 'pending' : 'local_only',
          pendingMutations,
        }))
      })
      .catch(() => undefined)
  }, [auth.status, catalog.version, isReady, progress])

  useEffect(() => {
    if (!isReady || auth.status !== 'authenticated') return
    const timeout = setTimeout(() => {
      syncNow().catch(() => undefined)
    }, 2000)

    return () => clearTimeout(timeout)
  }, [auth, isReady, progress])

  const discoveredCardIds = useMemo(() => getDiscoveredFigureIds(progress), [progress])
  const unlockedCardIds = useMemo(() => getUnlockedCardIds(progress), [progress])

  const discover = useCallback(
    (inputCardIds: string[]) => {
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

      setProgress((current) => {
        let next = recordAttempt(
          current,
          inputCardIds,
          result.type,
          result.type === 'new_figure' || result.type === 'already_discovered' ? result.cardId : undefined,
          result.type === 'new_figure' || result.type === 'already_discovered' ? result.score : undefined,
        )

        if (result.type === 'new_figure') {
          next = applyRewards(next, result.rewards)
          next = { ...next, lastDiscoveryId: result.cardId, lastDiscoveryResult: result }
        } else if (result.type === 'craft') {
          next = applyRewards(next, result.rewards)
          next = { ...next, lastDiscoveryResult: result }
        }

        return next
      })

      return result
    },
    [catalog, discoveredCardIds, unlockedCardIds],
  )

  const resetProgress = useCallback(() => {
    setProgress(initializeProgressWithStarter(catalog, initialProgress))
  }, [catalog])

  const figureCards = useMemo(
    () => catalog.cards.filter((card) => card.kind === 'figure'),
    [catalog.cards],
  )
  const toolCards = useMemo(
    () => catalog.cards.filter((card) => card.kind !== 'figure'),
    [catalog.cards],
  )
  const playableCards = useMemo(
    () => catalog.cards.filter((card) => unlockedCardIds.includes(card.id)),
    [catalog.cards, unlockedCardIds],
  )
  const getCard = useCallback(
    (cardId: string) => catalog.cards.find((card) => card.id === cardId),
    [catalog.cards],
  )
  const getConnections = useCallback(
    async (cardId: string) => getCatalogConnections(catalog, cardId),
    [catalog],
  )
  const getCardState = useCallback(
    (cardId: string) => progress.cardStates[cardId] ?? createCardState(cardId, 'locked'),
    [progress.cardStates],
  )
  const refreshCatalog = useCallback(async () => {
    const newCatalog = await loadCatalog()
    setCatalog(newCatalog)
    setProgress((current) => initializeProgressWithStarter(newCatalog, current))
    setCatalogSync({ status: 'local', localVersion: newCatalog.version })
  }, [])

  const syncNow = useCallback(async () => {
    if (auth.status !== 'authenticated') {
      const pendingMutations = await refreshPendingSyncCount()
      setProgressSync((current) => ({
        ...current,
        status: 'local_only',
        pendingMutations,
      }))
      return
    }

    const pendingMutations = await refreshPendingSyncCount()
    if (pendingMutations === 0) {
      setProgressSync((current) => ({ ...current, status: 'synced', pendingMutations: 0 }))
      return
    }

    setProgressSync((current) => ({ ...current, status: 'syncing', pendingMutations }))
    try {
      await syncPendingProgress(auth.session.accessToken)
      const remaining = await refreshPendingSyncCount()
      setProgressSync({
        status: remaining === 0 ? 'synced' : 'pending',
        pendingMutations: remaining,
        lastSyncedAt: new Date().toISOString(),
      })
    } catch (error) {
      const remaining = await refreshPendingSyncCount()
      setProgressSync({
        status: 'error',
        pendingMutations: remaining,
        message: error instanceof Error ? error.message : 'sync_error',
      })
    }
  }, [auth])

  const restoreFromCloud = useCallback(async () => {
    if (auth.status !== 'authenticated') {
      setProgressSync((current) => ({
        ...current,
        status: 'local_only',
        message: 'Connexion cloud requise',
      }))
      return
    }

    setProgressSync((current) => ({ ...current, status: 'syncing' }))
    try {
      const remoteProgress = await fetchRemoteProgress(auth.session.accessToken)
      if (!remoteProgress) {
        const pendingMutations = await refreshPendingSyncCount()
        setProgressSync({
          status: pendingMutations > 0 ? 'pending' : 'synced',
          pendingMutations,
          message: 'Aucune progression cloud à restaurer',
        })
        return
      }

      setProgress((current) => initializeProgressWithStarter(catalog, mergeProgress(current, remoteProgress)))
      const pendingMutations = await refreshPendingSyncCount()
      setProgressSync({
        status: pendingMutations > 0 ? 'pending' : 'synced',
        pendingMutations,
        lastSyncedAt: new Date().toISOString(),
      })
    } catch (error) {
      const pendingMutations = await refreshPendingSyncCount()
      setProgressSync({
        status: 'error',
        pendingMutations,
        message: error instanceof Error ? error.message : 'restore_error',
      })
    }
  }, [auth, catalog])

  const signOut = useCallback(async () => {
    await signOutSupabase()
    setAuth({ status: 'local_only', message: 'Session déconnectée' })
    const pendingMutations = await refreshPendingSyncCount()
    setProgressSync({ status: 'local_only', pendingMutations, message: 'Session déconnectée' })
  }, [])

  const value = useMemo(
    () => ({
      isReady,
      progress,
      catalog,
      catalogSync,
      auth,
      progressSync,
      figureCards,
      toolCards,
      playableCards,
      getCard,
      getCardState,
      getConnections,
      refreshCatalog,
      syncNow,
      restoreFromCloud,
      signOut,
      discover,
      resetProgress,
    }),
    [
      catalog,
      catalogSync,
      discover,
      figureCards,
      getCard,
      getConnections,
      getCardState,
      isReady,
      playableCards,
      progress,
      progressSync,
      refreshCatalog,
      resetProgress,
      restoreFromCloud,
      signOut,
      syncNow,
      toolCards,
      auth,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

function mergeProgress(local: GameProgress, remote: GameProgress): GameProgress {
  const cardIds = new Set([
    ...Object.keys(local.cardStates),
    ...Object.keys(remote.cardStates),
  ])
  const cardStates: Record<string, PlayerCardState> = {}
  for (const cardId of cardIds) {
    const localState = local.cardStates[cardId]
    const remoteState = remote.cardStates[cardId]
    cardStates[cardId] = chooseBestCardState(localState, remoteState)
  }

  const constellationIds = new Set([
    ...Object.keys(local.constellations),
    ...Object.keys(remote.constellations),
  ])
  const constellations: Record<string, PlayerConstellationState> = {}
  for (const constellationId of constellationIds) {
    const localState = local.constellations[constellationId]
    const remoteState = remote.constellations[constellationId]
    constellations[constellationId] = chooseBestConstellationState(localState, remoteState)
  }

  const attemptsById = new Map<string, AttemptRecord>()
  for (const attempt of [...remote.attemptHistory, ...local.attemptHistory]) {
    attemptsById.set(attempt.id, attempt)
  }

  return {
    ...local,
    cardStates,
    xp: Math.max(local.xp, remote.xp),
    attempts: Math.max(local.attempts, remote.attempts),
    claimedRewardIds: Array.from(new Set([...local.claimedRewardIds, ...remote.claimedRewardIds])),
    attemptHistory: Array.from(attemptsById.values())
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 50),
    packs: mergePacks(local.packs, remote.packs),
    constellations,
  }
}

function chooseBestCardState(
  local?: PlayerCardState,
  remote?: PlayerCardState,
): PlayerCardState {
  if (!local) return remote ?? createCardState('unknown', 'locked')
  if (!remote) return local

  const localRank = cardStateRank(local.state)
  const remoteRank = cardStateRank(remote.state)
  const winner = remoteRank > localRank ? remote : local

  return {
    ...winner,
    usableInAtelier: local.usableInAtelier || remote.usableInAtelier || cardStateRank(winner.state) >= cardStateRank('unlocked'),
    unlockedAt: earliestDate(local.unlockedAt, remote.unlockedAt),
    discoveredAt: earliestDate(local.discoveredAt, remote.discoveredAt),
    masteredAt: earliestDate(local.masteredAt, remote.masteredAt),
    sourceReason: winner.sourceReason ?? local.sourceReason ?? remote.sourceReason,
  }
}

function chooseBestConstellationState(
  local?: PlayerConstellationState,
  remote?: PlayerConstellationState,
): PlayerConstellationState {
  if (!local) return remote ?? { constellationId: 'unknown', state: 'hidden', progress: 0, total: 0 }
  if (!remote) return local

  const localRank = constellationStateRank(local.state)
  const remoteRank = constellationStateRank(remote.state)
  const winner = remoteRank > localRank ? remote : local

  return {
    ...winner,
    progress: Math.max(local.progress, remote.progress),
    total: Math.max(local.total, remote.total),
    rewardClaimedAt: earliestDate(local.rewardClaimedAt, remote.rewardClaimedAt),
  }
}

function mergePacks(local: GameProgress['packs'], remote: GameProgress['packs']): GameProgress['packs'] {
  const byId = new Map(local.map((pack) => [pack.packId, pack]))
  for (const remotePack of remote) {
    const localPack = byId.get(remotePack.packId)
    if (!localPack || packStateRank(remotePack.state) > packStateRank(localPack.state)) {
      byId.set(remotePack.packId, remotePack)
    }
  }

  return Array.from(byId.values())
}

function cardStateRank(state: PlayerCardState['state']): number {
  return {
    locked: 0,
    seen: 1,
    unlocked: 2,
    usable_in_atelier: 2,
    discovered: 3,
    mastered: 4,
  }[state]
}

function constellationStateRank(state: PlayerConstellationState['state']): number {
  return {
    hidden: 0,
    revealed: 1,
    in_progress: 2,
    completed: 3,
    mastered: 4,
  }[state]
}

function packStateRank(state: GameProgress['packs'][number]['state']): number {
  return {
    locked: 0,
    unopened: 1,
    opened: 2,
  }[state]
}

function earliestDate(left?: string, right?: string): string | undefined {
  if (!left) return right
  if (!right) return left
  return left <= right ? left : right
}

async function refreshPendingSyncCount(): Promise<number> {
  const pendingMutations = await countPendingSyncMutations()
  return pendingMutations
}

function toCurrentCatalogSync(localVersion: string, manifest: CatalogManifest): CatalogSyncState {
  return {
    status: 'current',
    localVersion,
    remoteVersion: manifest.catalogVersion,
    checksum: manifest.catalogChecksum,
    publishedAt: manifest.publishedAt,
  }
}

export function useGame() {
  const value = useContext(GameContext)
  if (!value) throw new Error('useGame must be used inside GameProvider')
  return value
}

function initializeProgressWithStarter(catalog: GameCatalog, base: GameProgress): GameProgress {
  const starterPack = catalog.packs.find((pack) => pack.id === 'pack.starter')
  if (!starterPack) return base

  const cardStates = { ...base.cardStates }
  for (const cardId of starterPack.starterCardIds) {
    const existing = cardStates[cardId]
    if (existing && existing.state !== 'locked') continue
    cardStates[cardId] = {
      ...(existing ?? createCardState(cardId, 'locked')),
      state: 'unlocked',
      usableInAtelier: true,
      unlockedAt: existing?.unlockedAt ?? new Date().toISOString(),
      sourceReason: existing?.sourceReason ?? 'starter_pack',
    }
  }

  return { ...base, cardStates }
}

function applyRewards(progress: GameProgress, rewards: Reward[]): GameProgress {
  let next = progress

  for (const reward of rewards) {
    switch (reward.type) {
      case 'xp': {
        if (typeof reward.value === 'number') {
          next = addXp(next, reward.value)
        }
        break
      }
      case 'new_figure_card': {
        if (typeof reward.value === 'string') {
          next = discoverCard(next, reward.value, 'discovery')
        }
        break
      }
      case 'new_tool_card':
      case 'unlock_card': {
        if (typeof reward.value === 'string') {
          const existing = next.cardStates[reward.value]
          if (!existing || existing.state === 'locked') {
            next = {
              ...next,
              cardStates: {
                ...next.cardStates,
                [reward.value]: {
                  ...(existing ?? createCardState(reward.value, 'locked')),
                  state: 'unlocked',
                  usableInAtelier: true,
                  unlockedAt: new Date().toISOString(),
                  sourceReason: 'reward',
                },
              },
            }
          }
        }
        break
      }
      case 'constellation_progress':
      case 'constellation_unlock': {
        if (reward.meta && typeof reward.meta.constellationId === 'string') {
          const { constellationId, discoveredCount, totalCount, isComplete } = reward.meta as {
            constellationId: string
            discoveredCount: number
            totalCount: number
            isComplete: boolean
          }
          next = {
            ...next,
            constellations: {
              ...next.constellations,
              [constellationId]: {
                constellationId,
                state: isComplete ? 'completed' : 'in_progress',
                progress: discoveredCount,
                total: totalCount,
              },
            },
          }
        }
        break
      }
      default:
        break
    }
  }

  return next
}

function getCatalogConnections(catalog: GameCatalog, cardId: string): CardConnection[] {
  const cardsById = new Map(catalog.cards.map((card) => [card.id, card]))

  return catalog.relationships.flatMap<CardConnection>((relationship) => {
    if (relationship.source === cardId) {
      const card = cardsById.get(relationship.target)
      return card
        ? [{ direction: 'outgoing', predicate: relationship.predicate, weight: relationship.weight, card }]
        : []
    }
    if (relationship.target === cardId) {
      const card = cardsById.get(relationship.source)
      return card
        ? [{ direction: 'incoming', predicate: relationship.predicate, weight: relationship.weight, card }]
        : []
    }
    return []
  })
}
