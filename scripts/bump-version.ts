/**
 * bump-version.ts — root-canonical, coordinated-major/minor versioning
 *
 * The canonical platform version lives in the repo-root `package.json` (the
 * private `@btech/design-system` workspace). Every other version-bearing file
 * (web base + tenants, flutter base + tenants, python base + tenants) is
 * DERIVED from root, with two distinct write rules:
 *
 *   1. RESET RULE (major / minor / prerelease boundary changed)
 *      → all derived packages set to `<newRoot>` exactly
 *      → `--scope` is ignored (warning logged) — major/minor releases are
 *        platform-wide by definition
 *
 *   2. PATCH RULE (only patch component differs OR root unchanged)
 *      → base packages (web/flutter/python token) follow root
 *      → tenant packages patch their OWN counter independently
 *      → `--scope` decides which packages participate
 *
 * Scopes:
 *   --scope=all     bump everything (default)
 *   --scope=base    bump base packages only (web/flutter/python token)
 *   --scope=tenants bump every tenant (skip base)
 *   --scope=tenant:<id> bump a single tenant
 *   --auto          infer scope from git diff (sources/{core|semantic|components}
 *                   → all; sources/tenants/<id> → tenant:<id>; multiple → tenants)
 *
 * Each tenant tracks its own patch counter, which resets to `.0` whenever
 * the reset rule fires (i.e. major/minor/prerelease moves). Override JSON
 * files (`tenants/<id>/overrides.json`) are NEVER touched here.
 *
 * Usage:
 *   pnpm bump                               # patch, all (back-compat)
 *   pnpm bump minor                         # minor → forces resetAll
 *   pnpm bump rc                            # rc patch — no resetAll (both have prerelease)
 *   pnpm bump set 1.0.0                     # rc graduate → resetAll fires
 *   pnpm bump set 1.5.4 --scope=base        # patch-level set, base only
 *   pnpm bump patch --scope=tenant:bspace   # tenant patch, root untouched
 *   pnpm bump patch --auto                  # detect scope from git diff
 *   pnpm bump patch --dry-run               # print plan, no writes
 *
 * Called automatically by auto-version.yml when a PR is merged to main.
 * PR labels map to flags:
 *   release:major|minor|patch|rc  → bump type
 *   scope:all|base|tenants        → scope (or `scope:tenant:<id>`)
 *   version:<x.y.z>               → invokes `set <x.y.z>` mode (overrides type)
 *   (no scope label → --auto)
 *   no-release                    → skip entirely
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

// ── Paths ────────────────────────────────────────────────────────────────
const ROOT = new URL('..', import.meta.url).pathname;
const ROOT_PKG = resolve(ROOT, 'package.json');
const WEB_BASE_PKG  = resolve(ROOT, 'packages/tokens/platforms/web/token/package.json');
const FLUTTER_PUBSPEC = resolve(ROOT, 'packages/tokens/platforms/flutter/token/pubspec.yaml');
const PYTHON_BASE_PYPROJECT = resolve(ROOT, 'packages/tokens/platforms/python/token/pyproject.toml');
const WEB_PLATFORM_DIR = resolve(ROOT, 'packages/tokens/platforms/web');
const PYTHON_TENANTS_DIR = resolve(ROOT, 'packages/tokens/platforms/python/tenants');
const FLUTTER_PLATFORM_DIR = resolve(ROOT, 'packages/tokens/platforms/flutter');

// ── Types ────────────────────────────────────────────────────────────────
type BumpType = 'patch' | 'minor' | 'major' | 'rc' | 'set';
type Scope    = { kind: 'all' } | { kind: 'base' } | { kind: 'tenants' } | { kind: 'tenant'; id: string };

/**
 * Loose-but-strict semver guard for the `set` mode. Same shape that
 * `auto-version.yml`'s `version:<x>` PR label is expected to carry. We don't
 * accept arbitrary strings — a malformed version would corrupt every
 * package.json we write.
 */
const STRICT_SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

