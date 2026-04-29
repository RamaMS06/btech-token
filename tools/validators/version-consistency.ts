/**
 * version-consistency.ts
 *
 * Validates that every version-bearing package in the monorepo carries a
 * valid semver string. Version mismatches between packages and the repo root
 * are reported as warnings (not failures) to allow independent versioning —
 * each package may advance its own version counter without requiring a
 * coordinated bump across the whole monorepo.
 *
 * Hard failures (exit 1):
 *   - Root package.json is missing or has an invalid semver version.
 *   - Any package version string is not valid semver.
 *   - A read error prevents version extraction from a package file.
 *
 * Soft warnings (informational, exit 0):
 *   - A package version differs from the root version (major, minor, patch,
 *     or prerelease channel). This is expected when packages are versioned
 *     independently. The drift is logged so maintainers stay aware of it.
 *
 * Why the change:
 *   Independent versioning (introduced in the hybrid-semver model) means
 *   tenants and base packages may legitimately be at different versions.
 *   Blocking CI on a version difference would prevent any independent bump
 *   from landing. Structural integrity (valid semver, readable files) is
 *   still enforced strictly.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const ROOT_PKG = resolve(ROOT, 'package.json');

const WEB_BASE_PKG          = resolve(ROOT, 'packages/tokens/platforms/web/token/package.json');
const WEB_PLATFORM_DIR      = resolve(ROOT, 'packages/tokens/platforms/web');
const FLUTTER_PUBSPEC       = resolve(ROOT, 'packages/tokens/platforms/flutter/token/pubspec.yaml');
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

interface Failure {
  label:  string;
  file:   string;
  actual: string;
  reason: string;
}

interface Warning {
  label:  string;
  file:   string;
  actual: string;
  reason: string;
}

/**
 * Returns a human-readable description of any version drift relative to root,
 * or null if the package is on the same version. The result is a warning —
 * it does NOT cause a non-zero exit. Independent versioning means drift is
 * expected and intentional.
 */
function compare(rootSemver: ParsedSemver, target: ParsedSemver): string | null {
  if (rootSemver.major !== target.major) {
    return `major differs (root ${rootSemver.major}, package ${target.major})`;
  }
  if (rootSemver.minor !== target.minor) {
    return `minor differs (root ${rootSemver.minor}, package ${target.minor})`;
  }
  if (Boolean(rootSemver.prerelease) !== Boolean(target.prerelease)) {
    const rootCh = rootSemver.prerelease ? 'prerelease' : 'stable';
    const tgtCh  = target.prerelease ? 'prerelease' : 'stable';
    return `release channel differs (root is ${rootCh}, package is ${tgtCh})`;
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

  console.log(`🔍 Version report — root @ ${rootVersion}`);

  const targets = collectTargets();
  const failures: Failure[] = [];
  const warnings: Warning[] = [];

  for (const t of targets) {
    let actual: string;
    try {
      actual = t.read(t.file);
    } catch (e) {
      // Hard failure: we cannot read the version at all.
      failures.push({
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
      // Hard failure: the version string is structurally broken.
      failures.push({
        label: t.label,
        file:  t.file,
        actual,
        reason: `not valid semver — ${(e as Error).message}`,
      });
      console.log(`  ❌ ${t.label.padEnd(36)} ${actual} — invalid semver`);
      continue;
    }

    const drift = compare(rootSemver, parsed);
    if (drift) {
      // Soft warning: version differs from root. OK under independent versioning.
      warnings.push({ label: t.label, file: t.file, actual, reason: drift });
      console.log(`  ⚠️  ${t.label.padEnd(36)} ${actual} — ${drift}`);
    } else {
      console.log(`  ✅ ${t.label.padEnd(36)} ${actual}`);
    }
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} package(s) differ from root version (informational — independent versioning is allowed):`);
    for (const w of warnings) {
      const rel = w.file.replace(ROOT + '/', '');
      console.warn(`     ${rel}`);
      console.warn(`       ${w.label} = ${w.actual}`);
      console.warn(`       → ${w.reason}`);
    }
    console.warn(
      '\n   To align all packages: `pnpm bump set <version> --scope=all`',
    );
    console.warn(
      '   See docs/architecture/versioning.md for the independent-versioning model.\n',
    );
  }

  if (failures.length > 0) {
    console.error(`\n❌ ${failures.length} hard failure(s) — packages with unreadable or invalid semver versions:`);
    for (const f of failures) {
      const rel = f.file.replace(ROOT + '/', '');
      console.error(`     ${rel}`);
      console.error(`       ${f.label} = ${f.actual}`);
      console.error(`       → ${f.reason}`);
    }
    process.exit(1);
  }

  const ok = targets.length - warnings.length;
  console.log(
    `\n✅ All ${targets.length} package(s) have valid semver` +
    (warnings.length > 0 ? ` (${ok} match root, ${warnings.length} differ — see warnings above).` : '.'),
  );
}

main();
