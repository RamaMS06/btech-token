/**
 * version-consistency.ts
 *
 * Asserts the coordinated-major/minor invariant that bump-version.ts is
 * supposed to maintain:
 *
 *   For every version-bearing package in the monorepo (web base + tenants,
 *   flutter base + tenants, python base + tenants), the package's
 *   <major>.<minor>.<prerelease-tag> MUST match the canonical platform
 *   version recorded in the repo-root /package.json.
 *
 * The patch component is intentionally NOT compared — tenants advance their
 * own patch counters independently between major/minor releases.
 *
 * Why this validator exists:
 *   `bump-version.ts` enforces this invariant on every bump. If a developer
 *   hand-edits a version, or if a future refactor introduces a code path
 *   that skips the reset rule, this validator catches the drift before
 *   anything reaches the registry. Treat a non-zero exit here as an
 *   architectural integrity failure — silently publishing an out-of-band
 *   tenant would corrupt the platform version contract.
 *
 * Exits non-zero on any major/minor/prerelease-channel mismatch.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ROOT_PKG = resolve(ROOT, 'package.json');

const WEB_BASE_PKG          = resolve(ROOT, 'packages/tokens/platforms/web/token/package.json');
const WEB_PLATFORM_DIR      = resolve(ROOT, 'packages/tokens/platforms/web');
const FLUTTER_PUBSPEC       = resolve(ROOT, 'packages/tokens/platforms/flutter/token/pubspec.yaml');
const FLUTTER_PLATFORM_DIR  = resolve(ROOT, 'packages/tokens/platforms/flutter');
const PYTHON_BASE_PYPROJECT = resolve(ROOT, 'packages/tokens/platforms/python/token/pyproject.toml');
const PYTHON_TENANTS_DIR    = resolve(ROOT, 'packages/tokens/platforms/python/tenants');

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

interface Target {
  label: string;
  file:  string;
  read:  (path: string) => string;
}

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

const readPkgJson = (path: string): string => {
  const v = JSON.parse(readFileSync(path, 'utf8')).version;
  if (typeof v !== 'string') throw new Error(`No version in ${path}`);
  return v;
};

const readPubspec = (path: string): string => {
  const m = readFileSync(path, 'utf8').match(/^version:\s*(.+)$/m);
  if (!m) throw new Error(`No version in ${path}`);
  return m[1].trim();
};

const readPyproject = (path: string): string => {
  const m = readFileSync(path, 'utf8').match(/^version = "([^"]+)"/m);
  if (!m) throw new Error(`No [project] version in ${path}`);
  return m[1];
};

function collectTargets(): Target[] {
  const targets: Target[] = [];

  if (existsSync(WEB_BASE_PKG)) {
    targets.push({ label: '@btech/tokens', file: WEB_BASE_PKG, read: readPkgJson });
  }
  if (existsSync(FLUTTER_PUBSPEC)) {
    targets.push({ label: 'btech_tokens (flutter)', file: FLUTTER_PUBSPEC, read: readPubspec });
  }
  if (existsSync(PYTHON_BASE_PYPROJECT)) {
    targets.push({ label: 'btech-tokens (python)', file: PYTHON_BASE_PYPROJECT, read: readPyproject });
  }

  // Web tenants — every directory under platforms/web/ except `token` that
  // carries a package.json.
  if (existsSync(WEB_PLATFORM_DIR)) {
    for (const entry of readdirSync(WEB_PLATFORM_DIR)) {
      if (entry === 'token') continue;
      const pkg = resolve(WEB_PLATFORM_DIR, entry, 'package.json');
      if (existsSync(pkg)) {
        targets.push({ label: `@btech/tokens-${entry}`, file: pkg, read: readPkgJson });
      }
    }
  }

  // Flutter tenants — every directory under platforms/flutter/ except
  // `token` that carries a pubspec.yaml. Mirrors the web-tenants block so
  // a tenant package drifting on the flutter side (e.g. a missed bump
  // leaving btech_tokens_<id> behind on rc.8 while root moved to rc.9)
  // is caught before publish, not after consumers report the mismatch.
  if (existsSync(FLUTTER_PLATFORM_DIR)) {
    for (const entry of readdirSync(FLUTTER_PLATFORM_DIR)) {
      if (entry === 'token') continue;
      const pubspec = resolve(FLUTTER_PLATFORM_DIR, entry, 'pubspec.yaml');
      if (existsSync(pubspec)) {
        targets.push({ label: `btech_tokens_${entry} (flutter)`, file: pubspec, read: readPubspec });
      }
    }
  }

  // Python tenants — every directory under platforms/python/tenants/ that
  // carries a pyproject.toml.
  if (existsSync(PYTHON_TENANTS_DIR)) {
    for (const entry of readdirSync(PYTHON_TENANTS_DIR)) {
      const py = resolve(PYTHON_TENANTS_DIR, entry, 'pyproject.toml');
      if (existsSync(py)) {
        targets.push({ label: `btech-tokens-${entry} (python)`, file: py, read: readPyproject });
      }
    }
  }

  return targets;
}

interface Violation {
  label:  string;
  file:   string;
  actual: string;
  reason: string;
}

function compare(rootSemver: ParsedSemver, target: ParsedSemver): string | null {
  if (rootSemver.major !== target.major) {
    return `major mismatch (root ${rootSemver.major}, package ${target.major})`;
  }
  if (rootSemver.minor !== target.minor) {
    return `minor mismatch (root ${rootSemver.minor}, package ${target.minor})`;
  }
  // Channel boundary: both must have a prerelease, or neither. We don't
  // require the prerelease *value* to match — a tenant on `rc.4` is fine
  // when root is on `rc.3` (tenant patched its own counter). What we DON'T
  // tolerate is a tenant graduating to stable while root is still on rc,
  // or vice versa, because that's a release-channel boundary.
  if (Boolean(rootSemver.prerelease) !== Boolean(target.prerelease)) {
    const rootCh = rootSemver.prerelease ? 'prerelease' : 'stable';
    const tgtCh  = target.prerelease ? 'prerelease' : 'stable';
    return `release channel mismatch (root is ${rootCh}, package is ${tgtCh})`;
  }
  return null;
}

function main(): void {
  if (!existsSync(ROOT_PKG)) {
    console.error(`❌ Root package.json not found at ${ROOT_PKG}`);
    process.exit(1);
  }

  const rootVersion = readPkgJson(ROOT_PKG);
  let rootSemver: ParsedSemver;
  try {
    rootSemver = parseSemver(rootVersion);
  } catch (e) {
    console.error(`❌ Root version "${rootVersion}" is not valid semver: ${(e as Error).message}`);
    process.exit(1);
  }

  console.log(`🔍 Version-consistency validation — root @ ${rootVersion}`);

  const targets = collectTargets();
  const violations: Violation[] = [];

  for (const t of targets) {
    let actual: string;
    try {
      actual = t.read(t.file);
    } catch (e) {
      violations.push({
        label: t.label,
        file:  t.file,
        actual: '?',
        reason: `read failed — ${(e as Error).message}`,
      });
      console.log(`  ❌ ${t.label.padEnd(36)} — could not read version`);
      continue;
    }

    let parsed: ParsedSemver;
    try {
      parsed = parseSemver(actual);
    } catch (e) {
      violations.push({
        label: t.label,
        file:  t.file,
        actual,
        reason: `not valid semver — ${(e as Error).message}`,
      });
      console.log(`  ❌ ${t.label.padEnd(36)} ${actual} — invalid semver`);
      continue;
    }

    const reason = compare(rootSemver, parsed);
    if (reason) {
      violations.push({ label: t.label, file: t.file, actual, reason });
      console.log(`  ❌ ${t.label.padEnd(36)} ${actual} — ${reason}`);
    } else {
      console.log(`  ✅ ${t.label.padEnd(36)} ${actual}`);
    }
  }

  if (violations.length === 0) {
    console.log(`\n✅ All ${targets.length} package(s) consistent with root ${rootVersion}.`);
    return;
  }

  console.error(`\n❌ ${violations.length} version-consistency violation(s):`);
  for (const v of violations) {
    const rel = v.file.replace(ROOT + '/', '');
    console.error(`     ${rel}`);
    console.error(`       ${v.label} = ${v.actual}`);
    console.error(`       → ${v.reason}`);
  }
  console.error(
    '\n   Fix with `pnpm bump set <root-version> --scope=all` or hand-edit the offending file.',
  );
  console.error(
    '   See docs/architecture/versioning.md (reset rule) for the invariant.\n',
  );
  process.exit(1);
}

main();
