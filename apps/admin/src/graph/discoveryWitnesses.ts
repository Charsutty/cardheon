import { attemptDiscovery, type Card, type DiscoveryResult, type GameCatalog, type ScoreReason } from "@cardheon/game-engine";

export type DiscoveryWitness = {
  figureId: string;
  inputCardIds: string[];
  score: number;
  scoreDelta?: number;
  resultType: DiscoveryResult["type"];
  reasons: ScoreReason[];
};

function combinations<T>(items: T[], size: number, limit: number): T[][] {
  const result: T[][] = [];
  const walk = (start: number, selected: T[]) => {
    if (result.length >= limit) return;
    if (selected.length === size) { result.push([...selected]); return; }
    for (let index = start; index < items.length; index += 1) walk(index + 1, [...selected, items[index]]);
  };
  walk(0, []);
  return result;
}

function supportsFigure(card: Card, figure: Card): number {
  const tokens = new Set([`card:${card.id}`, `kind:${card.kind}`, ...(card.tags ?? []).map((tag) => `tag:${tag.tag}`)]);
  let score = 0;
  for (const evidence of figure.discovery?.evidence ?? []) {
    if ((evidence.card && evidence.card === card.id) || (evidence.tag && tokens.has(`tag:${evidence.tag}`))) score += Math.max(0, evidence.weight);
  }
  for (const synergy of figure.discovery?.synergies ?? []) if (synergy.whenAll.some((token) => tokens.has(token))) score += Math.max(0, synergy.weight / synergy.whenAll.length);
  return score;
}

export function findDiscoveryWitnesses(
  catalog: GameCatalog,
  figureId: string,
  availableCardIds: string[],
  options: { minInputs: number; maxInputs: number; maxWitnesses: number; includeAlreadyDiscovered?: boolean },
): DiscoveryWitness[] {
  const figure = catalog.cards.find((card) => card.id === figureId && card.kind === "figure");
  if (!figure?.discovery) return [];
  const available = new Set(availableCardIds);
  const candidates = catalog.cards
    .filter((card) => card.kind !== "figure" && available.has(card.id))
    .map((card) => ({ card, support: supportsFigure(card, figure) }))
    .filter((candidate) => candidate.support > 0)
    .sort((a, b) => b.support - a.support)
    .slice(0, 18)
    .map((candidate) => candidate.card.id);
  const state = {
    discoveredCardIds: options.includeAlreadyDiscovered ? [figureId] : [],
    unlockedCardIds: availableCardIds,
  };
  const witnesses: DiscoveryWitness[] = [];
  for (let size = options.minInputs; size <= Math.min(options.maxInputs, candidates.length); size += 1) {
    for (const inputCardIds of combinations(candidates, size, 12000)) {
      const result = attemptDiscovery(catalog, state, inputCardIds, { includeDraftFigures: true });
      const candidate = result.type === "ambiguous" || result.type === "near_miss"
        ? result.candidates.find((item) => item.cardId === figureId)
        : undefined;
      const matches = (result.type === "new_figure" || result.type === "already_discovered") && result.cardId === figureId;
      if (!matches && !candidate) continue;
      const score = matches ? result.score : candidate?.score ?? 0;
      const reasons = matches ? result.reasons : candidate?.reasons ?? [];
      const second = result.type === "ambiguous" || result.type === "near_miss"
        ? result.candidates.filter((item) => item.cardId !== figureId)[0]?.score
        : undefined;
      witnesses.push({ figureId, inputCardIds, score, scoreDelta: second === undefined ? undefined : score - second, resultType: result.type, reasons });
    }
  }
  const unique = new Map(witnesses.sort((a, b) => {
    const successA = a.resultType === "new_figure" || a.resultType === "already_discovered" ? 1 : 0;
    const successB = b.resultType === "new_figure" || b.resultType === "already_discovered" ? 1 : 0;
    return successB - successA || b.score - a.score || a.inputCardIds.length - b.inputCardIds.length;
  }).map((witness) => [witness.inputCardIds.join("|"), witness]));
  return [...unique.values()].slice(0, options.maxWitnesses);
}
