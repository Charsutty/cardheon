#!/usr/bin/env tsx
/**
 * Cardheon discoverability analyzer.
 *
 * Suggested location in the repo:
 *   scripts/analyze-discoverability.ts
 *
 * Run:
 *   pnpm tsx scripts/analyze-discoverability.ts content/catalog.dev.json
 *   pnpm tsx scripts/analyze-discoverability.ts content/catalog.dev.json --exact-positive
 *
 * Goal:
 *   Compute the fixed point of reachable figures/tools from the starter pack,
 *   without enumerating every 2..5 combination from every available card.
 *
 * Core idea:
 *   For each target figure, enumerate only "positive witness" combinations:
 *   cards that can contribute positive evidence or a positive synergy to that
 *   specific figure. Every candidate combination is still validated by the real
 *   game engine's attemptDiscovery(), so this script is a content validator, not
 *   a second discovery engine.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

// If this file lives in scripts/, this import should point to the real engine.
// Adjust only this line if your workspace aliases differ.
import * as gameEngine from "../packages/game-engine/src/index";

type Id = string;
type AnyRecord = Record<string, any>;

type RefKind = "card" | "tag";

type EvidenceRef = {
  kind: RefKind;
  value: string;
  source: "evidence" | "synergy" | "contradiction" | "unknown";
  weight?: number;
};

type AnalyzerOptions = {
  minComboSize: number;
  maxComboSize: number;
  exactPositive: boolean;
  maxCandidatesPerFigure: number;
  maxCardsPerBroadRef: number;
  json: boolean;
  verbose: boolean;
};

type AttemptSuccess = {
  figureId: Id;
  raw: unknown;
};

type Witness = {
  figureId: Id;
  figureName: string;
  comboIds: Id[];
  comboNames: string[];
  attempts: number;
  candidateCount: number;
};

type Step = Witness & {
  unlockedToolCardIds: Id[];
  unlockedByConstellationIds: Id[];
};

type AnalysisReport = {
  starterToolCount: number;
  discoveredFigureCount: number;
  reachableToolCount: number;
  steps: Step[];
  blockedFigures: Array<{
    figureId: Id;
    figureName: string;
    reason: string;
    missingPositiveRefs: string[];
    candidateCount: number;
  }>;
  circularities: CircularityWarning[];
  thematicWarnings: CircularityWarning[];
  finalToolCardIds: Id[];
  finalFigureIds: Id[];
};

type CircularityWarning = {
  kind: "direct-self-unlock" | "tag-self-unlock" | "dependency-cycle";
  figureId?: Id;
  figureName?: string;
  cardId?: Id;
  cardName?: string;
  tag?: string;
  cycle?: Id[];
  message: string;
};

function arr<T = any>(value: any): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function uniq<T>(items: Iterable<T>): T[] {
  return [...new Set(items)];
}

function idOf(x: AnyRecord): Id {
  return String(x.id ?? x.cardId ?? x.figureId ?? x.slug ?? x.key ?? "");
}

function nameOf(x: AnyRecord): string {
  return String(x.localization?.fr?.title ?? x.name ?? x.title ?? x.label ?? idOf(x));
}

function getCards(catalog: any): AnyRecord[] {
  if (Array.isArray(catalog)) return catalog;
  if (Array.isArray(catalog.cards)) return catalog.cards;
  if (Array.isArray(catalog.cardList)) return catalog.cardList;
  if (catalog.cardsById && typeof catalog.cardsById === "object") return Object.values(catalog.cardsById);
  if (catalog.cardById && typeof catalog.cardById === "object") return Object.values(catalog.cardById);
  throw new Error("Unable to find cards in catalog. Expected catalog.cards or catalog.cardsById.");
}

function getStarterPack(catalog: any): Id[] {
  const candidates = [
    catalog.starterPackCardIds,
    catalog.starterPackToolCardIds,
    catalog.starterPack,
    catalog.starter?.cardIds,
    catalog.starter?.toolCardIds,
    catalog.game?.starterPackCardIds,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.map(String);
    }
  }

  // Cardhéon: packs with packType === 'starter_pack' or id === 'pack.starter'.
  const starterPack = arr(catalog.packs).find(
    (pack: AnyRecord) =>
      pack.id === "pack.starter" ||
      pack.packType === "starter_pack" ||
      pack.slug === "depart" ||
      pack.slug === "starter",
  );
  if (starterPack && Array.isArray(starterPack.starterCardIds)) {
    return starterPack.starterCardIds.map(String);
  }

  // Fallback: cards explicitly marked as starter.
  const fromCards = getCards(catalog)
    .filter((card) => Boolean(card.isStarter || card.starter || card.inStarterPack))
    .map(idOf)
    .filter(Boolean);

  if (fromCards.length > 0) return fromCards;
  throw new Error("Unable to find starter pack. Expected starterPackCardIds, catalog.packs, or card.isStarter.");
}

function isFigure(card: AnyRecord): boolean {
  const kind = String(card.kind ?? card.type ?? card.cardType ?? "").toLowerCase();
  return (
    kind === "figure" ||
    kind === "historical_figure" ||
    kind === "historical-figure" ||
    Boolean(card.discovery || card.discoveryRule || card.evidence || card.evidences)
  );
}

function getFigures(catalog: any): AnyRecord[] {
  const cards = getCards(catalog);
  return cards.filter(isFigure);
}

function getRule(catalog: any, figure: AnyRecord): AnyRecord {
  const fid = idOf(figure);
  return (
    figure.discovery ??
    figure.discoveryRule ??
    figure.rule ??
    catalog.discoveryRules?.[fid] ??
    catalog.rules?.[fid] ??
    figure
  );
}

function getTags(card: AnyRecord): Set<string> {
  const raw = arr(card.tags)
    .concat(arr(card.tagIds))
    .concat(arr(card.categories));

  const normalized = raw.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") return item.tag ?? item.tagId ?? item.id ?? item.value ?? "";
    return "";
  });

  return new Set(normalized.filter(Boolean));
}

function normalizeRefs(raw: any, source: EvidenceRef["source"]): EvidenceRef[] {
  if (!raw) return [];

  if (typeof raw === "string") {
    if (raw.startsWith("tag:")) return [{ kind: "tag", value: raw.slice(4), source }];
    if (raw.startsWith("card:")) return [{ kind: "card", value: raw.slice(5), source }];
    if (raw.startsWith("#")) return [{ kind: "tag", value: raw.slice(1), source }];
    return [{ kind: "card", value: raw, source }];
  }

  if (Array.isArray(raw)) {
    return raw.flatMap((x) => normalizeRefs(x, source));
  }

  if (typeof raw !== "object") return [];

  const weight = typeof raw.weight === "number" ? raw.weight : undefined;
  const refs: EvidenceRef[] = [];

  for (const key of ["cardId", "card", "toolCardId", "figureId"]) {
    if (typeof raw[key] === "string") refs.push({ kind: "card", value: raw[key], source, weight });
  }

  for (const key of ["tag", "tagId"]) {
    if (typeof raw[key] === "string") refs.push({ kind: "tag", value: raw[key], source, weight });
  }

  for (const key of ["cardIds", "cards", "toolCardIds", "figureIds"]) {
    for (const value of arr<string>(raw[key])) refs.push({ kind: "card", value: String(value), source, weight });
  }

  for (const key of ["tags", "tagIds"]) {
    for (const value of arr<string>(raw[key])) refs.push({ kind: "tag", value: String(value), source, weight });
  }

  // Engine-style modifier tokens: whenAll: ["card:...", "tag:..."]
  for (const key of ["whenAll", "requires", "allOf", "when", "refs"]) {
    for (const value of arr<string>(raw[key])) {
      refs.push(...normalizeRefs(value, source));
    }
  }

  return refs;
}

function getEvidenceItems(rule: AnyRecord): any[] {
  return arr(rule.evidence).concat(arr(rule.evidences)).concat(arr(rule.positiveEvidence));
}

function getSynergyItems(rule: AnyRecord): any[] {
  return arr(rule.synergies).concat(arr(rule.bonuses)).concat(arr(rule.comboBonuses));
}

function getContradictionItems(rule: AnyRecord): any[] {
  return arr(rule.contradictions).concat(arr(rule.negativeEvidence)).concat(arr(rule.penalties));
}

function getPositiveRefs(catalog: any, figure: AnyRecord): EvidenceRef[] {
  const rule = getRule(catalog, figure);
  const evidenceRefs = getEvidenceItems(rule).flatMap((item) => normalizeRefs(item, "evidence"));
  const synergyRefs = getSynergyItems(rule).flatMap((synergy) => {
    const requires = synergy.requires ?? synergy.allOf ?? synergy.when ?? synergy.evidence ?? synergy.refs ?? synergy;
    return normalizeRefs(requires, "synergy");
  });
  return dedupeRefs(evidenceRefs.concat(synergyRefs));
}

function getEvidenceRefsOnly(catalog: any, figure: AnyRecord): EvidenceRef[] {
  const rule = getRule(catalog, figure);
  return dedupeRefs(getEvidenceItems(rule).flatMap((item) => normalizeRefs(item, "evidence")));
}

function getContradictionRefs(catalog: any, figure: AnyRecord): EvidenceRef[] {
  const rule = getRule(catalog, figure);
  return dedupeRefs(getContradictionItems(rule).flatMap((item) => normalizeRefs(item, "contradiction")));
}

function dedupeRefs(refs: EvidenceRef[]): EvidenceRef[] {
  const seen = new Set<string>();
  const out: EvidenceRef[] = [];
  for (const ref of refs) {
    const key = `${ref.source}:${ref.kind}:${ref.value}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ref);
  }
  return out;
}

function matchesRef(card: AnyRecord, ref: EvidenceRef): boolean {
  if (ref.kind === "card") return idOf(card) === ref.value;
  return getTags(card).has(ref.value);
}

function refLabel(ref: EvidenceRef): string {
  return `${ref.kind}:${ref.value}`;
}

function localSupportScore(card: AnyRecord, positiveRefs: EvidenceRef[]): number {
  let score = 0;
  for (const ref of positiveRefs) {
    if (matchesRef(card, ref)) score += ref.weight ?? (ref.source === "evidence" ? 10 : 4);
  }
  return score;
}

function evidenceCountApprox(comboCards: AnyRecord[], evidenceRefs: EvidenceRef[]): number {
  let count = 0;
  for (const ref of evidenceRefs) {
    if (comboCards.some((card) => matchesRef(card, ref))) count += 1;
  }
  return count;
}

function ruleSignature(card: AnyRecord, catalog: any, figures: AnyRecord[]): string {
  // Exact-ish equivalence signature: cards with the same signature trigger the same
  // rule refs in this JSON model. Direct cardId refs keep cards distinct.
  const bits: string[] = [];
  for (const figure of figures) {
    const fid = idOf(figure);
    for (const ref of getPositiveRefs(catalog, figure)) {
      if (matchesRef(card, ref)) bits.push(`${fid}:pos:${ref.source}:${ref.kind}:${ref.value}`);
    }
    for (const ref of getContradictionRefs(catalog, figure)) {
      if (matchesRef(card, ref)) bits.push(`${fid}:neg:${ref.kind}:${ref.value}`);
    }
  }
  return bits.sort().join("|");
}

function dedupeEquivalentCards(cards: AnyRecord[], catalog: any, figures: AnyRecord[]): AnyRecord[] {
  const bySignature = new Map<string, AnyRecord>();
  for (const card of cards) {
    const signature = ruleSignature(card, catalog, figures) || `id:${idOf(card)}`;
    const previous = bySignature.get(signature);
    if (!previous || nameOf(card) < nameOf(previous)) bySignature.set(signature, card);
  }
  return [...bySignature.values()];
}

function buildCandidateCards(
  catalog: any,
  allCardsById: Map<Id, AnyRecord>,
  figures: AnyRecord[],
  target: AnyRecord,
  availableIds: Set<Id>,
  options: AnalyzerOptions
): AnyRecord[] {
  const positiveRefs = getPositiveRefs(catalog, target);
  const contradictionRefs = getContradictionRefs(catalog, target);
  const availableCards = [...availableIds]
    .map((id) => allCardsById.get(id))
    .filter(Boolean) as AnyRecord[];

  // We do not eagerly filter contradiction cards here: a contradiction modifier
  // only triggers when *all* of its whenAll tokens are present, so a card that
  // matches one contradiction token is still a valid candidate. The real engine
  // remains the source of truth for contradiction penalties.
  const candidates = availableCards.filter((card) => positiveRefs.some((ref) => matchesRef(card, ref)));

  // Broad tags such as "Europe" or "science" can match many cards. In default
  // mode we cap per ref, but --exact-positive disables this cap.
  let selected: AnyRecord[] = [];
  if (options.exactPositive) {
    selected = candidates;
  } else {
    const selectedIds = new Set<Id>();
    for (const ref of positiveRefs) {
      const matching = candidates
        .filter((card) => matchesRef(card, ref))
        .sort((a, b) => localSupportScore(b, positiveRefs) - localSupportScore(a, positiveRefs));
      for (const card of matching.slice(0, options.maxCardsPerBroadRef)) selectedIds.add(idOf(card));
    }
    selected = [...selectedIds].map((id) => allCardsById.get(id)).filter(Boolean) as AnyRecord[];
  }

  selected = dedupeEquivalentCards(selected, catalog, figures).sort(
    (a, b) => localSupportScore(b, positiveRefs) - localSupportScore(a, positiveRefs)
  );

  if (!options.exactPositive && selected.length > options.maxCandidatesPerFigure) {
    selected = selected.slice(0, options.maxCandidatesPerFigure);
  }

  return selected;
}

function* combinations<T>(items: T[], minSize: number, maxSize: number): Generator<T[]> {
  const n = items.length;
  const buffer: T[] = [];

  function* rec(start: number, targetSize: number): Generator<T[]> {
    if (buffer.length === targetSize) {
      yield [...buffer];
      return;
    }
    const remainingSlots = targetSize - buffer.length;
    for (let i = start; i <= n - remainingSlots; i += 1) {
      buffer.push(items[i]);
      yield* rec(i + 1, targetSize);
      buffer.pop();
    }
  }

  for (let size = minSize; size <= Math.min(maxSize, n); size += 1) {
    yield* rec(0, size);
  }
}

function normalizeAttemptResult(raw: any): AttemptSuccess | null {
  if (!raw) return null;
  if (typeof raw === "string") return { figureId: raw, raw };

  const direct = [
    raw.newFigureId,
    raw.figureId,
    raw.discoveredFigureId,
    raw.cardId,
    raw.id,
    raw.figure?.id,
    raw.newFigure?.id,
    raw.discoveredFigure?.id,
    raw.discovery?.figureId,
    raw.result?.figureId,
  ].find((x) => typeof x === "string" && x.length > 0);

  if (direct) return { figureId: direct, raw };
  return null;
}

function buildCatalogIndex(catalog: any): any {
  const fn = (gameEngine as any).buildCatalogIndex;
  return typeof fn === "function" ? fn(catalog) : undefined;
}

function attemptWithEngine(
  catalog: any,
  discoveredFigureIds: Set<Id>,
  unlockedToolCardIds: Set<Id>,
  comboIds: Id[]
): AttemptSuccess | null {
  const fn = (gameEngine as any).attemptDiscovery;
  if (typeof fn !== "function") {
    throw new Error("packages/game-engine/src/index.ts must export attemptDiscovery.");
  }

  const userState = {
    discoveredCardIds: [...discoveredFigureIds],
    unlockedCardIds: [...unlockedToolCardIds],
  };

  const raw = fn(catalog, userState, comboIds);
  if (!raw || typeof raw !== "object") return null;

  // Cardhéon DiscoveryResult shape.
  if (raw.type === "new_figure" && typeof raw.cardId === "string") {
    return { figureId: raw.cardId, raw };
  }
  if (raw.type === "already_discovered" && typeof raw.cardId === "string") {
    return { figureId: raw.cardId, raw };
  }

  return normalizeAttemptResult(raw);
}

function findWitnessForFigure(
  catalog: any,
  allCardsById: Map<Id, AnyRecord>,
  figures: AnyRecord[],
  target: AnyRecord,
  toolCardIds: Set<Id>,
  discoveredFigureIds: Set<Id>,
  options: AnalyzerOptions
): Witness | null {
  const availableIds = new Set<Id>([...toolCardIds, ...discoveredFigureIds]);
  const candidates = buildCandidateCards(catalog, allCardsById, figures, target, availableIds, options);
  const evidenceRefs = getEvidenceRefsOnly(catalog, target);
  let attempts = 0;

  for (const comboCards of combinations(candidates, options.minComboSize, options.maxComboSize)) {
    // Fast local precheck. The real engine remains the source of truth.
    // We keep combos that match at least one hard evidence; synergies may push them over the threshold.
    if (evidenceRefs.length > 0 && evidenceCountApprox(comboCards, evidenceRefs) < 1) continue;

    const comboIds = comboCards.map(idOf);
    attempts += 1;
    const result = attemptWithEngine(catalog, discoveredFigureIds, toolCardIds, comboIds);
    if (result?.figureId === idOf(target) && !discoveredFigureIds.has(result.figureId)) {
      return {
        figureId: idOf(target),
        figureName: nameOf(target),
        comboIds,
        comboNames: comboCards.map(nameOf),
        attempts,
        candidateCount: candidates.length,
      };
    }
  }

  return null;
}

function getFigureUnlocks(figure: AnyRecord): Id[] {
  const raw =
    figure.unlocksToolCardIds ??
    figure.unlockToolCardIds ??
    figure.unlocksToolIds ??
    figure.unlocks ??
    figure.rewards?.toolCardIds ??
    figure.discovery?.unlocksToolCardIds;
  return arr(raw).map(String);
}

function getConstellations(catalog: any): AnyRecord[] {
  return arr(catalog.constellations).concat(arr(catalog.collections)).concat(arr(catalog.sets));
}

function constellationId(c: AnyRecord): Id {
  return String(c.id ?? c.slug ?? c.name ?? "constellation");
}

function constellationMembers(c: AnyRecord): Id[] {
  return arr(c.figureIds)
    .concat(arr(c.figures))
    .concat(arr(c.memberFigureIds))
    .concat(arr(c.requiredFigureIds))
    .map((x: any) => (typeof x === "string" ? x : idOf(x)))
    .filter(Boolean);
}

function constellationRewards(c: AnyRecord): Id[] {
  return arr(c.rewardToolCardIds)
    .concat(arr(c.rewardsToolCardIds))
    .concat(arr(c.unlocksToolCardIds))
    .concat(arr(c.reward?.toolCardIds))
    .concat(arr(c.rewards?.toolCardIds))
    .map(String);
}

function applyConstellationRewards(
  catalog: any,
  discoveredFigureIds: Set<Id>,
  toolCardIds: Set<Id>,
  claimedConstellationIds: Set<Id>
): Id[] {
  const unlocked: Id[] = [];
  for (const constellation of getConstellations(catalog)) {
    const cid = constellationId(constellation);
    if (claimedConstellationIds.has(cid)) continue;
    const members = constellationMembers(constellation);
    if (members.length === 0) continue;
    if (members.every((id) => discoveredFigureIds.has(id))) {
      claimedConstellationIds.add(cid);
      for (const rewardId of constellationRewards(constellation)) {
        if (!toolCardIds.has(rewardId)) {
          toolCardIds.add(rewardId);
          unlocked.push(rewardId);
        }
      }
    }
  }
  return unlocked;
}

function missingPositiveRefs(
  catalog: any,
  figure: AnyRecord,
  allCardsById: Map<Id, AnyRecord>,
  availableIds: Set<Id>
): string[] {
  const availableCards = [...availableIds].map((id) => allCardsById.get(id)).filter(Boolean) as AnyRecord[];
  return getPositiveRefs(catalog, figure)
    .filter((ref) => !availableCards.some((card) => matchesRef(card, ref)))
    .map(refLabel);
}

function analyze(catalog: any, options: AnalyzerOptions): AnalysisReport {
  const cards = getCards(catalog);
  const allCardsById = new Map(cards.map((card) => [idOf(card), card]));
  const figures = getFigures(catalog);

  const toolCardIds = new Set<Id>(getStarterPack(catalog));
  const discoveredFigureIds = new Set<Id>();
  const claimedConstellationIds = new Set<Id>();
  const steps: Step[] = [];

  let changed = true;
  while (changed) {
    changed = false;

    for (const figure of figures) {
      const fid = idOf(figure);
      if (discoveredFigureIds.has(fid)) continue;

      const witness = findWitnessForFigure(
        catalog,
        allCardsById,
        figures,
        figure,
        toolCardIds,
        discoveredFigureIds,
        options
      );

      if (!witness) continue;

      discoveredFigureIds.add(fid);

      // The discovered figure becomes playable. We keep figures in D and tools in U,
      // but candidate generation uses U union D.
      const unlockedToolCardIds: Id[] = [];
      for (const unlockId of getFigureUnlocks(figure)) {
        if (!toolCardIds.has(unlockId)) {
          toolCardIds.add(unlockId);
          unlockedToolCardIds.push(unlockId);
        }
      }

      const unlockedByConstellationIds = applyConstellationRewards(
        catalog,
        discoveredFigureIds,
        toolCardIds,
        claimedConstellationIds
      );

      steps.push({ ...witness, unlockedToolCardIds, unlockedByConstellationIds });
      changed = true;
      break; // Restart: unlocks may make earlier blocked figures reachable.
    }
  }

  const finalAvailable = new Set<Id>([...toolCardIds, ...discoveredFigureIds]);
  const blockedFigures = figures
    .filter((figure) => !discoveredFigureIds.has(idOf(figure)))
    .map((figure) => {
      const candidates = buildCandidateCards(catalog, allCardsById, figures, figure, finalAvailable, options);
      const missing = missingPositiveRefs(catalog, figure, allCardsById, finalAvailable);
      return {
        figureId: idOf(figure),
        figureName: nameOf(figure),
        reason: missing.length > 0 ? "missing-positive-evidence" : "no-unambiguous-positive-witness",
        missingPositiveRefs: missing,
        candidateCount: candidates.length,
      };
    });

  return {
    starterToolCount: getStarterPack(catalog).length,
    discoveredFigureCount: discoveredFigureIds.size,
    reachableToolCount: toolCardIds.size,
    steps,
    blockedFigures,
    ...detectCircularities(catalog, allCardsById, figures),
    finalToolCardIds: [...toolCardIds].sort(),
    finalFigureIds: [...discoveredFigureIds].sort(),
  };
}

function detectCircularities(
  catalog: any,
  allCardsById: Map<Id, AnyRecord>,
  figures: AnyRecord[]
): { circularities: CircularityWarning[]; thematicWarnings: CircularityWarning[] } {
  const circularities: CircularityWarning[] = [];
  const thematicWarnings: CircularityWarning[] = [];

  for (const figure of figures) {
    const fid = idOf(figure);
    const positiveRefs = getPositiveRefs(catalog, figure);
    const unlocks = getFigureUnlocks(figure);

    for (const unlockedId of unlocks) {
      const unlockedCard = allCardsById.get(unlockedId);
      if (!unlockedCard) continue;

      const direct = positiveRefs.find((ref) => ref.kind === "card" && ref.value === unlockedId);
      if (direct) {
        circularities.push({
          kind: "direct-self-unlock",
          figureId: fid,
          figureName: nameOf(figure),
          cardId: unlockedId,
          cardName: nameOf(unlockedCard),
          message: `${nameOf(figure)} unlocks ${nameOf(unlockedCard)}, which is directly referenced by its own discovery rule.`,
        });
      }

      for (const ref of positiveRefs.filter((r) => r.kind === "tag")) {
        if (getTags(unlockedCard).has(ref.value)) {
          // Tag overlaps are usually intentional thematic echoes, not blockers.
          // Keep them as thematic warnings so authors can review without
          // treating them as hard circularities.
          thematicWarnings.push({
            kind: "tag-self-unlock",
            figureId: fid,
            figureName: nameOf(figure),
            cardId: unlockedId,
            cardName: nameOf(unlockedCard),
            tag: ref.value,
            message: `${nameOf(figure)} unlocks ${nameOf(unlockedCard)}, which shares tag:${ref.value} with its own discovery rule.`,
          });
        }
      }
    }
  }

  circularities.push(...detectGraphCycles(catalog, allCardsById, figures));
  return { circularities, thematicWarnings };
}

function detectGraphCycles(catalog: any, allCardsById: Map<Id, AnyRecord>, figures: AnyRecord[]): CircularityWarning[] {
  const graph = new Map<Id, Set<Id>>();
  const addEdge = (from: Id, to: Id) => {
    if (!graph.has(from)) graph.set(from, new Set());
    graph.get(from)!.add(to);
  };

  // Tool/figure card -> figure when the card can positively contribute.
  for (const figure of figures) {
    const fid = `figure:${idOf(figure)}`;
    for (const ref of getPositiveRefs(catalog, figure)) {
      if (ref.kind === "card") {
        addEdge(`card:${ref.value}`, fid);
      } else {
        for (const card of allCardsById.values()) {
          if (getTags(card).has(ref.value)) addEdge(`card:${idOf(card)}`, fid);
        }
      }
    }
  }

  // Figure -> unlocked tool cards.
  for (const figure of figures) {
    const fid = `figure:${idOf(figure)}`;
    for (const unlockId of getFigureUnlocks(figure)) addEdge(fid, `card:${unlockId}`);
  }

  // Approximate constellation hyperedges as member figure -> reward tool.
  for (const constellation of getConstellations(catalog)) {
    for (const memberId of constellationMembers(constellation)) {
      for (const rewardId of constellationRewards(constellation)) {
        addEdge(`figure:${memberId}`, `card:${rewardId}`);
      }
    }
  }

  const starterIds = new Set(getStarterPack(catalog));
  const sccs = tarjan(graph);

  return sccs
    .filter((scc) => scc.length > 1 && scc.some((n) => n.startsWith("figure:")) && scc.some((n) => n.startsWith("card:")))
    .filter((scc) => {
      // Ignore 2-node cycles that are pure tag self-unlocks: the figure unlocks
      // a card that merely shares a tag used by the figure's rule. These are
      // thematic echoes, not hard circularities.
      if (scc.length !== 2) return true;
      const figureNode = scc.find((n) => n.startsWith("figure:"))?.slice("figure:".length);
      const cardNode = scc.find((n) => n.startsWith("card:"))?.slice("card:".length);
      if (!figureNode || !cardNode) return true;
      const figure = figures.find((f) => idOf(f) === figureNode);
      if (!figure) return true;
      const positiveRefs = getPositiveRefs(catalog, figure);
      const unlocks = getFigureUnlocks(figure);
      if (!unlocks.includes(cardNode)) return true;
      const unlockedCard = allCardsById.get(cardNode);
      if (!unlockedCard) return true;
      const sharedTag = positiveRefs
        .filter((ref) => ref.kind === "tag")
        .some((ref) => getTags(unlockedCard).has(ref.value));
      return !sharedTag;
    })
    .filter((scc) => {
      // Ignore cycles that are broken by the starter pack: if any card in the
      // cycle is available from the start, players can enter the cycle without
      // needing the loop to close.
      return !scc.some((n) => n.startsWith("card:") && starterIds.has(n.slice("card:".length)));
    })
    .map((cycle) => ({
      kind: "dependency-cycle" as const,
      cycle,
      message: `Potential dependency cycle: ${cycle.join(" -> ")}`,
    }));
}

function tarjan(graph: Map<Id, Set<Id>>): Id[][] {
  let index = 0;
  const stack: Id[] = [];
  const onStack = new Set<Id>();
  const indices = new Map<Id, number>();
  const lowlink = new Map<Id, number>();
  const result: Id[][] = [];
  const nodes = new Set<Id>([...graph.keys(), ...[...graph.values()].flatMap((s) => [...s])]);

  function strongConnect(v: Id) {
    indices.set(v, index);
    lowlink.set(v, index);
    index += 1;
    stack.push(v);
    onStack.add(v);

    for (const w of graph.get(v) ?? []) {
      if (!indices.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, indices.get(w)!));
      }
    }

    if (lowlink.get(v) === indices.get(v)) {
      const scc: Id[] = [];
      while (true) {
        const w = stack.pop()!;
        onStack.delete(w);
        scc.push(w);
        if (w === v) break;
      }
      result.push(scc);
    }
  }

  for (const node of nodes) {
    if (!indices.has(node)) strongConnect(node);
  }
  return result;
}

function parseArgs(argv: string[]): { catalogPath: string; options: AnalyzerOptions } {
  const catalogPath = argv.find((arg) => !arg.startsWith("--")) ?? "content/catalog.dev.json";
  const getNumber = (name: string, fallback: number) => {
    const prefix = `--${name}=`;
    const raw = argv.find((arg) => arg.startsWith(prefix));
    return raw ? Number(raw.slice(prefix.length)) : fallback;
  };

  return {
    catalogPath,
    options: {
      minComboSize: getNumber("min", 2),
      maxComboSize: getNumber("max", 5),
      exactPositive: argv.includes("--exact-positive"),
      maxCandidatesPerFigure: getNumber("max-candidates", 18),
      maxCardsPerBroadRef: getNumber("max-per-ref", 8),
      json: argv.includes("--json"),
      verbose: argv.includes("--verbose"),
    },
  };
}

function printHuman(report: AnalysisReport) {
  console.log("\nCardheon discoverability report");
  console.log("================================");
  console.log(`Starter tools:        ${report.starterToolCount}`);
  console.log(`Reachable tools:      ${report.reachableToolCount}`);
  console.log(`Discovered figures:   ${report.discoveredFigureCount}`);
  console.log(`Blocked figures:      ${report.blockedFigures.length}`);
  console.log(`Circularity warnings: ${report.circularities.length}`);
  console.log(`Thematic warnings:    ${report.thematicWarnings.length}`);

  console.log("\nValid discovery order");
  console.log("---------------------");
  if (report.steps.length === 0) console.log("No figure discovered.");
  for (const [i, step] of report.steps.entries()) {
    const unlocks = step.unlockedToolCardIds.length > 0 ? ` | unlocks: ${step.unlockedToolCardIds.join(", ")}` : "";
    const constellation =
      step.unlockedByConstellationIds.length > 0
        ? ` | constellation rewards: ${step.unlockedByConstellationIds.join(", ")}`
        : "";
    console.log(
      `${String(i + 1).padStart(2, "0")}. ${step.figureName} [${step.figureId}] <= ${step.comboNames.join(" + ")}${unlocks}${constellation}`
    );
  }

  if (report.blockedFigures.length > 0) {
    console.log("\nBlocked figures");
    console.log("---------------");
    for (const blocked of report.blockedFigures) {
      console.log(`- ${blocked.figureName} [${blocked.figureId}]: ${blocked.reason}`);
      if (blocked.missingPositiveRefs.length > 0) {
        console.log(`  missing: ${blocked.missingPositiveRefs.join(", ")}`);
      }
    }
  }

  if (report.circularities.length > 0) {
    console.log("\nCircularity warnings");
    console.log("--------------------");
    for (const warning of report.circularities) console.log(`- ${warning.message}`);
  }

  if (report.thematicWarnings.length > 0) {
    console.log("\nThematic warnings (review only)");
    console.log("---------------------------------");
    for (const warning of report.thematicWarnings) console.log(`- ${warning.message}`);
  }
}

async function main() {
  const { catalogPath, options } = parseArgs(process.argv.slice(2));
  const absoluteCatalogPath = path.resolve(process.cwd(), catalogPath);
  const catalog = JSON.parse(await readFile(absoluteCatalogPath, "utf8"));
  const report = analyze(catalog, options);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report);
  }

  // Thematic warnings and dependency cycles are audit hints, not blockers.
  // The only hard circularity that blocks progression is a direct self-unlock
  // (a figure unlocks a card that is strictly required by its own rule).
  const hasDirectSelfUnlock = report.circularities.some((warning) => warning.kind === "direct-self-unlock");
  if (report.blockedFigures.length > 0 || hasDirectSelfUnlock) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
