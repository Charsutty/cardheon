import { CardheonButton, CardheonHeader, CardheonScreen } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'
import { MetricGrid } from '../../components/stats/MetricGrid'
import { getCompletion, getCompletionPercentage } from '../../game/progress'
import { useGame, type CatalogSyncState, type ProgressSyncState } from '../../state/GameProvider'
import type { SupabaseAuthState } from '../../services/supabaseAuth'
import { ExplorerIdentity } from './components/ExplorerIdentity'

const menuItems = [
  ['⚙', 'Paramètres'],
  ['▥', 'Statistiques'],
  ['▣', 'Sauvegarder'],
  ['ⓘ', 'À propos'],
]

export function ProfileScreen() {
  const {
    auth,
    catalog,
    catalogSync,
    figureCards,
    progress,
    progressSync,
    resetProgress,
    signOut,
    saveToCloud,
  } = useGame()
  const completion = getCompletion(progress, figureCards.length)
  const percentage = getCompletionPercentage(progress, figureCards.length)
  const metrics = [
    { value: String(completion.discovered), label: 'Découvertes' },
    { value: `${percentage}%`, label: 'Collection' },
    { value: String(progress.attempts), label: 'Tentatives' },
  ]

  return (
    <CardheonScreen>
      <CardheonHeader coins={progress.xp} />
      <ExplorerIdentity
        xp={progress.xp}
        xpPerLevel={catalog.gameplay.progression.xpPerLevel}
        initialLevel={catalog.gameplay.progression.initialLevel}
      />
      <MetricGrid metrics={metrics} />
      <CatalogStatusPanel catalogSync={catalogSync} />
      <CloudStatusPanel
        auth={auth}
        progressSync={progressSync}
        onSync={saveToCloud}
        onSignOut={signOut}
      />
      <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" overflow="hidden">
        {menuItems.map(([icon, label], index) => (
          <XStack
            key={label}
            minHeight={48}
            alignItems="center"
            paddingHorizontal="$3"
            gap="$3"
            borderBottomWidth={index === menuItems.length - 1 ? 0 : 1}
            borderColor="$border"
          >
            <Text color="$goldDark" fontSize={15}>{icon}</Text>
            <Text color="$ink" fontSize={11} fontWeight="700" flex={1}>{label.toUpperCase()}</Text>
            <Text color="$goldDark" fontSize={16}>›</Text>
          </XStack>
        ))}
      </YStack>
      <CardheonButton variant="secondary" onPress={resetProgress}>RÉINITIALISER LA PARTIE</CardheonButton>
    </CardheonScreen>
  )
}

function CloudStatusPanel({
  auth,
  progressSync,
  onSync,
  onSignOut,
}: {
  auth: SupabaseAuthState | { status: 'loading' }
  progressSync: ProgressSyncState
  onSync: () => Promise<void>
  onSignOut: () => Promise<void>
}) {
  const authView = authStatusView(auth)
  const syncView = progressSyncStatusView(progressSync)
  const canSync = auth.status === 'authenticated' && progressSync.status !== 'saving' && progressSync.status !== 'loading'

  return (
    <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3" gap="$3">
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <Text color="$ink" fontSize={11} lineHeight={14} fontWeight="800">CLOUD</Text>
        <Text color={authView.color} fontSize={10} lineHeight={13} fontWeight="800">{authView.label}</Text>
      </XStack>
      <Text color="$muted" fontSize={10} lineHeight={14}>{authView.detail}</Text>
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <Text color="$ink" fontSize={11} lineHeight={14} fontWeight="800">PROGRESSION</Text>
        <Text color={syncView.color} fontSize={10} lineHeight={13} fontWeight="800">{syncView.label}</Text>
      </XStack>
      <Text color="$muted" fontSize={10} lineHeight={14}>{syncView.detail}</Text>
      <YStack gap="$2">
        <CardheonButton variant="secondary" onPress={onSync} disabled={!canSync}>
          SYNCHRONISER
        </CardheonButton>
        {auth.status === 'authenticated' ? (
          <CardheonButton variant="secondary" onPress={onSignOut}>
            DÉCONNECTER
          </CardheonButton>
        ) : null}
      </YStack>
    </YStack>
  )
}

