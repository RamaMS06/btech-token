import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pc from 'picocolors';
import { configSchema, CONFIG_FILE } from '../schemas/config.js';
import { fetchRegistryIndex } from '../registry/fetcher.js';
import type { Framework } from '../schemas/config.js';

export async function runList(cwd: string, frameworkOverride?: string): Promise<void> {
  let framework: Framework;
  let registryUrl = 'https://buma-id.github.io/btech-registry';

  const configPath = join(cwd, CONFIG_FILE);
  if (existsSync(configPath)) {
    const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
    const config = configSchema.parse(raw);
    framework = config.framework;
    registryUrl = config.registry;
  } else if (frameworkOverride) {
    framework = frameworkOverride as Framework;
  } else {
    console.error(pc.red('\n  ✗ No btech.config.json. Run `btech init` or pass --framework vue|react|flutter.\n'));
    process.exit(1);
  }

  try {
    const index = await fetchRegistryIndex(registryUrl, framework);
    const byCategory = new Map<string, typeof index.items>();

    for (const item of index.items) {
      const cat = item.category;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push(item);
    }

    console.log(pc.bold(`\n  btech components — ${framework} (${index.items.length} total)\n`));

    for (const [cat, items] of byCategory) {
      console.log(pc.cyan(`  ${cat}`));
      for (const item of items) {
        console.log(`    ${pc.bold(item.name.padEnd(24))} ${pc.dim(item.description)}`);
      }
      console.log();
    }
  } catch (err) {
    console.error(pc.red(`\n  ✗ ${(err as Error).message}\n`));
    process.exit(1);
  }
}
