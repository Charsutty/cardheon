import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { GameCatalogSchema } from "../packages/content-schema/src/index";
import type { GameCatalog } from "../packages/game-engine/src/index";

const DEFAULT_CATALOG_PATH = "content/catalog.dev.json";
const DEFAULT_MINIMUM_APP_VERSION = "0.0.0";
const BATCH_SIZE = 500;

type PublishOptions = {
  catalogPath: string;
  catalogVersion?: string;
  minimumAppVersion: string;
  assetBaseUrl?: string;
  dryRun: boolean;
  sql: boolean;
};

type RestRow = Record<string, unknown>;

function parseOptions(): PublishOptions {
  const args = process.argv.slice(2);
  const options: PublishOptions = {
    catalogPath: DEFAULT_CATALOG_PATH,
    minimumAppVersion: DEFAULT_MINIMUM_APP_VERSION,
    dryRun: false,
    sql: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === "--catalog" && next) {
      options.catalogPath = next;
      index += 1;
    } else if (arg === "--version" && next) {
      options.catalogVersion = next;
      index += 1;
    } else if (arg === "--minimum-app-version" && next) {
      options.minimumAppVersion = next;
      index += 1;
    } else if (arg === "--asset-base-url" && next) {
      options.assetBaseUrl = next;
      index += 1;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--sql") {
      options.sql = true;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return options;
}

function loadDotEnv(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, "$2");
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function checksumCatalog(catalog: GameCatalog): string {
  return createHash("sha256").update(stableStringify(catalog)).digest("hex");
}

function loadCatalog(catalogPath: string): GameCatalog {
  const raw = JSON.parse(readFileSync(resolve(process.cwd(), catalogPath), "utf8")) as unknown;
  const parsed = GameCatalogSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid catalog: ${parsed.error.message}`);
  }
  return parsed.data as GameCatalog;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function supabaseUrlFromEnv(): string {
  return process.env.SUPABASE_URL ?? requiredEnv("EXPO_PUBLIC_SUPABASE_URL");
}

async function requestSupabase(
  path: string,
  init: RequestInit,
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<void> {
  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      prefer: "return=minimal",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase request failed (${response.status}) on ${path}: ${body}`);
  }
}

async function insertRows(
  table: string,
  rows: RestRow[],
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<void> {
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    const batch = rows.slice(index, index + BATCH_SIZE);
    if (batch.length === 0) continue;
    await requestSupabase(
      table,
      {
        method: "POST",
        body: JSON.stringify(batch),
      },
      supabaseUrl,
      serviceRoleKey,
    );
  }
}

function sqlLiteral(value: string | null | undefined): string {
  if (value == null) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown): string {
  return `${sqlLiteral(JSON.stringify(value))}::jsonb`;
}

function sqlTextArray(values: string[]): string {
  if (values.length === 0) return "'{}'::text[]";
  return `array[${values.map(sqlLiteral).join(", ")}]::text[]`;
}

function sqlNullableInteger(value: number | null | undefined): string {
  return typeof value === "number" ? String(value) : "null";
}

