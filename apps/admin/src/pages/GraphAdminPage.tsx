import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Card, GameCatalog } from "@cardheon/game-engine";
import catalogJson from "../../../../content/catalog.dev.json";
import { buildAdminGraph } from "../graph/buildAdminGraph";
import { analyzeProgression, computeIssues, graphStats } from "../graph/graphMetrics";
import type { AdminGraphEdge, AdminGraphNode, AdminNodeType } from "../graph/graphTypes";
import { DiscoveryAuditPanel } from "../components/DiscoveryAuditPanel";
import { EdgeDetailsPanel } from "../components/EdgeDetailsPanel";
import { GraphCanvas, type GraphCanvasHandle } from "../components/GraphCanvas";
import { GraphStatsPanel } from "../components/GraphStatsPanel";
import { GraphToolbar, type GraphFilters } from "../components/GraphToolbar";
import { IssueListPanel } from "../components/IssueListPanel";
import { NodeDetailsPanel } from "../components/NodeDetailsPanel";
import { PathExplorerPanel } from "../components/PathExplorerPanel";

const catalog = catalogJson as GameCatalog;
const ALL_NODE_TYPES = new Set<AdminNodeType>(["figure", "tool", "tag", "recipe", "constellation", "source", "modifier"]);
const DEFAULT_FILTERS: GraphFilters = {
  search: "", nodeTypes: ALL_NODE_TYPES, edgeTypes: new Set(), showTags: true, showRecipes: true,
  showDiscovery: true, showRelationships: true, showContradictions: true, minWeight: 0, depth: 0,
  cardKind: "", status: "", rarity: "", reachability: "",
};

function loadFilters(): GraphFilters {
  try {
    const stored = JSON.parse(localStorage.getItem("cardheon-admin-filters") ?? "{}") as Partial<GraphFilters> & { nodeTypes?: AdminNodeType[] };
    return { ...DEFAULT_FILTERS, ...stored, nodeTypes: new Set(stored.nodeTypes ?? ALL_NODE_TYPES), edgeTypes: new Set() };
  } catch { return DEFAULT_FILTERS; }
}

function download(name: string, content: string, type: string) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([content], { type }));
  anchor.download = name; anchor.click(); URL.revokeObjectURL(anchor.href);
}

