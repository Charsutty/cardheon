import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { attemptDiscovery, type DiscoveryResult, type GameCatalog } from "../packages/game-engine/src/index";

const DEFAULT_CATALOG_PATH = "content/catalog.dev.json";

function loadCatalog(path = DEFAULT_CATALOG_PATH): GameCatalog {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as GameCatalog;
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

function resultLabel(result: DiscoveryResult): string {
  switch (result.type) {
    case "new_figure":
    case "already_discovered":
      return `${result.type}:${result.cardId}:${result.score}`;
    case "ambiguous":
      return `ambiguous:${result.candidateCount}`;
    case "near_miss":
      return `near_miss:${result.candidates[0]?.cardId ?? "none"}`;
    case "invalid":
      return `invalid:${result.reason}`;
  }
}

function main(): void {
  const catalog = loadCatalog(process.argv[2] ?? DEFAULT_CATALOG_PATH);
  const toolCards = catalog.cards.filter((card) => card.kind !== "figure");
  const toolCardIds = toolCards.map((card) => card.id);
  const discoveries = new Map<string, string[]>();
  const nearMisses: string[] = [];

  const userState = { discoveredCardIds: [] as string[], unlockedCardIds: toolCardIds };

  for (const size of [2, 3, 4]) {
    for (const combo of combinations(toolCards, size)) {
      const inputCardIds = combo.map((card) => card.id);
      const result = attemptDiscovery(catalog, userState, inputCardIds);

      if (result.type === "new_figure") {
        const current = discoveries.get(result.cardId) ?? [];
        current.push(inputCardIds.join(" + "));
        discoveries.set(result.cardId, current);
      } else if (result.type === "near_miss") {
        nearMisses.push(`${inputCardIds.join(" + ")} -> ${resultLabel(result)}`);
      }
    }
  }

  console.info("🔎 Discoverable figures");
  for (const figure of catalog.cards.filter((card) => card.kind === "figure")) {
    const paths = discoveries.get(figure.id) ?? [];
    const title = figure.localization.fr?.title ?? figure.id;
    console.info(`- ${title}: ${paths.length} path(s)`);
    for (const path of paths.slice(0, 3)) {
      console.info(`  • ${path}`);
    }
  }

  const undiscoverable = catalog.cards.filter((card) => card.kind === "figure" && !discoveries.has(card.id));
  if (undiscoverable.length > 0) {
    console.info("\n⚠️ Undiscoverable figures in this simulation:");
    for (const figure of undiscoverable) {
      console.info(`- ${figure.localization.fr?.title ?? figure.id}`);
    }
    process.exitCode = 1;
  }

  console.info(`\nNear misses sampled: ${nearMisses.length}`);
}

main();
