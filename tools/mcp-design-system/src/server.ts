#!/usr/bin/env node
/**
 * BTech Design System MCP Server
 * --------------------------------------------------------------------------
 * Exposes the BTech Design System (tokens, framework templates, components)
 * as MCP tools and resources so AI agents (Claude Code, Cursor, custom
 * agents) can query the design system directly without dumping the entire
 * codebase into prompt context.
 *
 * D1 scope (this file): stdio transport + tool registry + smoke-test
 * `hello` tool. D2+ adds the real tools (list_tokens, find_token_for_role,
 * resolve_token, etc.) — see src/tools/.
 *
 * Run locally:
 *   pnpm --filter @btech/mcp-design-system dev
 *
 * Wire to Claude Code (~/Library/Application Support/Claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "btech-design-system": {
 *         "command": "node",
 *         "args": ["/abs/path/to/btech-ds/tools/mcp-design-system/dist/server.js"]
 *       }
 *     }
 *   }
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { registry } from './tools/index.js';

const SERVER_NAME = 'btech-design-system';
const SERVER_VERSION = '0.1.0';

const server = new Server(
  { name: SERVER_NAME, version: SERVER_VERSION },
  { capabilities: { tools: {} } },
);

// ── tools/list ────────────────────────────────────────────────────────────────
// Surface every tool the registry knows about. Keep descriptions tight — they
// are read by the LLM at every connection and burn tokens on every call.
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: registry.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

// ── tools/call ────────────────────────────────────────────────────────────────
// Look up the handler by name and delegate. Each handler is responsible for
// validating its own input shape (we only enforce JSON schema at registration
// time via the SDK).
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = registry.find((t) => t.name === name);

  if (!tool) {
    return {
      isError: true,
      content: [
        { type: 'text', text: `Unknown tool: ${name}. Known tools: ${registry.map((t) => t.name).join(', ')}` },
      ],
    };
  }

  try {
    const result = await tool.handler(args ?? {});
    return {
      content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [{ type: 'text', text: `Tool "${name}" failed: ${message}` }],
    };
  }
});

// ── boot ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // NOTE: log to stderr only — stdout is reserved for MCP JSON-RPC traffic.
  // Logging to stdout corrupts the protocol and the client disconnects silently.
  console.error(`[${SERVER_NAME}@${SERVER_VERSION}] ready (${registry.length} tools registered)`);
}

main().catch((err) => {
  console.error(`[${SERVER_NAME}] fatal:`, err);
  process.exit(1);
});
