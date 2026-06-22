import { CardheonScreen, CategoryPill, DiscoveryCard } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'
import { collectionCards, collectionStats } from '../src/data/mockCards'

export default function CollectionScreen() {
  return (
    <CardheonScreen>
      <YStack gap="$1">
        <Text color="$ink" fontSize={18} fontWeight="800" textAlign="center">COLLECTION</Text>
        <Text color="$ink" fontSize={30} fontWeight="900">{collectionStats.discovered} / {collectionStats.total}</Text>
        <Text color="$muted" fontSize={13}>figures découvertes</Text>
      </YStack>

      <XStack gap="$2" flexWrap="wrap">
        {['Toutes', 'Personnages', 'Concepts', 'Lieux', 'Époques'].map((label, index) => (
          <CategoryPill key={label} label={label} active={index === 0} />
        ))}
      </XStack>

      <XStack flexWrap="wrap" gap="$3" justifyContent="space-between">
        {collectionCards.map((card) => (
          <DiscoveryCard key={card.id} {...card} size="regular" />
        ))}
      </XStack>
    </CardheonScreen>
  )
}
