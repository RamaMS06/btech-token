# @btech/mcp-design-system

MCP server exposing the BTech Design System (tokens, framework templates,
component knowledge) as tools and resources. Lets AI agents — Claude Code,
Cursor, custom agents — query the design system directly without dumping
the entire codebase into prompt context.

This is **Layer 1** of the UI slicing pipeline. See
`docs/architecture/ui-slicing-pipeline.md` (or the design plan in
`.claude/plans/`) for the full architecture.

## Status

| Day | Scope | Status |
|---|---|---|
| D1 | stdio transport + smoke-test `hello` tool | ✅ done |
| D2 | core tools: `list_tokens`, `find_token_for_role`, `resolve_token`, `get_framework_template`, `get_framework_conventions` | ⏳ next |
| D6 | RAG tools: `find_similar_components`, `validate_token_usage` | ⏳ |

## Run locally

```bash
# install (run from repo root, hits the workspace)
pnpm install

# dev (tsx, hot reload not yet wired)
pnpm --filter @btech/mcp-design-system dev

# build to dist/
pnpm --filter @btech/mcp-design-system build

# run built bundle
pnpm --filter @btech/mcp-design-system start
```

## Wire to Claude Code

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```jsonc
{
  "mcpServers": {
    "btech-design-system": {
      "command": "node",
      "args": [
        "/abs/path/to/btech-ds/tools/mcp-design-system/dist/server.js"
      ]
    }
  }
}
```

Restart Claude Desktop / Code. The `hello` tool should appear in the tool
picker.

Smoke-test:

```
> hello me
Hello, me! BTech Design System MCP is online.
```

## Architecture

- `src/server.ts` — stdio entry point. Wires the MCP `Server` to a
  `StdioServerTransport`, registers `tools/list` + `tools/call` handlers
  that delegate to the registry.
- `src/tools/index.ts` — single source of truth for every tool exposed
  by the server. Adding a tool = create file + push onto the array.
- `src/tools/<name>.ts` — one file per tool, each exporting a `ToolDef`.
- `src/types.ts` — shared types (`ToolDef`, `JsonSchemaObject`).

The protocol uses **stdout for JSON-RPC traffic** — never `console.log` to
stdout from inside the server. All logging goes through `console.error`
(stderr) which the client tolerates.
