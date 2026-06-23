import type { Card, GameCatalog } from "@cardheon/game-engine";
import type { AdminGraph, AdminGraphEdge, AdminGraphNode } from "./graphTypes";

const titleOf = (card: Card) => card.localization.fr?.title ?? card.slug ?? card.id;
const tokenNodeId = (token: string) => token.startsWith("card:") ? token.slice(5) : token.startsWith("tag:") ? `tag:${token.slice(4)}` : `tag:${token}`;

export function buildAdminGraph(catalog: GameCatalog): AdminGraph {
  const nodes = new Map<string, AdminGraphNode>();
  const edges: AdminGraphEdge[] = [];
  let edgeSequence = 0;
  const addNode = (node: AdminGraphNode) => { if (!nodes.has(node.id)) nodes.set(node.id, node); };
  const addEdge = (edge: Omit<AdminGraphEdge, "id">) => edges.push({ ...edge, id: `edge:${edgeSequence++}:${edge.source}:${edge.target}` });
  const addTag = (tag: string) => addNode({ id: `tag:${tag}`, type: "tag", label: tag, tags: [tag] });

  for (const card of catalog.cards) {
    addNode({
      id: card.id,
      type: card.kind === "figure" ? "figure" : "tool",
      label: titleOf(card),
      cardKind: card.kind,
      rarity: card.rarity,
      status: card.status,
      tags: card.tags?.map((tag) => tag.tag) ?? [],
      entity: card,
    });
    for (const tag of card.tags ?? []) addTag(tag.tag);
  }

  for (const source of catalog.sources) addNode({ id: source.id, type: "source", label: source.title, entity: source });
  for (const constellation of catalog.constellations) {
    const id = `constellation:${constellation.id}`;
    addNode({ id, type: "constellation", label: constellation.localization.fr?.title ?? constellation.id, entity: constellation });
    for (const figureId of constellation.cardIds) {
      addEdge({ source: figureId, target: id, type: "constellation_member", label: "membre" });
    }
    for (const rewardId of constellation.reward?.unlockCardIds ?? []) {
      addEdge({ source: id, target: rewardId, type: "constellation_reward", label: "récompense" });
    }
  }

  for (const card of catalog.cards) {
    for (const sourceId of card.sourceIds ?? []) {
      addEdge({ source: card.id, target: sourceId, type: "source_reference", label: "source" });
    }
    for (const unlockedId of card.unlocksToolCardIds ?? []) {
      addEdge({ source: card.id, target: unlockedId, type: "figure_unlock", label: "débloque" });
    }
    const rule = card.discovery;
    if (!rule) continue;
    for (const evidence of rule.evidence) {
      const source = evidence.card ?? (evidence.tag ? `tag:${evidence.tag}` : "");
      if (!source) continue;
      if (evidence.tag) addTag(evidence.tag);
      addEdge({
        source,
        target: card.id,
        type: "discovery_evidence",
        label: evidence.reason ?? evidence.card ?? evidence.tag ?? "evidence",
        reason: evidence.reason,
        weight: evidence.weight,
        isPositive: evidence.weight >= 0,
      });
    }
    for (const [kind, modifiers] of [["discovery_synergy", rule.synergies ?? []], ["discovery_contradiction", rule.contradictions ?? []]] as const) {
      for (const modifier of modifiers) {
        const modifierId = `${kind === "discovery_synergy" ? "synergy" : "contradiction"}:${card.id}:${modifier.id}`;
        addNode({ id: modifierId, type: "modifier", label: modifier.reason, score: modifier.weight, entity: modifier });
        for (const token of modifier.whenAll) {
          const source = tokenNodeId(token);
          if (source.startsWith("tag:")) addTag(source.slice(4));
          addEdge({ source, target: modifierId, type: kind, label: "condition", reason: modifier.reason });
        }
        addEdge({
          source: modifierId,
          target: card.id,
          type: kind,
          label: modifier.reason,
          reason: modifier.reason,
          weight: modifier.weight,
          isPositive: modifier.weight >= 0,
          isNegative: modifier.weight < 0,
        });
      }
    }
  }

  for (const relationship of catalog.relationships) {
    addEdge({
      source: relationship.source,
      target: relationship.target,
      type: "historical_relationship",
      label: relationship.predicate,
      predicate: relationship.predicate,
      weight: relationship.weight,
      sourceIds: relationship.sourceIds,
    });
  }

  for (const recipe of catalog.gameplay.crafting ?? []) {
    const id = `recipe:${recipe.id}`;
    const reason = recipe.localization?.fr?.reason;
    addNode({ id, type: "recipe", label: recipe.id.replace(/^recipe\./, ""), entity: recipe });
    for (const input of recipe.inputs) addEdge({ source: input, target: id, type: "craft_input", label: "ingrédient", reason });
    addEdge({ source: id, target: recipe.outputCardId, type: "craft_output", label: reason ?? "produit", reason });
  }

  return { nodes: [...nodes.values()], edges, nodeById: nodes, catalog };
}
