import { CardheonHeader, CardheonScreen, CollectionProgressPanel } from '@cardheon/ui'
import { useRouter } from 'expo-router'
import { ScrollView, Text, YStack } from 'tamagui'
import { getCompletion } from '../../game/progress'
import { useGame } from '../../state/GameProvider'
import { AtelierActions } from './components/AtelierActions'
import { AttemptHistoryPanel } from './components/AttemptHistoryPanel'
import { ClueGrid } from './components/ClueGrid'
import { DiscoveryResultPanel } from './components/DiscoveryResultPanel'
import { HandPanel } from './components/HandPanel'
import { HypothesisFeedbackPanel } from './components/HypothesisFeedbackPanel'
import { RecommendedCardsPanel } from './components/RecommendedCardsPanel'
import { useAtelier } from './hooks/useAtelier'

export function AtelierScreen() {
  const router = useRouter()
  const { progress, figureCards } = useGame()
  const atelier = useAtelier()
  const completion = getCompletion(progress, figureCards.length)

  const handleAttempt = async () => {
    const result = await atelier.attempt()
    if (result.type === 'new_figure') router.push('/new-discovery')
  }

  return (
    <CardheonScreen scroll={false}>
      <CardheonHeader coins={progress.xp} />
      <CollectionProgressPanel {...completion} />

      <YStack gap="$1" alignItems="center" paddingVertical="$1">
        <Text color="$ink" fontFamily="$heading" fontSize={19} lineHeight={24} fontWeight="700" letterSpacing={1}>ATELIER</Text>
        <Text color="$muted" fontSize={11} lineHeight={16} textAlign="center">
          Combine les cartes pour révéler une figure historique.
        </Text>
        {atelier.isSubmitting ? (
          <Text color="$accent" fontSize={11}>Les indices résonnent…</Text>
        ) : null}
        {atelier.discoveryError ? (
          <Text color="$error" fontSize={10}>{atelier.discoveryError}</Text>
        ) : null}
      </YStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack gap="$4" paddingBottom="$3">
          <ClueGrid
            cards={atelier.allCards}
            selectedIds={atelier.selectedIds}
            minSelection={atelier.minSelection}
            maxSelection={atelier.maxSelection}
            onToggle={atelier.toggleCard}
          />
          <HypothesisFeedbackPanel
            selectionCount={atelier.selectedIds.length}
            minSelection={atelier.minSelection}
            maxSelection={atelier.maxSelection}
            craftPreview={atelier.craftPreview}
          />
          <RecommendedCardsPanel
            cards={atelier.recommendedCards}
            selectedIds={atelier.selectedIds}
            onToggle={atelier.toggleCard}
          />

          <HandPanel
            cards={atelier.cards}
            selectedIds={atelier.selectedIds}
            filter={atelier.filter}
            searchQuery={atelier.searchQuery}
            onFilter={atelier.setFilter}
            onSearch={atelier.setSearchQuery}
            onToggle={atelier.toggleCard}
          />

          {atelier.result ? <DiscoveryResultPanel result={atelier.result} /> : null}
          <AttemptHistoryPanel />
        </YStack>
      </ScrollView>

      <AtelierActions
        selectionCount={atelier.selectedIds.length}
        maxSelection={atelier.maxSelection}
        canAttempt={atelier.canAttempt}
        craftPreview={atelier.craftPreview}
        onAttempt={handleAttempt}
        onClear={atelier.clearSelection}
        disabled={atelier.isSubmitting}
      />
    </CardheonScreen>
  )
}
