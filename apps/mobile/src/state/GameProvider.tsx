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
import { bundledCatalog } from '../game/catalog'
import {
  addXp,
  createCardState,
  discoverCard,
  getDiscoveredFigureIds,
  getUnlockedCardIds,
  initialProgress,
  recordAttempt,
  type GameProgress,
  type PlayerCardState,
} from '../game/progress'
import { loadProgress, saveProgress } from '../services/progressStorage'
import { fetchCatalogManifest, type CatalogManifest } from '../services/catalogManifest'
import { fetchRemoteCatalog } from '../services/remoteCatalog'
import { restoreOrSignInAnonymously, signOutSupabase, type SupabaseAuthState } from '../services/supabaseAuth'
import { fetchRemoteProgress, saveRemoteProgress } from '../services/supabaseSync'
import { callAttemptDiscovery } from '../services/serverDiscovery'

export type CatalogSyncState = {
  status: 'local' | 'checking' | 'current' | 'updated' | 'remote_available' | 'error'
  localVersion: string
  remoteVersion?: string
  checksum?: string
  publishedAt?: string
  message?: string
}

export type ProgressSyncState = {
  status: 'local_only' | 'loading' | 'saving' | 'saved' | 'error'
  lastSyncedAt?: string
  message?: string
}

export type DiscoveryLoadingState = {
  status: 'idle' | 'submitting' | 'success' | 'error'
  message?: string
}

type GameContextValue = {
  isReady: boolean
  progress: GameProgress
  catalog: GameCatalog
  catalogSync: CatalogSyncState
  auth: SupabaseAuthState | { status: 'loading' }
  progressSync: ProgressSyncState
  discoveryLoading: DiscoveryLoadingState
  figureCards: Card[]
  toolCards: Card[]
  playableCards: Card[]
  getCard: (cardId: string) => Card | undefined
  getCardState: (cardId: string) => PlayerCardState
  getConnections: (cardId: string) => Promise<CardConnection[]>
  refreshCatalog: () => Promise<void>
  saveToCloud: () => Promise<void>
  signOut: () => Promise<void>
  discover: (inputCardIds: string[]) => Promise<DiscoveryResult>
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
  })
  const [discoveryLoading, setDiscoveryLoading] = useState<DiscoveryLoadingState>({
    status: 'idle',
  })
  const didLoadProgress = useRef(false)
  const didLoadRemoteProgress = useRef(false)
  const progressRef = useRef(progress)
  const [catalogSync, setCatalogSync] = useState<CatalogSyncState>(() => ({
    status: 'local',
    localVersion: bundledCatalog.version,
  }))

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

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
      .then(async (state) => {
        if (!isActive) return
        setAuth(state)
        if (state.status !== 'authenticated') {
          setProgressSync({
            status: 'local_only',
            message: state.status === 'error' ? state.message : state.message,
          })
          return
        }

        setProgressSync({ status: 'loading' })
        try {
          const remoteProgress = await fetchRemoteProgress(state.session.accessToken)
          if (!isActive) return
          if (remoteProgress) {
            setProgress(initializeProgressWithStarter(catalog, remoteProgress))
            setProgressSync({ status: 'saved', lastSyncedAt: new Date().toISOString() })
          } else {
            const starterProgress = initializeProgressWithStarter(catalog, progressRef.current)
            setProgress(starterProgress)
            await saveRemoteProgress(state.session.accessToken, catalog.version, starterProgress)
            setProgressSync({ status: 'saved', message: 'Nouvelle progression cloud' })
          }
          didLoadRemoteProgress.current = true
        } catch (error) {
          if (!isActive) return
          didLoadRemoteProgress.current = true
          setProgressSync({
            status: 'error',
            message: error instanceof Error ? error.message : 'progress_load_error',
          })
        }
      })
      .catch((error) => {
        if (!isActive) return
        setAuth({ status: 'error', message: error instanceof Error ? error.message : 'auth_error' })
      })

    return () => {
      isActive = false
    }
  }, [catalog, isReady])

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
    saveProgress(progress).catch(() => undefined)
  }, [isReady, progress])

  useEffect(() => {
    if (!isReady || auth.status !== 'authenticated') return
    if (!didLoadRemoteProgress.current) return
    const timeout = setTimeout(() => {
      saveToCloud().catch(() => undefined)
    }, 1500)

    return () => clearTimeout(timeout)
  }, [auth, catalog.version, isReady, progress])

  const discoveredCardIds = useMemo(() => getDiscoveredFigureIds(progress), [progress])
  const unlockedCardIds = useMemo(() => getUnlockedCardIds(progress), [progress])

  const doLocalDiscovery = useCallback(
    (inputCardIds: string[]) => {
      const craftResult = attemptCraft(catalog, inputCardIds)
      return craftResult ?? attemptDiscovery(
        catalog,
        { discoveredCardIds, unlockedCardIds },
        inputCardIds,
        {
          minInputs: catalog.gameplay.discovery.minInputs,
          maxInputs: catalog.gameplay.discovery.maxInputs,
        },
      )
    },
    [catalog, discoveredCardIds, unlockedCardIds],
  )

  const discover = useCallback(
    async (inputCardIds: string[]): Promise<DiscoveryResult> => {
      setDiscoveryLoading({ status: 'submitting' })

      if (auth.status === 'authenticated') {
        try {
          const serverResponse = await callAttemptDiscovery(
            auth.session.accessToken,
            inputCardIds,
          )

          setProgress((current) => ({
            ...serverResponse.progressSnapshot,
            packs: current.packs,
          }))

          setDiscoveryLoading({ status: 'success' })
          return serverResponse.result
        } catch (error) {
          console.warn('Server discovery failed, falling back to local', error)
        }
      }

      // Local fallback
      const result = doLocalDiscovery(inputCardIds)
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

      setDiscoveryLoading({ status: 'success' })
      return result
    },
    [auth, catalog, doLocalDiscovery],
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

  const saveToCloud = useCallback(async () => {
    if (auth.status !== 'authenticated') {
      setProgressSync({ status: 'local_only', message: 'Connexion cloud requise' })
      return
    }

    setProgressSync({ status: 'saving' })
    try {
      await saveRemoteProgress(auth.session.accessToken, catalog.version, progress)
      setProgressSync({
        status: 'saved',
        lastSyncedAt: new Date().toISOString(),
      })
    } catch (error) {
      setProgressSync({
        status: 'error',
        message: error instanceof Error ? error.message : 'sync_error',
      })
    }
  }, [auth, catalog.version, progress])

  const signOut = useCallback(async () => {
    await signOutSupabase()
    setAuth({ status: 'local_only', message: 'Session déconnectée' })
    didLoadRemoteProgress.current = false
    setProgressSync({ status: 'local_only', message: 'Session déconnectée' })
  }, [])

  const value = useMemo(
    () => ({
      isReady,
      progress,
      catalog,
      catalogSync,
      auth,
      progressSync,
      discoveryLoading,
      figureCards,
      toolCards,
      playableCards,
      getCard,
      getCardState,
      getConnections,
      refreshCatalog,
      saveToCloud,
      signOut,
      discover,
      resetProgress,
    }),
    [
      catalog,
      catalogSync,
      discover,
      discoveryLoading,
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
      saveToCloud,
      signOut,
      toolCards,
      auth,
    ],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
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
