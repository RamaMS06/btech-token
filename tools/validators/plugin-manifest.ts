/**
 * Plugin manifest validator
 * --------------------------
 * Lint-time guard for `btech-token-studio/manifest.json`. Catches the kind
 * of regression that bricks a published Figma plugin without the build
 * itself failing — Vite happily emits dist/{code.js,ui.html} even when
 * manifest.{main,ui} point at non-existent files, so the broken paths only
 * surface when an admin tries to load the uploaded plugin.
 *
 * Why this exists:
 *   We hit exactly that bug in the wild — manifest.json shipped with
 *   "ui": "dist/index.html" but Vite outputs `dist/ui.html` (input key
 *   "ui" → output `ui.html`). Plugin loaded with a blank UI iframe in
 *   Figma; nothing in the build pipeline noticed because the dist files
 *   were both present (just at the right names, not the manifest's names).
 *
 *   This validator runs in `pnpm validate` so:
 *     1. Local pre-commit hook catches it before push.
 *     2. CI (`validate.yml`) catches it before merge.
 *     3. `publish-plugin.yml` re-runs it as the last gate before tagging
 *        the immutable Universal Package.
 *
 * Checked invariants:
 *   - manifest.main === "dist/code.js"        (matches `pnpm build` output)
 *   - manifest.ui   === "dist/ui.html"         (matches `pnpm build` output)
 *   - manifest.id   matches /^com\.btech\..+$/ (no hijacked plugin ids)
 *   - manifest.api  === "1.0.0"                (Figma plugin API target)
 *   - manifest.networkAccess.allowedDomains contains only known hosts
 *
 * Exit codes follow the convention used by sibling validators:
 *   0 — all checks pass
 *   1 — one or more violations found (messages written to stderr)
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST_PATH = resolve(ROOT, 'btech-token-studio/manifest.json');

// ── Allowed values ──────────────────────────────────────────────────────────
const EXPECTED_MAIN = 'dist/code.js';
const EXPECTED_UI = 'dist/ui.html';
const EXPECTED_API = '1.0.0';
const ID_RE = /^com\.btech\..+$/;

// Hosts the plugin is allowed to talk to. Anything else is a red flag —
// Figma plugin permissions are an exfiltration vector if the manifest is
// quietly extended with a third-party domain.
const ALLOWED_DOMAINS = new Set<string>([
  'https://dev.azure.com',
]);

// ── Read manifest ───────────────────────────────────────────────────────────
let manifest: Record<string, unknown>;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
} catch (err) {
  console.error(`❌  Could not read ${MANIFEST_PATH}: ${(err as Error).message}`);
  process.exit(1);
}

// ── Run checks ──────────────────────────────────────────────────────────────
const errors: string[] = [];

if (manifest.main !== EXPECTED_MAIN) {
  errors.push(`manifest.main must be "${EXPECTED_MAIN}" (got "${String(manifest.main)}")`);
}
if (manifest.ui !== EXPECTED_UI) {
  errors.push(`manifest.ui must be "${EXPECTED_UI}" (got "${String(manifest.ui)}")`);
}
if (typeof manifest.id !== 'string' || !ID_RE.test(manifest.id)) {
  errors.push(`manifest.id must match /^com\\.btech\\..+$/ (got "${String(manifest.id)}")`);
}
if (manifest.api !== EXPECTED_API) {
  errors.push(`manifest.api must be "${EXPECTED_API}" (got "${String(manifest.api)}")`);
}

// networkAccess.allowedDomains: optional, but if present, every entry must
// be on the allowlist. We don't require its presence — a plugin without
// network access is fine — but unexpected hosts must fail the build.
const networkAccess = manifest.networkAccess as
  | { allowedDomains?: unknown }
  | undefined;
if (networkAccess && Array.isArray(networkAccess.allowedDomains)) {
  for (const host of networkAccess.allowedDomains) {
    if (typeof host !== 'string' || !ALLOWED_DOMAINS.has(host)) {
      errors.push(
        `networkAccess.allowedDomains contains unexpected host "${String(host)}". ` +
        `Allowed: ${[...ALLOWED_DOMAINS].join(', ')}.`,
      );
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────────────
if (errors.length > 0) {
  console.error('❌  Plugin manifest invalid:');
  for (const e of errors) console.error(`    • ${e}`);
  process.exit(1);
}

console.log('✓  Plugin manifest valid (main/ui/id/api/network).');
