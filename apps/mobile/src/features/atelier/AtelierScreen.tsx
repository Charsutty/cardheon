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
  const { discoveredCardIds, figureCards, xp } = useGame()
  const atelier = useAtelier()
  const completion = getCompletion(discoveredCardIds, figureCards.length)

  const handleAttempt = () => {
    const result = atelier.attempt()
    if (result.type === 'new_figure') router.push('/new-discovery')
  }

  return (
    <CardheonScreen>
      <CardheonHeader coins={xp} />
      <CollectionProgressPanel {...completion} />

      <YStack gap="$1" alignItems="center" paddingVertical="$1">
        <Text color="$ink" fontFamily="$heading" fontSize={19} lineHeight={24} fontWeight="700" letterSpacing={1}>ATELIER</Text>
        <Text color="$muted" fontSize={11} lineHeight={16} textAlign="center">
          Combine les cartes pour révéler une figure historique.
        </Text>
      </YStack>

      <ClueGrid
        cards={atelier.cards}
        selectedIds={atelier.selectedIds}
        maxSelection={atelier.maxSelection}
        onToggle={atelier.toggleCard}
      />
      <AtelierActions
        selectionCount={atelier.selectedIds.length}
        maxSelection={atelier.maxSelection}
        canAttempt={atelier.canAttempt}
        onAttempt={handleAttempt}
        onClear={atelier.clearSelection}
      />

      {atelier.result ? <DiscoveryResultPanel result={atelier.result} /> : null}
    </CardheonScreen>
  )
}
