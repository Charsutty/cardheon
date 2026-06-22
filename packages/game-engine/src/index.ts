export type CardKind =
  | "figure"
  | "period"
  | "region"
  | "place"
  | "civilization"
  | "role"
  | "domain"
  | "concept"
  | "event"
  | "work"
  | "movement"
  | "relation"
  | "symbol";

export type WeightedTag = {
  tag: string;
  weight?: number;
};

export type DiscoveryEvidence = {
  card?: string;
  tag?: string;
  weight: number;
  reason?: string;
};

export type DiscoveryModifier = {
  id: string;
  whenAll: string[];
  weight: number;
  reason: string;
};

export type DiscoveryRule = {
  figureId: string;
  minScore?: number;
  ambiguityMargin?: number;
  evidence: DiscoveryEvidence[];
  synergies?: DiscoveryModifier[];
  contradictions?: DiscoveryModifier[];
  minEvidenceCount?: number;
};

export type Card = {
  id: string;
  slug: string;
  kind: CardKind;
  status: "draft" | "needs_sources" | "reviewed" | "approved" | "published" | "deprecated";
  rarity?: "common" | "uncommon" | "rare" | "epic" | "legendary";
  localization: {
    fr?: {
      title: string;
      subtitle?: string;
      shortDescription?: string;
      longDescription?: string;
    };
  };
  tags?: WeightedTag[];
  sourceIds?: string[];
  constellationIds?: string[];
  discovery?: DiscoveryRule;
};

export type Relationship = {
  source: string;
  predicate: string;
  target: string;
  weight?: number;
  sourceIds?: string[];
};

export type Constellation = {
  id: string;
  slug: string;
  localization: Card["localization"];
  cardIds: string[];
  reward?: {
    xp?: number;
    unlockCardIds?: string[];
  };
};

export type Pack = {
  id: string;
  slug: string;
  localization: Card["localization"];
  starterCardIds: string[];
  cardPoolIds: string[];
};

export type Source = {
  id: string;
  title: string;
  type: "encyclopedia" | "museum" | "academic" | "book" | "primary_source" | "institution" | "article";
  url?: string;
};

export type GameCatalog = {
  version: string;
  cards: Card[];
  relationships: Relationship[];
  constellations: Constellation[];
  packs: Pack[];
  sources: Source[];
  gameplay: {
    discovery: {
      minInputs: number;
      maxInputs: number;
    };
    progression: {
      xpPerLevel: number;
      initialLevel: number;
    };
  };
};

export type UserGameState = {
  discoveredCardIds: string[];
};

export type ScoreReason = {
  kind: "evidence" | "synergy" | "contradiction";
  label: string;
  weight: number;
};

export type Reward = {
  type: "unlock_card" | "xp" | "constellation_progress";
  value: string | number;
};

export type Hint = {
  type:
    | "near_miss"
    | "ambiguous"
    | "contradictory"
    | "too_broad"
    | "missing_period"
    | "missing_region"
    | "missing_domain"
    | "missing_relation"
    | "already_known_path";
  message: string;
  cardIds?: string[];
};

export type CandidateScore = {
  cardId: string;
  title: string;
  score: number;
  evidenceCount: number;
  reasons: ScoreReason[];
};

export type DiscoveryResult =
  | {
      type: "new_figure";
      cardId: string;
      score: number;
      reasons: ScoreReason[];
      rewards: Reward[];
    }
  | {
      type: "already_discovered";
      cardId: string;
      score: number;
      reasons: ScoreReason[];
      rewards: Reward[];
    }
  | {
      type: "near_miss";
      hints: Hint[];
      candidates: CandidateScore[];
      nearestConstellations: string[];
    }
  | {
      type: "ambiguous";
      hints: Hint[];
      candidateCount: number;
      candidates: CandidateScore[];
    }
  | {
      type: "invalid";
      reason: string;
    };

export type DiscoveryOptions = {
  minInputs?: number;
  maxInputs?: number;
  defaultMinScore?: number;
  defaultAmbiguityMargin?: number;
  includeDraftFigures?: boolean;
};

type CatalogIndex = {
  cardsById: Map<string, Card>;
  playableCardsById: Map<string, Card>;
};

const DEFAULT_OPTIONS: Required<DiscoveryOptions> = {
  minInputs: 2,
  maxInputs: 5,
  defaultMinScore: 85,
  defaultAmbiguityMargin: 12,
  includeDraftFigures: false,
};