export default function GraphAdminPage() {
  const baseGraph = useMemo(() => buildAdminGraph(catalog), []);
  const progression = useMemo(() => analyzeProgression(catalog), []);
  const graph = useMemo(() => {
    const reachable = new Set([...progression.reachableTools, ...progression.discoveredFigures]);
    const blocked = new Set(progression.blockedFigures);
    const nodes = baseGraph.nodes.map((node) => ({ ...node, isReachable: reachable.has(node.id), isBlocked: blocked.has(node.id) }));
    return { ...baseGraph, nodes, nodeById: new Map(nodes.map((node) => [node.id, node])) };
  }, [baseGraph, progression]);
  const issues = useMemo(() => computeIssues(graph, progression), [graph, progression]);
  const stats = useMemo(() => graphStats(catalog), []);
  const [filters, setFilters] = useState<GraphFilters>(loadFilters);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedEdgeId, setSelectedEdgeId] = useState("");
  const [pathSource, setPathSource] = useState("");
  const [pathTarget, setPathTarget] = useState("");
  const [layout, setLayout] = useState("cose");
  const [spacing, setSpacing] = useState(1.65);
  const canvasRef = useRef<GraphCanvasHandle>(null);

  useEffect(() => {
    localStorage.setItem("cardheon-admin-filters", JSON.stringify({ ...filters, nodeTypes: [...filters.nodeTypes], edgeTypes: [] }));
  }, [filters]);

  const visible = useMemo(() => {
    const search = filters.search.trim().toLocaleLowerCase("fr");
    let candidateIds = new Set(graph.nodes.filter((node) => {
      if (!filters.nodeTypes.has(node.type)) return false;
      if (!filters.showTags && node.type === "tag") return false;
      if (!filters.showRecipes && node.type === "recipe") return false;
      if (filters.cardKind && node.cardKind !== filters.cardKind) return false;
      if (filters.status && node.status !== filters.status) return false;
      if (filters.rarity && node.rarity !== filters.rarity) return false;
      if (filters.reachability === "reachable" && !node.isReachable) return false;
      if (filters.reachability === "blocked" && !node.isBlocked) return false;
      if (filters.reachability === "unknown" && (node.isReachable || node.isBlocked)) return false;
      if (search && !`${node.id} ${node.label} ${(node.tags ?? []).join(" ")}`.toLocaleLowerCase("fr").includes(search)) return false;
      return true;
    }).map((node) => node.id));
    const edgeAllowed = (edge: AdminGraphEdge) => {
      if (!filters.showRelationships && edge.type === "historical_relationship") return false;
      if (!filters.showDiscovery && edge.type.startsWith("discovery_")) return false;
      if (!filters.showContradictions && edge.type === "discovery_contradiction") return false;
      if (edge.weight !== undefined && Math.abs(edge.weight) < filters.minWeight) return false;
      return true;
    };
    if (filters.depth && selectedNodeId) {
      const neighborhood = new Set([selectedNodeId]);
      let frontier = new Set([selectedNodeId]);
      for (let depth = 0; depth < filters.depth; depth += 1) {
        const next = new Set<string>();
        for (const edge of graph.edges.filter(edgeAllowed)) {
          if (frontier.has(edge.source)) next.add(edge.target);
          if (frontier.has(edge.target)) next.add(edge.source);
        }
        next.forEach((id) => neighborhood.add(id)); frontier = next;
      }
      candidateIds = new Set([...candidateIds].filter((id) => neighborhood.has(id)));
    }
    const edges = graph.edges.filter((edge) => edgeAllowed(edge) && candidateIds.has(edge.source) && candidateIds.has(edge.target));
    const connected = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    if (search) candidateIds.forEach((id) => connected.add(id));
    return { nodes: graph.nodes.filter((node) => candidateIds.has(node.id) && (connected.has(node.id) || graph.nodes.length < 200)), edges };
  }, [filters, graph, selectedNodeId]);

  const selectNode = useCallback((id: string) => { setSelectedNodeId(id); setSelectedEdgeId(""); }, []);
  const selectEdge = useCallback((id: string) => { setSelectedEdgeId(id); setSelectedNodeId(""); }, []);
  const selectedNode = graph.nodeById.get(selectedNodeId);
  const selectedEdge = graph.edges.find((edge) => edge.id === selectedEdgeId);
  const selectedFigure = selectedNode?.type === "figure" ? selectedNode.entity as Card : undefined;
  const exportJson = () => download("cardheon-visible-graph.json", JSON.stringify(visible, null, 2), "application/json");
  const exportPng = () => {
    const uri = canvasRef.current?.png(); if (!uri) return;
    const anchor = document.createElement("a"); anchor.href = uri; anchor.download = "cardheon-graph.png"; anchor.click();
  };

  return <main className="app-shell">
    <header><div><div className="eyebrow">Cardhéon Admin</div><h1>Graph Audit</h1></div><div className="catalog-meta"><span>catalog {catalog.version}</span><b>{visible.nodes.length} nœuds · {visible.edges.length} arêtes</b></div></header>
    <div className="workspace">
      <aside className="left-panel scroll">
        <GraphToolbar filters={filters} onChange={setFilters} onFit={() => canvasRef.current?.fit()} onFocus={() => canvasRef.current?.focus(selectedNodeId)} onExportJson={exportJson} onExportPng={exportPng} />
        <GraphStatsPanel stats={stats} />
        <section><h3>Progression</h3><div className="detail-row"><span>Starter</span><b>{progression.starterTools.length}</b></div><div className="detail-row"><span>Outils atteignables</span><b>{progression.reachableTools.length}</b></div><div className="detail-row"><span>Figures découvertes</span><b>{progression.discoveredFigures.length}</b></div><div className="detail-row"><span>Figures bloquées</span><b>{progression.blockedFigures.length}</b></div><details><summary>Ordre valide</summary><ol>{progression.validDiscoveryOrder.map((id) => <li key={id}>{graph.nodeById.get(id)?.label ?? id}</li>)}</ol></details></section>
        <IssueListPanel issues={issues} onSelect={selectNode} />
      </aside>
      <section className="center-panel">
        <div className="canvas-toolbar">
          <div className="canvas-controls">
            <label>Layout <select value={layout} onChange={(event) => setLayout(event.target.value)}><option value="cose">cose</option><option value="breadthfirst">breadthfirst</option><option value="circle">circle</option><option value="grid">grid</option></select></label>
            <label className="spacing-control">Espacement
              <input type="range" min="0.75" max="3" step="0.15" value={spacing} onChange={(event) => setSpacing(Number(event.target.value))} />
              <b>{spacing.toFixed(2)}×</b>
            </label>
          </div>
          <span>Molette: zoom · glisser: pan · clic: inspecter</span>
        </div>
        <GraphCanvas ref={canvasRef} nodes={visible.nodes} edges={visible.edges} selectedId={selectedNodeId || selectedEdgeId} layout={layout} spacing={spacing} onSelectNode={selectNode} onSelectEdge={selectEdge} />
      </section>
      <aside className="right-panel scroll">
        {selectedNode ? <NodeDetailsPanel node={selectedNode} graph={graph} issues={issues.filter((issue) => issue.nodeId === selectedNode.id)} onFocus={() => canvasRef.current?.focus(selectedNode.id)} onPathFrom={() => setPathSource(selectedNode.id)} onPathTo={() => setPathTarget(selectedNode.id)} /> : selectedEdge ? <EdgeDetailsPanel edge={selectedEdge} graph={graph} /> : <section><div className="eyebrow">Inspection</div><h2>Sélectionnez un élément</h2><p className="muted">Cliquez sur un nœud ou une arête pour afficher ses données et son impact gameplay.</p></section>}
        <PathExplorerPanel graph={graph} sourceId={pathSource} targetId={pathTarget} onSource={setPathSource} onTarget={setPathTarget} />
        <DiscoveryAuditPanel catalog={catalog} figure={selectedFigure} />
      </aside>
    </div>
  </main>;
}
