import { CardheonHeader, CardheonScreen, CategoryPill } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'
import { ScreenHeading } from '../../components/layout/ScreenHeading'
import { getCompletion, getCompletionPercentage } from '../../game/progress'
import { useGame } from '../../state/GameProvider'
import { FigureCollectionGrid } from './components/FigureCollectionGrid'

export function CollectionScreen() {
  const { discoveredCardIds, xp } = useGame()
  const completion = getCompletion(discoveredCardIds)
  const percentage = getCompletionPercentage(discoveredCardIds)

  return (
    <CardheonScreen>
      <CardheonHeader coins={xp} />
      <ScreenHeading title="Collection" eyebrow="Cabinet d’histoire" action="⌕ RECHERCHER" />

      <XStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3" justifyContent="space-around">
        <Stat value={String(completion.discovered)} label="Découvertes" />
        <Divider />
        <Stat value={`${percentage}%`} label="Complétion" />
        <Divider />
        <Stat value="3" label="Catégories" />
      </XStack>

      <XStack gap="$2">
        <CategoryPill label="Toutes" active />
        <CategoryPill label="Personnages" />
        <CategoryPill label="Concepts" />
      </XStack>

      <FigureCollectionGrid discoveredCardIds={discoveredCardIds} />
    </CardheonScreen>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <YStack alignItems="center" gap={2}>
      <Text color="$ink" fontFamily="$heading" fontSize={20} fontWeight="700">{value}</Text>
      <Text color="$muted" fontSize={9}>{label}</Text>
    </YStack>
  )
}

function Divider() {
  return <YStack width={1} height={38} backgroundColor="$border" />
}
