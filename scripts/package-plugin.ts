/**
 * package-plugin.ts
 *
 * Stages and zips the BTech Token Studio Figma plugin for release.
 *
 * Output: btech-token-studio/release/btech-token-studio-v<version>.zip
 *
 * Zip structure (Figma requires manifest.json at the root of the zip,
 * NOT inside a subfolder — otherwise the plugin fails to load):
 *
 *   manifest.json          ← at zip root (Figma reads this directly)
 *   dist/
 *   ├── code.js
 *   └── ui.html
 *
 * Run after `pnpm --filter @btech/token-studio build`:
 *   pnpm exec tsx scripts/package-plugin.ts
 */

import { readFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

const ROOT   = new URL('..', import.meta.url).pathname;
const PLUGIN = resolve(ROOT, 'btech-token-studio');
const RELEASE = resolve(PLUGIN, 'release');

// ── Read version from plugin package.json ────────────────────────────────
const pkgPath = resolve(PLUGIN, 'package.json');
if (!existsSync(pkgPath)) {
  console.error(`❌  Plugin package.json not found: ${pkgPath}`);
  process.exit(1);
}
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
const version = pkg.version;
if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`❌  Invalid or missing version in ${pkgPath}: "${version}"`);
  process.exit(1);
}

console.log(`📦  Packaging @btech/token-studio v${version}`);

// ── Verify required build outputs ────────────────────────────────────────
const REQUIRED_DIST = ['dist/code.js', 'dist/ui.html'] as const;
for (const file of REQUIRED_DIST) {
  if (!existsSync(resolve(PLUGIN, file))) {
    console.error(`❌  Missing build output: ${file}. Run pnpm --filter @btech/token-studio build first.`);
    process.exit(1);
  }
}

// ── Sanity-check manifest paths ──────────────────────────────────────────
const manifestPath = resolve(PLUGIN, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error(`❌  manifest.json not found: ${manifestPath}`);
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  main: string;
  ui: string;
};
if (manifest.main !== 'dist/code.js') {
  console.error(
    `❌  manifest.json "main" must be "dist/code.js" (got "${manifest.main}"). ` +
    `Run pnpm validate to see the full manifest check.`,
  );
  process.exit(1);
}
if (manifest.ui !== 'dist/ui.html') {
  console.error(
    `❌  manifest.json "ui" must be "dist/ui.html" (got "${manifest.ui}"). ` +
    `Run pnpm validate to see the full manifest check.`,
  );
  process.exit(1);
}

// ── Zip — manifest.json MUST be at root (Figma requirement) ─────────────
// Zip from inside PLUGIN dir so paths are:
//   manifest.json        ← Figma reads this at root
//   dist/code.js
//   dist/ui.html
// NOT btech-token-studio/manifest.json (Figma would reject it)
const zipName = `btech-token-studio-v${version}.zip`;
const zipPath = resolve(RELEASE, zipName);

// Clean release dir (also removes any stale zip)
if (existsSync(RELEASE)) rmSync(RELEASE, { recursive: true });
mkdirSync(RELEASE, { recursive: true });

execSync(
  `cd "${PLUGIN}" && zip -r "${zipPath}" manifest.json dist/`,
  { stdio: 'inherit' },
);

// ── Verify zip contents ──────────────────────────────────────────────────
const zipList = execSync(`unzip -l "${zipPath}"`, { encoding: 'utf8' });
const required = [
  'manifest.json',
  'dist/code.js',
  'dist/ui.html',
];
const missing = required.filter((f) => !zipList.includes(f));
if (missing.length > 0) {
  console.error(`❌  Zip is missing expected entries:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

console.log(`\n✅  release/${zipName}`);
console.log(`\n   Contents:`);
for (const f of required) {
  console.log(`     ${f}`);
}
console.log(`\n   Upload this zip at:`);
console.log(`   Figma → Admin → Resources → Plugins → Upload plugin`);

// Emit version for CI steps that follow
console.log(`##vso[task.setvariable variable=PLUGIN_ZIP]${zipName}`);
