import { z } from "zod";

export const CARD_KINDS = [
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
] as const;

export type CardKind = (typeof CARD_KINDS)[number];

export type ContentStatus =
  | "draft"
  | "needs_sources"
  | "reviewed"
  | "approved"
  | "published"
  | "deprecated";

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export const CONTENT_STATUSES = [
  "draft",
  "needs_sources",
  "reviewed",
  "approved",
  "published",
  "deprecated",
] as const;

export const RARITIES = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
] as const;

export const WeightedTagSchema = z.object({
  tag: z.string().min(1),
  weight: z.number().int().optional(),
});

export const LocalizationSchema = z.object({
  fr: z
    .object({
      title: z.string().min(1),
      subtitle: z.string().optional(),
      shortDescription: z.string().optional(),
      longDescription: z.string().optional(),
    })
    .optional(),
});

export const DiscoveryEvidenceSchema = z
  .object({
    card: z.string().min(1).optional(),
    tag: z.string().min(1).optional(),
    weight: z.number().int(),
    reason: z.string().optional(),
  })
  .refine((evidence) => Boolean(evidence.card || evidence.tag), {
    message: "Discovery evidence requires a card or a tag.",
  });

export const DiscoveryModifierSchema = z.object({
  id: z.string().min(1),
  whenAll: z.array(z.string().min(1)).min(1),
  weight: z.number().int(),
  reason: z.string().min(1),
});

export const DiscoveryRuleSchema = z.object({
  figureId: z.string().min(1),
  minScore: z.number().int().optional(),
  ambiguityMargin: z.number().int().optional(),
  evidence: z.array(DiscoveryEvidenceSchema).min(1),
  synergies: z.array(DiscoveryModifierSchema).optional(),
  contradictions: z.array(DiscoveryModifierSchema).optional(),
  minEvidenceCount: z.number().int().positive().optional(),
});

export const CardSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  kind: z.enum(CARD_KINDS),
  status: z.enum(CONTENT_STATUSES),
  rarity: z.enum(RARITIES).optional(),
  localization: LocalizationSchema,
  tags: z.array(WeightedTagSchema).optional(),
  sourceIds: z.array(z.string().min(1)).optional(),
  constellationIds: z.array(z.string().min(1)).optional(),
  discovery: DiscoveryRuleSchema.optional(),
  unlocksToolCardIds: z.array(z.string().min(1)).optional(),
});

export const RelationshipSchema = z.object({
  source: z.string().min(1),
  predicate: z.string().min(1),
  target: z.string().min(1),
  weight: z.number().int().optional(),
  sourceIds: z.array(z.string().min(1)).optional(),
});

export const ConstellationSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  localization: LocalizationSchema,
  cardIds: z.array(z.string().min(1)).min(1),
  reward: z
    .object({
      xp: z.number().int().nonnegative().optional(),
      unlockCardIds: z.array(z.string().min(1)).optional(),
    })
    .optional(),
});

export const PackSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  localization: LocalizationSchema,
  starterCardIds: z.array(z.string().min(1)),
  cardPoolIds: z.array(z.string().min(1)),
});

export const SourceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(["encyclopedia", "museum", "academic", "book", "primary_source", "institution", "article"]),
  url: z.string().url().optional(),
});

export const CraftingRecipeSchema = z.object({
  id: z.string().min(1),
  inputs: z.array(z.string().min(1)).min(2),
  outputCardId: z.string().min(1),
  localization: z
    .object({
      fr: z
        .object({
          reason: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export const GameCatalogSchema = z.object({
  version: z.string().min(1),
  cards: z.array(CardSchema),
  relationships: z.array(RelationshipSchema),
  constellations: z.array(ConstellationSchema),
  packs: z.array(PackSchema),
  sources: z.array(SourceSchema),
  gameplay: z.object({
    discovery: z.object({
      minInputs: z.number().int().positive(),
      maxInputs: z.number().int().positive(),
    }),
    crafting: z.array(CraftingRecipeSchema).optional(),
    progression: z.object({
      xpPerLevel: z.number().int().positive(),
      initialLevel: z.number().int().positive(),
    }),
  }),
});

export type WeightedTagInput = z.infer<typeof WeightedTagSchema>;
export type GameCatalogInput = z.infer<typeof GameCatalogSchema>;
