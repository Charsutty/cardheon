import { useMemo } from "react";
import type { Card, GameCatalog } from "@cardheon/game-engine";
import { findDiscoveryWitnesses } from "../graph/discoveryWitnesses";
import { cardTitle } from "../graph/graphMetrics";

export function DiscoveryAuditPanel({ catalog, figure }: { catalog: GameCatalog; figure?: Card }) {
  const available = catalog.cards.filter((card) => card.kind !== "figure").map((card) => card.id);
  const witnesses = useMemo(() => figure ? findDiscoveryWitnesses(catalog, figure.id, available, {
    minInputs: catalog.gameplay.discovery.minInputs,
    maxInputs: catalog.gameplay.discovery.maxInputs,
    maxWitnesses: 12,
  }) : [], [catalog, figure]);
  if (!figure) return <section><h3>Audit discovery</h3><p className="muted">Sélectionnez une figure pour calculer ses combinaisons avec le moteur réel.</p></section>;
  return <section><h3>Audit discovery</h3><p className="muted">Seuil {figure.discovery?.minScore ?? 85} · marge {figure.discovery?.ambiguityMargin ?? 12}</p>
    {witnesses.map((witness, index) => <div className={`witness ${witness.resultType}`} key={witness.inputCardIds.join("|")}><b>#{index + 1} · {witness.resultType} · {witness.score} pts</b>
      <div>{witness.inputCardIds.map((id) => cardTitle(catalog, id)).join(" + ")}</div>
      {witness.scoreDelta !== undefined && <small>Écart second candidat : {witness.scoreDelta}</small>}
      <ul>{witness.reasons.map((reason, reasonIndex) => <li key={`${reason.label}:${reasonIndex}`}>{reason.kind} {reason.weight > 0 ? "+" : ""}{reason.weight} — {reason.label}</li>)}</ul>
    </div>)}
    {!witnesses.length && <div className="issue error">Aucune combinaison candidate trouvée.</div>}
  </section>;
}
