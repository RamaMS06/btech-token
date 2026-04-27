/**
 * publish-changed.ts — idempotent npm publisher
 *
 * Walks all npm-publishable packages in the monorepo and publishes only
 * those whose local version is NOT yet on the registry. Skips already-
 * published versions silently. Used by pipelines/publish.yml so that
 * tag-triggered publishes don't fail when only a subset of packages
 * actually changed version (the hybrid versioning model introduced
 * alongside this script).
 *
 * Packages considered:
 *   - packages/tokens/platforms/web/token          (@btech/tokens)
 *   - packages/tokens/platforms/web/<tenant>       (@btech/tokens-<tenant>)
 *
 * Flutter (pubspec.yaml) is out of scope — it ships via git path, not
 * a pub/npm registry.
 *
 * Usage:
 *   pnpm exec tsx scripts/publish-changed.ts
 *   pnpm exec tsx scripts/publish-changed.ts --dry-run
 *
 * Env:
 *   NPM_TAG              dist-tag to publish under ("rc" or "latest"). Required.
 *   PUBLISH_ONLY_TENANT  optional — when set to a tenant id, restricts the
 *                        publish loop to that single `@btech/tokens-<id>`
 *                        package. Set by publish.yml when triggered by a
 *                        `<tenant>-v<version>` tag so tenant-only releases
 *                        don't accidentally re-publish base or other tenants.
 */

import { execSync, spawnSync } from 'child_process';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT       = new URL('..', import.meta.url).pathname;
const WEB_DIR    = resolve(ROOT, 'packages/tokens/platforms/web');
const DRY_RUN    = process.argv.includes('--dry-run');
const NPM_TAG    = process.env.NPM_TAG ?? '';
// Empty string is interpreted as "no restriction" — same semantics as unset.
const ONLY_TENANT = (process.env.PUBLISH_ONLY_TENANT ?? '').trim();

if (!NPM_TAG && !DRY_RUN) {
  console.error('❌  NPM_TAG env var required (e.g. NPM_TAG=rc or NPM_TAG=latest).');
  process.exit(1);
}

interface Pkg {
  name: string;
  version: string;
  dir: string;      // absolute path to the package directory
}

function readPkg(dir: string): Pkg | null {
  const pjPath = resolve(dir, 'package.json');
  if (!existsSync(pjPath)) return null;
  const pj = JSON.parse(readFileSync(pjPath, 'utf8'));
  if (!pj.name || !pj.version) return null;
  return { name: pj.name, version: pj.version, dir };
}

function collectPackages(): Pkg[] {
  // Tenant-only mode short-circuits the whole walk: we only ever consider
  // `<WEB_DIR>/<tenant>/package.json`. Base + sibling tenants stay alone.
  if (ONLY_TENANT) {
    const target = readPkg(resolve(WEB_DIR, ONLY_TENANT));
    if (!target) {
      console.error(`❌  PUBLISH_ONLY_TENANT="${ONLY_TENANT}" but no package found at ${WEB_DIR}/${ONLY_TENANT}.`);
      process.exit(1);
    }
    return [target];
  }

  const pkgs: Pkg[] = [];
  const base = readPkg(resolve(WEB_DIR, 'token'));
  if (base) pkgs.push(base);
  for (const entry of readdirSync(WEB_DIR)) {
    if (entry === 'token') continue;
    const p = readPkg(resolve(WEB_DIR, entry));
    if (p) pkgs.push(p);
  }
  return pkgs;
}

function publishedVersions(pkgName: string): Set<string> {
  try {
    const raw = execSync(`npm view ${pkgName} versions --json 2>/dev/null`, {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    }).trim();
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed);
    if (typeof parsed === 'string') return new Set([parsed]);
    return new Set();
  } catch {
    // E404 — package has never been published. That's fine.
    return new Set();
  }
}

function publish(pkg: Pkg): boolean {
  if (DRY_RUN) {
    console.log(`   [dry-run] would publish ${pkg.name}@${pkg.version} (tag: ${NPM_TAG || '<unset>'})`);
    return true;
  }
  const res = spawnSync(
    'pnpm',
    ['--filter', pkg.name, 'publish', '--no-git-checks', '--tag', NPM_TAG],
    { cwd: ROOT, stdio: 'inherit' },
  );
  return res.status === 0;
}

// ── Run ──────────────────────────────────────────────────────────────────
const pkgs = collectPackages();
console.log(`\n🔎  Evaluating ${pkgs.length} package(s) for publish${DRY_RUN ? ' (dry-run)' : ''}…\n`);

let publishedCount = 0;
let skippedCount   = 0;
let failedCount    = 0;

for (const pkg of pkgs) {
  const existing = publishedVersions(pkg.name);
  if (existing.has(pkg.version)) {
    console.log(`ℹ️   ${pkg.name}@${pkg.version} — already published, skipping.`);
    skippedCount++;
    continue;
  }
  console.log(`🚀  ${pkg.name}@${pkg.version} — publishing…`);
  const ok = publish(pkg);
  if (ok) {
    publishedCount++;
  } else {
    failedCount++;
    console.error(`❌  ${pkg.name}@${pkg.version} — publish failed.`);
  }
}

console.log(
  `\n📦  Summary: ${publishedCount} published · ${skippedCount} skipped · ${failedCount} failed`,
);
process.exit(failedCount > 0 ? 1 : 0);