function buildPublishSql(
  catalogVersion: string,
  checksum: string,
  publishedAt: string,
  options: PublishOptions,
  rows: {
    cards: RestRow[];
    relationships: RestRow[];
    constellations: RestRow[];
    packs: RestRow[];
    sources: RestRow[];
  },
  gameplay: GameCatalog["gameplay"],
): string {
  const statements: string[] = [
    "begin;",
    `delete from public.catalog_versions where id = ${sqlLiteral(catalogVersion)};`,
    `insert into public.catalog_versions (id, status, minimum_app_version, catalog_checksum, asset_base_url, gameplay, published_at) values (${sqlLiteral(catalogVersion)}, 'draft', ${sqlLiteral(options.minimumAppVersion)}, ${sqlLiteral(checksum)}, ${sqlLiteral(options.assetBaseUrl)}, ${sqlJson(catalog.gameplay)}, null);`,
  ];

  if (rows.cards.length > 0) {
    statements.push(`insert into public.catalog_cards (catalog_version_id, id, slug, kind, status, rarity, localization, tags, discovery, unlocks_tool_card_ids, source_ids, constellation_ids) values\n${rows.cards
      .map((row) => `  (${[
        sqlLiteral(row.catalog_version_id as string),
        sqlLiteral(row.id as string),
        sqlLiteral(row.slug as string),
        sqlLiteral(row.kind as string),
        sqlLiteral(row.status as string),
        sqlLiteral(row.rarity as string | null),
        sqlJson(row.localization),
        sqlJson(row.tags),
        row.discovery ? sqlJson(row.discovery) : "null",
        sqlTextArray(row.unlocks_tool_card_ids as string[]),
        sqlTextArray(row.source_ids as string[]),
        sqlTextArray(row.constellation_ids as string[]),
      ].join(", ")})`)
      .join(",\n")};`);
  }

  if (rows.relationships.length > 0) {
    statements.push(`insert into public.catalog_relationships (catalog_version_id, source_card_id, predicate, target_card_id, weight, source_ids) values\n${rows.relationships
      .map((row) => `  (${[
        sqlLiteral(row.catalog_version_id as string),
        sqlLiteral(row.source_card_id as string),
        sqlLiteral(row.predicate as string),
        sqlLiteral(row.target_card_id as string),
        sqlNullableInteger(row.weight as number | null),
        sqlTextArray(row.source_ids as string[]),
      ].join(", ")})`)
      .join(",\n")};`);
  }

  if (rows.constellations.length > 0) {
    statements.push(`insert into public.catalog_constellations (catalog_version_id, id, slug, localization, card_ids, reward) values\n${rows.constellations
      .map((row) => `  (${[
        sqlLiteral(row.catalog_version_id as string),
        sqlLiteral(row.id as string),
        sqlLiteral(row.slug as string),
        sqlJson(row.localization),
        sqlTextArray(row.card_ids as string[]),
        row.reward ? sqlJson(row.reward) : "null",
      ].join(", ")})`)
      .join(",\n")};`);
  }

  if (rows.packs.length > 0) {
    statements.push(`insert into public.catalog_packs (catalog_version_id, id, slug, localization, starter_card_ids, card_pool_ids) values\n${rows.packs
      .map((row) => `  (${[
        sqlLiteral(row.catalog_version_id as string),
        sqlLiteral(row.id as string),
        sqlLiteral(row.slug as string),
        sqlJson(row.localization),
        sqlTextArray(row.starter_card_ids as string[]),
        sqlTextArray(row.card_pool_ids as string[]),
      ].join(", ")})`)
      .join(",\n")};`);
  }

  if (rows.sources.length > 0) {
    statements.push(`insert into public.catalog_sources (catalog_version_id, id, title, type, url) values\n${rows.sources
      .map((row) => `  (${[
        sqlLiteral(row.catalog_version_id as string),
        sqlLiteral(row.id as string),
        sqlLiteral(row.title as string),
        sqlLiteral(row.type as string),
        sqlLiteral(row.url as string | null),
      ].join(", ")})`)
      .join(",\n")};`);
  }

  statements.push(
    `update public.catalog_versions set status = 'deprecated' where id <> ${sqlLiteral(catalogVersion)} and status = 'published';`,
    `update public.catalog_versions set status = 'published', published_at = ${sqlLiteral(publishedAt)}::timestamptz where id = ${sqlLiteral(catalogVersion)};`,
    "commit;",
  );

  return `${statements.join("\n\n")}\n`;
}

