import { CardheonButton, CardheonScreen, DiscoveryCard } from '@cardheon/ui'
import { Text, YStack } from 'tamagui'

export default function NewDiscoveryScreen() {
  return (
    <CardheonScreen>
      <YStack alignItems="center" gap="$5" paddingTop="$5">
        <YStack alignItems="center" gap="$2">
          <Text color="$goldDark" fontSize={18} fontWeight="900" letterSpacing={1}>NOUVELLE DÉCOUVERTE !</Text>
          <Text color="$muted" fontSize={12}>Une figure historique rejoint ta collection.</Text>
        </YStack>

        <YStack width={280} height={280} borderRadius={140} backgroundColor="$goldSoft" opacity={0.22} position="absolute" top={150} />

        <DiscoveryCard
          title="Cléopâtre"
          subtitle="Égypte antique"
          type="character"
          state="new"
          rarity="rare"
          size="large"
        />

        <Text color="$ink" fontSize={14} lineHeight={22} textAlign="center" maxWidth={310}>
          Reine d’Égypte de la dynastie des Ptolémées, célèbre pour son intelligence politique et son règne légendaire.
        </Text>

        <YStack width="100%" gap="$3">
          <CardheonButton>AJOUTER À LA COLLECTION</CardheonButton>
          <CardheonButton variant="secondary">PARTAGER</CardheonButton>
        </YStack>
      </YStack>
    </CardheonScreen>
  )
}
