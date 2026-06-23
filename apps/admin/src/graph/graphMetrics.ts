import type { Card, GameCatalog } from "@cardheon/game-engine";
import { findDiscoveryWitnesses } from "./discoveryWitnesses";
import type { AdminGraph, GraphIssue } from "./graphTypes";

export type ProgressionAudit = {
  starterTools: string[];
  reachableTools: string[];
  discoveredFigures: string[];
  blockedFigures: string[];
  validDiscoveryOrder: string[];
  circularities: string[];
};

export function analyzeProgression(catalog: GameCatalog): ProgressionAudit {
  const starterTools = catalog.packs.flatMap((pack) => pack.starterCardIds);
  const tools = new Set(starterTools);
  const discovered = new Set<string>();
  const order: string[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (const recipe of catalog.gameplay.crafting ?? []) {
      if (!tools.has(recipe.outputCardId) && recipe.inputs.every((input) => tools.has(input))) {
        tools.add(recipe.outputCardId); changed = true;
      }
    }
    for (const figure of catalog.cards.filter((card) => card.kind === "figure" && !discovered.has(card.id))) {
      const witness = findDiscoveryWitnesses(catalog, figure.id, [...tools], {
        minInputs: catalog.gameplay.discovery.minInputs,
        maxInputs: catalog.gameplay.discovery.maxInputs,
        maxWitnesses: 1,
      }).find((item) => item.resultType === "new_figure");
      if (!witness) continue;
      discovered.add(figure.id); order.push(figure.id); changed = true;
      for (const unlocked of figure.unlocksToolCardIds ?? []) tools.add(unlocked);
      for (const constellationId of figure.constellationIds ?? []) {
        const constellation = catalog.constellations.find((item) => item.id === constellationId);
        if (constellation?.cardIds.every((id) => discovered.has(id))) {
          for (const unlocked of constellation.reward?.unlockCardIds ?? []) tools.add(unlocked);
        }
      }
    }
  }
  const figures = catalog.cards.filter((card) => card.kind === "figure");
  const circularities = figures.flatMap((figure) =>
    (figure.unlocksToolCardIds ?? []).filter((id) => figure.discovery?.evidence.some((evidence) => evidence.card === id))
      .map((id) => `${figure.id} dépend directement de ${id}, qu’elle débloque elle-même.`),
  );
  return {
    starterTools,
    reachableTools: [...tools],
    discoveredFigures: [...discovered],
    blockedFigures: figures.filter((figure) => !discovered.has(figure.id)).map((figure) => figure.id),
    validDiscoveryOrder: order,
    circularities,
  };
}

export function computeIssues(graph: AdminGraph, progression: ProgressionAudit): GraphIssue[] {
  const { catalog } = graph;
  const cardIds = new Set(catalog.cards.map((card) => card.id));
  const sourceIds = new Set(catalog.sources.map((source) => source.id));
  const issues: GraphIssue[] = [];
  const issue = (severity: GraphIssue["severity"], code: string, message: string, nodeId?: string) => issues.push({ severity, code, message, nodeId });
  for (const card of catalog.cards) {
    if (card.kind === "figure" && !card.discovery) issue("error", "missing-rule", `${card.id} n’a pas de règle discovery.`, card.id);
    for (const evidence of card.discovery?.evidence ?? []) if (evidence.card && !cardIds.has(evidence.card)) issue("error", "unknown-evidence", `${card.id}: evidence inconnue ${evidence.card}.`, card.id);
    for (const sourceId of card.sourceIds ?? []) if (!sourceIds.has(sourceId)) issue("error", "unknown-source", `${card.id}: source inconnue ${sourceId}.`, card.id);
    const maxScore = (card.discovery?.evidence ?? []).reduce((sum, evidence) => sum + Math.max(0, evidence.weight), 0)
      + (card.discovery?.synergies ?? []).reduce((sum, modifier) => sum + Math.max(0, modifier.weight), 0);
    if (card.discovery && maxScore < (card.discovery.minScore ?? 85)) issue("warning", "low-max-score", `${card.id}: score théorique ${maxScore} < seuil ${card.discovery.minScore ?? 85}.`, card.id);
    for (const evidence of card.discovery?.evidence ?? []) if (Math.abs(evidence.weight) >= 60 || Math.abs(evidence.weight) <= 5) issue("warning", "odd-weight", `${card.id}: poids d’evidence atypique ${evidence.weight}.`, card.id);
    for (const contradiction of card.discovery?.contradictions ?? []) if (contradiction.weight <= -50) issue("warning", "strong-penalty", `${card.id}: pénalité forte ${contradiction.weight}.`, card.id);
  }
  for (const relationship of catalog.relationships) {
    if (!cardIds.has(relationship.source) || !cardIds.has(relationship.target)) issue("error", "unknown-relationship-node", `Relation invalide ${relationship.source} → ${relationship.target}.`);
    if (!(relationship.sourceIds?.length)) issue("warning", "unsourced-relationship", `Relation sans source ${relationship.source} → ${relationship.target}.`, relationship.source);
  }
  for (const recipe of catalog.gameplay.crafting ?? []) {
    for (const id of [...recipe.inputs, recipe.outputCardId]) if (!cardIds.has(id)) issue("error", "unknown-recipe-card", `${recipe.id}: carte inconnue ${id}.`, `recipe:${recipe.id}`);
  }
  for (const constellation of catalog.constellations) {
    for (const id of constellation.cardIds) if (!cardIds.has(id)) issue("error", "unknown-member", `${constellation.id}: membre inconnu ${id}.`, `constellation:${constellation.id}`);
  }
  const used = new Set(graph.edges.flatMap((edge) => [edge.source, edge.target]));
  for (const card of catalog.cards) if (!used.has(card.id)) issue("warning", "orphan-card", `${card.id} n’est reliée à aucun élément.`, card.id);
  for (const id of progression.blockedFigures) issue("error", "blocked-figure", `${id} est impossible à atteindre depuis le starter pack.`, id);
  for (const message of progression.circularities) issue("error", "circularity", message);
  return issues.sort((a, b) => ({ error: 0, warning: 1, info: 2 }[a.severity] - { error: 0, warning: 1, info: 2 }[b.severity]));
}

export function graphStats(catalog: GameCatalog) {
  const figures = catalog.cards.filter((card) => card.kind === "figure");
  const rules = figures.map((card) => card.discovery).filter(Boolean);
  const evidence = rules.flatMap((rule) => rule?.evidence ?? []);
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  return {
    cartes: catalog.cards.length,
    figures: figures.length,
    outils: catalog.cards.length - figures.length,
    relations: catalog.relationships.length,
    règles: rules.length,
    recettes: catalog.gameplay.crafting?.length ?? 0,
    constellations: catalog.constellations.length,
    "evidences / figure": average(rules.map((rule) => rule?.evidence.length ?? 0)).toFixed(1),
    "seuil moyen": average(rules.map((rule) => rule?.minScore ?? 85)).toFixed(1),
    "poids moyen": average(evidence.map((item) => item.weight)).toFixed(1),
    synergies: rules.reduce((sum, rule) => sum + (rule?.synergies?.length ?? 0), 0),
    contradictions: rules.reduce((sum, rule) => sum + (rule?.contradictions?.length ?? 0), 0),
  };
}

export const cardTitle = (catalog: GameCatalog, id: string) =>
  (catalog.cards.find((card) => card.id === id) as Card | undefined)?.localization.fr?.title ?? id;
