import { CardheonHeader, CardheonScreen, CollectionProgressPanel } from '@cardheon/ui'
import { useRouter } from 'expo-router'
import { ScreenHeading } from '../../components/layout/ScreenHeading'
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
      <ScreenHeading
        eyebrow="Atelier de découverte"
        title="Fais parler l’Histoire"
        description="Assemble de 2 à 5 indices. Une combinaison précise révèle une figure de ta collection."
      />
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