interface PlanTarget {
  label: string;            // human-friendly name, e.g. "@btech/tokens"
  kind: 'web-base' | 'flutter-base' | 'python-base' | 'web-tenant' | 'flutter-tenant' | 'python-tenant';
  file: string;             // path to package.json / pubspec.yaml / pyproject.toml
  tenantId?: string;        // only for web-tenant / python-tenant
}

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null; // e.g. "rc.3" or null
}

// ── Arg parsing ──────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith('--'));

const bumpType: BumpType = (() => {
  const raw = positional[0] ?? 'patch';
  if (!['patch', 'minor', 'major', 'rc', 'set'].includes(raw)) {
    console.error(`❌  Invalid bump type: "${raw}". Use patch | minor | major | rc | set.`);
    process.exit(1);
  }
  return raw as BumpType;
})();

/**
 * For `set <version>` we capture the target version from the second
 * positional argument. Validated against STRICT_SEMVER so a typo in a PR
 * label can't poison every package.json on the way to publish.
 */
const setTarget: string | null = bumpType === 'set'
  ? (() => {
      const v = positional[1];
      if (!v) {
        console.error('❌  `set` requires a target version, e.g. `pnpm bump set 1.0.0`.');
        process.exit(1);
      }
      if (!STRICT_SEMVER.test(v)) {
        console.error(`❌  Invalid version "${v}". Must be MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-prerelease.`);
        process.exit(1);
      }
      return v;
    })()
  : null;

const flagAuto   = argv.includes('--auto');
const flagDryRun = argv.includes('--dry-run');
const rawScope   = (argv.find((a) => a.startsWith('--scope=')) ?? '--scope=all').slice('--scope='.length);

function parseScope(raw: string): Scope {
  if (raw === 'all' || raw === '')    return { kind: 'all' };
  if (raw === 'base')                 return { kind: 'base' };
  if (raw === 'tenants')              return { kind: 'tenants' };
  if (raw.startsWith('tenant:'))      return { kind: 'tenant', id: raw.slice('tenant:'.length) };
  console.error(`❌  Invalid --scope="${raw}". Use all | base | tenants | tenant:<id>.`);
  process.exit(1);
}

// ── Auto scope detection ─────────────────────────────────────────────────
function detectScope(): Scope | null {
  let changed: string[] = [];
  try {
    const diff = execSync(
      'git diff --name-only origin/main...HEAD 2>/dev/null; git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null',
      { encoding: 'utf8', cwd: ROOT },
    );
    changed = Array.from(new Set(diff.split('\n').filter(Boolean)));
  } catch {
    console.warn('⚠️   Could not read git diff — falling back to scope=all.');
    return { kind: 'all' };
  }

  const coreChanged = changed.some((f) =>
    /^packages\/tokens\/sources\/(core|semantic|components)\//.test(f),
  );
  if (coreChanged) return { kind: 'all' };

  const tenantHits = new Set<string>();
  for (const f of changed) {
    const m = f.match(/^packages\/tokens\/sources\/tenants\/([^/]+)\//);
    if (m) tenantHits.add(m[1]);
  }

  if (tenantHits.size === 1) return { kind: 'tenant', id: [...tenantHits][0] };
  if (tenantHits.size > 1)   return { kind: 'tenants' };
  return null; // nothing relevant
}

const scope: Scope = flagAuto
  ? (() => {
      const detected = detectScope();
      if (!detected) {
        console.log('ℹ️   --auto: no token source changes detected — nothing to bump.');
        process.exit(0);
      }
      console.log(`🔍  --auto detected scope: ${scopeLabel(detected)}`);
      return detected;
    })()
  : parseScope(rawScope);

function scopeLabel(s: Scope): string {
  if (s.kind === 'tenant') return `tenant:${s.id}`;
  return s.kind;
}

// ── Semver ───────────────────────────────────────────────────────────────

function parseSemver(v: string): ParsedSemver {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
  if (!m) throw new Error(`Invalid version: "${v}"`);
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? null,
  };
}

