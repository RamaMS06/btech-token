export type EdgeKind = 'call' | 'import' | 'test' | 'other';
export type NodeKind = 'function' | 'class' | 'file' | 'module';

export interface ExportedNode {
  id: string;
  label: string;
  kind: NodeKind;
  file?: string;
  line?: number;
  metrics?: { loc?: number; calls?: number };
}

export interface ExportedEdge {
  id: string;
  source: string;
  target: string;
  kind: EdgeKind;
}

export interface ExportedGraph {
  nodes: ExportedNode[];
  edges: ExportedEdge[];
  stats?: {
    totalNodes: number;
    totalEdges: number;
    languages?: string[];
    generatedAt?: string;
  };
}
