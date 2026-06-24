import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { GameCatalogSchema } from "../packages/content-schema/src/index";
import type { Card, Constellation, GameCatalog, Pack, Relationship, Source } from "../packages/game-engine/src/index";

const DEFAULT_INPUT = "content/catalog.dev.json";
const DEFAULT_OUTPUT = "dist/catalog.local.json";
const SOURCE_ROOT = existsSync(resolve(process.cwd(), "content/catalog-source")) ? "content/catalog-source" : "content";

type RawYaml = Record<string, unknown>;

function readYamlFiles(directory: string): RawYaml[] {
  const absoluteDirectory = resolve(process.cwd(), directory);
  if (!existsSync(absoluteDirectory)) return [];

  const files: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      if (entry.isFile() && /\.(ya?ml)$/i.test(entry.name)) files.push(entryPath);
    }
  };
  walk(absoluteDirectory);

  return files.map((file) => parseYaml(readFileSync(file, "utf8")) as RawYaml);
}

function prefixedId(prefix: string, value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  return raw.includes(".") ? raw : `${prefix}.${raw}`;
}

function slugFromId(id: string): string {
  return id.replace(/\./g, "-");
}

function cardRef(value: unknown): string {
  const raw = String(value ?? "");
  if (!raw) return "";
  if (raw.includes(".")) return raw;
  return raw.includes("-") ? `figure.${raw}` : raw;
}

function normalizeTags(rawTags: unknown): Card["tags"] {
  if (!Array.isArray(rawTags)) return [];
  return rawTags.flatMap((item) => {
    if (typeof item === "string") return [{ tag: item }];
    if (item && typeof item === "object" && "tag" in item) {
      const tag = String((item as Record<string, unknown>).tag ?? "");
      const weight = (item as Record<string, unknown>).weight;
      return tag ? [{ tag, weight: typeof weight === "number" ? weight : undefined }] : [];
    }
    if (item && typeof item === "object") {
      return Object.entries(item as Record<string, unknown>).map(([tag, weight]) => ({
        tag,
        weight: typeof weight === "number" ? weight : undefined,
      }));
    }
    return [];
  });
}

function toCard(raw: RawYaml, fallbackKind?: Card["kind"]): Card {
  const kind = String(raw.kind ?? fallbackKind ?? "concept") as Card["kind"];
  const id = String(raw.id ?? prefixedId(kind, raw.slug));
  return {
    id,
    slug: String(raw.slug ?? slugFromId(id)),
    kind,
    status: String(raw.status ?? "draft") as Card["status"],
    rarity: raw.rarity as Card["rarity"],
    localization: raw.localization as Card["localization"],
    tags: normalizeTags(raw.tags),
    sourceIds: Array.isArray(raw.sourceIds) ? raw.sourceIds.map(String) : undefined,
    constellationIds: Array.isArray(raw.constellationIds)
      ? raw.constellationIds.map(String)
      : Array.isArray(raw.constellations)
        ? raw.constellations.map((slug) => prefixedId("constellation", slug))
        : undefined,
    discovery: raw.discovery as Card["discovery"],
    unlocksToolCardIds: Array.isArray(raw.unlocksToolCardIds) ? raw.unlocksToolCardIds.map(String) : undefined,
  };
}

