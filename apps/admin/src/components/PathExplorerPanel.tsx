import { useMemo, useState } from "react";
import type { AdminGraph } from "../graph/graphTypes";
import { findSimplePaths } from "../graph/pathFinding";

export function PathExplorerPanel({ graph, sourceId, targetId, onSource, onTarget }: {
  graph: AdminGraph; sourceId: string; targetId: string; onSource: (id: string) => void; onTarget: (id: string) => void;
}) {
  const [maxDepth, setMaxDepth] = useState(5);
  const [includeNegative, setIncludeNegative] = useState(false);
  const options = graph.nodes.slice().sort((a, b) => a.label.localeCompare(b.label));
  const paths = useMemo(() => findSimplePaths(graph, sourceId, targetId, { maxDepth, maxPaths: 20, includeNegative }), [graph, sourceId, targetId, maxDepth, includeNegative]);
  return <section><h3>Chemins multiples</h3>
    <label className="field"><span>Source</span><select value={sourceId} onChange={(event) => onSource(event.target.value)}><option value="">Choisir…</option>{options.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>
    <label className="field"><span>Cible</span><select value={targetId} onChange={(event) => onTarget(event.target.value)}><option value="">Choisir…</option>{options.map((node) => <option key={node.id} value={node.id}>{node.label}</option>)}</select></label>
    <label className="field"><span>Profondeur max: {maxDepth}</span><input type="range" min="3" max="8" value={maxDepth} onChange={(event) => setMaxDepth(Number(event.target.value))} /></label>
    <label className="check"><input type="checkbox" checked={includeNegative} onChange={(event) => setIncludeNegative(event.target.checked)} /> Inclure les arêtes négatives</label>
    <div className="path-list">{paths.map((path, index) => <div className="path" key={`${path.nodeIds.join(":")}:${index}`}><b>#{index + 1} · score {path.score}</b>{path.nodeIds.map((id, itemIndex) => <span key={`${id}:${itemIndex}`}>{itemIndex > 0 && <i>→ {path.edges[itemIndex - 1]?.label} →</i>} {graph.nodeById.get(id)?.label ?? id}</span>)}</div>)}</div>
    {sourceId && targetId && paths.length === 0 && <p className="muted">Aucun chemin dans cette profondeur.</p>}
  </section>;
}
