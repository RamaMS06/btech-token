/**
 * Token schema validation (Ajv, pre-push gate)
 * ----------------------------------------------
 * Validates individual tokens and whole DTCG trees against the project
 * schema (packages/tokens/schema/token.schema.json) before a push is allowed
 * through. CI re-validates on arrival, but catching invalid tokens here gives
 * the designer an immediate, actionable error instead of a CI failure 5 min
 * later.
 *
 * The schema JSON is bundled at build time via Vite's native JSON import
 * (resolveJsonModule + import assertion). No fetch() at runtime.
 */

import Ajv, { type AnySchema } from 'ajv';
import tokenSchemaRaw from '../../../packages/tokens/schema/token.schema.json';
import type { DTCGToken, DTCGGroup } from './types.js';

// Cast the JSON-imported schema to Ajv's AnySchema once. The `definitions`
// shape is well-known so we narrow it in a single place.
const tokenSchema = tokenSchemaRaw as unknown as {
  definitions: Record<string, AnySchema>;
} & AnySchema;

// ── Ajv instance ─────────────────────────────────────────────────────────────
//
// We compile once at module load so repeated validation calls pay negligible
// overhead. "strict: false" because our schema uses $schema and $id which
// Ajv strict mode rejects as unknown keywords.
const ajv = new Ajv({ strict: false, allErrors: true });

// Compile validators from the schema's definitions directly so we can
// validate a single token leaf without wrapping it in a group.
const validateTokenValue = ajv.compile(tokenSchema.definitions.tokenValue);
const validateTokenGroup = ajv.compile(tokenSchema);

// ── Error formatting ─────────────────────────────────────────────────────────

function formatErrors(errors: typeof ajv.errors): string[] {
  if (!errors) return [];
  return errors.map((e) => {
    const path = e.instancePath || '(root)';
    return `${path}: ${e.message ?? 'unknown error'}`;
  });
}

// ── Public API ───────────────────────────────────────────────────────────────

/** Validate a single DTCG token leaf against the tokenValue definition. */
export function validateToken(token: DTCGToken): { valid: boolean; errors: string[] } {
  const valid = validateTokenValue(token);
  return {
    valid: valid as boolean,
    errors: valid ? [] : formatErrors(validateTokenValue.errors),
  };
}

/**
 * Validate an entire DTCG group tree against the root schema.
 * Used for pre-push full-file validation.
 */
export function validateTree(tree: DTCGGroup): { valid: boolean; errors: string[] } {
  const valid = validateTokenGroup(tree);
  return {
    valid: valid as boolean,
    errors: valid ? [] : formatErrors(validateTokenGroup.errors),
  };
}
