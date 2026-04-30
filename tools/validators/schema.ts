/**
 * Token schema validator
 * ----------------------
 * Validates every token source file under packages/tokens/sources/**\/*.json
 * against packages/tokens/schema/token.schema.json (DTCG-compatible).
 *
 * Catches malformed tokens (missing $value / $type, unknown $type, typos in
 * key names like $valeu) BEFORE Style Dictionary runs — giving clearer error
 * messages than SD's downstream failures.
 *
 * Runs as part of `pnpm validate`.
 */
import Ajv, { ErrorObject } from 'ajv';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SOURCES_DIR = resolve(ROOT, 'packages/tokens/sources');
const SCHEMA_PATH = resolve(ROOT, 'packages/tokens/schema/token.schema.json');

// Files under sources/ that are NOT DTCG token files — meta/registry/manifest.
// These files carry their own shape (see the generator that consumes them)
// and are intentionally excluded from the DTCG schema check.
const EXCLUDE_FILES = new Set<string>([
  'font-registry.json',
]);

// ── Load schema ─────────────────────────────────────────────────────────
const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

// ── Walk all token JSON files ───────────────────────────────────────────
function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if (entry.endsWith('.json') && !EXCLUDE_FILES.has(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

const files = walk(SOURCES_DIR);

// ── Format an Ajv error into a readable line ────────────────────────────
function formatError(err: ErrorObject): string {
  const path = err.instancePath || '<root>';
  let msg = `  ${path}: ${err.message ?? 'invalid'}`;
  if (err.params) {
    const extras = Object.entries(err.params)
      .filter(([k]) => k !== 'passingSchemas')
      .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : v}`)
      .join(' ');
    if (extras) msg += `  (${extras})`;
  }
  return msg;
}

// ── Validate each file, collect failures ────────────────────────────────
let failed = 0;
for (const file of files) {
  const rel = relative(ROOT, file);
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, 'utf-8'));
  } catch (e) {
    console.error(`❌ ${rel}`);
    console.error(`  JSON parse error: ${(e as Error).message}`);
    failed++;
    continue;
  }

  const ok = validate(data);
  if (!ok) {
    failed++;
    console.error(`❌ ${rel}`);
    // Ajv's oneOf errors are noisy — dedupe by instancePath + message
    const seen = new Set<string>();
    for (const err of validate.errors ?? []) {
      const key = `${err.instancePath}::${err.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      console.error(formatError(err));
    }
  }
}

// ── Summary ─────────────────────────────────────────────────────────────
if (failed > 0) {
  console.error(`\n❌ Schema validation failed: ${failed}/${files.length} file(s) invalid.`);
  process.exit(1);
} else {
  console.log(`✓ Schema validation passed: ${files.length} token file(s) checked.`);
}
