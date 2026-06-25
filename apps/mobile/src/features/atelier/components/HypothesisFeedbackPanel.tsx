import type { DiscoveryResult } from '@cardheon/game-engine'
import { Text, XStack, YStack } from 'tamagui'

type HypothesisFeedbackPanelProps = {
  selectionCount: number
  minSelection: number
  maxSelection: number
  craftPreview?: DiscoveryResult | null
}

export function HypothesisFeedbackPanel({
  selectionCount,
  minSelection,
  maxSelection,
  craftPreview,
}: HypothesisFeedbackPanelProps) {
  const view = getFeedback(selectionCount, minSelection, maxSelection, craftPreview)

  return (
    <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3" gap="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>LECTURE DE L’HYPOTHÈSE</Text>
        <Text color={view.color} fontSize={10} fontWeight="800">{view.label}</Text>
      </XStack>
      <Text color="$muted" fontSize={11} lineHeight={16}>{view.message}</Text>
    </YStack>
  )
}

function getFeedback(
  selectionCount: number,
  minSelection: number,
  maxSelection: number,
  craftPreview?: DiscoveryResult | null,
) {
  if (craftPreview?.type === 'craft') {
    return {
      label: 'CRÉATION',
      color: '$goldDark' as const,
      message: 'Cette combinaison ressemble à une recette de carte-outil. Tu peux la créer directement.',
    }
  }

  if (selectionCount === 0) {
    return {
      label: 'VIDE',
      color: '$muted' as const,
      message: 'Choisis des indices complémentaires : époque, lieu, domaine, concept ou figure déjà connue.',
    }
  }

  if (selectionCount < minSelection) {
    return {
      label: 'INCOMPLET',
      color: '$goldDark' as const,
      message: `Ajoute encore ${minSelection - selectionCount} carte pour former une hypothèse testable.`,
    }
  }

  if (selectionCount >= maxSelection) {
    return {
      label: 'DENSE',
      color: '$goldDark' as const,
      message: 'Tu as utilisé tous les emplacements. Lance la tentative ou retire un indice trop large.',
    }
  }

  return {
    label: 'PLAUSIBLE',
    color: '$ink' as const,
    message: 'La combinaison est testable. Un indice distinctif supplémentaire peut réduire les ambiguïtés.',
  }
}
