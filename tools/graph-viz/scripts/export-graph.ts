/**
 * export-graph.ts
 *
 * Exports the code-review-graph MCP knowledge graph into a static JSON
 * file that the xyflow viz app reads at `/graph.json`.
 *
 * Strategy:
 *   The MCP server writes its graph cache under `.code-review-graph/`
 *   in the repo root. We read the most recent export directly from there.
 *   If that cache does not exist (MCP not yet built), we emit an empty
 *   graph skeleton so the app can still load and show a "no data" state.
 *
 * To regenerate:
 *   pnpm graph:export
 *
 * The produced file is NOT committed — it is regenerated on demand.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const HERE      = dirname(fileURLToPath(import.meta.url));
const VIZ_ROOT  = resolve(HERE, '..');
const REPO_ROOT = resolve(VIZ_ROOT, '../..');
const OUT_PATH  = resolve(VIZ_ROOT, 'public/graph.json');
const CACHE_DIR = resolve(REPO_ROOT, '.code-review-graph');

type EdgeKind = 'call' | 'import' | 'test' | 'other';
type NodeKind = 'function' | 'class' | 'file' | 'module';

interface ExportedNode {
  id: string;
  label: string;
  kind: NodeKind;
  file?: string;
  line?: number;
}

interface ExportedEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
}

interface ExportedGraph {
  nodes: ExportedNode[];
  edges: ExportedEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    languages: string[];
    generatedAt: string;
  };
}

function emptyGraph(reason: string): ExportedGraph {
  console.warn(`⚠️   ${reason} — writing empty graph skeleton.`);
  return {
    nodes: [],
    edges: [],
    stats: {
      totalNodes: 0,
      totalEdges: 0,
      languages: [],
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Scan the MCP cache directory for a `nodes.json`/`edges.json` or a
 * combined `graph.json` and transform to our schema. Schema may vary
 * across MCP versions — this shim tolerates both.
 */
function loadFromMcpCache(): ExportedGraph | null {
  if (!existsSync(CACHE_DIR)) return null;
  const entries = readdirSync(CACHE_DIR);

  // Try combined snapshot first.
  const combined = entries.find((e) => e === 'graph.json');
  if (combined) {
    try {
      const raw = JSON.parse(readFileSync(resolve(CACHE_DIR, combined), 'utf8'));
      return normaliseRaw(raw);
    } catch {
      /* fall through */
    }
  }

  // Try split files.
  const nodesFile = entries.find((e) => e === 'nodes.json');
  const edgesFile = entries.find((e) => e === 'edges.json');
  if (nodesFile && edgesFile) {
    try {
      const rawNodes = JSON.parse(readFileSync(resolve(CACHE_DIR, nodesFile), 'utf8'));
      const rawEdges = JSON.parse(readFileSync(resolve(CACHE_DIR, edgesFile), 'utf8'));
      return normaliseRaw({ nodes: rawNodes, edges: rawEdges });
    } catch {
      /* fall through */
    }
  }

  return null;
}

function normaliseRaw(raw: { nodes?: unknown[]; edges?: unknown[] }): ExportedGraph {
  const nodes: ExportedNode[] = (raw.nodes ?? []).map((n: any, i: number) => ({
    id:    String(n.id ?? n.qualified_name ?? `n${i}`),
    label: String(n.label ?? n.name ?? n.id ?? `node-${i}`),
    kind:  normaliseKind(n.kind ?? n.type),
    file:  n.file ?? n.path,
    line:  n.line,
  }));

  const edges: ExportedEdge[] = (raw.edges ?? []).map((e: any, i: number) => ({
    id:     String(e.id ?? `e${i}`),
    source: String(e.source ?? e.from),
    target: String(e.target ?? e.to),
    kind:   normaliseEdgeKind(e.kind ?? e.type ?? e.relation),
  }));

  return {
    nodes,
    edges,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      languages: [],
      generatedAt: new Date().toISOString(),
    },
  };
}

function normaliseKind(raw: unknown): NodeKind {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('class')) return 'class';
  if (s.includes('file'))  return 'file';
  if (s.includes('module') || s.includes('package')) return 'module';
  return 'function';
}

function normaliseEdgeKind(raw: unknown): EdgeKind {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('call'))   return 'call';
  if (s.includes('import')) return 'import';
  if (s.includes('test'))   return 'test';
  return 'other';
}

function main() {
  const graph = loadFromMcpCache() ?? emptyGraph(
    `No MCP cache found at ${CACHE_DIR}. Run the code-review-graph MCP ` +
    `(build_or_update_graph_tool) first.`,
  );

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(graph, null, 2) + '\n', 'utf8');
  console.log(
    `✅  Wrote ${graph.nodes.length} nodes / ${graph.edges.length} edges → ${OUT_PATH}`,
  );
}

main();
