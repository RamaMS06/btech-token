import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import fs from 'fs-extra';
import pc from 'picocolors';
import { createPatch } from 'diff';
import type { RegistryItem } from '../schemas/registry.js';
import type { BtechConfig } from '../schemas/config.js';
import { resolveTargetPath } from '../transformers/web-imports.js';

export interface WriteResult {
  written: string[];
  skipped: string[];
}

export async function writeWebComponent(
  item: RegistryItem,
  config: BtechConfig,
  cwd: string,
  options: { overwrite?: boolean; dryRun?: boolean } = {},
): Promise<WriteResult> {
  const written: string[] = [];
  const skipped: string[] = [];

  for (const file of item.files) {
    const targetPath = resolveTargetPath(file.target, config, cwd);
    const relativePath = targetPath.replace(cwd + '/', '');

    if (existsSync(targetPath) && !options.overwrite) {
      // Show diff
      const existing = readFileSync(targetPath, 'utf-8');
      if (existing === file.content) {
        console.log(pc.dim(`  ↓ unchanged  ${relativePath}`));
        skipped.push(relativePath);
        continue;
      }
      const patch = createPatch(relativePath, existing, file.content, 'existing', 'new');
      console.log(pc.yellow(`  ~ conflict   ${relativePath}`));
      console.log(pc.dim(patch.split('\n').slice(0, 20).join('\n')));
      console.log(pc.dim('  (use --overwrite to replace)'));
      skipped.push(relativePath);
      continue;
    }

    if (!options.dryRun) {
      await fs.ensureDir(dirname(targetPath));
      await fs.writeFile(targetPath, file.content, 'utf-8');
    }

    console.log(pc.green(`  ✓ wrote      ${relativePath}`));
    written.push(relativePath);
  }

  return { written, skipped };
}

export async function writeWebComponents(
  items: RegistryItem[],
  config: BtechConfig,
  cwd: string,
  options: { overwrite?: boolean; dryRun?: boolean } = {},
): Promise<WriteResult> {
  const allWritten: string[] = [];
  const allSkipped: string[] = [];

  for (const item of items) {
    console.log(pc.cyan(`\n  → ${item.title}`));
    const { written, skipped } = await writeWebComponent(item, config, cwd, options);
    allWritten.push(...written);
    allSkipped.push(...skipped);
  }

  return { written: allWritten, skipped: allSkipped };
}

/**
 * Install npm dependencies declared in registry items.
 * Uses the package manager detected from the project (pnpm > yarn > npm).
 */
export async function installWebDeps(
  items: RegistryItem[],
  cwd: string,
): Promise<void> {
  const deps = new Set<string>();
  const devDeps = new Set<string>();

  for (const item of items) {
    item.dependencies.forEach((d) => deps.add(d));
    item.devDependencies.forEach((d) => devDeps.add(d));
  }

  // Remove already-satisfied deps (btech_tokens is always pre-installed)
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const installed = new Set([
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]);
    installed.forEach((d) => { deps.delete(d); devDeps.delete(d); });
  }

  if (deps.size === 0 && devDeps.size === 0) return;

  const { execa } = await import('execa');
  const pm = detectPackageManager(cwd);

  if (deps.size > 0) {
    console.log(pc.cyan(`\n  Installing ${[...deps].join(', ')}...`));
    await execa(pm, [pm === 'npm' ? 'install' : 'add', ...[...deps]], { cwd, stdio: 'inherit' });
  }
  if (devDeps.size > 0) {
    console.log(pc.cyan(`\n  Installing dev deps ${[...devDeps].join(', ')}...`));
    await execa(pm, [pm === 'npm' ? 'install' : 'add', '-D', ...[...devDeps]], { cwd, stdio: 'inherit' });
  }
}

function detectPackageManager(cwd: string): 'pnpm' | 'yarn' | 'npm' {
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  return 'npm';
}
