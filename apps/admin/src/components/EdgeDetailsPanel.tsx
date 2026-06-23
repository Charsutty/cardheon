import type { AdminGraph, AdminGraphEdge } from "../graph/graphTypes";

export function EdgeDetailsPanel({ edge, graph }: { edge: AdminGraphEdge; graph: AdminGraph }) {
  return <section><div className="eyebrow">edge</div><h2>{edge.label}</h2>
    <div className="detail-row"><span>Type</span><strong>{edge.type}</strong></div>
    <div className="detail-row"><span>Source</span><strong>{graph.nodeById.get(edge.source)?.label ?? edge.source}</strong></div>
    <div className="detail-row"><span>Cible</span><strong>{graph.nodeById.get(edge.target)?.label ?? edge.target}</strong></div>
    <div className="detail-row"><span>Poids</span><strong>{edge.weight ?? "—"}</strong></div>
    {edge.predicate && <p><b>Prédicat :</b> {edge.predicate}</p>}{edge.reason && <p><b>Raison :</b> {edge.reason}</p>}
    {edge.sourceIds?.length && <p><b>Sources :</b> {edge.sourceIds.join(", ")}</p>}
    <p className="muted">Impact gameplay : {edge.isNegative ? "pénalité" : edge.type.startsWith("discovery") ? "contribution au score" : edge.type.includes("unlock") || edge.type.includes("reward") ? "déblocage" : "contexte du graphe"}.</p>
  </section>;
}