function authStatusView(auth: SupabaseAuthState | { status: 'loading' }): {
  label: string
  detail: string
  color: '$goldDark' | '$muted' | '$ink'
} {
  switch (auth.status) {
    case 'loading':
      return {
        label: 'CONNEXION',
        detail: 'Recherche d’une session joueur.',
        color: '$goldDark',
      }
    case 'authenticated':
      return {
        label: auth.session.isAnonymous ? 'ANONYME' : 'CONNECTÉ',
        detail: `Joueur ${auth.session.userId.slice(0, 8)}`,
        color: '$ink',
      }
    case 'error':
      return {
        label: 'ERREUR',
        detail: auth.message,
        color: '$goldDark',
      }
    case 'local_only':
    default:
      return {
        label: 'LOCAL',
        detail: auth.message ?? 'Progression conservée sur cet appareil.',
        color: '$muted',
      }
  }
}

function progressSyncStatusView(progressSync: ProgressSyncState): {
  label: string
  detail: string
  color: '$goldDark' | '$muted' | '$ink'
} {
  switch (progressSync.status) {
    case 'loading':
      return {
        label: 'CHARGEMENT',
        detail: 'Lecture de la progression cloud.',
        color: '$goldDark',
      }
    case 'saving':
      return {
        label: 'SAUVEGARDE',
        detail: 'Envoi de la progression vers Supabase.',
        color: '$goldDark',
      }
    case 'saved':
      return {
        label: 'SAUVEGARDÉE',
        detail: progressSync.lastSyncedAt
          ? `Dernière sync ${new Date(progressSync.lastSyncedAt).toLocaleString()}`
          : progressSync.message ?? 'Progression cloud prête.',
        color: '$ink',
      }
    case 'error':
      return {
        label: 'ERREUR',
        detail: progressSync.message ?? 'Sauvegarde cloud indisponible.',
        color: '$goldDark',
      }
    case 'local_only':
    default:
      return {
        label: 'LOCAL',
        detail: progressSync.message ?? 'Progression gardée sur cet appareil.',
        color: '$muted',
      }
  }
}

function CatalogStatusPanel({ catalogSync }: { catalogSync: CatalogSyncState }) {
  const view = catalogStatusView(catalogSync)

  return (
    <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3" gap="$2">
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <Text color="$ink" fontSize={11} lineHeight={14} fontWeight="800">CATALOGUE</Text>
        <Text color={view.color} fontSize={10} lineHeight={13} fontWeight="800">{view.label}</Text>
      </XStack>
      <Text color="$muted" fontSize={10} lineHeight={14}>{view.detail}</Text>
    </YStack>
  )
}

function catalogStatusView(catalogSync: CatalogSyncState): {
  label: string
  detail: string
  color: '$goldDark' | '$muted' | '$ink'
} {
  switch (catalogSync.status) {
    case 'checking':
      return {
        label: 'VÉRIFICATION',
        detail: `Version locale ${catalogSync.localVersion}`,
        color: '$goldDark',
      }
    case 'current':
      return {
        label: 'À JOUR',
        detail: `Version publiée ${catalogSync.remoteVersion ?? catalogSync.localVersion}`,
        color: '$ink',
      }
    case 'updated':
      return {
        label: 'MIS À JOUR',
        detail: `Version distante chargée ${catalogSync.remoteVersion ?? catalogSync.localVersion}`,
        color: '$ink',
      }
    case 'remote_available':
      return {
        label: 'DISTANT',
        detail: `Version ${catalogSync.remoteVersion} disponible, jeu maintenu sur ${catalogSync.localVersion}`,
        color: '$goldDark',
      }
    case 'error':
      return {
        label: 'HORS LIGNE',
        detail: `Version locale ${catalogSync.localVersion}`,
        color: '$muted',
      }
    case 'local':
    default:
      return {
        label: 'LOCAL',
        detail: `Version embarquée ${catalogSync.localVersion}`,
        color: '$muted',
      }
  }
}
