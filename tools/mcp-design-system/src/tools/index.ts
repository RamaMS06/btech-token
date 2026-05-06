/**
 * Tool registry — single source of truth for every MCP tool exposed by the
 * BTech Design System server. server.ts iterates this array for both
 * `tools/list` and `tools/call` dispatch.
 *
 * Adding a new tool:
 *   1. Create `<name>.ts` in this folder exporting a `ToolDef`
 *   2. Import + push it onto `registry` below
 *   3. Done — no further wiring needed
 */
import type { ToolDef } from '../types.js';
import { helloTool } from './hello.js';

export const registry: ToolDef[] = [helloTool];
