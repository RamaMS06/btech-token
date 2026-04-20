import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { ROOT } from '../utils.js';

/**
 * Creates packages/tokens-{tenantId}/package.json if it doesn't exist.
 * Also creates a minimal src/index.ts that re-exports from the base package.
 */
export function ensureTenantPackageJson(tenantId: string): void {
  // ROOT = packages/tokens/ → go up two levels to monorepo root
  const MONOREPO_ROOT = resolve(ROOT, '../..');
  const pkgDir  = resolve(MONOREPO_ROOT, 'packages', `tokens-${tenantId}`);
  const srcDir  = resolve(pkgDir, 'src');
  const distDir = resolve(pkgDir, 'dist');

  mkdirSync(pkgDir,  { recursive: true });
  mkdirSync(srcDir,  { recursive: true });
  mkdirSync(distDir, { recursive: true });

  const pkgJsonPath = resolve(pkgDir, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    const pkgJson = {
      name: `@btech/tokens-${tenantId}`,
      version: '1.0.0',
      description: `BTech design tokens for ${tenantId} tenant`,
      main: './dist/index.js',
      module: './dist/index.mjs',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types:   './dist/index.d.ts',
          import:  './dist/index.mjs',
          require: './dist/index.js',
        },
        './styles.css': './dist/styles.css',
      },
      scripts: {
        build: 'tsup src/index.ts --format cjs,esm --dts',
      },
      dependencies: {
        '@btech/tokens': 'workspace:*',
      },
      devDependencies: {
        tsup:       '^8.0.2',
        typescript: '^5.4.5',
      },
      publishConfig: {
        registry:
          'https://buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/',
      },
    };
    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    console.log(`  Created packages/tokens-${tenantId}/package.json`);
  }

  // Create src/index.ts — re-exports everything from base @btech/tokens
  const indexPath = resolve(srcDir, 'index.ts');
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      [
        `// AUTO-GENERATED — re-exports base @btech/tokens for ${tenantId} tenant.`,
        `// Import styles.css from this package to apply ${tenantId}'s token values to :root.`,
        `export * from '@btech/tokens';`,
        '',
      ].join('\n'),
    );
    console.log(`  Created packages/tokens-${tenantId}/src/index.ts`);
  }
}
