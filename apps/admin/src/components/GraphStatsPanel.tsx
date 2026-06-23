export function GraphStatsPanel({ stats }: { stats: Record<string, string | number> }) {
  return <section><h3>Métriques</h3><div className="stats">{Object.entries(stats).map(([label, value]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div></section>;
}
