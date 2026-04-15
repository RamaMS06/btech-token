/**
 * bump-version.ts
 *
 * Bumps the version in packages/tokens-web/package.json, then syncs
 * packages/tokens-dart/pubspec.yaml to the same version (mirror versioning).
 *
 * Usage:
 *   pnpm bump patch     ← default, e.g. 1.0.1 → 1.0.2
 *   pnpm bump minor     ← e.g. 1.0.1 → 1.1.0
 *   pnpm bump major     ← e.g. 1.0.1 → 2.0.0
 *
 * Called automatically by auto-version.yml on every PR merge to main.
 * The bump type is determined by PR labels:
 *   release:patch  → patch (default)
 *   release:minor  → minor
 *   release:major  → major
 */

import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

// ── Parse bump type ────────────────────────────────────────────────────────
const bumpType = (process.argv[2] ?? 'patch') as 'patch' | 'minor' | 'major';
if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error(`❌  Invalid bump type: "${bumpType}". Use patch | minor | major.`);
  process.exit(1);
}

// ── Read current version from tokens-web ──────────────────────────────────
const webPkgPath = resolve(ROOT, 'packages/tokens-web/package.json');
const webPkg = JSON.parse(readFileSync(webPkgPath, 'utf8'));
const currentVersion: string = webPkg.version;

if (!currentVersion || !/^\d+\.\d+\.\d+$/.test(currentVersion)) {
  console.error(`❌  Invalid version in tokens-web/package.json: "${currentVersion}"`);
  process.exit(1);
}

// ── Compute new version ───────────────────────────────────────────────────
const [major, minor, patch] = currentVersion.split('.').map(Number);

let newVersion: string;
if (bumpType === 'major') newVersion = `${major + 1}.0.0`;
else if (bumpType === 'minor') newVersion = `${major}.${minor + 1}.0`;
else newVersion = `${major}.${minor}.${patch + 1}`;

// ── Write tokens-web/package.json ────────────────────────────────────────
webPkg.version = newVersion;
writeFileSync(webPkgPath, JSON.stringify(webPkg, null, 2) + '\n', 'utf8');
console.log(`✅  @ramaMS06/tokens-web  ${currentVersion} → ${newVersion}`);

// ── Write tokens-dart/pubspec.yaml (mirror versioning) ───────────────────
const pubspecPath = resolve(ROOT, 'packages/tokens-dart/pubspec.yaml');
const pubspec = readFileSync(pubspecPath, 'utf8');
const updatedPubspec = pubspec.replace(/^version:\s*.+$/m, `version: ${newVersion}`);

if (updatedPubspec === pubspec) {
  console.log(`ℹ️   btech_tokens already at ${newVersion} — no change needed.`);
} else {
  writeFileSync(pubspecPath, updatedPubspec, 'utf8');
  console.log(`✅  btech_tokens          ${currentVersion} → ${newVersion}`);
}

// ── Print new version for CI (captured via $GITHUB_OUTPUT) ───────────────
console.log(`\n📦  New version: ${newVersion}`);
// Write to GITHUB_OUTPUT if running in CI
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
}
