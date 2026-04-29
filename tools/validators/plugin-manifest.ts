/**
 * plugin-manifest.ts
 *
 * Validates btech-token-studio/manifest.json to catch path regressions
 * (e.g. "ui": "dist/index.html" instead of "dist/ui.html") before they
 * reach a published release zip.
 *
 * Checks:
 *   - manifest.main === "dist/code.js"
 *   - manifest.ui   === "dist/ui.html"
 *   - manifest.id   matches /^com\.btech\..+$/
 *   - manifest.api  === "1.0.0"
 *   - networkAccess.allowedDomains contains only "https://dev.azure.com"
 *
 * Run as part of `pnpm validate`:
 *   pnpm exec tsx tools/validators/plugin-manifest.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT          = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST_PATH = resolve(ROOT, 'btech-token-studio/manifest.json');

type ManifestJson = {
  name?: string;
  id?: string;
  api?: string;
  main?: string;
  ui?: string;
  networkAccess?: {
    allowedDomains?: string[];
  };
};

function main(): void {
  if (!existsSync(MANIFEST_PATH)) {
    // Plugin directory is optional — monorepo might be checked out without it.
    console.log('ℹ️   btech-token-studio/manifest.json not found — skipping plugin manifest check.');
    return;
  }

  let manifest: ManifestJson;
  try {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as ManifestJson;
  } catch (err) {
    console.error(`❌  Could not parse ${MANIFEST_PATH}: ${(err as Error).message}`);
    process.exit(1);
  }

  const errors: string[] = [];

  // ── Build output paths ────────────────────────────────────────────────
  if (manifest.main !== 'dist/code.js') {
    errors.push(
      `"main" must be "dist/code.js" (got ${JSON.stringify(manifest.main)}). ` +
      `Vite emits dist/code.js for the main thread build.`,
    );
  }
  if (manifest.ui !== 'dist/ui.html') {
    errors.push(
      `"ui" must be "dist/ui.html" (got ${JSON.stringify(manifest.ui)}). ` +
      `Vite emits dist/ui.html because the rollupOptions input is keyed as "ui".`,
    );
  }

  // ── Plugin identity ───────────────────────────────────────────────────
  if (!manifest.id || !/^com\.btech\..+$/.test(manifest.id)) {
    errors.push(
      `"id" must match /^com\\.btech\\..+$/ (got ${JSON.stringify(manifest.id)}).`,
    );
  }
  if (manifest.api !== '1.0.0') {
    errors.push(
      `"api" must be "1.0.0" (got ${JSON.stringify(manifest.api)}).`,
    );
  }

  // ── Network access ────────────────────────────────────────────────────
  const domains = manifest.networkAccess?.allowedDomains ?? [];
  const invalid = domains.filter((d) => d !== 'https://dev.azure.com');
  if (invalid.length > 0) {
    errors.push(
      `networkAccess.allowedDomains must only contain "https://dev.azure.com". ` +
      `Unexpected: ${invalid.map((d) => JSON.stringify(d)).join(', ')}.`,
    );
  }

  // ── Report ────────────────────────────────────────────────────────────
  if (errors.length > 0) {
    console.error('❌  Plugin manifest invalid:');
    for (const e of errors) {
      console.error(`     ${e}`);
    }
    process.exit(1);
  }

  console.log('✓ Plugin manifest valid');
}

main();
