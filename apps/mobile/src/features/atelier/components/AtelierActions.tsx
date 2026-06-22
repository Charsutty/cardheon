import { CardheonButton } from '@cardheon/ui'
import { YStack } from 'tamagui'
import { MAX_SELECTION } from '../hooks/useAtelier'

type AtelierActionsProps = {
  selectionCount: number
  canAttempt: boolean
  onAttempt: () => void
  onClear: () => void
}

export function AtelierActions({ selectionCount, canAttempt, onAttempt, onClear }: AtelierActionsProps) {
  return (
    <YStack gap="$2">
      <CardheonButton disabled={!canAttempt} onPress={onAttempt}>
        COMBINER · {selectionCount} / {MAX_SELECTION}
      </CardheonButton>
      {selectionCount > 0 ? (
        <CardheonButton variant="ghost" onPress={onClear}>EFFACER LA COMBINAISON</CardheonButton>
      ) : null}
    </YStack>
  )
}
