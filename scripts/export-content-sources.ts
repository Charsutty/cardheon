import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { stringify as stringifyYaml } from "yaml";
import { GameCatalogSchema } from "../packages/content-schema/src/index";
import type { Card, GameCatalog } from "../packages/game-engine/src/index";

const DEFAULT_INPUT = "content/catalog.dev.json";
const DEFAULT_OUTPUT_ROOT = "content/catalog-source";

function fileSlug(value: string): string {
  return value.replace(/[^a-zA-Z0-9.-]+/g, "-").replace(/\./g, "-").toLowerCase();
}

function writeYaml(path: string, value: unknown): void {
  const absolutePath = resolve(process.cwd(), path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(
    absolutePath,
    stringifyYaml(value, {
      lineWidth: 120,
      sortMapEntries: false,
    }),
    "utf8",
  );
}

function cardPath(root: string, card: Card): string {
  if (card.kind === "figure") return `${root}/figures/${fileSlug(card.slug)}.yml`;
  return `${root}/tools/${card.kind}/${fileSlug(card.slug)}.yml`;
}

function main(): void {
  const inputPath = process.argv[2] ?? DEFAULT_INPUT;
  const outputRoot = process.argv[3] ?? DEFAULT_OUTPUT_ROOT;
  const rawCatalog = JSON.parse(readFileSync(resolve(process.cwd(), inputPath), "utf8")) as GameCatalog;
  const catalog = GameCatalogSchema.parse(rawCatalog) as GameCatalog;

  for (const card of catalog.cards) {
    writeYaml(cardPath(outputRoot, card), card);
  }

  for (const constellation of catalog.constellations) {
    writeYaml(`${outputRoot}/constellations/${fileSlug(constellation.slug)}.yml`, constellation);
  }

  for (const pack of catalog.packs) {
    writeYaml(`${outputRoot}/packs/${fileSlug(pack.slug)}.yml`, pack);
  }

  for (const source of catalog.sources) {
    writeYaml(`${outputRoot}/sources/${fileSlug(source.id)}.yml`, source);
  }

  writeYaml(`${outputRoot}/relationships/relationships.yml`, {
    relationships: catalog.relationships,
  });

  writeYaml(`${outputRoot}/gameplay/gameplay.yml`, {
    version: catalog.version,
    gameplay: catalog.gameplay,
  });

  console.info(`✅ Exported content sources to ${outputRoot}`);
  console.info(`   ${catalog.cards.filter((card) => card.kind === "figure").length} figures`);
  console.info(`   ${catalog.cards.filter((card) => card.kind !== "figure").length} tools`);
  console.info(`   ${catalog.relationships.length} relationships`);
  console.info(`   ${catalog.constellations.length} constellations`);
}

main();
