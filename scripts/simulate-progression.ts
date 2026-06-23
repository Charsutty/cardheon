import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { attemptDiscovery, type Card, type DiscoveryResult, type GameCatalog } from "../packages/game-engine/src/index";

const DEFAULT_CATALOG_PATH = "content/catalog.dev.json";

type SimulationState = {
  unlocked: Set<string>;
  discovered: Set<string>;
  constellations: Map<string, Set<string>>;
  paths: Map<string, { combo: string[]; round: number }>;
};

function loadCatalog(path = DEFAULT_CATALOG_PATH): GameCatalog {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as GameCatalog;
}

function buildIndexes(catalog: GameCatalog) {
  const cardsById = new Map(catalog.cards.map((card) => [card.id, card]));
  const tagToCards = new Map<string, string[]>();

  for (const card of catalog.cards) {
    for (const { tag } of card.tags ?? []) {
      const list = tagToCards.get(tag) ?? [];
      list.push(card.id);
      tagToCards.set(tag, list);
    }
  }

  return { cardsById, tagToCards };
}

function satisfiesEvidence(cardId: string, evidence: { card?: string; tag?: string }, cardsById: Map<string, Card>): boolean {
  if (evidence.card && evidence.card === cardId) return true;
  if (!evidence.tag) return false;
  const card = cardsById.get(cardId);
  return card?.tags?.some((tag) => tag.tag === evidence.tag) ?? false;
}

function estimateContribution(cardId: string, figure: Card, cardsById: Map<string, Card>): number {
  if (figure.kind !== "figure" || !figure.discovery) return 0;
  let total = 0;
  for (const evidence of figure.discovery.evidence) {
    if (satisfiesEvidence(cardId, evidence, cardsById)) total += evidence.weight;
  }
  return total;
}

function combinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (items.length < size) return [];
  const [head, ...tail] = items;
  return [
    ...combinations(tail, size - 1).map((combo) => [head, ...combo]),
    ...combinations(tail, size),
  ];
}

function findDiscoveryPath(
  catalog: GameCatalog,
  figure: Card,
  state: SimulationState,
  cardsById: Map<string, Card>,
): string[] | null {
  if (figure.kind !== "figure" || !figure.discovery) return null;

  const scoredCandidates = [...state.unlocked]
    .map((cardId) => ({ cardId, score: estimateContribution(cardId, figure, cardsById) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .map((candidate) => candidate.cardId);

  // Discovered figures can be used as inputs for higher-level figures.
  const discoveredFigureInputs = [...state.discovered]
    .map((id) => cardsById.get(id))
    .filter((card): card is Card => card?.kind === "figure")
    .map((card) => card.id);

  const candidates = [...new Set([...scoredCandidates, ...discoveredFigureInputs])];

  for (const size of [2, 3, 4, 5]) {
    if (candidates.length < size) continue;
    for (const combo of combinations(candidates, size)) {
      const result: DiscoveryResult = attemptDiscovery(
        catalog,
        { discoveredCardIds: [...state.discovered], unlockedCardIds: [...state.unlocked] },
        combo,
      );
      if (result.type === "new_figure" && result.cardId === figure.id) {
        return combo;
      }
    }
  }

  return null;
}

function simulate(catalog: GameCatalog): SimulationState {
  const starterPack = catalog.packs.find((pack) => pack.id === "pack.starter");
  if (!starterPack) throw new Error("No starter pack found");

  const { cardsById } = buildIndexes(catalog);
  const state: SimulationState = {
    unlocked: new Set(starterPack.starterCardIds),
    discovered: new Set(),
    constellations: new Map(catalog.constellations.map((c) => [c.id, new Set()])),
    paths: new Map(),
  };

  let changed = true;
  let round = 0;
  const figures = catalog.cards.filter((card) => card.kind === "figure");

  while (changed && round < 20) {
    changed = false;
    round++;

    for (const figure of figures) {
      if (state.discovered.has(figure.id)) continue;
      const path = findDiscoveryPath(catalog, figure, state, cardsById);
      if (!path) continue;

      state.discovered.add(figure.id);
      state.paths.set(figure.id, { combo: path, round });

      for (const toolCardId of figure.unlocksToolCardIds ?? []) {
        state.unlocked.add(toolCardId);
      }

      for (const constellationId of figure.constellationIds ?? []) {
        const progress = state.constellations.get(constellationId)!;
        progress.add(figure.id);
        const constellation = catalog.constellations.find((c) => c.id === constellationId);
        if (constellation && progress.size === constellation.cardIds.length) {
          for (const rewardCardId of constellation.reward?.unlockCardIds ?? []) {
            state.unlocked.add(rewardCardId);
          }
        }
      }

      changed = true;
    }
  }

  return state;
}

function main(): void {
  const catalog = loadCatalog(process.argv[2] ?? DEFAULT_CATALOG_PATH);
  const state = simulate(catalog);
  const figures = catalog.cards.filter((card) => card.kind === "figure");

  console.info(`✅ Simulation complete after ${Math.max(...[...state.paths.values()].map((p) => p.round), 0)} round(s)`);
  console.info(`   Discovered: ${state.discovered.size} / ${figures.length} figures`);

  const undiscovered = figures.filter((figure) => !state.discovered.has(figure.id));
  if (undiscovered.length > 0) {
    console.info("\n⚠️ Undiscoverable figures:");
    for (const figure of undiscovered) {
      console.info(`   - ${figure.localization.fr?.title ?? figure.id}`);
    }
  }

  console.info("\nDiscovery paths:");
  for (const [figureId, { combo, round }] of state.paths) {
    const title = catalog.cards.find((card) => card.id === figureId)?.localization.fr?.title ?? figureId;
    console.info(`   [R${round}] ${title}: ${combo.join(" + ")}`);
  }

  if (undiscovered.length > 0) process.exitCode = 1;
}

main();