export function attemptDiscovery(
  catalog: GameCatalog,
  userState: UserGameState,
  inputCardIds: string[],
  options: DiscoveryOptions = {},
): DiscoveryResult {
  const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
  const normalizedInputs = [...new Set(inputCardIds)];
  const index = buildCatalogIndex(catalog);

  if (normalizedInputs.length < resolvedOptions.minInputs) {
    return { type: "invalid", reason: `At least ${resolvedOptions.minInputs} cards are required.` };
  }

  if (normalizedInputs.length > resolvedOptions.maxInputs) {
    return { type: "invalid", reason: `At most ${resolvedOptions.maxInputs} cards can be combined.` };
  }

  const unknownInput = normalizedInputs.find((cardId) => !index.playableCardsById.has(cardId));
  if (unknownInput) {
    return { type: "invalid", reason: `Unknown or non-playable input card: ${unknownInput}` };
  }

  const candidateScores = catalog.cards
    .filter((card) => card.kind === "figure" && card.discovery)
    .filter((figure) => isFigureEligible(figure, resolvedOptions))
    .map((figure) => scoreFigure(figure, normalizedInputs, index))
    .filter((candidate) => candidate.evidenceCount > 0)
    .sort((left, right) => right.score - left.score);

  const [best, secondBest] = candidateScores;

  if (!best) {
    return {
      type: "near_miss",
      hints: [buildBroadHint(normalizedInputs, index)],
      candidates: [],
      nearestConstellations: [],
    };
  }

  const bestFigure = index.cardsById.get(best.cardId);
  if (!bestFigure?.discovery) {
    return { type: "invalid", reason: `Best candidate has no discovery rule: ${best.cardId}` };
  }

  const minScore = bestFigure.discovery.minScore ?? resolvedOptions.defaultMinScore;
  const ambiguityMargin = bestFigure.discovery.ambiguityMargin ?? resolvedOptions.defaultAmbiguityMargin;
  const scoreDelta = best.score - (secondBest?.score ?? 0);
  const minEvidenceCount = bestFigure.discovery.minEvidenceCount ?? 1;

  if (best.score >= minScore && scoreDelta < ambiguityMargin) {
    return {
      type: "ambiguous",
      hints: [buildAmbiguityHint(candidateScores.slice(0, 3), index)],
      candidateCount: candidateScores.filter((candidate) => best.score - candidate.score < ambiguityMargin).length,
      candidates: candidateScores.slice(0, 5),
    };
  }

  if (best.score >= minScore && best.evidenceCount >= minEvidenceCount) {
    const rewards = buildRewards(bestFigure, catalog, userState);
    if (userState.discoveredCardIds.includes(best.cardId)) {
      return {
        type: "already_discovered",
        cardId: best.cardId,
        score: best.score,
        reasons: best.reasons,
        rewards,
      };
    }

    return {
      type: "new_figure",
      cardId: best.cardId,
      score: best.score,
      reasons: best.reasons,
      rewards,
    };
  }

  return {
    type: "near_miss",
    hints: buildNearMissHints(best, bestFigure, normalizedInputs, index),
    candidates: candidateScores.slice(0, 5),
    nearestConstellations: bestFigure.constellationIds ?? [],
  };
}

export function scoreFigure(figure: Card, inputCardIds: string[], index: CatalogIndex): CandidateScore {
  const inputCards = inputCardIds.map((cardId) => index.cardsById.get(cardId)).filter(Boolean) as Card[];
  const inputTokens = buildInputTokens(inputCards);
  const reasons: ScoreReason[] = [];
  let score = 0;
  let evidenceCount = 0;

  for (const evidence of figure.discovery?.evidence ?? []) {
    const matchedWeight = scoreEvidence(evidence, inputCards, inputTokens);
    if (matchedWeight > 0) {
      evidenceCount += 1;
      score += matchedWeight;
      reasons.push({
        kind: "evidence",
        label: evidence.reason ?? evidence.card ?? evidence.tag ?? "evidence",
        weight: matchedWeight,
      });
    }
  }

  for (const synergy of figure.discovery?.synergies ?? []) {
    if (modifierMatches(synergy, inputTokens)) {
      score += synergy.weight;
      reasons.push({ kind: "synergy", label: synergy.reason, weight: synergy.weight });
    }
  }

  for (const contradiction of figure.discovery?.contradictions ?? []) {
    if (modifierMatches(contradiction, inputTokens)) {
      score += contradiction.weight;
      reasons.push({ kind: "contradiction", label: contradiction.reason, weight: contradiction.weight });
    }
  }

  return {
    cardId: figure.id,
    title: figure.localization.fr?.title ?? figure.slug,
    score: Math.max(0, Math.round(score)),
    evidenceCount,
    reasons,
  };
}

export function buildCatalogIndex(catalog: GameCatalog): CatalogIndex {
  const cardsById = new Map(catalog.cards.map((card) => [card.id, card]));
  const playableCardsById = new Map(catalog.cards.filter((card) => card.kind !== "figure").map((card) => [card.id, card]));

  return { cardsById, playableCardsById };
}

function isFigureEligible(figure: Card, options: Required<DiscoveryOptions>): boolean {
  if (options.includeDraftFigures) return figure.status !== "deprecated";
  return ["reviewed", "approved", "published"].includes(figure.status);
}

function scoreEvidence(evidence: DiscoveryEvidence, inputCards: Card[], inputTokens: Set<string>): number {
  if (evidence.card && inputTokens.has(`card:${evidence.card}`)) return evidence.weight;
  if (!evidence.tag) return 0;

  if (inputTokens.has(`tag:${evidence.tag}`)) return evidence.weight;

  const matchingWeightedTag = inputCards
    .flatMap((card) => card.tags ?? [])
    .filter((weightedTag) => weightedTag.tag === evidence.tag)
    .sort((left, right) => (right.weight ?? 1) - (left.weight ?? 1))[0];

  if (!matchingWeightedTag) return 0;
  return Math.round(evidence.weight * normalizeTagStrength(matchingWeightedTag));
}

