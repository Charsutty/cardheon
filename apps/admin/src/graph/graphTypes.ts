import type { CardKind, GameCatalog } from "@cardheon/game-engine";

export type AdminNodeType = "figure" | "tool" | "tag" | "recipe" | "constellation" | "source" | "modifier";
export type AdminEdgeType =
  | "historical_relationship"
  | "discovery_evidence"
  | "discovery_synergy"
  | "discovery_contradiction"
  | "craft_input"
  | "craft_output"
  | "figure_unlock"
  | "constellation_member"
  | "constellation_reward"
  | "source_reference";

export type AdminGraphNode = {
  id: string;
  type: AdminNodeType;
  label: string;
  cardKind?: CardKind;
  rarity?: string;
  status?: string;
  score?: number;
  tags?: string[];
  isReachable?: boolean;
  isBlocked?: boolean;
  issueCount?: number;
  entity?: unknown;
};

export type AdminGraphEdge = {
  id: string;
  source: string;
  target: string;
  type: AdminEdgeType;
  label: string;
  weight?: number;
  predicate?: string;
  reason?: string;
  sourceIds?: string[];
  isPositive?: boolean;
  isNegative?: boolean;
};

export type AdminGraph = {
  nodes: AdminGraphNode[];
  edges: AdminGraphEdge[];
  nodeById: Map<string, AdminGraphNode>;
  catalog: GameCatalog;
};

export type GraphIssue = {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
  nodeId?: string;
};
