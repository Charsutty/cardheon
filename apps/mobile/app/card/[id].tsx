import type { Card, DiscoveryEvidence, DiscoveryModifier } from '@cardheon/game-engine'
import { CardheonButton, CardheonHeader, CardheonScreen, DiscoveryCard } from '@cardheon/ui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, type ReactNode } from 'react'
import { ScrollView, Text, XStack, YStack } from 'tamagui'
import { buildProgressionGraph, ProgressionGraph } from '../../src/features/card-detail/components/ProgressionGraph'
import { getFrenchSubtitle, getFrenchTitle, toDiscoveryCard } from '../../src/game/catalog'
import { useGame } from '../../src/state/GameProvider'

export default function CardDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { catalog, getCard, getCardState, progress } = useGame()
  const card = id ? getCard(id) : undefined
  const state = card ? getCardState(card.id).state : 'locked'
  const isKnown = state === 'discovered' || state === 'mastered' || state === 'unlocked'

  const relatedCards = useMemo(() => {
    if (!card) return []
    return catalog.relationships
      .filter((relationship) => relationship.source === card.id || relationship.target === card.id)
      .map((relationship) => getCard(relationship.source === card.id ? relationship.target : relationship.source))
      .filter((related): related is Card => Boolean(related))
      .filter((related) => isVisibleCard(related, getCardState(related.id).state))
      .filter(uniqueCardById)
      .slice(0, 8)
  }, [card, catalog.relationships, getCard, getCardState])

  if (!card) {
    return (
      <CardheonScreen>
        <Text color="$ink" fontFamily="$heading" fontSize={21} fontWeight="700">Carte introuvable</Text>
        <CardheonButton onPress={() => router.replace('/collection')}>RETOUR COLLECTION</CardheonButton>
      </CardheonScreen>
    )
  }

  const model = toDiscoveryCard(card)
  const fr = card.localization.fr
  const constellations = catalog.constellations.filter((constellation) => constellation.cardIds.includes(card.id))
  const sources = catalog.sources.filter((source) => card.sourceIds?.includes(source.id))
  const discoveryRoute = isKnown && card.discovery ? buildDiscoveryRoute(card, catalog.cards, getCardState) : null
  const progressionGraph = useMemo(
    () => card && isKnown ? buildProgressionGraph(card, catalog, getCardState) : null,
    [card, catalog, getCardState, isKnown],
  )

  return (
    <CardheonScreen>
      <CardheonHeader coins={progress.xp} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap="$4" paddingBottom="$4">
          <XStack gap="$4" alignItems="center">
            <DiscoveryCard {...model} state={isKnown ? 'default' : 'locked'} size="large" />
            <YStack flex={1} gap="$2">
              <Text color="$goldDark" fontSize={10} fontWeight="800" letterSpacing={1}>{card.kind.toUpperCase()}</Text>
              <Text color="$ink" fontFamily="$heading" fontSize={24} lineHeight={30} fontWeight="700">
                {isKnown ? getFrenchTitle(card) : 'Carte à découvrir'}
              </Text>
              <Text color="$muted" fontSize={12} lineHeight={17}>
                {isKnown ? getFrenchSubtitle(card) : 'Continue l’Atelier pour révéler cette figure.'}
              </Text>
              <Text color="$goldDark" fontSize={10} fontWeight="800">RARETÉ {(model.rarity ?? 'common').toUpperCase()}</Text>
            </YStack>
          </XStack>

          <DetailSection title="Résumé">
            <Text color="$ink" fontSize={12} lineHeight={18}>
              {isKnown
                ? fr?.shortDescription ?? fr?.longDescription ?? 'Cette carte n’a pas encore de résumé éditorial.'
                : 'Les détails complets se débloquent avec la découverte.'}
            </Text>
          </DetailSection>

          {isKnown && fr?.longDescription ? (
            <DetailSection title="Contexte">
              <Text color="$ink" fontSize={12} lineHeight={18}>{fr.longDescription}</Text>
            </DetailSection>
          ) : null}

          {constellations.length > 0 ? (
            <DetailSection title="Constellations">
              <YStack gap="$2">
                {constellations.map((constellation) => (
                  <Text key={constellation.id} color="$ink" fontSize={12} lineHeight={16} fontWeight="700">
                    {(constellation.localization.fr?.title ?? constellation.slug).toUpperCase()}
                  </Text>
                ))}
              </YStack>
            </DetailSection>
          ) : null}

          {discoveryRoute ? (
            <DetailSection title="Routes de découverte">
              <YStack gap="$3">
                <RouteSummary
                  minScore={card.discovery?.minScore}
                  minEvidenceCount={card.discovery?.minEvidenceCount}
                  unlockedCount={discoveryRoute.evidence.filter((item) => item.known).length}
                  totalCount={discoveryRoute.evidence.length}
                />
                <YStack gap="$2">
                  <Text color="$brown" fontSize={10} fontWeight="800">INDICES DIRECTS</Text>
                  {discoveryRoute.evidence.map((item, index) => (
                    <RouteRow
                      key={`${item.kind}-${item.id}-${index}`}
                      title={item.title}
                      detail={item.reason}
                      weight={item.weight}
                      known={item.known}
                      onPress={item.cardId ? () => router.push(`/card/${item.cardId}` as never) : undefined}
                    />
                  ))}
                </YStack>
                {discoveryRoute.synergies.length > 0 ? (
                  <YStack gap="$2">
                    <Text color="$brown" fontSize={10} fontWeight="800">COMBINAISONS FORTES</Text>
                    {discoveryRoute.synergies.map((item) => (
                      <ModifierRoute key={item.id} modifier={item} />
                    ))}
                  </YStack>
                ) : null}
                {discoveryRoute.contradictions.length > 0 ? (
                  <YStack gap="$2">
                    <Text color="$brown" fontSize={10} fontWeight="800">FAUSSES PISTES</Text>
                    {discoveryRoute.contradictions.map((item) => (
                      <ModifierRoute key={item.id} modifier={item} />
                    ))}
                  </YStack>
                ) : null}
              </YStack>
            </DetailSection>
          ) : null}

          {relatedCards.length > 0 ? (
            <DetailSection title="Cartes liées">
              <XStack flexWrap="wrap" gap="$2">
                {relatedCards.map((related) => (
                  <CardheonButton key={related.id} variant="secondary" onPress={() => router.push(`/card/${related.id}` as never)}>
                    {getFrenchTitle(related).toUpperCase()}
                  </CardheonButton>
                ))}
              </XStack>
            </DetailSection>
          ) : null}

          {sources.length > 0 ? (
            <DetailSection title="Sources">
              <YStack gap="$2">
                {sources.map((source) => (
                  <Text key={source.id} color="$muted" fontSize={10} lineHeight={14}>
                    {source.title}
                  </Text>
                ))}
              </YStack>
            </DetailSection>
          ) : null}

          {progressionGraph && progressionGraph.levels.length > 1 ? (
            <DetailSection title="Progression du graphe">
              <YStack gap="$3">
                <Text color="$ink" fontSize={12} lineHeight={18}>
                  Chemin reconstruit depuis les cartes de départ et les déblocages connus vers cette carte.
                </Text>
                <ProgressionGraph
                  graph={progressionGraph}
                  onOpenCard={(cardId) => router.push(`/card/${cardId}` as never)}
                />
              </YStack>
            </DetailSection>
          ) : null}
        </YStack>
      </ScrollView>
    </CardheonScreen>
  )
}

