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
    // Read version from base package to stay in sync
    const basePkgPath = `${ROOT}/platforms/web/token/package.json`;
    const version = existsSync(basePkgPath)
      ? JSON.parse(readFileSync(basePkgPath, 'utf-8')).version ?? '1.0.0'
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
