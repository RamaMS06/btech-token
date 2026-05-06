import { registryItemSchema, registryIndexSchema } from '../schemas/registry.js';
import type { RegistryItem, RegistryIndex } from '../schemas/registry.js';
import type { Framework } from '../schemas/config.js';

const cache = new Map<string, unknown>();

async function fetchJSON(url: string): Promise<unknown> {
  if (cache.has(url)) return cache.get(url);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Registry fetch failed: ${res.status} ${res.statusText} — ${url}`);
  }
  const data = await res.json();
  cache.set(url, data);
  return data;
}

export async function fetchRegistryIndex(
  registryUrl: string,
  framework: Framework,
): Promise<RegistryIndex> {
  const url = `${registryUrl}/r/registry.${framework}.json`;
  const data = await fetchJSON(url);
  return registryIndexSchema.parse(data);
}

export async function fetchRegistryItem(
  registryUrl: string,
  framework: Framework,
  name: string,
): Promise<RegistryItem> {
  const url = `${registryUrl}/r/${framework}/${name}.json`;
  const data = await fetchJSON(url);
  return registryItemSchema.parse(data);
}

export async function fetchRegistryItemByUrl(url: string): Promise<RegistryItem> {
  const data = await fetchJSON(url);
  return registryItemSchema.parse(data);
}