type RouteItem = {
  id: string
  kind: 'card' | 'tag'
  title: string
  reason: string
  weight: number
  known: boolean
  cardId?: string
}

type ModifierRouteItem = {
  id: string
  reason: string
  weight: number
  inputs: RouteItem[]
}

function buildDiscoveryRoute(
  card: Card,
  cards: Card[],
  getCardState: ReturnType<typeof useGame>['getCardState'],
) {
  const byId = new Map(cards.map((item) => [item.id, item]))
  const resolveEvidence = (evidence: DiscoveryEvidence | string): RouteItem => {
    const normalized = typeof evidence === 'string' ? { card: evidence, weight: 0 } : evidence
    const id = normalized.card ?? normalized.tag ?? 'unknown'
    const directCard = byId.get(id)
    const tagCard = directCard ?? cards.find((item) => item.tags?.some((tag) => tag.tag === id))
    const state = tagCard ? getCardState(tagCard.id).state : 'locked'
    const known = state === 'unlocked' || state === 'discovered' || state === 'mastered'

    return {
      id,
      kind: normalized.card ? 'card' : 'tag',
      title: tagCard ? getFrenchTitle(tagCard) : id.replace(/\./g, ' '),
      reason: normalized.reason ?? (normalized.card ? 'Carte précise' : 'Famille d’indice'),
      weight: normalized.weight,
      known,
      cardId: tagCard?.id,
    }
  }

  const resolveModifier = (modifier: DiscoveryModifier): ModifierRouteItem => ({
    id: modifier.id,
    reason: modifier.reason,
    weight: modifier.weight,
    inputs: modifier.whenAll.map(resolveEvidence),
  })

  return {
    evidence: card.discovery?.evidence.map(resolveEvidence) ?? [],
    synergies: card.discovery?.synergies?.map(resolveModifier) ?? [],
    contradictions: card.discovery?.contradictions?.map(resolveModifier) ?? [],
  }
}

