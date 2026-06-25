import { CardheonButton, CardheonScreen } from '@cardheon/ui'
import { useRouter } from 'expo-router'
import { Text } from 'tamagui'
import { useGame } from '../../state/GameProvider'
import { DiscoveryActions } from './components/DiscoveryActions'
import { DiscoveryCelebration } from './components/DiscoveryCelebration'

export function NewDiscoveryScreen() {
  const router = useRouter()
  const { getCard, progress } = useGame()
  const card = progress.lastDiscoveryId ? getCard(progress.lastDiscoveryId) : undefined

  if (!card) {
    return (
      <CardheonScreen>
        <Text color="$ink" fontSize={18} fontWeight="900">Aucune découverte récente</Text>
        <CardheonButton onPress={() => router.replace('/')}>OUVRIR L’ATELIER</CardheonButton>
      </CardheonScreen>
    )
  }

  return (
    <CardheonScreen>
      <DiscoveryCelebration card={card} result={progress.lastDiscoveryResult} />
      <DiscoveryActions
        onViewCollection={() => router.replace(`/card/${card.id}` as never)}
        onExploreLinks={() => router.replace({ pathname: '/map', params: { focus: card.id } })}
        onContinue={() => router.replace('/')}
      />
    </CardheonScreen>
  )
}
