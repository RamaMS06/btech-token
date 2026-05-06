import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pc from 'picocolors';
import { configSchema, CONFIG_FILE } from '../schemas/config.js';

export function runInfo(cwd: string): void {
  const configPath = join(cwd, CONFIG_FILE);

  if (!existsSync(configPath)) {
    console.log(pc.yellow(`\n  No ${CONFIG_FILE} found in ${cwd}.\n  Run \`btech init\` to set up.\n`));
    return;
  }

  const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
  const config = configSchema.parse(raw);

  console.log(pc.bold('\n  btech project info\n'));
  console.log(`  Framework  ${pc.cyan(config.framework)}`);
  console.log(`  Registry   ${pc.cyan(config.registry)}`);
  console.log(`  Tokens     ${pc.cyan(config.tokens)}`);

  if (config.aliases) {
    console.log(`\n  Aliases:`);
    for (const [k, v] of Object.entries(config.aliases)) {
      console.log(`    ${k.padEnd(12)} ${pc.dim(v)}`);
    }
  }

  if (config.flutterBase) {
    console.log(`\n  Flutter base  ${pc.cyan(config.flutterBase)}`);
  }

  console.log();
}
