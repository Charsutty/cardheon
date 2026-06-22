import type { Card } from '@cardheon/game-engine'
import { DiscoveryCard } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'
import { toDiscoveryCard } from '../../../game/catalog'

type DiscoveryCelebrationProps = {
  card: Card
}

export function DiscoveryCelebration({ card }: DiscoveryCelebrationProps) {
  return (
    <YStack alignItems="center" gap="$4" paddingTop="$4">
      <YStack alignItems="center" gap="$2">
        <Text color="$goldDark" fontSize={10} fontWeight="900" letterSpacing={1.7}>NOUVELLE DÉCOUVERTE</Text>
        <Text color="$ink" fontFamily="$heading" fontSize={27} fontWeight="700">L’Histoire se révèle</Text>
        <XStack width={72} height={1} backgroundColor="$borderStrong" />
      </YStack>

      <YStack width="100%" alignItems="center" paddingVertical="$5" borderRadius="$4" borderWidth={1} borderColor="$border" backgroundColor="$paper" overflow="hidden">
        <YStack position="absolute" width={250} height={250} borderRadius={125} borderWidth={1} borderColor="$goldSoft" opacity={0.35} top={-20} />
        <YStack position="absolute" width={190} height={190} borderRadius={95} borderWidth={1} borderColor="$goldSoft" opacity={0.45} top={10} />
        <DiscoveryCard {...toDiscoveryCard(card)} state="new" size="large" />
      </YStack>

      <Text color="$ink" fontSize={13} lineHeight={21} textAlign="center" maxWidth={310}>
        {card.localization.fr?.shortDescription ?? 'Une nouvelle piste historique vient de se révéler.'}
      </Text>
    </YStack>
  )
}
