import type { DiscoveryResult, Reward } from '@cardheon/game-engine'
import { Text, YStack } from 'tamagui'
import { useGame } from '../../../state/GameProvider'

type DiscoveryResultPanelProps = {
  result: DiscoveryResult
}

export function DiscoveryResultPanel({ result }: DiscoveryResultPanelProps) {
  const { getCard } = useGame()
  const content = getResultContent(result, getCard)

  return (
    <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$4" gap="$3">
      <Text color="$ink" fontSize={16} fontWeight="900">{content.title}</Text>
      {content.messages.map((message, index) => (
        <Text key={index} color="$muted" fontSize={13} lineHeight={19}>{message}</Text>
      ))}
      {content.rewards.length > 0 ? (
        <YStack gap="$1" paddingTop="$1">
          <Text color="$goldDark" fontSize={10} fontWeight="800" letterSpacing={0.5}>RÉCOMPENSES</Text>
          {content.rewards.map((reward, index) => (
            <Text key={index} color="$ink" fontSize={12} lineHeight={18}>• {reward}</Text>
          ))}
        </YStack>
      ) : null}
    </YStack>
  )
}

function getResultContent(
  result: DiscoveryResult,
  getCard: ReturnType<typeof useGame>['getCard'],
) {
  switch (result.type) {
    case 'invalid':
      return { title: 'Tentative impossible', messages: [result.reason], rewards: [] }
    case 'already_discovered': {
      const title = getCard(result.cardId)?.localization.fr?.title ?? result.cardId
      return {
        title: 'Figure déjà connue',
        messages: [`${title} est déjà dans ta collection. Continue à explorer d’autres pistes.`],
        rewards: formatRewards(result.rewards, getCard),
      }
    }
    case 'ambiguous': {
      const candidateTitles = result.candidates
        .slice(0, 3)
        .map((candidate) => getCard(candidate.cardId)?.localization.fr?.title ?? candidate.cardId)
        .join(', ')
      return {
        title: 'Plusieurs pistes possibles',
        messages: [
          result.hints[0]?.message ?? 'Ajoute un indice distinctif.',
          candidateTitles ? `Candidats proches : ${candidateTitles}.` : '',
        ].filter(Boolean),
        rewards: [],
      }
    }
    case 'near_miss':
      return {
        title: 'Tu chauffes',
        messages: result.hints.map((hint) => hint.message).filter(Boolean),
        rewards: [],
      }
    case 'new_figure': {
      const title = getCard(result.cardId)?.localization.fr?.title ?? result.cardId
      return {
        title: 'Découverte !',
        messages: [`${title} rejoint ta collection.`],
        rewards: formatRewards(result.rewards, getCard),
      }
    }
    case 'craft': {
      const title = getCard(result.outputCardId)?.localization.fr?.title ?? result.outputCardId
      return {
        title: 'Nouvelle carte créée !',
        messages: [`Tu as assemblé les cartes pour créer ${title}. Elle est maintenant disponible dans ta main.`],
        rewards: formatRewards(result.rewards, getCard),
      }
    }
  }
}

function formatRewards(
  rewards: Reward[] | undefined,
  getCard: ReturnType<typeof useGame>['getCard'],
): string[] {
  if (!rewards) return []

  return rewards
    .filter((reward) => reward.type !== 'new_figure_card')
    .map((reward) => {
      switch (reward.type) {
        case 'xp':
          return `+${reward.value} XP`
        case 'new_tool_card':
        case 'unlock_card': {
          const title = getCard(String(reward.value))?.localization.fr?.title ?? String(reward.value)
          return `Carte-outil débloquée : ${title}`
        }
        case 'constellation_progress': {
          const meta = reward.meta as { constellationId?: string; discoveredCount?: number; totalCount?: number } | undefined
          const id = meta?.constellationId ?? String(reward.value).split(':')[0]
          const progress = meta ? `${meta.discoveredCount}/${meta.totalCount}` : String(reward.value).split(':')[1]
          return `Constellation ${id} : ${progress}`
        }
        case 'constellation_unlock': {
          const meta = reward.meta as { constellationId?: string } | undefined
          return `Constellation complétée : ${meta?.constellationId ?? String(reward.value)}`
        }
        case 'pack':
          return `Pack obtenu : ${String(reward.value)}`
        case 'hint':
          return `Indice : ${String(reward.value)}`
        case 'title':
          return `Titre débloqué : ${String(reward.value)}`
        case 'shard':
          return `Éclat : +${reward.value}`
        case 'cosmetic':
          return `Cosmétique : ${String(reward.value)}`
        default:
          return `${reward.type}: ${String(reward.value)}`
      }
    })
}