function compileSources(): GameCatalog | undefined {
  const figureSources = readYamlFiles(`${SOURCE_ROOT}/figures`);
  const toolSources = readYamlFiles(`${SOURCE_ROOT}/tools`);
  const constellationSources = readYamlFiles(`${SOURCE_ROOT}/constellations`);
  const packSources = readYamlFiles(`${SOURCE_ROOT}/packs`);
  const sourceSources = readYamlFiles(`${SOURCE_ROOT}/sources`).filter((source) => source.id || source.slug);
  const relationshipSources = readYamlFiles(`${SOURCE_ROOT}/relationships`);
  const gameplaySource = readYamlFiles(`${SOURCE_ROOT}/gameplay`)[0];

  if (
    figureSources.length < 30 ||
    toolSources.length < 100 ||
    constellationSources.length < 10 ||
    packSources.length === 0
  ) {
    return undefined;
  }

  const cards: Card[] = [];
  const relationships: Relationship[] = [];

  for (const raw of toolSources) cards.push(toCard(raw));

  for (const raw of figureSources) {
    const card = toCard(raw, "figure");
    cards.push(card);

    for (const relation of Array.isArray(raw.relationships) ? raw.relationships : []) {
      if (!relation || typeof relation !== "object") continue;
      const data = relation as Record<string, unknown>;
      relationships.push({
        source: card.id,
        predicate: String(data.predicate ?? "related_to"),
        target: cardRef(data.target),
        weight: typeof data.weight === "number" ? data.weight : undefined,
      });
    }
  }

  const constellations: Constellation[] = constellationSources.map((raw) => {
    const id = prefixedId("constellation", raw.id ?? raw.slug);
    return {
      id,
      slug: String(raw.slug ?? slugFromId(id)),
      localization: raw.localization as Card["localization"],
      cardIds: Array.isArray(raw.cardIds)
        ? raw.cardIds.map(String)
        : (Array.isArray(raw.nodes) ? raw.nodes : [])
          .map((node) => (node && typeof node === "object" ? (node as Record<string, unknown>).card : node))
          .map(cardRef)
          .filter(Boolean),
      reward: raw.reward as Constellation["reward"],
    };
  });

  const packs: Pack[] = packSources.map((raw) => {
    const id = prefixedId("pack", raw.id ?? raw.slug);
    const items = Array.isArray(raw.items) ? raw.items : [];
    return {
      id,
      slug: String(raw.slug ?? slugFromId(id)),
      localization: raw.localization as Card["localization"],
      starterCardIds: Array.isArray(raw.starterCardIds)
        ? raw.starterCardIds.map(String)
        : items
          .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>).card : item))
          .map(cardRef)
          .filter(Boolean),
      cardPoolIds: Array.isArray(raw.cardPoolIds)
        ? raw.cardPoolIds.map(String)
        : cards.filter((card) => card.kind === "figure").map((card) => card.id),
    };
  });

  const sources: Source[] = sourceSources.map((raw) => ({
    id: prefixedId("source", raw.id ?? raw.slug),
    title: String(raw.title ?? raw.slug ?? raw.id),
    type: String(raw.type ?? "institution") as Source["type"],
    url: typeof raw.url === "string" ? raw.url : undefined,
  }));

  relationships.push(...relationshipSources.flatMap((source) => Array.isArray(source.relationships) ? source.relationships as Relationship[] : []));

  const gameplay = gameplaySource?.gameplay as GameCatalog["gameplay"] | undefined;
  const catalog: GameCatalog = {
    version: String(gameplaySource?.version ?? "0.1.0-editorial"),
    gameplay: gameplay ?? {
      discovery: { minInputs: 2, maxInputs: 5 },
      progression: { xpPerLevel: 2000, initialLevel: 1 },
    },
    cards,
    relationships,
    constellations,
    packs,
    sources: sources.length > 0 ? sources : [{ id: "source.cardheon.editorial", title: "Cardhéon editorial source", type: "institution" }],
  };

  const result = GameCatalogSchema.safeParse(catalog);
  return result.success ? (result.data as GameCatalog) : undefined;
}

function main(): void {
  const catalogMode = process.argv[2] === "--catalog";
  const inputPath = catalogMode ? DEFAULT_INPUT : process.argv[2] ?? DEFAULT_INPUT;
  const outputPath = catalogMode ? process.argv[3] ?? DEFAULT_INPUT : process.argv[3] ?? DEFAULT_OUTPUT;
  const compiledFromSources = compileSources();
  const catalog = compiledFromSources ?? JSON.parse(readFileSync(resolve(process.cwd(), inputPath), "utf8")) as GameCatalog;

  if (catalogMode) {
    const absoluteOutput = resolve(process.cwd(), outputPath);
    mkdirSync(dirname(absoluteOutput), { recursive: true });
    writeFileSync(absoluteOutput, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
    console.info(`✅ Compiled catalog artifact: ${outputPath}`);
    if (!compiledFromSources) {
      console.info("ℹ️  Source YAML corpus is incomplete; copied existing catalog artifact.");
    }
    return;
  }

  const compiled = {
    builtAt: new Date().toISOString(),
    source: compiledFromSources ? "content-sources" : inputPath,
    version: catalog.version,
    gameplay: catalog.gameplay,
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
  if (!compiledFromSources) {
    console.info("ℹ️  Source YAML corpus is incomplete; used catalog artifact as input.");
  }
}

main();
