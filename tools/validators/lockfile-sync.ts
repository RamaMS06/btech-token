/**
 * Lockfile sync validator
 * -----------------------
 * Fails CI if pnpm-lock.yaml is out of sync with any workspace
 * package.json — catching the class of bug where `pnpm generate`
 * regenerates a tenant package.json (e.g. peerDep bump) but the
 * lockfile refresh is forgotten.
 *
 * Why this exists:
 *   `pnpm install --frozen-lockfile` in the pipeline would also catch
 *   drift, but its error message points at the first file it finds and
 *   gives no overview. This validator enumerates every importer, lists
 *   all drifted specifiers, and tells the developer exactly what to
 *   run to fix it. Runs fast (no dep resolution — just YAML + JSON
 *   diff) so it can live at the top of `pnpm validate`.
 *
 * Scope: compares `dependencies`, `devDependencies`, `peerDependencies`
 * specifiers only. Transitive resolutions are validated separately by
 * the CI's `--frozen-lockfile` step.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LOCKFILE = resolve(ROOT, 'pnpm-lock.yaml');

type SpecMap = Record<string, string>;
type Importer = {
  path: string;
  dependencies?: SpecMap;
  devDependencies?: SpecMap;
  peerDependencies?: SpecMap;
};

// ── Minimal pnpm-lock.yaml parser ───────────────────────────────────────
// Avoids adding a `yaml` dependency — we only need the `importers:` block
// and its specifier fields. This is a narrow, line-based scan; if pnpm
// ever changes the lockfile format, the full parse lives in pnpm itself.
function parseLockfileImporters(source: string): Importer[] {
  const lines = source.split('\n');
  const importers: Importer[] = [];

  // Find start of importers: block
  let i = lines.findIndex((l) => l === 'importers:');
  if (i === -1) return [];
  i++;

  let current: Importer | null = null;
  let section: 'dependencies' | 'devDependencies' | 'peerDependencies' | null = null;
  let currentDep: string | null = null;

  const indentOf = (s: string) => s.length - s.trimStart().length;

  for (; i < lines.length; i++) {
    const raw = lines[i];
    if (raw === '' || raw.startsWith('#')) continue;

    const indent = indentOf(raw);
    const trimmed = raw.trim();

    // Top-level break (e.g. `packages:`) — end of importers section
    if (indent === 0) break;

    // 2-space indent → importer path (e.g. `  packages/tokens/.../token:`)
    if (indent === 2 && trimmed.endsWith(':')) {
      if (current) importers.push(current);
      current = { path: trimmed.slice(0, -1).replace(/^['"]|['"]$/g, '') };
      section = null;
      currentDep = null;
      continue;
    }

    if (!current) continue;

    // 4-space indent → section header
    if (indent === 4 && trimmed.endsWith(':')) {
      const name = trimmed.slice(0, -1);
      if (name === 'dependencies' || name === 'devDependencies' || name === 'peerDependencies') {
        section = name;
        current[section] = current[section] ?? {};
      } else {
        section = null;
      }
      currentDep = null;
      continue;
    }

    if (!section) continue;

    // 6-space indent → dependency name (e.g. `      '@btech/tokens':`)
    if (indent === 6 && trimmed.endsWith(':')) {
      currentDep = trimmed.slice(0, -1).replace(/^['"]|['"]$/g, '');
      continue;
    }

    // 8-space indent → `specifier: <value>`
    if (indent === 8 && currentDep && trimmed.startsWith('specifier:')) {
      const value = trimmed
        .slice('specifier:'.length)
        .trim()
        .replace(/^['"]|['"]$/g, '');
      current[section]![currentDep] = value;
    }
  }
  if (current) importers.push(current);
  return importers;
}

// ── Load lockfile ───────────────────────────────────────────────────────
if (!existsSync(LOCKFILE)) {
  console.error('❌ pnpm-lock.yaml not found at repo root.');
  process.exit(1);
}
const importers = parseLockfileImporters(readFileSync(LOCKFILE, 'utf-8'));

// ── Compare each importer's specifiers against its package.json ─────────
// With `autoInstallPeers: true` (our pnpm config), the lockfile hoists
// peerDependencies into `dependencies` of the importer. Comparing by
// section produces false positives. Instead we flatten every specifier
// per importer into a single `name → spec` map and compare those.
const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies'] as const;
type Drift = { importer: string; name: string; lockfile: string; pkgJson: string };
const drifts: Drift[] = [];

const flatten = (obj: Importer | Record<string, unknown>): SpecMap => {
  const out: SpecMap = {};
  for (const section of SECTIONS) {
    const specs = (obj as Record<string, SpecMap | undefined>)[section];
    if (!specs) continue;
    for (const [name, val] of Object.entries(specs)) {
      if (typeof val === 'string') out[name] = val;
    }
  }
  return out;
};

for (const imp of importers) {
  const pkgPath = imp.path === '.' ? join(ROOT, 'package.json') : join(ROOT, imp.path, 'package.json');
  if (!existsSync(pkgPath)) {
    console.error(`⚠︎  Lockfile references ${imp.path}/package.json but the file is missing.`);
    continue;
  }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const lockFlat = flatten(imp);
  const pkgFlat = flatten(pkg);

  const names = new Set([...Object.keys(lockFlat), ...Object.keys(pkgFlat)]);
  for (const name of names) {
    if (lockFlat[name] !== pkgFlat[name]) {
      drifts.push({
        importer: imp.path,
        name,
        lockfile: lockFlat[name] ?? '<missing>',
        pkgJson: pkgFlat[name] ?? '<missing>',
      });
    }
  }
}

// ── Report ──────────────────────────────────────────────────────────────
if (drifts.length === 0) {
  console.log(`✓ Lockfile in sync: ${importers.length} importer(s) checked.`);
  process.exit(0);
}

console.error('❌ pnpm-lock.yaml is out of sync with package.json:\n');
for (const d of drifts) {
  console.error(`  [${d.importer}] ${d.name}`);
  console.error(`    package.json: ${d.pkgJson}`);
  console.error(`    lockfile:     ${d.lockfile}`);
}
console.error('\nFix: run `pnpm install --lockfile-only` and commit the updated pnpm-lock.yaml.');
console.error('(This commonly happens right after `pnpm generate` regenerates a tenant peerDep.)');
process.exit(1);
