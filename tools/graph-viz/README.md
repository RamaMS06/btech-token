# @btech/graph-viz

Interactive visualization of BTech Design System's function + flow graph,
powered by [xyflow](https://xyflow.com) and auto-laid-out with
[elkjs](https://www.npmjs.com/package/elkjs).

## Usage

```bash
# 1. regenerate the static graph snapshot (reads from code-review-graph MCP cache)
pnpm graph:export

# 2. open the viz
pnpm graph:view   # → http://localhost:5177
```

The exporter reads the MCP knowledge graph cache at
`.code-review-graph/` in the repo root and writes a normalised
`tools/graph-viz/public/graph.json`. The Vite app fetches it at runtime.

`graph.json` is intentionally **not committed** — regenerate on demand.

## Features (v1)

- Full-graph view with layered auto-layout (elk `layered`, top-to-bottom)
- Node types colour-coded by kind (function / class / file / module)
- Edge types colour-coded and togglable (call / import / test / other)
- Fuzzy search on node labels
- Pan / zoom / minimap / fit-to-view

## Roadmap

- Click-to-focus side panel (callers, callees, file path, metrics)
- Flow mode — animate edges along a selected execution flow
- View presets (architecture overview, hub nodes, communities)
- Export as PNG/SVG for docs
- Diff view — compare graphs before / after refactor

## Troubleshooting

**"No `graph.json` found"** — the MCP cache is empty. Run
`mcp__code-review-graph__build_or_update_graph_tool` (via your IDE's
MCP client) to populate it, then `pnpm graph:export` again.

**Empty graph despite cache existing** — the MCP cache schema may have
changed. The exporter tolerates two schemas (`graph.json` combined or
`nodes.json` + `edges.json` split). If yours differs, adjust
`scripts/export-graph.ts::normaliseRaw`.
