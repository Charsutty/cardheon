import type { DiscoveryResult } from '@cardheon/game-engine'
import { Text, YStack } from 'tamagui'
import { useGame } from '../../../state/GameProvider'

type DiscoveryResultPanelProps = {
  result: DiscoveryResult
}

export function DiscoveryResultPanel({ result }: DiscoveryResultPanelProps) {
  const { getCard } = useGame()
  const content = getResultContent(result, getCard)

  return (
    <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$4" gap="$2">
      <Text color="$ink" fontSize={16} fontWeight="900">{content.title}</Text>
      <Text color="$muted" fontSize={13} lineHeight={19}>{content.message}</Text>
    </YStack>
  )
}

function getResultContent(
  result: DiscoveryResult,
  getCard: ReturnType<typeof useGame>['getCard'],
) {
  switch (result.type) {
    case 'invalid':
      return { title: 'Tentative impossible', message: result.reason }
    case 'already_discovered':
      return {
        title: 'Figure déjà connue',
        message: `${getCard(result.cardId)?.localization.fr?.title ?? result.cardId} est déjà dans ta collection.`,
      }
    case 'ambiguous':
      return {
        title: 'Plusieurs pistes possibles',
        message: result.hints[0]?.message ?? 'Ajoute un indice distinctif.',
      }
    case 'near_miss':
      return {
        title: 'Tu chauffes',
        message: result.hints[0]?.message ?? 'Essaie une combinaison plus précise.',
      }
    case 'new_figure':
      return { title: 'Découverte !', message: 'Une nouvelle figure rejoint ta collection.' }
  }
}
