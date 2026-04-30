/**
 * workspace-deps.ts
 *
 * Guards against accidentally pinning @btech/* deps in demo apps.
 * Demo apps (apps/demo-*) MUST consume design tokens via the pnpm workspace
 * protocol so local token changes are reflected instantly without re-publishing.
 *
 * Pinning to a published version (e.g. "1.0.0-rc.2") in a demo app breaks that
 * contract: Vite resolves the symlink to the registry tarball instead of the
 * local source, so CSS/JS changes go unseen until the package is re-published.
 *
 * Exits non-zero if any @btech/* dep in an apps/demo-* package.json is not
 * "workspace:*" (or "workspace:^" / "workspace:~").
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT     = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const APPS_DIR = resolve(ROOT, 'apps');
const DEMO_RX  = /^demo-/;
const BTECH_RX = /^@btech\//;
const OK_RX    = /^workspace:/;

type PkgJson = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

type Violation = {
  app:     string;
  depName: string;
  section: 'dependencies' | 'devDependencies' | 'peerDependencies';
  version: string;
};

function findDemoApps(): string[] {
  if (!existsSync(APPS_DIR)) return [];
  return readdirSync(APPS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && DEMO_RX.test(d.name))
    .map((d) => d.name);
}

function checkPkg(app: string): Violation[] {
  const pkgPath = resolve(APPS_DIR, app, 'package.json');
  if (!existsSync(pkgPath)) return [];

  const pkg: PkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const violations: Violation[] = [];

  const sections: Array<Violation['section']> = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ];

  for (const section of sections) {
    const deps = pkg[section];
    if (!deps) continue;
    for (const [depName, version] of Object.entries(deps)) {
      if (BTECH_RX.test(depName) && !OK_RX.test(version)) {
        violations.push({ app, depName, section, version });
      }
    }
  }

  return violations;
}

function main(): void {
  const demos = findDemoApps();
  if (demos.length === 0) {
    console.log('ℹ️   No demo apps found under apps/demo-* — skipping.');
    return;
  }

  console.log(`🔍 Workspace-deps validation — ${demos.length} demo app(s):`);
  const all: Violation[] = [];
  for (const app of demos) {
    const v = checkPkg(app);
    if (v.length === 0) {
      console.log(`  ✅ apps/${app}: all @btech/* deps use workspace: protocol`);
    } else {
      console.log(`  ❌ apps/${app}: ${v.length} violation(s)`);
    }
    all.push(...v);
  }

  if (all.length === 0) {
    console.log('\n✅ All demo apps consume @btech/* via workspace protocol.');
    return;
  }

  console.error('\n❌ Demo apps must consume @btech/* via workspace: protocol.');
  console.error('   Pinning a published version breaks instant local token feedback.\n');
  console.error('   Violations:');
  for (const v of all) {
    console.error(
      `     apps/${v.app}/package.json › ${v.section}["${v.depName}"] = "${v.version}"`,
    );
    console.error(`       → change to "workspace:*"`);
  }
  console.error('');
  process.exit(1);
}

main();
