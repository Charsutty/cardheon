import { CardheonButton } from '@cardheon/ui'
import { YStack } from 'tamagui'

type AtelierActionsProps = {
  selectionCount: number
  maxSelection: number
  canAttempt: boolean
  onAttempt: () => void
  onClear: () => void
}

export function AtelierActions({ selectionCount, maxSelection, canAttempt, onAttempt, onClear }: AtelierActionsProps) {
  return (
    <YStack gap="$2">
      <CardheonButton disabled={!canAttempt} onPress={onAttempt}>
        COMBINER · {selectionCount} / {maxSelection}
      </CardheonButton>
      {selectionCount > 0 ? (
        <CardheonButton variant="ghost" onPress={onClear}>EFFACER LA COMBINAISON</CardheonButton>
      ) : null}
    </YStack>
  )
}
