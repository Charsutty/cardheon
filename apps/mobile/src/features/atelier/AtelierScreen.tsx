import { CardheonHeader, CardheonScreen, CollectionProgressPanel } from '@cardheon/ui'
import { useRouter } from 'expo-router'
import { Text, YStack } from 'tamagui'
import { getCompletion } from '../../game/progress'
import { useGame } from '../../state/GameProvider'
import { AtelierActions } from './components/AtelierActions'
import { ClueGrid } from './components/ClueGrid'
import { DiscoveryResultPanel } from './components/DiscoveryResultPanel'
import { useAtelier } from './hooks/useAtelier'

export function AtelierScreen() {
  const router = useRouter()
  const { discoveredCardIds, xp } = useGame()
  const atelier = useAtelier()
  const completion = getCompletion(discoveredCardIds)

  const handleAttempt = () => {
    const result = atelier.attempt()
    if (result.type === 'new_figure') router.push('/new-discovery')
  }

  return (
    <CardheonScreen>
      <CardheonHeader coins={xp} />
      <CollectionProgressPanel {...completion} />

      <YStack gap="$1" alignItems="center">
        <Text color="$ink" fontFamily="$heading" fontSize={17} fontWeight="700" letterSpacing={1}>ATELIER</Text>
        <Text color="$muted" fontSize={11} textAlign="center">
          Combine les cartes pour reveler une figure historique.
        </Text>
      </YStack>

      <ClueGrid cards={atelier.cards} selectedIds={atelier.selectedIds} onToggle={atelier.toggleCard} />
      <AtelierActions
        selectionCount={atelier.selectedIds.length}
        canAttempt={atelier.canAttempt}
        onAttempt={handleAttempt}
        onClear={atelier.clearSelection}
      />

      {atelier.result ? <DiscoveryResultPanel result={atelier.result} /> : null}
    </CardheonScreen>
  )
}
