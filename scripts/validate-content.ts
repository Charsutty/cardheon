import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Card, GameCatalog } from "../packages/game-engine/src/index";

const DEFAULT_CATALOG_PATH = "content/catalog.dev.json";

const VALID_KINDS = new Set([
  "figure",
  "period",
  "region",
  "place",
  "civilization",
  "role",
  "domain",
  "concept",
  "event",
  "work",
  "movement",
  "relation",
  "symbol",
]);

const VALID_STATUSES = new Set(["draft", "needs_sources", "reviewed", "approved", "published", "deprecated"]);

type Issue = {
  severity: "error" | "warning";
  path: string;
  message: string;
};

function loadCatalog(path = DEFAULT_CATALOG_PATH): GameCatalog {
  const absolutePath = resolve(process.cwd(), path);
  return JSON.parse(readFileSync(absolutePath, "utf8")) as GameCatalog;
}

function validateCatalog(catalog: GameCatalog): Issue[] {
  const issues: Issue[] = [];
  const cardIds = new Set<string>();
  const sourceIds = new Set((catalog.sources ?? []).map((source) => source.id));
  const constellationIds = new Set((catalog.constellations ?? []).map((constellation) => constellation.id));

  if (!catalog.version) {
    issues.push({ severity: "error", path: "version", message: "Catalog version is required." });
  }

  for (const [index, card] of catalog.cards.entries()) {
    const path = `cards[${index}]`;
    validateCardShape(card, path, issues);

    if (cardIds.has(card.id)) {
      issues.push({ severity: "error", path: `${path}.id`, message: `Duplicate card id: ${card.id}` });
    }
    cardIds.add(card.id);

    for (const sourceId of card.sourceIds ?? []) {
      if (!sourceIds.has(sourceId)) {
        issues.push({ severity: "error", path: `${path}.sourceIds`, message: `Unknown source id: ${sourceId}` });
      }
    }

    for (const constellationId of card.constellationIds ?? []) {
      if (!constellationIds.has(constellationId)) {
        issues.push({ severity: "error", path: `${path}.constellationIds`, message: `Unknown constellation id: ${constellationId}` });
      }
    }
  }

  for (const [index, card] of catalog.cards.entries()) {
    if (card.kind !== "figure") continue;
    const path = `cards[${index}].discovery`;

    if (!card.discovery) {
      issues.push({ severity: "error", path, message: "Figure cards require a discovery rule." });
      continue;
    }

    if (card.discovery.figureId !== card.id) {
      issues.push({ severity: "error", path: `${path}.figureId`, message: "Discovery rule must target the figure card itself." });
    }

    for (const evidence of card.discovery.evidence ?? []) {
      if (evidence.card && !cardIds.has(evidence.card)) {
        issues.push({ severity: "error", path: `${path}.evidence`, message: `Unknown evidence card id: ${evidence.card}` });
      }
      if (!evidence.card && !evidence.tag) {
        issues.push({ severity: "error", path: `${path}.evidence`, message: "Evidence requires a card or tag." });
      }
    }

    for (const modifier of [...(card.discovery.synergies ?? []), ...(card.discovery.contradictions ?? [])]) {
      for (const token of modifier.whenAll) {
        if (token.startsWith("card:") && !cardIds.has(token.slice("card:".length))) {
          issues.push({ severity: "error", path: `${path}.${modifier.id}`, message: `Unknown modifier card token: ${token}` });
        }
      }
    }
  }

  for (const [index, relationship] of catalog.relationships.entries()) {
    if (!cardIds.has(relationship.source)) {
      issues.push({ severity: "error", path: `relationships[${index}].source`, message: `Unknown relationship source: ${relationship.source}` });
    }
    if (!cardIds.has(relationship.target)) {
      issues.push({ severity: "error", path: `relationships[${index}].target`, message: `Unknown relationship target: ${relationship.target}` });
    }
  }

  for (const [index, constellation] of catalog.constellations.entries()) {
    for (const cardId of constellation.cardIds) {
      if (!cardIds.has(cardId)) {
        issues.push({ severity: "error", path: `constellations[${index}].cardIds`, message: `Unknown constellation card id: ${cardId}` });
      }
    }
  }

  return issues;
}

function validateCardShape(card: Card, path: string, issues: Issue[]): void {
  if (!card.id) issues.push({ severity: "error", path: `${path}.id`, message: "Card id is required." });
  if (!card.slug) issues.push({ severity: "error", path: `${path}.slug`, message: "Card slug is required." });
  if (!VALID_KINDS.has(card.kind)) issues.push({ severity: "error", path: `${path}.kind`, message: `Unknown card kind: ${card.kind}` });
  if (!VALID_STATUSES.has(card.status)) issues.push({ severity: "error", path: `${path}.status`, message: `Unknown content status: ${card.status}` });

  if (!card.localization?.fr?.title) {
    issues.push({ severity: "warning", path: `${path}.localization.fr.title`, message: "French title is recommended for MVP content." });
  }
}

function main(): void {
  const catalogPath = process.argv[2] ?? DEFAULT_CATALOG_PATH;
  const catalog = loadCatalog(catalogPath);
  const issues = validateCatalog(catalog);

  if (issues.length === 0) {
    console.info(`✅ Content catalog is valid: ${catalog.cards.length} cards, ${catalog.relationships.length} relationships.`);
    return;
  }

  for (const issue of issues) {
    const icon = issue.severity === "error" ? "❌" : "⚠️";
    console.info(`${icon} ${issue.severity.toUpperCase()} ${issue.path}: ${issue.message}`);
  }

  if (issues.some((issue) => issue.severity === "error")) {
    process.exitCode = 1;
  }
}

main();
