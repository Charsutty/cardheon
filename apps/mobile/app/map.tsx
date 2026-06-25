import { CardheonButton, CardheonHeader, CardheonScreen, CategoryPill } from '@cardheon/ui'
import type { Card, Constellation } from '@cardheon/game-engine'
import { useMemo, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Text, XStack, YStack } from 'tamagui'
import { ScreenHeading } from '../src/components/layout/ScreenHeading'
import { ConstellationPicker } from '../src/features/map/ConstellationPicker'
import { getFrenchSubtitle, getFrenchTitle } from '../src/game/catalog'
import { useGame } from '../src/state/GameProvider'

export default function KnowledgeMapScreen() {
  const router = useRouter()
  const { constellation: constellationId, focus } = useLocalSearchParams<{ constellation?: string; focus?: string }>()
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const { catalog, progress } = useGame()
  const discoveredCardIds = useMemo(
    () => Object.values(progress.cardStates).filter((s) => s.state === 'discovered' || s.state === 'mastered').map((s) => s.cardId),
    [progress.cardStates],
  )
  const constellation = constellationId
    ? catalog.constellations.find((item) => item.id === constellationId) ?? selectActiveConstellation(catalog.constellations, discoveredCardIds)
    : focus
    ? catalog.constellations.find((item) => item.cardIds.includes(focus)) ?? selectActiveConstellation(catalog.constellations, discoveredCardIds)
    : selectActiveConstellation(catalog.constellations, discoveredCardIds)
  const cardsById = new Map(catalog.cards.map((card) => [card.id, card]))
  const nodes = constellation?.cardIds
    .map((cardId) => cardsById.get(cardId))
    .filter((card): card is Card => Boolean(card))
    ?? []

  return (
    <CardheonScreen>
      <CardheonHeader coins={progress.xp} />
      <ScreenHeading
        eyebrow="Graphe historique"
        title={constellation?.localization.fr?.title ?? 'Connaissances'}
      />

      <XStack gap="$2">
        <CategoryPill label="Carte" active={viewMode === 'map'} onPress={() => setViewMode('map')} />
        <CategoryPill label="Liste" active={viewMode === 'list'} onPress={() => setViewMode('list')} />
      </XStack>

      <ConstellationPicker
        catalog={catalog}
        discoveredCardIds={discoveredCardIds}
        selectedId={constellation?.id}
        onSelect={(nextConstellationId) => router.replace({ pathname: '/map', params: { constellation: nextConstellationId } })}
      />

      <YStack
        minHeight={460}
        borderRadius="$4"
        borderWidth={1}
        borderColor="$border"
        backgroundColor="$paper"
        padding="$4"
        gap="$4"
        justifyContent="center"
      >
        {viewMode === 'map' ? (
          <XStack flexWrap="wrap" justifyContent="center" gap="$4">
            {nodes.map((card) => (
              <KnowledgeNode
                key={card.id}
                card={card}
                discovered={discoveredCardIds.includes(card.id)}
                focused={focus === card.id}
                onPress={() => router.push(`/card/${card.id}` as never)}
              />
            ))}
          </XStack>
        ) : (
          <YStack gap="$2">
            {nodes.map((card) => {
              const discovered = discoveredCardIds.includes(card.id)
              return (
                <XStack
                  key={card.id}
                  onPress={discovered ? () => router.push(`/card/${card.id}` as never) : undefined}
                  minHeight={48}
                  alignItems="center"
                  padding="$3"
                  borderRadius="$2"
                  borderWidth={1}
                  borderColor={focus === card.id ? '$gold' : '$border'}
                  backgroundColor={discovered ? '$surface' : '$surfaceMuted'}
                  gap="$3"
                >
                  <Text color={discovered ? '$goldDark' : '$muted'} fontFamily="$heading" fontSize={18} fontWeight="700">
                    {discovered ? getFrenchTitle(card).charAt(0).toUpperCase() : '?'}
                  </Text>
                  <YStack flex={1}>
                    <Text color="$ink" fontSize={11} fontWeight="800">{discovered ? getFrenchTitle(card).toUpperCase() : 'À DÉCOUVRIR'}</Text>
                    <Text color="$muted" fontSize={9}>{getFrenchSubtitle(card)}</Text>
                  </YStack>
                </XStack>
              )
            })}
          </YStack>
        )}

        {constellation ? <ConstellationCore constellation={constellation} /> : null}

        {nodes.length === 0 ? (
          <Text color="$muted" fontSize={12} lineHeight={18} textAlign="center">
            Le catalogue ne contient encore aucune carte pour cette branche.
          </Text>
        ) : null}
      </YStack>

      <CardheonButton variant="secondary" onPress={() => router.push('/collection')}>
        {constellation?.localization.fr?.title
          ? `EXPLORER ${constellation.localization.fr.title.toUpperCase()}`
          : 'EXPLORER LE CATALOGUE'}
      </CardheonButton>
    </CardheonScreen>
  )
}

function selectActiveConstellation(
  constellations: Constellation[],
  discoveredCardIds: string[],
): Constellation | undefined {
  const discovered = new Set(discoveredCardIds)

  return [...constellations].sort((left, right) => {
    const leftProgress = left.cardIds.filter((id) => discovered.has(id)).length / Math.max(1, left.cardIds.length)
    const rightProgress = right.cardIds.filter((id) => discovered.has(id)).length / Math.max(1, right.cardIds.length)
    return rightProgress - leftProgress
  })[0]
}

function ConstellationCore({ constellation }: { constellation: Constellation }) {
  const title = constellation.localization.fr?.title ?? constellation.slug

  return (
    <YStack alignItems="center" gap="$2">
      <YStack width="70%" height={1} backgroundColor="$borderStrong" opacity={0.6} />
      <XStack
        minWidth={132}
        minHeight={78}
        borderRadius="$4"
        borderWidth={2}
        borderColor="$gold"
        backgroundColor="$goldPale"
        padding="$3"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="$ink" fontFamily="$heading" fontSize={14} lineHeight={19} fontWeight="700" textAlign="center">
          {title.toUpperCase()}
        </Text>
      </XStack>
    </YStack>
  )
}

function KnowledgeNode({
  card,
  discovered,
  focused,
  onPress,
}: {
  card: Card
  discovered: boolean
  focused: boolean
  onPress: () => void
}) {
  const title = getFrenchTitle(card)

  return (
    <YStack width={104} alignItems="center" gap="$1">
      <XStack
        onPress={discovered ? onPress : undefined}
        width={66}
        height={66}
        borderRadius={33}
        borderWidth={2}
        borderColor={focused ? '$goldDark' : discovered ? '$gold' : '$border'}
        backgroundColor={discovered ? '$goldPale' : '$surfaceMuted'}
        alignItems="center"
        justifyContent="center"
      >
        <Text color={discovered ? '$goldDark' : '$muted'} fontFamily="$heading" fontSize={22} lineHeight={27} fontWeight="700">
          {discovered ? title.charAt(0).toUpperCase() : '?'}
        </Text>
      </XStack>
      <Text color="$ink" fontFamily="$heading" fontSize={8} lineHeight={11} fontWeight="700" textAlign="center" numberOfLines={2}>
        {discovered ? title.toUpperCase() : 'À DÉCOUVRIR'}
      </Text>
      <Text color="$muted" fontSize={7} lineHeight={10} textAlign="center" numberOfLines={1}>
        {getFrenchSubtitle(card)}
      </Text>
    </YStack>
  )
}
