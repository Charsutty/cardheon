import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { GameCatalog } from "../packages/game-engine/src/index";

const DEFAULT_INPUT = "content/catalog.dev.json";
const DEFAULT_OUTPUT = "dist/catalog.local.json";

function main(): void {
  const inputPath = process.argv[2] ?? DEFAULT_INPUT;
  const outputPath = process.argv[3] ?? DEFAULT_OUTPUT;
  const catalog = JSON.parse(readFileSync(resolve(process.cwd(), inputPath), "utf8")) as GameCatalog;

  const compiled = {
    builtAt: new Date().toISOString(),
    version: catalog.version,
    cardsById: Object.fromEntries(catalog.cards.map((card) => [card.id, card])),
    playableCardIds: catalog.cards.filter((card) => card.kind !== "figure").map((card) => card.id),
    figureCardIds: catalog.cards.filter((card) => card.kind === "figure").map((card) => card.id),
    relationships: catalog.relationships,
    constellations: catalog.constellations,
    packs: catalog.packs,
    sources: catalog.sources,
  };

  const absoluteOutput = resolve(process.cwd(), outputPath);
  mkdirSync(dirname(absoluteOutput), { recursive: true });
  writeFileSync(absoluteOutput, `${JSON.stringify(compiled, null, 2)}\n`, "utf8");
  console.info(`✅ Built local catalog: ${outputPath}`);
}

main();
