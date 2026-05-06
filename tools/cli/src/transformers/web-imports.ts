import type { BtechConfig } from '../schemas/config.js';

/**
 * Rewrites registry-standard import aliases to the user's configured aliases.
 *
 * Registry files use canonical paths like:
 *   import { ... } from '@btech/tokens'   ← stays as-is (real npm dep)
 *   import './BTButton.css'               ← relative, stays as-is
 *
 * If the user's config has non-standard aliases, rewrite them.
 */
export function transformWebImports(content: string, _config: BtechConfig): string {
  // Currently we keep imports as-is — @btech/tokens is the real dep.
  // Future: if the user's aliases differ, apply find-replace here.
  return content;
}

/**
 * Resolve the target path from a registry @-placeholder to an absolute path.
 *
 * Registry target format:  "@ui/Button/BTButton.vue"
 * Resolves using aliases from config:  "src/components/ui/Button/BTButton.vue"
 */
export function resolveTargetPath(
  target: string,
  config: BtechConfig,
  cwd: string,
): string {
  const { join } = require('node:path');
  const aliases = config.aliases ?? {
    components: '@/components',
    ui: '@/components/ui',
    lib: '@/lib',
    utils: '@/lib/utils',
  };

  // Map @ui/ → src/components/ui/ (strip the alias prefix and resolve)
  const aliasMap: Record<string, string> = {
    '@ui/': stripAtPrefix(aliases.ui) + '/',
    '@components/': stripAtPrefix(aliases.components) + '/',
    '@lib/': stripAtPrefix(aliases.lib) + '/',
    '@hooks/': 'src/composables/',
  };

  for (const [prefix, resolved] of Object.entries(aliasMap)) {
    if (target.startsWith(prefix)) {
      return join(cwd, target.replace(prefix, resolved));
    }
  }

  // Fallback: treat as relative to src/
  return join(cwd, 'src', target);
}

function stripAtPrefix(alias: string): string {
  // "@/components/ui" → "src/components/ui"
  return alias.replace(/^@\//, 'src/');
}
