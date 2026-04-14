/**
 * sync-dart-version.ts
 *
 * Reads the current version from packages/tokens-web/package.json
 * and writes the same version to packages/tokens-dart/pubspec.yaml.
 *
 * Run automatically after `pnpm changeset version` in CI (publish.yml),
 * or manually: pnpm exec tsx scripts/sync-dart-version.ts
 *
 * Mirror versioning rule:
 *   @ramaMS06/tokens-web@X.Y.Z  ←→  btech_tokens X.Y.Z (pubspec)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = new URL('..', import.meta.url).pathname;

// ── Read JS version ────────────────────────────────────────────────────────
const webPkg = JSON.parse(
  readFileSync(resolve(ROOT, 'packages/tokens-web/package.json'), 'utf8')
);
const version: string = webPkg.version;

if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`❌  Invalid version in tokens-web/package.json: "${version}"`);
  process.exit(1);
}

// ── Update pubspec.yaml ────────────────────────────────────────────────────
const pubspecPath = resolve(ROOT, 'packages/tokens-dart/pubspec.yaml');
const pubspec = readFileSync(pubspecPath, 'utf8');

const updated = pubspec.replace(
  /^version:\s*.+$/m,
  `version: ${version}`
);

if (updated === pubspec) {
  console.log(`ℹ️   tokens-dart already at version ${version} — no change needed.`);
  process.exit(0);
}

writeFileSync(pubspecPath, updated, 'utf8');
console.log(`✅  Synced btech_tokens → ${version} (mirrors @ramaMS06/tokens-web@${version})`);