function isVisibleCard(card: Card, state: string) {
  if (card.kind === 'figure') return state === 'discovered' || state === 'mastered'
  return state === 'unlocked' || state === 'discovered' || state === 'mastered'
}

function uniqueCardById(card: Card, index: number, cards: Card[]) {
  return cards.findIndex((candidate) => candidate.id === card.id) === index
}

function RouteSummary({
  minScore,
  minEvidenceCount,
  unlockedCount,
  totalCount,
}: {
  minScore?: number
  minEvidenceCount?: number
  unlockedCount: number
  totalCount: number
}) {
  return (
    <YStack borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$paper" padding="$3" gap="$1">
      <Text color="$ink" fontSize={12} lineHeight={17}>
        Cette carte se construit par score d’indices. Les cartes déjà débloquées indiquent les chemins que tu peux rejouer dans l’Atelier.
      </Text>
      <Text color="$goldDark" fontSize={10} fontWeight="800">
        {unlockedCount} / {totalCount} indices accessibles · seuil {minScore ?? 'n/a'} · minimum {minEvidenceCount ?? 1} preuves
      </Text>
    </YStack>
  )
}

function RouteRow({
  title,
  detail,
  weight,
  known,
  onPress,
}: {
  title: string
  detail: string
  weight: number
  known: boolean
  onPress?: () => void
}) {
  return (
    <XStack
      onPress={onPress}
      minHeight={48}
      borderRadius="$2"
      borderWidth={1}
      borderColor={known ? '$gold' : '$border'}
      backgroundColor={known ? '$goldPale' : '$paper'}
      padding="$2"
      gap="$2"
      alignItems="center"
    >
      <YStack width={30} height={30} borderRadius={15} backgroundColor={known ? '$gold' : '$surfaceMuted'} alignItems="center" justifyContent="center">
        <Text color={known ? '$white' : '$muted'} fontSize={12} fontWeight="900">{known ? '✓' : '?'}</Text>
      </YStack>
      <YStack flex={1} minWidth={0}>
        <Text color="$ink" fontSize={11} lineHeight={15} fontWeight="800" numberOfLines={1}>{title.toUpperCase()}</Text>
        <Text color="$muted" fontSize={9} lineHeight={13} numberOfLines={1}>{detail}</Text>
      </YStack>
      <Text color={weight >= 0 ? '$goldDark' : '$danger'} fontSize={10} fontWeight="800">
        {weight > 0 ? '+' : ''}{weight}
      </Text>
    </XStack>
  )
}

function ModifierRoute({ modifier }: { modifier: ModifierRouteItem }) {
  return (
    <YStack borderRadius="$2" borderWidth={1} borderColor="$border" backgroundColor="$paper" padding="$2" gap="$2">
      <XStack justifyContent="space-between" gap="$2">
        <Text color="$ink" fontSize={11} lineHeight={15} fontWeight="800" flex={1}>{modifier.reason}</Text>
        <Text color={modifier.weight >= 0 ? '$goldDark' : '$danger'} fontSize={10} fontWeight="800">
          {modifier.weight > 0 ? '+' : ''}{modifier.weight}
        </Text>
      </XStack>
      <XStack flexWrap="wrap" gap="$2">
        {modifier.inputs.map((input, index) => (
          <XStack key={`${modifier.id}-${input.id}-${index}`} borderRadius="$1" borderWidth={1} borderColor={input.known ? '$gold' : '$border'} backgroundColor={input.known ? '$goldPale' : '$surface'} paddingHorizontal="$2" paddingVertical="$1">
            <Text color={input.known ? '$goldDark' : '$muted'} fontSize={9} fontWeight="800">{input.title.toUpperCase()}</Text>
          </XStack>
        ))}
      </XStack>
    </YStack>
  )
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <YStack borderRadius="$3" borderWidth={1} borderColor="$border" backgroundColor="$surface" padding="$3" gap="$2">
      <Text color="$goldDark" fontSize={10} fontWeight="800" letterSpacing={1}>{title.toUpperCase()}</Text>
      {children}
    </YStack>
  )
}
