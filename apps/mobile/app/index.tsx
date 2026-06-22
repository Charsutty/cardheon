import { CardheonButton, CardheonHeader, CardheonScreen, CollectionProgressPanel, DiscoveryCard } from '@cardheon/ui'
import { Link } from 'expo-router'
import { Text, XStack, YStack } from 'tamagui'
import { atelierCards, collectionStats, recentDiscoveries } from '../src/data/mockCards'

export default function AtelierScreen() {
  return (
    <CardheonScreen>
      <CardheonHeader coins={collectionStats.discovered} />
      <CollectionProgressPanel discovered={collectionStats.discovered} total={collectionStats.total} />

      <YStack gap="$3">
        <Text color="$brown" fontSize={12} fontWeight="800" letterSpacing={1}>ATELIER DE DÉCOUVERTE</Text>
        <XStack alignItems="center" justifyContent="center" gap="$4">
          <DiscoveryCard {...atelierCards[0]} size="regular" />
          <Text color="$goldDark" fontSize={34} fontWeight="900">+</Text>
          <DiscoveryCard {...atelierCards[1]} size="regular" />
        </XStack>
        <CardheonButton>COMBINER</CardheonButton>
      </YStack>

      <YStack gap="$3">
        <XStack alignItems="center" justifyContent="space-between">
          <Text color="$brown" fontSize={12} fontWeight="800" letterSpacing={1}>DÉCOUVERTES RÉCENTES</Text>
          <Link href="/collection" asChild>
            <Text color="$goldDark" fontSize={12}>Voir tout ›</Text>
          </Link>
        </XStack>
        <XStack gap="$3" justifyContent="space-between">
          {recentDiscoveries.map((card) => (
            <DiscoveryCard key={card.id} {...card} size="regular" />
          ))}
        </XStack>
      </YStack>
    </CardheonScreen>
  )
}
