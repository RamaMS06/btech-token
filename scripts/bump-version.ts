/**
 * bump-version.ts — forward-compatible versioning
 *
 * Supports three versioning strategies out of the box, selectable per-run:
 *
 *   1. Lockstep       — bump everything together       (--scope=all, default)
 *   2. Base-only      — bump base (web/token + flutter/token) only
 *                                                       (--scope=base)
 *   3. Independent    — bump only specific tenant(s)
 *                                                       (--scope=tenants | tenant:<id>)
 *
 * Auto mode (`--auto`) infers the correct scope from `git diff origin/main...HEAD`:
 *   - change in sources/{core|semantic|components}/**   → scope=all
 *   - change in sources/tenants/<id>/** (only)          → scope=tenant:<id>
 *   - changes in multiple tenants, no core              → scope=tenants
 *   - no source change                                  → no-op (exit 0)
 *
 * Each package tracks its own version. Bumps apply per package in scope.
 * Safe to call repeatedly — idempotent.
 *
 * Usage:
 *   pnpm bump                               # patch, all (back-compat)
 *   pnpm bump minor                         # minor, all
 *   pnpm bump rc                            # rc, all
 *   pnpm bump patch --scope=base            # base only
 *   pnpm bump patch --scope=tenants         # all tenants only
 *   pnpm bump patch --scope=tenant:bspace   # single tenant
 *   pnpm bump patch --auto                  # detect scope from git diff
 *   pnpm bump patch --dry-run               # print plan, no writes
 *
 * Called automatically by auto-version.yml when a PR is merged to main.
 * PR labels map to flags:
 *   release:major|minor|patch|rc  → bump type
 *   scope:all|base|tenants        → scope (or `scope:tenant:<id>`)
 *   (no scope label → --auto)
 *   no-release                    → skip entirely
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { execSync } from 'child_process';

// ── Paths ────────────────────────────────────────────────────────────────
const ROOT = new URL('..', import.meta.url).pathname;
const WEB_BASE_PKG  = resolve(ROOT, 'packages/tokens/platforms/web/token/package.json');
const FLUTTER_PUBSPEC = resolve(ROOT, 'packages/tokens/platforms/flutter/token/pubspec.yaml');
const WEB_PLATFORM_DIR = resolve(ROOT, 'packages/tokens/platforms/web');

// ── Types ────────────────────────────────────────────────────────────────
type BumpType = 'patch' | 'minor' | 'major' | 'rc';
type Scope    = { kind: 'all' } | { kind: 'base' } | { kind: 'tenants' } | { kind: 'tenant'; id: string };

interface Plan {
  bumpType: BumpType;
  scope: Scope;
  targets: PlanTarget[];
  dryRun: boolean;
}

interface PlanTarget {
  label: string;            // human-friendly name, e.g. "@btech/tokens"
  kind: 'web-base' | 'flutter-base' | 'web-tenant';
  file: string;             // path to package.json / pubspec.yaml
  tenantId?: string;        // only for web-tenant
}

// ── Arg parsing ──────────────────────────────────────────────────────────
const argv = process.argv.slice(2);

const bumpType: BumpType = (() => {
  const raw = argv.find((a) => !a.startsWith('--')) ?? 'patch';
  if (!['patch', 'minor', 'major', 'rc'].includes(raw)) {
    console.error(`❌  Invalid bump type: "${raw}". Use patch | minor | major | rc.`);
    process.exit(1);
  }
  return raw as BumpType;
})();

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
function bump(current: string, type: BumpType): string {
  if (!/^\d+\.\d+\.\d+(-rc\.\d+)?$/.test(current)) {
    throw new Error(`Invalid version: "${current}"`);
  }
  const [base, pre] = current.split('-');
  const [major, minor, patch] = base.split('.').map(Number);

  if (type === 'rc') {
    if (pre?.startsWith('rc.')) {
      const n = parseInt(pre.split('.')[1], 10) + 1;
      return `${base}-rc.${n}`;
    }
    return `${base}-rc.1`;
  }
  if (type === 'major') return `${major + 1}.0.0`;
  if (type === 'minor') return `${major}.${minor + 1}.0`;
  // patch: if currently an rc, stripping -rc = patch graduation
  if (pre?.startsWith('rc.')) return base;
  return `${major}.${minor}.${patch + 1}`;
}

// ── Build target list from scope ─────────────────────────────────────────
function collectTargets(s: Scope): PlanTarget[] {
  const targets: PlanTarget[] = [];

  const addBase = () => {
    targets.push({ label: '@btech/tokens',   kind: 'web-base',     file: WEB_BASE_PKG });
    targets.push({ label: 'btech_tokens',    kind: 'flutter-base', file: FLUTTER_PUBSPEC });
  };
  const addTenant = (id: string) => {
    const p = resolve(WEB_PLATFORM_DIR, id, 'package.json');
    if (!existsSync(p)) {
      console.error(`❌  Unknown tenant: "${id}" (no ${p})`);
      process.exit(1);
    }
    targets.push({ label: `@btech/tokens-${id}`, kind: 'web-tenant', file: p, tenantId: id });
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

// ── Apply bump to a single target ────────────────────────────────────────
function applyBump(t: PlanTarget, type: BumpType, dryRun: boolean): { from: string; to: string } {
  if (t.kind === 'flutter-base') {
    const pubspec = readFileSync(t.file, 'utf8');
    const match = pubspec.match(/^version:\s*(.+)$/m);
    if (!match) throw new Error(`No version in ${t.file}`);
    const from = match[1].trim();
    const to = bump(from, type);
    if (!dryRun) {
      writeFileSync(t.file, pubspec.replace(/^version:\s*.+$/m, `version: ${to}`), 'utf8');
    }
    return { from, to };
  }

  const pkg = JSON.parse(readFileSync(t.file, 'utf8'));
  const from = pkg.version as string;
  const to   = bump(from, type);
  if (!dryRun) {
    pkg.version = to;
    writeFileSync(t.file, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  }
  return { from, to };
}

// ── Execute ──────────────────────────────────────────────────────────────
const plan: Plan = { bumpType, scope, targets: collectTargets(scope), dryRun: flagDryRun };

console.log(
  `\n📋  Plan — bump=${plan.bumpType} · scope=${scopeLabel(plan.scope)}` +
  (plan.dryRun ? ' · DRY-RUN' : '') +
  `\n    targets (${plan.targets.length}):`,
);

const results: { label: string; from: string; to: string }[] = [];
for (const t of plan.targets) {
  const r = applyBump(t, plan.bumpType, plan.dryRun);
  results.push({ label: t.label, ...r });
  const arrow = r.from === r.to ? '=' : '→';
  console.log(`      ${(r.from === r.to ? 'ℹ️ ' : '✅')} ${t.label.padEnd(28)} ${r.from} ${arrow} ${r.to}`);
}

// ── Summary ──────────────────────────────────────────────────────────────
const basePkgAfter = JSON.parse(readFileSync(WEB_BASE_PKG, 'utf8'));
console.log(
  `\n📦  Base @btech/tokens version: ${basePkgAfter.version}` +
  (plan.dryRun ? ' (unchanged — dry run)' : ''),
);

// Emit machine-readable block for CI consumption (auto-version.yml reads this).
console.log('\n---BUMP_RESULT_JSON---');
console.log(JSON.stringify({
  bumpType: plan.bumpType,
  scope: scopeLabel(plan.scope),
  baseVersion: basePkgAfter.version,
  changed: results.filter((r) => r.from !== r.to).map((r) => ({ pkg: r.label, from: r.from, to: r.to })),
}));
console.log('---END_BUMP_RESULT_JSON---');
