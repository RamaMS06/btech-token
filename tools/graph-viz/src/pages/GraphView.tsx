import { useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import { layoutWithElk } from '../lib/elk-layout';
import type { ExportedGraph, EdgeKind, NodeKind } from '../lib/types';

const NODE_COLOR: Record<NodeKind, string> = {
  function: '#38bdf8',
  class:    '#a78bfa',
  file:     '#f59e0b',
  module:   '#34d399',
};

const EDGE_STYLE: Record<EdgeKind, { stroke: string; strokeDasharray?: string; animated?: boolean }> = {
  call:   { stroke: '#38bdf8' },
  import: { stroke: '#94a3b8', strokeDasharray: '4 4' },
  test:   { stroke: '#34d399', strokeDasharray: '2 6' },
  other:  { stroke: '#64748b' },
};

function GraphNode({ data }: NodeProps) {
  const kind = (data.kind as NodeKind) ?? 'function';
  const color = NODE_COLOR[kind];
  return (
    <div
      style={{
        padding: '8px 12px',
        background: '#1e293b',
        border: `1.5px solid ${color}`,
        borderRadius: 6,
        color: '#e2e8f0',
        fontSize: 12,
        minWidth: 140,
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div style={{ fontSize: 10, color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kind}</div>
      <div style={{ fontWeight: 600 }}>{String(data.label)}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { graph: GraphNode };

export function GraphView() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [filter, setFilter] = useState<Record<EdgeKind, boolean>>({
    call: true, import: true, test: true, other: true,
  });
  const [search, setSearch] = useState('');
  const [loaded, setLoaded] = useState<ExportedGraph | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing'>('loading');

  useEffect(() => {
    fetch('/graph.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('no graph.json'))))
      .then((g: ExportedGraph) => {
        setLoaded(g);
        setStatus('ok');
      })
      .catch(() => setStatus('missing'));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const rfNodes: Node[] = loaded.nodes.map((n) => ({
      id: n.id,
      type: 'graph',
      data: { label: n.label, kind: n.kind, file: n.file, line: n.line },
      position: { x: 0, y: 0 },
    }));
    const rfEdges: Edge[] = loaded.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: { kind: e.kind },
      style: EDGE_STYLE[e.kind],
      animated: false,
    }));
    layoutWithElk(rfNodes, rfEdges).then(({ nodes: n, edges: ed }) => {
      setNodes(n);
      setEdges(ed);
    });
  }, [loaded]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const keepEdge = (e: Edge) => filter[(e.data?.kind as EdgeKind) ?? 'other'];
    const keepNode = (n: Node) =>
      !q || String(n.data?.label ?? '').toLowerCase().includes(q);
    return {
      nodes: nodes.filter(keepNode),
      edges: edges.filter(keepEdge),
    };
  }, [nodes, edges, filter, search]);

  if (status === 'loading') return <Overlay message="Loading graph…" />;
  if (status === 'missing') {
    return (
      <Overlay
        message={
          <>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              No <code>graph.json</code> found
            </div>
            <div style={{ fontSize: 14, color: '#94a3b8', maxWidth: 480, textAlign: 'center' }}>
              Run <code>pnpm graph:export</code> from the repo root to generate a fresh
              snapshot into <code>tools/graph-viz/public/graph.json</code>, then reload.
            </div>
          </>
        }
      />
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Toolbar
        search={search}
        setSearch={setSearch}
        filter={filter}
        setFilter={setFilter}
        stats={loaded?.stats}
      />
      <ReactFlow
        nodes={visible.nodes}
        edges={visible.edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" gap={24} />
        <MiniMap pannable zoomable style={{ background: '#1e293b' }} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

function Toolbar(props: {
  search: string;
  setSearch: (v: string) => void;
  filter: Record<EdgeKind, boolean>;
  setFilter: (f: Record<EdgeKind, boolean>) => void;
  stats?: ExportedGraph['stats'];
}) {
  const { search, setSearch, filter, setFilter, stats } = props;
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 10,
        background: 'rgba(15, 23, 42, 0.9)',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        fontSize: 12,
      }}
    >
      <strong style={{ color: '#38bdf8' }}>BTech Graph</strong>
      <input
        placeholder="Search nodes…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          background: '#1e293b',
          border: '1px solid #475569',
          color: '#e2e8f0',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 12,
          width: 200,
        }}
      />
      {(Object.keys(filter) as EdgeKind[]).map((k) => (
        <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="checkbox"
            checked={filter[k]}
            onChange={(e) => setFilter({ ...filter, [k]: e.target.checked })}
          />
          <span style={{ color: EDGE_STYLE[k].stroke }}>{k}</span>
        </label>
      ))}
      {stats && (
        <span style={{ color: '#64748b', marginLeft: 'auto' }}>
          {stats.totalNodes} nodes · {stats.totalEdges} edges
        </span>
      )}
    </div>
  );
}

function Overlay({ message }: { message: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: 24,
      }}
    >
      {typeof message === 'string' ? <div>{message}</div> : message}
    </div>
  );
}
