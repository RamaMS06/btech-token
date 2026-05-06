import { Command } from 'commander';
import { runInit } from './commands/init.js';
import { runAdd } from './commands/add.js';
import { runList } from './commands/list.js';
import { runInfo } from './commands/info.js';

const program = new Command();

program
  .name('btech')
  .description('shadcn-style CLI to add btech UI components into your project')
  .version('0.1.0');

// ── init ────────────────────────────────────────────────────────────────────
program
  .command('init')
  .description('Set up btech in your project (creates btech.config.json)')
  .option('--cwd <path>', 'Working directory', process.cwd())
  .action(async (opts: { cwd: string }) => {
    await runInit(opts.cwd);
  });

// ── add ─────────────────────────────────────────────────────────────────────
program
  .command('add')
  .description('Add one or more components to your project')
  .argument('<components...>', 'Component name(s) to add, e.g. button tooltip')
  .option('--overwrite', 'Overwrite existing files without asking', false)
  .option('--dry-run', 'Preview files that would be written without writing them', false)
  .option('--cwd <path>', 'Working directory', process.cwd())
  .action(async (components: string[], opts: { overwrite: boolean; dryRun: boolean; cwd: string }) => {
    await runAdd(components, {
      overwrite: opts.overwrite,
      dryRun: opts.dryRun,
      cwd: opts.cwd,
    });
  });

// ── list ─────────────────────────────────────────────────────────────────────
program
  .command('list')
  .description('List all available components in the registry')
  .option('--framework <framework>', 'Framework override: vue | react | flutter')
  .option('--cwd <path>', 'Working directory', process.cwd())
  .action(async (opts: { framework?: string; cwd: string }) => {
    await runList(opts.cwd, opts.framework);
  });

// ── info ─────────────────────────────────────────────────────────────────────
program
  .command('info')
  .description('Show project configuration')
  .option('--cwd <path>', 'Working directory', process.cwd())
  .action((opts: { cwd: string }) => {
    runInfo(opts.cwd);
  });

program.parse();
