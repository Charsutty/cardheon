import { CardheonButton, CardheonHeader, CardheonScreen } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'
import { MetricGrid } from '../../components/stats/MetricGrid'
import { getCompletion, getCompletionPercentage } from '../../game/progress'
import { useGame, type CatalogSyncState } from '../../state/GameProvider'
import { ExplorerIdentity } from './components/ExplorerIdentity'

const menuItems = [
  ['⚙', 'Paramètres'],
  ['▥', 'Statistiques'],
  ['▣', 'Sauvegarder'],
  ['ⓘ', 'À propos'],
]

export function ProfileScreen() {
  const { catalog, catalogSync, figureCards, progress, resetProgress } = useGame()
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
