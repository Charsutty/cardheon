import type { Card, DiscoveryEvidence, GameCatalog } from '@cardheon/game-engine'
import { Text, XStack, YStack } from 'tamagui'
import { getFrenchSubtitle, getFrenchTitle } from '../../../game/catalog'
import { useGame } from '../../../state/GameProvider'

export type ProgressionNode = {
  id: string
  title: string
  subtitle: string
  kind: Card['kind']
  state: string
  isStarter: boolean
  isTarget: boolean
}

export type ProgressionEdge = {
  id: string
  sourceId: string
  targetId: string
  label: string
  kind: 'evidence' | 'synergy' | 'contradiction' | 'craft' | 'unlock'
  weight?: number
}

export type ProgressionGraphModel = {
  targetId: string
  levels: ProgressionNode[][]
  edges: ProgressionEdge[]
}

type GetCardState = ReturnType<typeof useGame>['getCardState']

export function buildProgressionGraph(
  target: Card,
  catalog: GameCatalog,
  getCardState: GetCardState,
): ProgressionGraphModel {
  const byId = new Map(catalog.cards.map((item) => [item.id, item]))
  const starterIds = new Set(catalog.packs.flatMap((pack) => pack.starterCardIds))
  const incoming = new Map<string, ProgressionEdge[]>()
  const edgeById = new Map<string, ProgressionEdge>()

  const addEdge = (
    sourceId: string | undefined,
    targetId: string | undefined,
    kind: ProgressionEdge['kind'],
    label: string,
    weight?: number,
  ) => {
    if (!sourceId || !targetId || sourceId === targetId) return
    if (!byId.has(sourceId) || !byId.has(targetId)) return
    const id = `${kind}:${sourceId}->${targetId}:${label}:${weight ?? ''}`
    if (edgeById.has(id)) return
    const edge: ProgressionEdge = { id, sourceId, targetId, kind, label, weight }
    edgeById.set(id, edge)
    incoming.set(targetId, [...(incoming.get(targetId) ?? []), edge])
  }

  const resolveEvidenceCardIds = (evidence: DiscoveryEvidence | string): string[] => {
    const normalized = typeof evidence === 'string' ? { card: evidence, weight: 0 } : evidence
    if (normalized.card && byId.has(normalized.card)) return [normalized.card]
    if (!normalized.tag) return []
    return dedupe(
      catalog.cards
        .filter((candidate) => candidate.id === normalized.tag || candidate.tags?.some((tag) => tag.tag === normalized.tag))
        .map((candidate) => candidate.id),
    ).slice(0, 3)
  }

  for (const candidate of catalog.cards) {
    if (candidate.discovery) {
      for (const evidence of candidate.discovery.evidence) {
        for (const sourceId of resolveEvidenceCardIds(evidence)) {
          addEdge(sourceId, candidate.id, 'evidence', evidence.reason ?? 'Indice', evidence.weight)
        }
      }
      for (const modifier of candidate.discovery.synergies ?? []) {
        for (const evidence of modifier.whenAll) {
          for (const sourceId of resolveEvidenceCardIds(evidence)) {
            addEdge(sourceId, candidate.id, 'synergy', modifier.reason, modifier.weight)
          }
        }
      }
      for (const modifier of candidate.discovery.contradictions ?? []) {
        for (const evidence of modifier.whenAll) {
          for (const sourceId of resolveEvidenceCardIds(evidence)) {
            addEdge(sourceId, candidate.id, 'contradiction', modifier.reason, modifier.weight)
          }
        }
      }
    }
    for (const toolId of candidate.unlocksToolCardIds ?? []) {
      addEdge(candidate.id, toolId, 'unlock', 'Débloque')
    }
  }

  for (const recipe of catalog.gameplay.crafting ?? []) {
    for (const inputId of recipe.inputs) {
      addEdge(inputId, recipe.outputCardId, 'craft', recipe.localization?.fr?.reason ?? 'Recette')
    }
  }

  for (const relationship of catalog.relationships) {
    if (relationship.predicate === 'unlocks') {
      addEdge(relationship.source, relationship.target, 'unlock', 'Débloque', relationship.weight)
    }
  }

  const levelById = new Map<string, number>([[target.id, 0]])
  const selectedEdges = new Map<string, ProgressionEdge>()
  const queue = [target.id]
  const maxDepth = 5

  while (queue.length > 0) {
    const currentId = queue.shift()!
    const currentDepth = levelById.get(currentId) ?? 0
    if (currentDepth >= maxDepth) continue
    const predecessorEdges = dedupeEdges(incoming.get(currentId) ?? [])
      .filter((edge) => {
        const source = byId.get(edge.sourceId)
        if (!source) return false
        return starterIds.has(edge.sourceId) || isVisibleCard(source, getCardState(edge.sourceId).state)
      })
      .sort((left, right) => (right.weight ?? 0) - (left.weight ?? 0))
      .slice(0, 8)

    for (const edge of predecessorEdges) {
      selectedEdges.set(edge.id, edge)
      const nextDepth = currentDepth + 1
      const existingDepth = levelById.get(edge.sourceId)
      if (existingDepth !== undefined && existingDepth <= nextDepth) continue
      levelById.set(edge.sourceId, nextDepth)
      queue.push(edge.sourceId)
    }
  }

  const maxLevel = Math.max(...levelById.values())
  const levels: ProgressionNode[][] = Array.from({ length: maxLevel + 1 }, () => [])
  for (const [cardId, reverseLevel] of levelById) {
    const graphCard = byId.get(cardId)
    if (!graphCard) continue
    const state = getCardState(cardId).state
    levels[maxLevel - reverseLevel].push({
      id: cardId,
      title: getFrenchTitle(graphCard),
      subtitle: getFrenchSubtitle(graphCard),
      kind: graphCard.kind,
      state,
      isStarter: starterIds.has(cardId),
      isTarget: cardId === target.id,
    })
  }

  for (const level of levels) {
    level.sort((left, right) => Number(right.isStarter) - Number(left.isStarter) || left.title.localeCompare(right.title))
  }

  const visibleIds = new Set(levels.flat().map((node) => node.id))
  const edges = [...selectedEdges.values()].filter((edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId))

  return {
    targetId: target.id,
    levels: levels.filter((level) => level.length > 0),
    edges,
  }
}

