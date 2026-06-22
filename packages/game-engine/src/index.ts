export type DiscoveryResult =
  | { type: "new_figure"; cardId: string; score: number }
  | { type: "already_discovered"; cardId: string }
  | { type: "near_miss"; hints: string[] }
  | { type: "ambiguous"; hints: string[]; candidateCount: number }
  | { type: "invalid"; reason: string };

export type GameCatalog = {
  cards: unknown[];
  tags: unknown[];
  relationships: unknown[];
  discoveryRules: unknown[];
  constellations: unknown[];
};

export type UserGameState = {
  discoveredCardIds: string[];
};

export function attemptDiscovery(
  _catalog: GameCatalog,
  _userState: UserGameState,
  inputCardIds: string[],
): DiscoveryResult {
  if (inputCardIds.length < 2) {
    return { type: "invalid", reason: "At least two cards are required." };
  }

  return {
    type: "near_miss",
    hints: ["Discovery engine not implemented yet."],
  };
}
