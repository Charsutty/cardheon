import type { AdminEdgeType, AdminNodeType } from "../graph/graphTypes";

export type GraphFilters = {
  search: string;
  nodeTypes: Set<AdminNodeType>;
  edgeTypes: Set<AdminEdgeType>;
  showTags: boolean;
  showRecipes: boolean;
  showDiscovery: boolean;
  showRelationships: boolean;
  showContradictions: boolean;
  minWeight: number;
  depth: number;
  cardKind: string;
  status: string;
  rarity: string;
  reachability: string;
};

const NODE_TYPES: AdminNodeType[] = ["figure", "tool", "tag", "recipe", "constellation", "source", "modifier"];

export function GraphToolbar({ filters, onChange, onFit, onFocus, onExportJson, onExportPng }: {
  filters: GraphFilters;
  onChange: (filters: GraphFilters) => void;
  onFit: () => void;
  onFocus: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
}) {
  const toggleNodeType = (type: AdminNodeType) => {
    const next = new Set(filters.nodeTypes);
    next.has(type) ? next.delete(type) : next.add(type);
    onChange({ ...filters, nodeTypes: next });
  };
  return (
    <div className="filters">
      <label className="field"><span>Recherche</span><input value={filters.search} onChange={(event) => onChange({ ...filters, search: event.target.value })} placeholder="Titre, id ou tag…" /></label>
      <div className="field"><span>Types de nœuds</span><div className="chips">
        {NODE_TYPES.map((type) => <button key={type} className={filters.nodeTypes.has(type) ? "chip active" : "chip"} onClick={() => toggleNodeType(type)}>{type}</button>)}
      </div></div>
      <div className="select-grid">
        <label className="field"><span>Kind</span><select value={filters.cardKind} onChange={(event) => onChange({ ...filters, cardKind: event.target.value })}><option value="">Tous</option>{["period","region","place","civilization","role","domain","concept","event","work","movement","relation","symbol"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="field"><span>Statut</span><select value={filters.status} onChange={(event) => onChange({ ...filters, status: event.target.value })}><option value="">Tous</option>{["draft","needs_sources","reviewed","approved","published","deprecated"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="field"><span>Rareté</span><select value={filters.rarity} onChange={(event) => onChange({ ...filters, rarity: event.target.value })}><option value="">Toutes</option>{["common","uncommon","rare","epic","legendary"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="field"><span>Accessibilité</span><select value={filters.reachability} onChange={(event) => onChange({ ...filters, reachability: event.target.value })}><option value="">Toutes</option><option value="reachable">Atteignable</option><option value="blocked">Bloquée</option><option value="unknown">Inconnue</option></select></label>
      </div>
      <label className="check"><input type="checkbox" checked={filters.showTags} onChange={(event) => onChange({ ...filters, showTags: event.target.checked })} /> Tags virtuels</label>
      <label className="check"><input type="checkbox" checked={filters.showRecipes} onChange={(event) => onChange({ ...filters, showRecipes: event.target.checked })} /> Recettes</label>
      <label className="check"><input type="checkbox" checked={filters.showDiscovery} onChange={(event) => onChange({ ...filters, showDiscovery: event.target.checked })} /> Règles discovery</label>
      <label className="check"><input type="checkbox" checked={filters.showRelationships} onChange={(event) => onChange({ ...filters, showRelationships: event.target.checked })} /> Relations historiques</label>
      <label className="check"><input type="checkbox" checked={filters.showContradictions} onChange={(event) => onChange({ ...filters, showContradictions: event.target.checked })} /> Contradictions</label>
      <label className="field"><span>Poids minimum: {filters.minWeight}</span><input type="range" min="0" max="60" value={filters.minWeight} onChange={(event) => onChange({ ...filters, minWeight: Number(event.target.value) })} /></label>
      <label className="field"><span>Profondeur depuis sélection</span><select value={filters.depth} onChange={(event) => onChange({ ...filters, depth: Number(event.target.value) })}><option value={0}>Graphe complet</option><option value={1}>1 saut</option><option value={2}>2 sauts</option><option value={3}>3 sauts</option></select></label>
      <div className="button-grid">
        <button onClick={onFit}>Tout cadrer</button><button onClick={onFocus}>Cadrer sélection</button>
        <button onClick={onExportPng}>Exporter PNG</button><button onClick={onExportJson}>Exporter JSON</button>
      </div>
    </div>
  );
}
