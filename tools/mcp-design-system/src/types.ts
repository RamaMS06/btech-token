/**
 * Shared types for the BTech Design System MCP server.
 */

/** JSON Schema-shaped object describing a tool's input. We keep the shape
 *  loose (`Record<string, unknown>`) because the SDK accepts JSON Schema
 *  draft-7 objects and we don't want to lock ourselves to a specific
 *  validator yet. */
export type JsonSchemaObject = {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
  [key: string]: unknown;
};

/** Definition of a single MCP tool. The registry array (tools/index.ts) is
 *  a list of these, and server.ts walks it for both list + call dispatch. */
export interface ToolDef {
  /** Snake-case tool name. Must be unique across the registry. Becomes the
   *  identifier the LLM uses to invoke the tool. */
  name: string;

  /** One- or two-sentence description shown to the LLM. Keep it tight —
   *  it is sent on every tools/list call and burns context tokens. */
  description: string;

  /** JSON Schema describing the input arguments. The SDK does NOT enforce
   *  this against the actual call — it is informational for the LLM. We
   *  validate manually inside `handler` if needed. */
  inputSchema: JsonSchemaObject;

  /** Tool implementation. Receives the parsed `arguments` object from the
   *  call and returns either a string (passed through verbatim) or any
   *  JSON-serialisable object (stringified with 2-space indent). Throw to
   *  signal an error — server.ts wraps it in an MCP error response. */
  handler: (args: Record<string, unknown>) => Promise<string | Record<string, unknown>>;
}