export function ProgressionGraph({
  graph,
  onOpenCard,
}: {
  graph: ProgressionGraphModel
  onOpenCard: (cardId: string) => void
}) {
  return (
    <YStack gap="$3">
      {graph.levels.map((level, index) => (
        <YStack key={`level-${index}`} gap="$2">
          {index > 0 ? <EdgeBand edges={edgesBetween(graph, index - 1, index)} /> : null}
          <XStack flexWrap="wrap" gap="$2" justifyContent="center">
            {level.map((node) => (
              <ProgressionNodeChip key={node.id} node={node} onPress={() => onOpenCard(node.id)} />
            ))}
          </XStack>
        </YStack>
      ))}
    </YStack>
  )
}

function EdgeBand({ edges }: { edges: ProgressionEdge[] }) {
  const displayed = dedupeEdges(edges).slice(0, 5)

  return (
    <YStack alignItems="center" gap="$1">
      <YStack width={1} height={14} backgroundColor="$borderStrong" />
      {displayed.length > 0 ? (
        <XStack flexWrap="wrap" gap="$1" justifyContent="center">
          {displayed.map((edge) => (
            <XStack key={edge.id} borderRadius="$1" borderWidth={1} borderColor="$border" backgroundColor="$surface" paddingHorizontal="$2" paddingVertical={2}>
              <Text color={edge.kind === 'contradiction' ? '$danger' : '$goldDark'} fontSize={8} lineHeight={10} fontWeight="800" numberOfLines={1}>
                {edgeLabel(edge)}
              </Text>
            </XStack>
          ))}
        </XStack>
      ) : null}
      <YStack width={1} height={14} backgroundColor="$borderStrong" />
    </YStack>
  )
}

function ProgressionNodeChip({
  node,
  onPress,
}: {
  node: ProgressionNode
  onPress: () => void
}) {
  return (
    <YStack
      onPress={onPress}
      width={node.isTarget ? 180 : 132}
      minHeight={64}
      borderRadius="$2"
      borderWidth={node.isTarget ? 2 : 1}
      borderColor={node.isTarget ? '$gold' : node.isStarter ? '$borderStrong' : '$border'}
      backgroundColor={node.isTarget ? '$goldPale' : '$paper'}
      padding="$2"
      gap="$1"
      alignItems="center"
      justifyContent="center"
    >
      <Text color={node.isTarget ? '$goldDark' : '$ink'} fontSize={10} lineHeight={13} fontWeight="900" textAlign="center" numberOfLines={2}>
        {node.title.toUpperCase()}
      </Text>
      <Text color="$muted" fontSize={8} lineHeight={11} textAlign="center" numberOfLines={1}>
        {node.isStarter ? 'Départ' : node.kind}
      </Text>
    </YStack>
  )
}

function edgesBetween(graph: ProgressionGraphModel, sourceLevelIndex: number, targetLevelIndex: number) {
  const sourceIds = new Set(graph.levels[sourceLevelIndex]?.map((node) => node.id) ?? [])
  const targetIds = new Set(graph.levels[targetLevelIndex]?.map((node) => node.id) ?? [])
  return graph.edges.filter((edge) => sourceIds.has(edge.sourceId) && targetIds.has(edge.targetId))
}

function edgeLabel(edge: ProgressionEdge) {
  const prefix: Record<ProgressionEdge['kind'], string> = {
    evidence: 'indice',
    synergy: 'combo',
    contradiction: 'anti-piste',
    craft: 'craft',
    unlock: 'déblocage',
  }
  const weight = typeof edge.weight === 'number' ? ` ${edge.weight > 0 ? '+' : ''}${edge.weight}` : ''
  return `${prefix[edge.kind]}${weight}`
}

function isVisibleCard(card: Card, state: string) {
  if (card.kind === 'figure') return state === 'discovered' || state === 'mastered'
  return state === 'unlocked' || state === 'discovered' || state === 'mastered'
}

function dedupe(values: string[]) {
  return [...new Set(values)]
}

function dedupeEdges(edges: ProgressionEdge[]) {
  const seen = new Set<string>()
  return edges.filter((edge) => {
    const key = `${edge.sourceId}->${edge.targetId}:${edge.kind}:${edge.label}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
