import type { DiscoveryResult } from '@cardheon/game-engine'
import { CardheonButton } from '@cardheon/ui'
import { useGame } from '../../../state/GameProvider'
import { YStack } from 'tamagui'

type AtelierActionsProps = {
  selectionCount: number
  maxSelection: number
  canAttempt: boolean
  craftPreview?: DiscoveryResult | null
  onAttempt: () => void
  onClear: () => void
  disabled?: boolean
}

export function AtelierActions({ selectionCount, maxSelection, canAttempt, craftPreview, onAttempt, onClear, disabled }: AtelierActionsProps) {
  const { getCard } = useGame()
  const isCraft = craftPreview?.type === 'craft'
  const outputTitle = isCraft ? getCard(craftPreview.outputCardId)?.localization.fr?.title : undefined

  return (
    <YStack gap="$2">
      <CardheonButton disabled={disabled || !canAttempt} onPress={onAttempt}>
        {isCraft ? `CRÉER ${outputTitle ?? 'UNE CARTE'}` : `COMBINER · ${selectionCount} / ${maxSelection}`}
      </CardheonButton>
      {selectionCount > 0 ? (
        <CardheonButton variant="ghost" onPress={onClear}>EFFACER LA COMBINAISON</CardheonButton>
      ) : null}
    </YStack>
  )
}