async function publishCatalog(options: PublishOptions): Promise<void> {
  loadDotEnv();

  const catalog = loadCatalog(options.catalogPath);
  const catalogVersion = options.catalogVersion ?? catalog.version;
  const checksum = checksumCatalog(catalog);
  const publishedAt = new Date().toISOString();

  const rows = {
    cards: catalog.cards.map((card) => ({
      catalog_version_id: catalogVersion,
      id: card.id,
      slug: card.slug,
      kind: card.kind,
      status: card.status,
      rarity: card.rarity ?? null,
      localization: card.localization,
      tags: card.tags ?? [],
      discovery: card.discovery ?? null,
      unlocks_tool_card_ids: card.unlocksToolCardIds ?? [],
      source_ids: card.sourceIds ?? [],
      constellation_ids: card.constellationIds ?? [],
    })),
    relationships: catalog.relationships.map((relationship) => ({
      catalog_version_id: catalogVersion,
      source_card_id: relationship.source,
      predicate: relationship.predicate,
      target_card_id: relationship.target,
      weight: relationship.weight ?? null,
      source_ids: relationship.sourceIds ?? [],
    })),
    constellations: catalog.constellations.map((constellation) => ({
      catalog_version_id: catalogVersion,
      id: constellation.id,
      slug: constellation.slug,
      localization: constellation.localization,
      card_ids: constellation.cardIds,
      reward: constellation.reward ?? null,
    })),
    packs: catalog.packs.map((pack) => ({
      catalog_version_id: catalogVersion,
      id: pack.id,
      slug: pack.slug,
      localization: pack.localization,
      starter_card_ids: pack.starterCardIds,
      card_pool_ids: pack.cardPoolIds,
    })),
    sources: catalog.sources.map((source) => ({
      catalog_version_id: catalogVersion,
      id: source.id,
      title: source.title,
      type: source.type,
      url: source.url ?? null,
    })),
  };

  const log = options.sql ? console.error : console.info;
  log(`Catalog: ${options.catalogPath}`);
  log(`Version: ${catalogVersion}`);
  log(`Checksum: ${checksum}`);
  log(
    `Rows: ${rows.cards.length} cards, ${rows.relationships.length} relationships, ${rows.constellations.length} constellations, ${rows.packs.length} packs, ${rows.sources.length} sources`,
  );

  if (options.sql) {
    console.log(buildPublishSql(catalogVersion, checksum, publishedAt, options, rows, catalog.gameplay));
    return;
  }

  if (options.dryRun) return;

  const supabaseUrl = supabaseUrlFromEnv();
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  await requestSupabase(
    `catalog_versions?id=eq.${encodeURIComponent(catalogVersion)}`,
    { method: "DELETE" },
    supabaseUrl,
    serviceRoleKey,
  );

  await insertRows(
    "catalog_versions",
    [
      {
        id: catalogVersion,
        status: "draft",
        minimum_app_version: options.minimumAppVersion,
        catalog_checksum: checksum,
        asset_base_url: options.assetBaseUrl ?? null,
        gameplay: catalog.gameplay,
        published_at: null,
      },
    ],
    supabaseUrl,
    serviceRoleKey,
  );

  await insertRows("catalog_cards", rows.cards, supabaseUrl, serviceRoleKey);
  await insertRows("catalog_relationships", rows.relationships, supabaseUrl, serviceRoleKey);
  await insertRows("catalog_constellations", rows.constellations, supabaseUrl, serviceRoleKey);
  await insertRows("catalog_packs", rows.packs, supabaseUrl, serviceRoleKey);
  await insertRows("catalog_sources", rows.sources, supabaseUrl, serviceRoleKey);

  await requestSupabase(
    `catalog_versions?id=neq.${encodeURIComponent(catalogVersion)}&status=eq.published`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "deprecated" }),
    },
    supabaseUrl,
    serviceRoleKey,
  );

  await requestSupabase(
    `catalog_versions?id=eq.${encodeURIComponent(catalogVersion)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status: "published", published_at: publishedAt }),
    },
    supabaseUrl,
    serviceRoleKey,
  );

  console.info(`Published catalog version ${catalogVersion} at ${publishedAt}`);
}

publishCatalog(parseOptions()).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
