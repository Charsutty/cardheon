import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import cytoscape, { type Core, type ElementDefinition, type LayoutOptions } from "cytoscape";
import { cytoscapeStyles } from "../graph/cytoscapeStyles";
import type { AdminGraphEdge, AdminGraphNode } from "../graph/graphTypes";

export type GraphCanvasHandle = {
  fit: () => void;
  focus: (id?: string) => void;
  png: () => string;
};

export const GraphCanvas = forwardRef<GraphCanvasHandle, {
  nodes: AdminGraphNode[];
  edges: AdminGraphEdge[];
  selectedId?: string;
  layout: string;
  spacing: number;
  onSelectNode: (id: string) => void;
  onSelectEdge: (id: string) => void;
}>(({ nodes, edges, selectedId, layout, spacing, onSelectNode, onSelectEdge }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  useImperativeHandle(ref, () => ({
    fit: () => cyRef.current?.fit(undefined, 40),
    focus: (id) => {
      const element = id ? cyRef.current?.getElementById(id) : cyRef.current?.$(":selected");
      if (element?.length) cyRef.current?.animate({ fit: { eles: element.closedNeighborhood(), padding: 80 }, duration: 350 });
    },
    png: () => cyRef.current?.png({ full: true, scale: 2, bg: "#10151d" }) ?? "",
  }), []);

  useEffect(() => {
    if (!containerRef.current) return;
    const elements: ElementDefinition[] = [
      ...nodes.map((node) => ({ data: { ...node, entity: undefined, blocked: node.isBlocked ? 1 : undefined } })),
      ...edges.map((edge) => ({ data: { ...edge, weightLabel: edge.weight === undefined ? "" : String(edge.weight) } })),
    ];
    const cy = cytoscape({ container: containerRef.current, elements, style: cytoscapeStyles, minZoom: 0.08, maxZoom: 3 });
    cy.on("tap", "node", (event) => onSelectNode(event.target.id()));
    cy.on("tap", "edge", (event) => onSelectEdge(event.target.id()));
    cy.on("mouseover", "edge", (event) => {
      const edge = event.target;
      const weight = edge.data("weight");
      containerRef.current!.title = `${edge.data("label")}${weight === undefined ? "" : ` · poids ${weight}`}`;
    });
    cy.on("mouseout", "edge", () => { if (containerRef.current) containerRef.current.title = ""; });
    cyRef.current = cy;
    const options: LayoutOptions = layout === "cose"
      ? {
          name: "cose",
          animate: false,
          padding: 50,
          randomize: true,
          idealEdgeLength: 65 * spacing,
          nodeRepulsion: 350_000 * spacing * spacing,
          edgeElasticity: 90,
          nestingFactor: 1.2,
          gravity: Math.max(0.15, 0.7 / spacing),
          numIter: 1_500,
          componentSpacing: 70 * spacing,
          nodeOverlap: 20 * spacing,
        }
      : layout === "breadthfirst"
        ? {
            name: "breadthfirst",
            directed: true,
            padding: 50,
            spacingFactor: spacing,
            avoidOverlap: true,
          }
        : layout === "circle"
          ? {
              name: "circle",
              padding: 50,
              spacingFactor: spacing,
              avoidOverlap: true,
            }
          : {
              name: "grid",
              padding: 50,
              spacingFactor: spacing,
              avoidOverlap: true,
            };
    cy.layout(options).run();
    return () => { cy.destroy(); cyRef.current = null; };
  }, [nodes, edges, layout, spacing, onSelectEdge, onSelectNode]);

  useEffect(() => {
    if (!selectedId || !cyRef.current) return;
    cyRef.current.$(":selected").unselect();
    cyRef.current.getElementById(selectedId).select();
  }, [selectedId]);

  return <div ref={containerRef} className="graph-canvas" />;
});
