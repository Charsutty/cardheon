import type { Card, GameCatalog } from "@cardheon/game-engine";
import type { AdminGraph, AdminGraphNode, GraphIssue } from "../graph/graphTypes";

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="detail-row"><span>{label}</span><strong>{children}</strong></div>;

export function NodeDetailsPanel({ node, graph, issues, onFocus, onPathFrom, onPathTo }: {
  node: AdminGraphNode;
  graph: AdminGraph;
  issues: GraphIssue[];
  onFocus: () => void;
  onPathFrom: () => void;
  onPathTo: () => void;
}) {
  const card = node.entity && "kind" in (node.entity as object) ? node.entity as Card : undefined;
  const incoming = graph.edges.filter((edge) => edge.target === node.id);
  const outgoing = graph.edges.filter((edge) => edge.source === node.id);
  return <section>
    <div className="eyebrow">{node.type}</div><h2>{node.label}</h2><code>{node.id}</code>
    {card && <><Row label="Kind">{card.kind}</Row><Row label="Statut">{card.status}</Row><Row label="Rareté">{card.rarity ?? "—"}</Row>
      <div className="tag-list">{card.tags?.map((tag) => <span key={tag.tag}>{tag.tag} <b>{tag.weight ?? 100}</b></span>)}</div>
      {card.discovery && <div className="rule-box"><h3>Règle discovery</h3><Row label="Seuil">{card.discovery.minScore ?? 85}</Row><Row label="Marge">{card.discovery.ambiguityMargin ?? 12}</Row><Row label="Evidence min.">{card.discovery.minEvidenceCount ?? 1}</Row></div>}
    </>}
    <Row label="Relations entrantes">{incoming.length}</Row><Row label="Relations sortantes">{outgoing.length}</Row>
    <div className="button-grid"><button onClick={onFocus}>Focus voisinage</button><button onClick={onPathFrom}>Chemins depuis</button><button onClick={onPathTo}>Chemins vers</button></div>
    {issues.length > 0 && <div><h3>Issues</h3>{issues.map((item, index) => <div className={`issue ${item.severity}`} key={`${item.code}:${index}`}>{item.message}</div>)}</div>}
  </section>;
}

export const labelFor = (catalog: GameCatalog, id: string) => catalog.cards.find((card) => card.id === id)?.localization.fr?.title ?? id;
