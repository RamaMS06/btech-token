import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { configSchema, CONFIG_FILE } from '../schemas/config.js';
import type { BtechConfig } from '../schemas/config.js';
import { resolveComponents } from '../registry/resolver.js';
import { writeWebComponents, installWebDeps } from '../writers/web.js';

interface AddOptions {
  overwrite?: boolean;
  dryRun?: boolean;
  cwd?: string;
}

export async function runAdd(components: string[], options: AddOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = join(cwd, CONFIG_FILE);

  // Load config
  if (!existsSync(configPath)) {
    console.error(pc.red(`\n  ✗ No ${CONFIG_FILE} found. Run \`btech init\` first.\n`));
    process.exit(1);
  }

  const raw = JSON.parse(readFileSync(configPath, 'utf-8'));
  const config: BtechConfig = configSchema.parse(raw);

  if (config.framework === 'flutter') {
    console.log(pc.yellow('\n  Flutter uses mason bricks — not this CLI.'));
    console.log(pc.dim('  Run: mason add btech_button && mason make btech_button\n'));
    process.exit(0);
  }

  if (components.length === 0) {
    console.error(pc.red('\n  ✗ No component name specified.\n  Usage: btech add <component> [...components]\n'));
    process.exit(1);
  }

  p.intro(pc.cyan(`  Adding ${components.join(', ')} to ${config.framework} project`));

  const spinner = p.spinner();
  spinner.start('Fetching component manifests from registry...');

  let items;
  try {
    items = await resolveComponents(components, config.registry, config.framework);
    spinner.stop(`Resolved ${items.length} component${items.length === 1 ? '' : 's'} (including dependencies)`);
  } catch (err) {
    spinner.stop(pc.red('Failed to fetch from registry'));
    console.error(pc.red(`\n  ✗ ${(err as Error).message}\n`));
    process.exit(1);
  }

  if (options.dryRun) {
    p.note(
      items.flatMap((i) => i.files.map((f) => f.target)).join('\n'),
      'Dry run — files that would be written:',
    );
    p.outro(pc.dim('  No files were written (dry run).'));
    return;
  }

  const { written, skipped } = await writeWebComponents(items, config, cwd, {
    overwrite: options.overwrite,
  });

  // Install npm dependencies
  if (written.length > 0) {
    await installWebDeps(items, cwd);
  }

  const summary: string[] = [];
  if (written.length > 0) summary.push(pc.green(`${written.length} file${written.length === 1 ? '' : 's'} written`));
  if (skipped.length > 0) summary.push(pc.yellow(`${skipped.length} skipped`));

  p.outro(pc.cyan(`  Done! ${summary.join(', ')}.`));
}
