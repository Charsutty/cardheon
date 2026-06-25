import type { Card } from '@cardheon/game-engine'
import { CardheonButton, CardheonHeader, CardheonScreen, DiscoveryCard } from '@cardheon/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, Text, XStack, YStack } from 'tamagui'
import { getFrenchSubtitle, getFrenchTitle, toDiscoveryCard } from '../../src/game/catalog'
import { useGame } from '../../src/state/GameProvider'

export default function QuestDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { catalog, getCard, getCardState, progress } = useGame()
  const constellation = catalog.constellations.find((item) => item.id === id)

  if (!constellation) {
    return (
      <CardheonScreen>
        <Text color="$ink" fontFamily="$heading" fontSize={21} fontWeight="700">Quête introuvable</Text>
        <CardheonButton onPress={() => router.replace('/quests')}>RETOUR AUX QUÊTES</CardheonButton>
      </CardheonScreen>
    )
  }

  const cards = constellation.cardIds
    .map((cardId) => getCard(cardId))
    .filter((card): card is Card => Boolean(card))
  const discoveredCards = cards.filter((card) => isKnown(getCardState(card.id).state))
  const title = constellation.localization.fr?.title ?? constellation.slug
  const description = constellation.localization.fr?.subtitle ?? 'Découvre les cartes liées à cette constellation.'
  const progressRatio = cards.length === 0 ? 0 : discoveredCards.length / cards.length
  const reward = constellation.reward?.xp ?? 0

  return (
    <CardheonScreen>
      <CardheonHeader coins={progress.xp} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap="$4" paddingBottom="$4">
          <YStack alignItems="center" gap="$2">
            <Text color="$goldDark" fontSize={9} fontWeight="800" letterSpacing={1.4}>QUÊTE DE CONSTELLATION</Text>
            <Text color="$ink" fontFamily="$heading" fontSize={24} lineHeight={30} fontWeight="700" textAlign="center">{title.toUpperCase()}</Text>
            <Text color="$muted" fontSize={12} lineHeight={18} textAlign="center">{description}</Text>
          </YStack>

          <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3" gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text color="$ink" fontSize={11} fontWeight="800">PROGRESSION</Text>
              <Text color="$goldDark" fontSize={11} fontWeight="800">{discoveredCards.length} / {cards.length}</Text>
            </XStack>
            <YStack height={7} borderRadius={999} backgroundColor="$surfaceMuted" overflow="hidden">
              <YStack width={`${Math.round(progressRatio * 100)}%`} height="100%" backgroundColor="$gold" />
            </YStack>
            <Text color="$muted" fontSize={10} lineHeight={14}>
              Récompense prévue : {reward > 0 ? `${reward} XP` : 'progression de collection'}.
            </Text>
          </YStack>

          <CardheonButton onPress={() => router.push({ pathname: '/map', params: { constellation: constellation.id } })}>
            VOIR SUR LA CARTE
          </CardheonButton>

          <YStack gap="$3">
            <Text color="$brown" fontSize={10} fontWeight="800" letterSpacing={1}>CARTES DE LA QUÊTE</Text>
            <XStack flexWrap="wrap" gap="$3">
              {cards.map((card) => {
                const known = isKnown(getCardState(card.id).state)
                return (
                  <YStack key={card.id} width={96} gap="$2" alignItems="center">
                    <DiscoveryCard
                      {...toDiscoveryCard(card)}
                      size="compact"
                      state={known ? 'default' : 'locked'}
                      onPress={known ? () => router.push(`/card/${card.id}` as never) : undefined}
                    />
                    <Text color="$muted" fontSize={8} lineHeight={11} textAlign="center" numberOfLines={2}>
                      {known ? getFrenchSubtitle(card) : nextHint(card)}
                    </Text>
                  </YStack>
                )
              })}
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </CardheonScreen>
  )
}

function isKnown(state: string) {
  return state === 'discovered' || state === 'mastered'
}

function nextHint(card: Card) {
  const title = getFrenchTitle(card)
  return title.length > 0 ? `${title.charAt(0).toUpperCase()}...` : 'Indice masqué'
}
