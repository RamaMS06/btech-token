/**
 * Smoke-test tool. Confirms the MCP server is wired correctly and reachable
 * from the client (Claude Code / Cursor / etc.). Will be removed once D2
 * tools land and we have a real probe target.
 */
import type { ToolDef } from '../types.js';

export const helloTool: ToolDef = {
  name: 'hello',
  description:
    'Smoke-test tool. Echoes back a greeting plus server metadata. Use this to verify the MCP server is connected and responding.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Optional name to include in the greeting (defaults to "world").',
      },
    },
    additionalProperties: false,
  },
  handler: async (args) => {
    const name = typeof args.name === 'string' && args.name.length > 0 ? args.name : 'world';
    return {
      greeting: `Hello, ${name}! BTech Design System MCP is online.`,
      server: 'btech-design-system',
      timestamp: new Date().toISOString(),
    };
  },
};