function normalizeTagStrength(weightedTag: WeightedTag): number {
  if (weightedTag.weight === undefined) return 1;
  return Math.max(0.25, Math.min(1, weightedTag.weight / 100));
}

function modifierMatches(modifier: DiscoveryModifier, inputTokens: Set<string>): boolean {
  return modifier.whenAll.every((token) => inputTokens.has(token));
}

function buildInputTokens(inputCards: Card[]): Set<string> {
  const tokens = new Set<string>();
  for (const card of inputCards) {
    tokens.add(`card:${card.id}`);
    tokens.add(`kind:${card.kind}`);
    for (const weightedTag of card.tags ?? []) {
      tokens.add(`tag:${weightedTag.tag}`);
    }
  }
  return tokens;
}

function buildRewards(figure: Card, catalog: GameCatalog, userState: UserGameState): Reward[] {
  const rewards: Reward[] = [
    { type: "unlock_card", value: figure.id },
    { type: "xp", value: rarityXp(figure.rarity) },
  ];

  for (const constellationId of figure.constellationIds ?? []) {
    const constellation = catalog.constellations.find((candidate) => candidate.id === constellationId);
    if (!constellation) continue;

    const discoveredCount = constellation.cardIds.filter((cardId) =>
      cardId === figure.id || userState.discoveredCardIds.includes(cardId),
    ).length;

    rewards.push({
      type: "constellation_progress",
      value: `${constellationId}:${discoveredCount}/${constellation.cardIds.length}`,
    });
  }

  return rewards;
}

function rarityXp(rarity: Card["rarity"]): number {
  switch (rarity) {
    case "legendary":
      return 120;
    case "epic":
      return 80;
    case "rare":
      return 50;
    case "uncommon":
      return 30;
    default:
      return 20;
  }
}

function buildBroadHint(inputCardIds: string[], index: CatalogIndex): Hint {
  const inputKinds = inputCardIds.map((cardId) => index.cardsById.get(cardId)?.kind).filter(Boolean);

  if (!inputKinds.includes("period")) {
    return { type: "missing_period", message: "Ajoute une époque pour situer ta recherche." };
  }

  if (!inputKinds.includes("domain") && !inputKinds.includes("role")) {
    return { type: "missing_domain", message: "Ajoute un domaine ou un rôle pour préciser l’intention." };
  }

  return { type: "too_broad", message: "La combinaison est trop générale. Ajoute un indice plus spécifique." };
}

function buildAmbiguityHint(candidates: CandidateScore[], index: CatalogIndex): Hint {
  const titles = candidates
    .map((candidate) => index.cardsById.get(candidate.cardId)?.localization.fr?.title ?? candidate.cardId)
    .join(", ");

  return {
    type: "ambiguous",
    message: `Tu es proche de plusieurs personnages (${titles}). Ajoute un indice distinctif : lieu précis, découverte, œuvre ou relation.`,
    cardIds: candidates.map((candidate) => candidate.cardId),
  };
}

function buildNearMissHints(best: CandidateScore, figure: Card, inputCardIds: string[], index: CatalogIndex): Hint[] {
  const hints: Hint[] = [];
  const inputTokens = buildInputTokens(inputCardIds.map((cardId) => index.cardsById.get(cardId)).filter(Boolean) as Card[]);
  const missingEvidence = figure.discovery?.evidence.find((evidence) => {
    if (evidence.card && inputTokens.has(`card:${evidence.card}`)) return false;
    if (evidence.tag && inputTokens.has(`tag:${evidence.tag}`)) return false;
    return true;
  });

  if (best.reasons.some((reason) => reason.kind === "contradiction")) {
    hints.push({ type: "contradictory", message: "Un indice joué semble contredire le meilleur candidat." });
  }

  if (missingEvidence?.tag?.startsWith("period.")) {
    hints.push({ type: "missing_period", message: "Tu es proche : ajoute une époque plus précise." });
  } else if (missingEvidence?.tag?.startsWith("place.") || missingEvidence?.tag?.startsWith("region.")) {
    hints.push({ type: "missing_region", message: "Tu es proche : ajoute un lieu ou une région plus précise." });
  } else if (missingEvidence?.tag?.startsWith("domain.")) {
    hints.push({ type: "missing_domain", message: "Tu es proche : ajoute le domaine exact du personnage." });
  } else if (missingEvidence?.card) {
    const title = index.cardsById.get(missingEvidence.card)?.localization.fr?.title ?? missingEvidence.card;
    hints.push({ type: "missing_relation", message: `Tu es proche : essaie un indice lié à ${title}.` });
  }

  if (hints.length === 0) {
    hints.push({ type: "near_miss", message: "Tu es proche, mais il manque encore un indice vraiment distinctif." });
  }

  return hints;
}
