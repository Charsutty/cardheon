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
