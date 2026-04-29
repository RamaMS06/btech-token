import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { ROOT } from '../utils.js';

/**
 * Scaffolds a single tenant package skeleton if one doesn't exist.
 * Used by TENANT mode (--tenant flag) — BASE mode uses web-tenant-format.ts
 * which OVERWRITES with the authoritative shape on every regen.
 *
 * Shape mirrors web-tenant-format.ts: single-import re-export of @btech/tokens
 * with side-effect CSS. Consumers install only this package and import once.
 */
export function ensureTenantPackageJson(tenantId: string): void {
  const pkgDir  = `${ROOT}/platforms/web/${tenantId}`;
  const srcDir  = `${pkgDir}/src`;
  const distDir = `${pkgDir}/dist`;

  mkdirSync(pkgDir,  { recursive: true });
  mkdirSync(srcDir,  { recursive: true });
  mkdirSync(distDir, { recursive: true });

  const pkgJsonPath = `${pkgDir}/package.json`;
  if (!existsSync(pkgJsonPath)) {
    // Seed from the canonical platform version at the repo root rather than
    // the web base package — the root version is platform-agnostic and is
    // the single source of truth for "what version is this design system at".
    const rootPkgPath = `${ROOT}/../../package.json`; // packages/tokens/ → repo root
    const version: string = existsSync(rootPkgPath)
      ? JSON.parse(readFileSync(rootPkgPath, 'utf-8')).version ?? '1.0.0'
      : '1.0.0';

    const pkgJson = {
      name:        `@btech/tokens-${tenantId}`,
      version,
      description: `BTech design tokens for ${tenantId} — single-import superset of @btech/tokens`,
      main:    './dist/index.js',
      module:  './dist/index.mjs',
      types:   './dist/index.d.ts',
      exports: {
        '.': {
          types:   './dist/index.d.ts',
          import:  './dist/index.mjs',
          require: './dist/index.js',
        },
        './styles.css': './dist/styles.css',
      },
      sideEffects: ['./dist/styles.css', './dist/index.mjs', './dist/index.js'],
      files: ['dist'],
      scripts: {
        build: 'tsup --config tsup.config.ts',
        prepublishOnly: 'tsup --config tsup.config.ts',
      },
      // workspace:^ → resolves to the local @btech/tokens during dev; pnpm
      // publish replaces it with `^<resolved-version>` (== `>=X <X+1.0.0`).
      dependencies: {
        '@btech/tokens': 'workspace:^',
      },
      devDependencies: {
        tsup:       '^8.0.2',
        typescript: '^5.4.5',
      },
      publishConfig: {
        registry: 'https://buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/',
      },
    };
    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    console.log(`  Created platforms/web/${tenantId}/package.json`);
  }
}
