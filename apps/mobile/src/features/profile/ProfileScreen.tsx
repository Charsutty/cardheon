import { CardheonButton, CardheonHeader, CardheonScreen } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'
import { MetricGrid } from '../../components/stats/MetricGrid'
import { getCompletion, getCompletionPercentage } from '../../game/progress'
import { useGame } from '../../state/GameProvider'
import { ExplorerIdentity } from './components/ExplorerIdentity'

const menuItems = [
  ['⚙', 'Paramètres'],
  ['▥', 'Statistiques'],
  ['▣', 'Sauvegarder'],
  ['ⓘ', 'À propos'],
]

export function ProfileScreen() {
  const { attempts, catalog, discoveredCardIds, figureCards, resetProgress, xp } = useGame()
  const completion = getCompletion(discoveredCardIds, figureCards.length)
  const percentage = getCompletionPercentage(discoveredCardIds, figureCards.length)
  const metrics = [
    { value: String(completion.discovered), label: 'Découvertes' },
    { value: `${percentage}%`, label: 'Collection' },
    { value: String(attempts), label: 'Tentatives' },
  ]

  return (
    <CardheonScreen>
      <CardheonHeader coins={xp} />
      <ExplorerIdentity
        xp={xp}
        xpPerLevel={catalog.gameplay.progression.xpPerLevel}
        initialLevel={catalog.gameplay.progression.initialLevel}
      />
      <MetricGrid metrics={metrics} />
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
