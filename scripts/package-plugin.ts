/**
 * package-plugin.ts
 *
 * Packages the BTech Token Studio Figma plugin into a release ZIP suitable
 * for upload to the Figma org admin console (Resources → Plugins → Upload).
 *
 * ZIP structure (manifest.json MUST be at root — Figma requirement):
 *   manifest.json
 *   dist/
 *     code.js
 *     ui.html
 *
 * Output: btech-token-studio/release/btech-token-studio-v<version>.zip
 *
 * Usage:
 *   pnpm --filter @btech/token-studio build
 *   pnpm exec tsx scripts/package-plugin.ts
 */

import { readFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const ROOT       = new URL('..', import.meta.url).pathname;
const PLUGIN_DIR = resolve(ROOT, 'btech-token-studio');
const RELEASE    = resolve(PLUGIN_DIR, 'release');

// ── Read version from plugin package.json ────────────────────────────────
const pkg     = JSON.parse(readFileSync(`${PLUGIN_DIR}/package.json`, 'utf8'));
const version: string = pkg.version;
const zipName = `btech-token-studio-v${version}.zip`;
const zipPath = resolve(RELEASE, zipName);

// ── Verify build outputs exist before packaging ──────────────────────────
const required = ['dist/code.js', 'dist/ui.html', 'manifest.json'];
for (const file of required) {
  if (!existsSync(`${PLUGIN_DIR}/${file}`)) {
    console.error(`❌  Missing required file: ${file}`);
    console.error('    Run: pnpm --filter @btech/token-studio build');
    process.exit(1);
  }
}

// ── Sanity-check manifest paths ──────────────────────────────────────────
const manifest = JSON.parse(readFileSync(`${PLUGIN_DIR}/manifest.json`, 'utf8'));
if (manifest.main !== 'dist/code.js') {
  console.error(`❌  manifest.main must be "dist/code.js" (got "${manifest.main}")`);
  process.exit(1);
}
if (manifest.ui !== 'dist/ui.html') {
  console.error(`❌  manifest.ui must be "dist/ui.html" (got "${manifest.ui}")`);
  process.exit(1);
}

// ── Clean and recreate release dir ───────────────────────────────────────
if (existsSync(RELEASE)) rmSync(RELEASE, { recursive: true });
mkdirSync(RELEASE, { recursive: true });

// ── Zip: manifest.json + dist/ at root (Figma requirement) ───────────────
// `cd` into PLUGIN_DIR so paths inside ZIP are manifest.json and dist/*
// NOT btech-token-studio/manifest.json — Figma reads manifest.json at root.
execSync(
  `cd "${PLUGIN_DIR}" && zip -r "${zipPath}" manifest.json dist/`,
  { stdio: 'inherit' },
);

console.log(`\n✅  Packaged: btech-token-studio/release/${zipName}`);
console.log(`    Size: ${Math.round(execSync(`wc -c < "${zipPath}"`).toString().trim().replace(/\s/g, '')) / 1024} KB`);
console.log('\n📤  Upload to Figma:');
console.log('    figma.com → org logo (top-left) → Admin → Resources → Plugins → Upload plugin');
