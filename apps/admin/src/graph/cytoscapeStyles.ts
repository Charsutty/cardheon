import type cytoscape from "cytoscape";

export const cytoscapeStyles = [
  { selector: "node", style: { "background-color": "#65758b", label: "data(label)", color: "#e8edf5", "font-size": 9, "text-wrap": "wrap", "text-max-width": 90, "text-valign": "bottom", "text-margin-y": "7px", width: 22, height: 22, "border-width": 2, "border-color": "#17202b" } },
  { selector: 'node[type = "figure"]', style: { "background-color": "#d9a441", shape: "diamond", width: 34, height: 34 } },
  { selector: 'node[type = "tool"]', style: { "background-color": "#4d91a8" } },
  { selector: 'node[type = "tag"]', style: { "background-color": "#8c6cc0", shape: "ellipse", width: 14, height: 14, "font-size": 7 } },
  { selector: 'node[type = "recipe"]', style: { "background-color": "#56a86e", shape: "round-rectangle", width: 28, height: 18 } },
  { selector: 'node[type = "constellation"]', style: { "background-color": "#dd6f92", shape: "star", width: 38, height: 38 } },
  { selector: 'node[type = "source"]', style: { "background-color": "#9da7b4", shape: "tag" } },
  { selector: 'node[type = "modifier"]', style: { "background-color": "#c47b54", shape: "hexagon", width: 20, height: 20 } },
  { selector: "node[blocked]", style: { "border-color": "#f45b69", "border-width": 4 } },
  { selector: "node:selected", style: { "overlay-color": "#ffffff", "overlay-opacity": 0.15, "border-color": "#ffffff", "border-width": 4 } },
  { selector: "edge", style: { width: 1.2, "line-color": "#536174", "target-arrow-color": "#536174", "target-arrow-shape": "triangle", "curve-style": "bezier", label: "data(weightLabel)", color: "#c5cfda", "font-size": 7, "text-background-color": "#10151d", "text-background-opacity": 0.8, "text-background-padding": "2px" } },
  { selector: 'edge[type = "discovery_evidence"]', style: { "line-color": "#d9a441", "target-arrow-color": "#d9a441", width: 2 } },
  { selector: 'edge[type = "discovery_synergy"]', style: { "line-color": "#55b978", "target-arrow-color": "#55b978" } },
  { selector: 'edge[type = "discovery_contradiction"]', style: { "line-color": "#ef5b68", "target-arrow-color": "#ef5b68", "line-style": "dashed" } },
  { selector: 'edge[type ^= "craft_"]', style: { "line-color": "#56a86e", "target-arrow-color": "#56a86e" } },
  { selector: "edge:selected", style: { width: 4, "line-color": "#ffffff", "target-arrow-color": "#ffffff" } },
] as cytoscape.StylesheetJson;
