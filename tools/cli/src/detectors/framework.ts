import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Framework } from '../schemas/config.js';

export function detectFramework(cwd: string): Framework | null {
  // Flutter — pubspec.yaml presence
  if (existsSync(join(cwd, 'pubspec.yaml'))) {
    return 'flutter';
  }

  // Read package.json if it exists
  const pkgPath = join(cwd, 'package.json');
  if (!existsSync(pkgPath)) return null;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  if ('vue' in deps || '@vue/runtime-core' in deps) return 'vue';
  if ('react' in deps || 'react-dom' in deps) return 'react';

  return null;
}
