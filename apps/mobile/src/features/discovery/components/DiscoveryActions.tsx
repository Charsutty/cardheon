import { CardheonButton } from '@cardheon/ui'
import { YStack } from 'tamagui'

type DiscoveryActionsProps = {
  onViewCollection: () => void
  onExploreLinks: () => void
  onContinue: () => void
}

export function DiscoveryActions({ onViewCollection, onExploreLinks, onContinue }: DiscoveryActionsProps) {
  return (
    <YStack width="100%" gap="$3">
      <CardheonButton onPress={onExploreLinks}>EXPLORER SES LIENS</CardheonButton>
      <CardheonButton variant="secondary" onPress={onViewCollection}>VOIR DANS LA COLLECTION</CardheonButton>
      <CardheonButton variant="ghost" onPress={onContinue}>CONTINUER À EXPLORER</CardheonButton>
    </YStack>
  )
}
