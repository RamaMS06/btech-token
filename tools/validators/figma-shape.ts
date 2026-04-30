/**
 * Figma shape validator
 * ---------------------
 * Guards against malformed or Figma-plugin-contaminated token files in the
 * tenants/ directory. Runs as part of `pnpm validate` so CI catches issues
 * before they reach the Azure Artifacts feed.
 *
 * Why this exists:
 *   The BTech Token Studio plugin pushes JSON files directly to the repo via
 *   the Azure DevOps Git REST API. Even though the plugin runs Ajv pre-push,
 *   a future bug or a manually constructed push could slip through non-schema
 *   issues (bad slug names, stale plugin metadata keys). This validator is the
 *   CI-side safety net for those structural concerns.
 *
 *   It does NOT re-validate the DTCG schema — that lives in tools/validators/schema.ts.
 *   This file is narrowly focused on the three concerns below:
 *
 *   1. Tenant directory names must be valid slugs ([a-z][a-z0-9-]*)
 *   2. overrides.json must not carry unknown top-level keys
 *   3. No keys starting with __btech_plugin_ anywhere in the tree
 *      (a class of metadata that the plugin might accidentally serialize)
 *
 * Exit codes follow the same convention as lockfile-sync.ts and schema.ts:
 *   0 — all checks pass
 *   1 — one or more violations found (messages written to stderr)
 */

import { readdirSync, existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const TENANTS_DIR = join(ROOT, 'packages/tokens/sources/tenants');

// ── Checks ───────────────────────────────────────────────────────────────────

/** Valid tenant slug: lowercase alpha-start, alphanumeric + hyphen only */
const SLUG_RE = /^[a-z][a-z0-9-]*$/;

/** Top-level keys allowed in any tenant overrides.json */
const ALLOWED_OVERRIDES_KEYS = new Set([
  '$schema',
  '$description',
  'color',
  'brand',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'number',
  'shadow',
  'strokeStyle',
  'border',
  'transition',
  'gradient',
  'typography',
  'radius',
  'spacing',
  'motion',
  'elevation',
  'zIndex',
]);

/** Plugin-internal metadata prefix that must never appear in committed files */
const PLUGIN_KEY_PREFIX = '__btech_plugin_';

type Violations = string[];

// ── Walk helpers ─────────────────────────────────────────────────────────────

/**
 * Recursively walk an object and report any key that starts with the
 * forbidden plugin-metadata prefix. We only check keys, not values.
 */
function findPluginKeys(obj: unknown, keyPath: string, into: Violations): void {
  if (typeof obj !== 'object' || obj === null) return;

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const currentPath = keyPath ? `${keyPath}.${key}` : key;
    if (key.startsWith(PLUGIN_KEY_PREFIX)) {
      into.push(`  key "${currentPath}" starts with "${PLUGIN_KEY_PREFIX}" — plugin metadata must not be committed`);
    }
    if (typeof value === 'object' && value !== null) {
      findPluginKeys(value, currentPath, into);
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

if (!existsSync(TENANTS_DIR)) {
  // No tenants directory — nothing to validate. This is valid for a fresh clone
  // before the first tenant is added via pnpm add-tenant or the plugin.
  console.log('✓ No tenants directory found — skipping figma-shape checks.');
  process.exit(0);
}

const violations: Violations = [];
const tenantDirs = readdirSync(TENANTS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const tenantId of tenantDirs) {
  // ── Check 1: slug format ─────────────────────────────────────────────────
  if (!SLUG_RE.test(tenantId)) {
    violations.push(
      `  Tenant directory "${tenantId}" is not a valid slug. ` +
      `Must match /^[a-z][a-z0-9-]*$/ (e.g. "bspace", "tokopedia-commerce").`,
    );
    // Skip further checks for this tenant — the name is already wrong
    continue;
  }

  const overridesPath = join(TENANTS_DIR, tenantId, 'overrides.json');
  if (!existsSync(overridesPath)) {
    // Tenants without overrides.json are allowed (Phase 2 may support other files)
    continue;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(overridesPath, 'utf-8'));
  } catch (err) {
    violations.push(
      `  tenants/${tenantId}/overrides.json is not valid JSON: ${(err as Error).message}`,
    );
    continue;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    violations.push(`  tenants/${tenantId}/overrides.json must be a JSON object at the root.`);
    continue;
  }

  // ── Check 2: unknown top-level keys ──────────────────────────────────────
  for (const key of Object.keys(parsed as Record<string, unknown>)) {
    if (!ALLOWED_OVERRIDES_KEYS.has(key)) {
      violations.push(
        `  tenants/${tenantId}/overrides.json has unknown top-level key "${key}". ` +
        `Allowed keys: ${Array.from(ALLOWED_OVERRIDES_KEYS).join(', ')}.`,
      );
    }
  }

  // ── Check 3: no plugin metadata keys anywhere in the tree ────────────────
  findPluginKeys(parsed, `tenants/${tenantId}/overrides.json`, violations);
}

// ── Report ────────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log(`✓ Figma shape: ${tenantDirs.length} tenant(s) validated — no issues.`);
  process.exit(0);
}

console.error('❌ figma-shape validation failed:\n');
for (const v of violations) {
  console.error(v);
}
console.error(
  '\nFix the issues above, then re-run `pnpm validate`.',
);
process.exit(1);
