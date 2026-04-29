/**
 * package-plugin.ts
 *
 * Stages and zips the BTech Token Studio Figma plugin for release.
 *
 * Output: btech-token-studio/release/btech-token-studio-v<version>.zip
 *
 * Zip structure (Figma admin console expects a zip with a root folder
 * containing manifest.json + dist/):
 *
 *   btech-token-studio/
 *   ├── manifest.json
 *   ├── dist/
 *   │   ├── code.js
 *   │   └── ui.html
 *   ├── README.md
 *   └── VERSION
 *
 * Run after `pnpm --filter @btech/token-studio build`:
 *   pnpm exec tsx scripts/package-plugin.ts
 */

import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, copyFileSync } from 'fs';
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

// ── Stage files into release/btech-token-studio/ ─────────────────────────
const stage = resolve(RELEASE, 'btech-token-studio');
const stageDist = resolve(stage, 'dist');

// Clean previous staging dir (not the zip itself, in case re-run)
if (existsSync(stage)) rmSync(stage, { recursive: true });
mkdirSync(stageDist, { recursive: true });

copyFileSync(manifestPath,                      resolve(stage, 'manifest.json'));
copyFileSync(resolve(PLUGIN, 'dist/code.js'),   resolve(stageDist, 'code.js'));
copyFileSync(resolve(PLUGIN, 'dist/ui.html'),   resolve(stageDist, 'ui.html'));

// README is optional
const readmePath = resolve(PLUGIN, 'README.md');
if (existsSync(readmePath)) {
  copyFileSync(readmePath, resolve(stage, 'README.md'));
}

// VERSION plain-text file lets admins identify the release without unzipping
writeFileSync(resolve(stage, 'VERSION'), version + '\n', 'utf8');

// ── Zip ──────────────────────────────────────────────────────────────────
const zipName = `btech-token-studio-v${version}.zip`;
const zipPath = resolve(RELEASE, zipName);

// Remove stale zip if present
if (existsSync(zipPath)) rmSync(zipPath);

execSync(
  `cd "${RELEASE}" && zip -r "${zipName}" btech-token-studio/`,
  { stdio: 'inherit' },
);

// ── Verify zip contents ──────────────────────────────────────────────────
const zipList = execSync(`unzip -l "${zipPath}"`, { encoding: 'utf8' });
const required = [
  'btech-token-studio/manifest.json',
  'btech-token-studio/dist/code.js',
  'btech-token-studio/dist/ui.html',
  'btech-token-studio/VERSION',
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
