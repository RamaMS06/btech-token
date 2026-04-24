import ELK from 'elkjs/lib/elk.bundled.js';
import type { Node, Edge } from '@xyflow/react';

const elk = new ELK();

const DEFAULT_OPTS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'DOWN',
  'elk.layered.spacing.nodeNodeBetweenLayers': '80',
  'elk.spacing.nodeNode': '40',
};

/**
 * Run elkjs layered layout on a xyflow graph.
 * Returns positioned nodes (edges are returned unchanged).
 */
export async function layoutWithElk<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  opts: Record<string, string> = {},
): Promise<{ nodes: N[]; edges: E[] }> {
  const elkGraph = {
    id: 'root',
    layoutOptions: { ...DEFAULT_OPTS, ...opts },
    children: nodes.map((n) => ({
      id: n.id,
      width: (n.width as number | undefined) ?? 180,
      height: (n.height as number | undefined) ?? 48,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const laid = await elk.layout(elkGraph);
  const byId = new Map(laid.children?.map((c) => [c.id, c]) ?? []);

  const positioned = nodes.map((n) => {
    const elkNode = byId.get(n.id);
    return elkNode
      ? { ...n, position: { x: elkNode.x ?? 0, y: elkNode.y ?? 0 } }
      : n;
  });

  return { nodes: positioned, edges };
}