/**
 * The reset rule — when `true`, every downstream package is force-set to
 * `next` regardless of `--scope`. Major/minor moves are platform-wide; RC
 * graduation (or fall back into RC) is also platform-wide because the
 * prerelease tag carries release-channel meaning that affects every package.
 *
 * Pure patch differences (including incrementing rc.N → rc.N+1) do NOT
 * trigger reset — those are scope-respecting.
 */
function shouldResetAll(prev: string, next: string): boolean {
  const p = parseSemver(prev);
  const n = parseSemver(next);
  if (p.major !== n.major) return true;
  if (p.minor !== n.minor) return true;
  // Prerelease APPEARED or DISAPPEARED → channel boundary crossed
  if (Boolean(p.prerelease) !== Boolean(n.prerelease)) return true;
  return false;
}

function bump(current: string, type: BumpType): string {
  // `set` short-circuits the semver math — the designer (or PR label) gave
  // us the literal next version. We still validate `current` is parseable so
  // an unrelated read failure surfaces here rather than silently overwriting.
  if (type === 'set') {
    if (!setTarget) throw new Error('Internal: set mode missing target.');
    return setTarget;
  }

  const parsed = parseSemver(current);
  const { major, minor, patch, prerelease } = parsed;
  const base = `${major}.${minor}.${patch}`;

  if (type === 'rc') {
    if (prerelease?.startsWith('rc.')) {
      const n = parseInt(prerelease.split('.')[1], 10) + 1;
      return `${base}-rc.${n}`;
    }
    return `${base}-rc.1`;
  }
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  // patch: stripping a prerelease counts as graduation (e.g. 1.0.0-rc.3 → 1.0.0)
  if (prerelease?.startsWith('rc.')) return base;
  return `${major}.${minor}.${patch + 1}`;
}

// ── Build target list from scope ─────────────────────────────────────────
function collectTargets(s: Scope): PlanTarget[] {
  const targets: PlanTarget[] = [];

  const addBase = () => {
    targets.push({ label: '@btech/tokens',   kind: 'web-base',     file: WEB_BASE_PKG });
    targets.push({ label: 'btech_tokens',    kind: 'flutter-base', file: FLUTTER_PUBSPEC });
    if (existsSync(PYTHON_BASE_PYPROJECT)) {
      targets.push({ label: 'btech-tokens',  kind: 'python-base',  file: PYTHON_BASE_PYPROJECT });
    }
  };
  const addTenant = (id: string) => {
    const webPkg = resolve(WEB_PLATFORM_DIR, id, 'package.json');
    if (!existsSync(webPkg)) {
      console.error(`❌  Unknown tenant: "${id}" (no ${webPkg})`);
      process.exit(1);
    }
    targets.push({ label: `@btech/tokens-${id}`, kind: 'web-tenant', file: webPkg, tenantId: id });
    // Flutter tenant pubspec — same lockstep semantics as the web-tenant
    // package.json. Was missing from the target list previously, which
    // caused tenant Flutter packages to drift from root version after a
    // few bump cycles (e.g. root rc.9 while flutter/<id>/pubspec stayed
    // pinned to whatever the generator scaffolded). Including it here
    // means every scope-respecting bump that touches a tenant also
    // updates its Flutter pubspec.yaml.
    const flutterTenantPubspec = resolve(FLUTTER_PLATFORM_DIR, id, 'pubspec.yaml');
    if (existsSync(flutterTenantPubspec)) {
      targets.push({
        label: `btech_tokens_${id}`,
        kind: 'flutter-tenant',
        file: flutterTenantPubspec,
        tenantId: id,
      });
    }
    const pyTenantPyproject = resolve(PYTHON_TENANTS_DIR, id, 'pyproject.toml');
    if (existsSync(pyTenantPyproject)) {
      targets.push({
        label: `btech-tokens-${id}`,
        kind: 'python-tenant',
        file: pyTenantPyproject,
        tenantId: id,
      });
    }
  };
  const allTenantIds = () =>
    readdirSync(WEB_PLATFORM_DIR).filter(
      (e) => e !== 'token' && existsSync(resolve(WEB_PLATFORM_DIR, e, 'package.json')),
    );

  switch (s.kind) {
    case 'all':
      addBase();
      allTenantIds().forEach(addTenant);
      break;
    case 'base':
      addBase();
      break;
    case 'tenants':
      allTenantIds().forEach(addTenant);
      break;
    case 'tenant':
      addTenant(s.id);
      break;
  }
  return targets;
}

