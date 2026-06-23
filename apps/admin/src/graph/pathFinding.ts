import type { AdminGraph, AdminGraphEdge } from "./graphTypes";

export type GraphPath = { nodeIds: string[]; edges: AdminGraphEdge[]; score: number };
export type PathOptions = { maxDepth: number; maxPaths: number; edgeTypes?: Set<string>; includeNegative?: boolean };

export function findSimplePaths(graph: AdminGraph, sourceId: string, targetId: string, options: PathOptions): GraphPath[] {
  if (!sourceId || !targetId || sourceId === targetId) return [];
  const adjacency = new Map<string, AdminGraphEdge[]>();
  for (const edge of graph.edges) {
    if (options.edgeTypes?.size && !options.edgeTypes.has(edge.type)) continue;
    if (!options.includeNegative && edge.isNegative) continue;
    adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge]);
    adjacency.set(edge.target, [...(adjacency.get(edge.target) ?? []), { ...edge, source: edge.target, target: edge.source }]);
  }
  const results: GraphPath[] = [];
  const visit = (current: string, nodeIds: string[], pathEdges: AdminGraphEdge[], score: number) => {
    if (pathEdges.length > options.maxDepth || results.length >= options.maxPaths * 8) return;
    if (current === targetId) {
      results.push({ nodeIds: [...nodeIds], edges: [...pathEdges], score });
      return;
    }
    for (const edge of adjacency.get(current) ?? []) {
      if (nodeIds.includes(edge.target)) continue;
      visit(edge.target, [...nodeIds, edge.target], [...pathEdges, edge], score + (edge.weight ?? 0));
    }
  };
  visit(sourceId, [sourceId], [], 0);
  return results.sort((a, b) => b.score - a.score || a.edges.length - b.edges.length).slice(0, options.maxPaths);
}
