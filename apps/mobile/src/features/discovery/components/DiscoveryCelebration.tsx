import type { Card, DiscoveryResult, GameCatalog } from '@cardheon/game-engine'
import { DiscoveryCard } from '@cardheon/ui'
import { Text, XStack, YStack } from 'tamagui'
import { toDiscoveryCard } from '../../../game/catalog'
import { useGame } from '../../../state/GameProvider'

type DiscoveryCelebrationProps = {
  card: Card
  result?: DiscoveryResult
}

export function DiscoveryCelebration({ card, result }: DiscoveryCelebrationProps) {
  const { catalog } = useGame()
  const rewards = result?.type === 'new_figure' || result?.type === 'already_discovered' ? result.rewards : []
  const xpReward = rewards.find((reward) => reward.type === 'xp' && !reward.meta?.reason)
  const constellationRewards = rewards.filter((reward) => reward.type === 'constellation_progress' || reward.type === 'constellation_unlock')
  const toolRewards = rewards.filter((reward) => reward.type === 'new_tool_card')

  const nextHint = findNextHint(card, catalog)

  return (
    <YStack alignItems="center" gap="$4" paddingTop="$4">
      <YStack alignItems="center" gap="$2">
        <Text color="$goldDark" fontSize={10} fontWeight="900" letterSpacing={1.7}>NOUVELLE DÉCOUVERTE</Text>
        <Text color="$ink" fontFamily="$heading" fontSize={27} fontWeight="700">L’Histoire se révèle</Text>
        <XStack width={72} height={1} backgroundColor="$borderStrong" />
      </YStack>

      <YStack width="100%" alignItems="center" paddingVertical="$5" borderRadius="$4" borderWidth={1} borderColor="$border" backgroundColor="$paper" overflow="hidden">
        <YStack position="absolute" width={250} height={250} borderRadius={125} borderWidth={1} borderColor="$goldSoft" opacity={0.35} top={-20} />
        <YStack position="absolute" width={190} height={190} borderRadius={95} borderWidth={1} borderColor="$goldSoft" opacity={0.45} top={10} />
        <DiscoveryCard {...toDiscoveryCard(card)} state="new" size="large" />
      </YStack>

      <YStack gap="$2" width="100%">
        {xpReward ? (
          <RewardLine label="XP" value={`+${xpReward.value}`} />
        ) : null}
        {toolRewards.map((reward, index) => (
          <RewardLine key={index} label="Carte" value={String(reward.value)} />
        ))}
        {constellationRewards.map((reward, index) => {
          const meta = reward.meta as { constellationId?: string; discoveredCount?: number; totalCount?: number } | undefined
          const label = meta?.constellationId ?? String(reward.value).split(':')[0]
          const value = meta ? `${meta.discoveredCount}/${meta.totalCount}` : String(reward.value).split(':')[1]
          return <RewardLine key={index} label="Constellation" value={`${label} : ${value}`} />
        })}
        {nextHint ? (
          <YStack borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3" gap="$1">
            <Text color="$goldDark" fontSize={9} fontWeight="800" letterSpacing={0.5}>PISTE SUIVANTE</Text>
            <Text color="$muted" fontSize={11} lineHeight={16}>{nextHint}</Text>
          </YStack>
        ) : null}
      </YStack>

      <Text color="$ink" fontSize={13} lineHeight={21} textAlign="center" maxWidth={310}>
        {card.localization.fr?.shortDescription ?? 'Une nouvelle piste historique vient de se révéler.'}
      </Text>
    </YStack>
  )
}

function RewardLine({ label, value }: { label: string; value: string }) {
  return (
    <XStack justifyContent="space-between" alignItems="center" borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3">
      <Text color="$muted" fontSize={10} fontWeight="800" letterSpacing={0.5}>{label.toUpperCase()}</Text>
      <Text color="$ink" fontSize={12} fontWeight="700">{value}</Text>
    </XStack>
  )
}

function findNextHint(card: Card, catalog: GameCatalog): string | null {
  // Suggest a related figure if one exists through relationships.
  const relatedFigure = catalog.relationships.find((relationship) => {
    if (relationship.source === card.id && relationship.target.startsWith('figure.')) return true
    if (relationship.target === card.id && relationship.source.startsWith('figure.')) return true
    return false
  })

  if (!relatedFigure) return null

  const relatedId = relatedFigure.source === card.id ? relatedFigure.target : relatedFigure.source
  const relatedCard = catalog.cards.find((candidate) => candidate.id === relatedId)
  if (!relatedCard) return null

  return `Essaye de découvrir ${relatedCard.localization.fr?.title ?? relatedCard.slug}.`
}
