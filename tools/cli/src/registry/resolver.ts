import { fetchRegistryItem } from './fetcher.js';
import type { RegistryItem } from '../schemas/registry.js';
import type { Framework } from '../schemas/config.js';

/**
 * Recursively resolve a component and all its registryDependencies.
 * Returns a flat array in dependency-first order (no duplicates).
 */
export async function resolveComponents(
  names: string[],
  registryUrl: string,
  framework: Framework,
): Promise<RegistryItem[]> {
  const resolved = new Map<string, RegistryItem>();

  async function resolve(name: string): Promise<void> {
    if (resolved.has(name)) return;

    const item = await fetchRegistryItem(registryUrl, framework, name);
    // Resolve deps first so they're written before the component
    for (const dep of item.registryDependencies) {
      await resolve(dep);
    }
    resolved.set(name, item);
  }

  for (const name of names) {
    await resolve(name);
  }

  return Array.from(resolved.values());
}
