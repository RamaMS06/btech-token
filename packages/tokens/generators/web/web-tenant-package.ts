import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { ROOT } from '../utils.js';

/**
 * Creates a CSS-only package.json for a tenant package if one doesn't exist.
 * Used by TENANT mode (--tenant flag). BASE mode uses web-tenant-format.ts instead.
 */
export function ensureTenantPackageJson(tenantId: string): void {
  const pkgDir  = `${ROOT}/platforms/web/${tenantId}`;
  const distDir = `${pkgDir}/dist`;

  mkdirSync(pkgDir,  { recursive: true });
  mkdirSync(distDir, { recursive: true });

  const pkgJsonPath = `${pkgDir}/package.json`;
  if (!existsSync(pkgJsonPath)) {
    // Seed from the canonical platform version at the repo root rather than
    // the web base package — the root version is platform-agnostic and is
    // the single source of truth for "what version is this design system at".
    const rootPkgPath = `${ROOT}/../../package.json`; // packages/tokens/ → repo root
    const version = existsSync(rootPkgPath)
      ? JSON.parse(readFileSync(rootPkgPath, 'utf-8')).version ?? '1.0.0'
      : '1.0.0';

    const pkgJson = {
      name:        `@btech/tokens-${tenantId}`,
      version,
      description: `BTech design tokens for ${tenantId} — auto-generated, do not edit`,
      exports: {
        './styles.css': './dist/styles.css',
      },
      files: ['dist'],
      publishConfig: {
        registry: 'https://buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/',
      },
    };
    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    console.log(`  Created platforms/web/${tenantId}/package.json`);
  }
}
