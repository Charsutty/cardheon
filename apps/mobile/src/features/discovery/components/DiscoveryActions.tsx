import { CardheonButton } from '@cardheon/ui'
import { YStack } from 'tamagui'

type DiscoveryActionsProps = {
  onViewCollection: () => void
  onContinue: () => void
}

export function DiscoveryActions({ onViewCollection, onContinue }: DiscoveryActionsProps) {
  return (
    <YStack width="100%" gap="$3">
      <CardheonButton onPress={onViewCollection}>AJOUTER À LA COLLECTION</CardheonButton>
      <CardheonButton variant="secondary" onPress={onContinue}>CONTINUER À EXPLORER</CardheonButton>
    </YStack>
  )
}