// ── I/O helpers ──────────────────────────────────────────────────────────

function readVersion(t: PlanTarget): string {
  if (t.kind === 'flutter-base' || t.kind === 'flutter-tenant') {
    const pubspec = readFileSync(t.file, 'utf8');
    const match = pubspec.match(/^version:\s*(.+)$/m);
    if (!match) throw new Error(`No version in ${t.file}`);
    return match[1].trim();
  }
  if (t.kind === 'python-base' || t.kind === 'python-tenant') {
    const toml = readFileSync(t.file, 'utf8');
    const match = toml.match(/^version = "([^"]+)"/m);
    if (!match) throw new Error(`No [project] version in ${t.file}`);
    return match[1];
  }
  return JSON.parse(readFileSync(t.file, 'utf8')).version as string;
}

function writeVersion(t: PlanTarget, to: string): void {
  if (t.kind === 'flutter-base' || t.kind === 'flutter-tenant') {
    const pubspec = readFileSync(t.file, 'utf8');
    writeFileSync(t.file, pubspec.replace(/^version:\s*.+$/m, `version: ${to}`), 'utf8');
    return;
  }
  if (t.kind === 'python-base' || t.kind === 'python-tenant') {
    const toml = readFileSync(t.file, 'utf8');
    writeFileSync(t.file, toml.replace(/^version = "[^"]+"/m, `version = "${to}"`), 'utf8');
    return;
  }
  const pkg = JSON.parse(readFileSync(t.file, 'utf8'));
  pkg.version = to;
  writeFileSync(t.file, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

// ── Compute new root ─────────────────────────────────────────────────────

const currentRoot = JSON.parse(readFileSync(ROOT_PKG, 'utf8')).version as string;

/**
 * Determine the next root version. Root advances on every major/minor/rc
 * bump regardless of scope. For pure `patch` bumps, root only advances when
 * the scope includes base packages; tenant-only patches leave root alone so
 * the canonical "platform version" doesn't churn for tenant-side edits.
 */
function computeNewRoot(prev: string, type: BumpType): string {
  if (type === 'patch') {
    if (scope.kind === 'tenant' || scope.kind === 'tenants') {
      return prev; // tenant-only patch → root unchanged
    }
    return bump(prev, 'patch');
  }
  return bump(prev, type);
}

const newRoot = computeNewRoot(currentRoot, bumpType);
const resetAll = shouldResetAll(currentRoot, newRoot);

if (resetAll && (scope.kind !== 'all')) {
  console.warn(
    `⚠️   ${currentRoot} → ${newRoot} crosses major/minor/prerelease boundary; ` +
    `forcing scope=all (was ${scopeLabel(scope)}).`,
  );
}

// When the reset rule fires we expand to every package, regardless of the
// caller's scope choice. Patch-level bumps keep the requested scope.
const effectiveScope: Scope = resetAll ? { kind: 'all' } : scope;
const targets = collectTargets(effectiveScope);

// ── Execute ──────────────────────────────────────────────────────────────

console.log(
  `\n📋  Plan — bump=${bumpType} · scope=${scopeLabel(scope)}` +
  (resetAll ? ' · RESET-ALL' : '') +
  (flagDryRun ? ' · DRY-RUN' : ''),
);
console.log(`    root: ${currentRoot} → ${newRoot}`);
console.log(`    targets (${targets.length}):`);

interface Result { label: string; from: string; to: string; }
const results: Result[] = [];

// Root is written first — it's the canonical record everything else mirrors
// against. Skipping the write on a no-op keeps dry-runs clean and avoids
// touching the file when scope=tenant:* with no root change.
if (!flagDryRun && newRoot !== currentRoot) {
  const rootPkg = JSON.parse(readFileSync(ROOT_PKG, 'utf8'));
  rootPkg.version = newRoot;
  writeFileSync(ROOT_PKG, JSON.stringify(rootPkg, null, 2) + '\n', 'utf8');
}
results.push({ label: '<root> @btech/design-system', from: currentRoot, to: newRoot });
{
  const arrow = currentRoot === newRoot ? '=' : '→';
  console.log(`      ${currentRoot === newRoot ? 'ℹ️ ' : '✅'} <root> @btech/design-system   ${currentRoot} ${arrow} ${newRoot}`);
}

// Derived packages — apply per the resetAll / scope rules.
for (const t of targets) {
  const from = readVersion(t);
  let to: string;

  if (resetAll) {
    // Reset rule: every derived package gets the new root version verbatim.
    to = newRoot;
  } else if (t.kind === 'web-base' || t.kind === 'flutter-base' || t.kind === 'python-base') {
    // Patch rule, base packages: mirror root (advances together with root
    // because root only advanced when scope included base).
    to = newRoot;
  } else {
    // Patch rule, tenant packages: independent counter — increment from the
    // tenant's OWN current version, staying within whatever release channel
    // the tenant is on. If the tenant is on a prerelease (e.g. 1.0.0-rc.3)
    // we increment the rc counter (rc.4) rather than graduating to a stable;
    // tenant-only patches should never cross channel boundaries.
    const channelBump: BumpType = parseSemver(from).prerelease?.startsWith('rc.')
      ? 'rc'
      : 'patch';
    to = bump(from, channelBump);
  }

  if (!flagDryRun && to !== from) {
    writeVersion(t, to);
  }
  const arrow = from === to ? '=' : '→';
  console.log(`      ${from === to ? 'ℹ️ ' : '✅'} ${t.label.padEnd(28)} ${from} ${arrow} ${to}`);
  results.push({ label: t.label, from, to });
}

// ── Summary ──────────────────────────────────────────────────────────────
console.log(
  `\n📦  Root @btech/design-system: ${newRoot}` +
  (flagDryRun ? ' (unchanged — dry run)' : ''),
);

// Emit machine-readable block for CI consumption (auto-version.yml reads this).
// `bumpedTenant` lets the pipeline tag tenant-only bumps as `<id>-v<version>`
// without having to re-derive the scope from the JSON.
const bumpedTenant: string | null =
  !resetAll && scope.kind === 'tenant'
    ? scope.id
    : (!resetAll && scope.kind === 'tenants' && results.some((r) => r.from !== r.to))
      ? 'multiple'
      : null;

console.log('\n---BUMP_RESULT_JSON---');
console.log(JSON.stringify({
  bumpType,
  scope: scopeLabel(scope),
  effectiveScope: scopeLabel(effectiveScope),
  resetAll,
  prevRoot: currentRoot,
  newRoot,
  bumpedTenant,
  setTarget,
  changed: results.filter((r) => r.from !== r.to).map((r) => ({ pkg: r.label, from: r.from, to: r.to })),
}));
console.log('---END_BUMP_RESULT_JSON---');

// Echo the same key facts as Azure DevOps logging variables so subsequent
// pipeline steps can branch on them without parsing JSON. Logging-only:
// they have no effect outside of CI.
if (bumpedTenant && bumpedTenant !== 'multiple') {
  console.log(`##vso[task.setvariable variable=BUMPED_TENANT]${bumpedTenant}`);
}
console.log(`##vso[task.setvariable variable=NEW_ROOT_VERSION]${newRoot}`);
console.log(`##vso[task.setvariable variable=PREV_ROOT_VERSION]${currentRoot}`);
console.log(`##vso[task.setvariable variable=RESET_ALL]${resetAll ? 'true' : 'false'}`);
