import { CardheonButton, CardheonScreen } from '@cardheon/ui'
import { useRouter } from 'expo-router'
import { Text } from 'tamagui'
import { useGame } from '../../state/GameProvider'
import { DiscoveryActions } from './components/DiscoveryActions'
import { DiscoveryCelebration } from './components/DiscoveryCelebration'

export function NewDiscoveryScreen() {
  const router = useRouter()
  const { getCard, lastDiscoveryId } = useGame()
  const card = lastDiscoveryId ? getCard(lastDiscoveryId) : undefined

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
      <DiscoveryCelebration card={card} />
      <DiscoveryActions
        onViewCollection={() => router.replace('/collection')}
        onContinue={() => router.replace('/')}
      />
    </CardheonScreen>
  )
}
