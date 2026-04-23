/**
 * bump-version.ts
 *
 * Bumps the version in packages/tokens/platforms/web/token/package.json, then syncs:
 *   - packages/tokens/platforms/flutter/token/pubspec.yaml  (mirror versioning)
 *   - packages/tokens/platforms/web/{tenant}/package.json   (all tenant packages)
 *
 * Usage:
 *   pnpm bump           ← patch (default), e.g. 1.0.1 → 1.0.2
 *   pnpm bump patch     ← e.g. 1.0.1 → 1.0.2  (stable, strips rc suffix)
 *   pnpm bump minor     ← e.g. 1.0.1 → 1.1.0
 *   pnpm bump major     ← e.g. 1.0.1 → 2.0.0
 *   pnpm bump rc        ← e.g. 1.0.1 → 1.0.1-rc.1  OR  1.0.1-rc.1 → 1.0.1-rc.2
 *
 * Called automatically by auto-version.yml when a PR is merged to main.
 * The bump type is determined by PR labels set before merging:
 *   release:patch  → patch (default)
 *   release:minor  → minor
 *   release:major  → major
 *   release:rc     → rc
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

// ── Parse bump type ────────────────────────────────────────────────────────
const bumpType = (process.argv[2] ?? 'patch') as 'patch' | 'minor' | 'major' | 'rc';
if (!['patch', 'minor', 'major', 'rc'].includes(bumpType)) {
  console.error(`❌  Invalid bump type: "${bumpType}". Use patch | minor | major | rc.`);
  process.exit(1);
}

// ── Read current version from tokens-web base package ────────────────────
const webPkgPath = resolve(ROOT, 'packages/tokens/platforms/web/token/package.json');
const webPkg = JSON.parse(readFileSync(webPkgPath, 'utf8'));
const currentVersion: string = webPkg.version;

if (!currentVersion || !/^\d+\.\d+\.\d+(-rc\.\d+)?$/.test(currentVersion)) {
  console.error(`❌  Invalid version in web/token/package.json: "${currentVersion}"`);
  process.exit(1);
}

// ── Compute new version ───────────────────────────────────────────────────
const [baseVersion, preRelease] = currentVersion.split('-');
const [major, minor, patch] = baseVersion.split('.').map(Number);

let newVersion: string;
if (bumpType === 'rc') {
  if (preRelease?.startsWith('rc.')) {
    const rcNum = parseInt(preRelease.split('.')[1], 10) + 1;
    newVersion = `${baseVersion}-rc.${rcNum}`;
  } else {
    newVersion = `${baseVersion}-rc.1`;
  }
} else if (bumpType === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (bumpType === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else {
  newVersion = `${major}.${minor}.${patch + 1}`;
}

// ── Write web/token/package.json ─────────────────────────────────────────
webPkg.version = newVersion;
writeFileSync(webPkgPath, JSON.stringify(webPkg, null, 2) + '\n', 'utf8');
console.log(`✅  @btech/tokens          ${currentVersion} → ${newVersion}`);

// ── Sync flutter/token/pubspec.yaml ──────────────────────────────────────
const pubspecPath = resolve(ROOT, 'packages/tokens/platforms/flutter/token/pubspec.yaml');
const pubspec = readFileSync(pubspecPath, 'utf8');
const updatedPubspec = pubspec.replace(/^version:\s*.+$/m, `version: ${newVersion}`);
if (updatedPubspec === pubspec) {
  console.log(`ℹ️   btech_tokens already at ${newVersion} — no change needed.`);
} else {
  writeFileSync(pubspecPath, updatedPubspec, 'utf8');
  console.log(`✅  btech_tokens           ${currentVersion} → ${newVersion}`);
}

// ── Sync all web tenant package.json versions ────────────────────────────
const webPlatformDir = resolve(ROOT, 'packages/tokens/platforms/web');
for (const entry of readdirSync(webPlatformDir)) {
  if (entry === 'token') continue; // already done above
  const tenantPkgPath = resolve(webPlatformDir, entry, 'package.json');
  if (!existsSync(tenantPkgPath)) continue;
  const tenantPkg = JSON.parse(readFileSync(tenantPkgPath, 'utf8'));
  tenantPkg.version = newVersion;
  writeFileSync(tenantPkgPath, JSON.stringify(tenantPkg, null, 2) + '\n', 'utf8');
  console.log(`✅  @btech/tokens-${entry.padEnd(12)} ${currentVersion} → ${newVersion}`);
}

console.log(`\n📦  New version: ${newVersion}`);
