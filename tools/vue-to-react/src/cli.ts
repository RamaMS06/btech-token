#!/usr/bin/env node
/**
 * vue-to-react CLI — convert a Vue SFC to React via Claude Sonnet.
 *
 * Usage:
 *   vue-to-react <vue-file-path> [--out <dir>] [--dry-run]
 *
 * Without ANTHROPIC_API_KEY env var, runs in dry-run mode (prints prompt
 * sizes and exits without calling the API).
 */
import { runConversion } from './converter.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';

interface Args {
  vueFilePath: string;
  outputDir: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: vue-to-react <vue-file-path> [--out <dir>] [--dry-run]

Examples:
  vue-to-react packages/ui/vue/src/components/molecules/Avatar/BTAvatar.vue
  vue-to-react path/to/Foo.vue --out packages/ui/react/src/components/molecules/Foo
  vue-to-react path/to/Foo.vue --dry-run`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const vueFilePath = resolve(args[0]!);
  const dryRun = args.includes('--dry-run');
  const outIdx = args.indexOf('--out');
  const outputDir =
    outIdx >= 0 && args[outIdx + 1]
      ? resolve(args[outIdx + 1]!)
      : resolve(dirname(vueFilePath).replace('/vue/', '/react/'));

  return { vueFilePath, outputDir, dryRun };
}

async function main(): Promise<void> {
  const { vueFilePath, outputDir, dryRun } = parseArgs(process.argv);

  const result = await runConversion({ vueFilePath, outputDir, dryRun });

  if (result === null) {
    // Dry run or no API key — already logged
    return;
  }

  await mkdir(outputDir, { recursive: true });
  for (const [filename, content] of Object.entries(result.files)) {
    const filePath = resolve(outputDir, filename);
    await writeFile(filePath, content, 'utf8');
    console.log(`✓ wrote ${filePath}`);
  }

  if (result.notes.length > 0) {
    console.log('\nNotes from converter:');
    for (const note of result.notes) console.log(`  - ${note}`);
  }

  console.log(`\nDone. Run 'tsc --noEmit --project ${outputDir}' to verify.`);
  void basename;
}

main().catch((err: unknown) => {
  console.error('vue-to-react failed:', err);
  process.exit(1);
});
