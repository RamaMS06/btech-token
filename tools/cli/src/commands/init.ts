import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { detectFramework } from '../detectors/framework.js';
import { configSchema, CONFIG_FILE } from '../schemas/config.js';
import type { BtechConfig, Framework } from '../schemas/config.js';

const REGISTRY_URL = 'https://buma-id.github.io/btech-registry';

export async function runInit(cwd: string): Promise<void> {
  console.log(pc.bold('\n  btech init\n'));

  const configPath = join(cwd, CONFIG_FILE);
  if (existsSync(configPath)) {
    console.log(pc.yellow(`  ${CONFIG_FILE} already exists. Run \`btech add\` to add components.`));
    return;
  }

  // Detect framework
  const detected = detectFramework(cwd);

  p.intro(pc.cyan('  Setting up btech for your project'));

  const framework = await p.select<Framework>({
    message: 'Which framework are you using?',
    options: [
      { value: 'vue',     label: 'Vue 3',   hint: detected === 'vue' ? 'detected' : '' },
      { value: 'react',   label: 'React',   hint: detected === 'react' ? 'detected' : '' },
      { value: 'flutter', label: 'Flutter', hint: detected === 'flutter' ? '→ use mason bricks instead (see docs)' : '' },
    ],
    initialValue: detected ?? 'vue',
  });

  if (p.isCancel(framework)) { p.cancel('Cancelled.'); process.exit(0); }

  if (framework === 'flutter') {
    p.note(
      [
        'Flutter components are distributed as mason bricks.',
        '',
        '  1. Install mason:  dart pub global activate mason_cli',
        `  2. Add a brick:    mason add btech_button`,
        '  3. Generate:       mason make btech_button',
        '',
        'See: https://brickhub.dev (search btech_)',
      ].join('\n'),
      'Flutter → mason bricks',
    );
    p.outro(pc.cyan('No config file needed for Flutter. Use mason directly.'));
    return;
  }

  const uiPath = await p.text({
    message: 'Where should components be installed?',
    placeholder: 'src/components/ui',
    defaultValue: 'src/components/ui',
  });

  if (p.isCancel(uiPath)) { p.cancel('Cancelled.'); process.exit(0); }

  const config: BtechConfig = configSchema.parse({
    framework,
    registry: REGISTRY_URL,
    tokens: '@btech/tokens',
    tsx: true,
    aliases: {
      components: '@/components',
      ui: `@/${uiPath as string}`.replace('src/', ''),
      lib: '@/lib',
      utils: '@/lib/utils',
    },
  });

  writeFileSync(
    configPath,
    JSON.stringify({ $schema: 'https://buma-id.github.io/btech-registry/schema/config.json', ...config }, null, 2),
    'utf-8',
  );

  p.log.success(`Created ${CONFIG_FILE}`);

  // Remind about token dep
  p.note(
    framework === 'vue'
      ? 'pnpm add @btech/tokens'
      : 'npm install @btech/tokens',
    'Add the token package if not already installed:',
  );

  p.outro(pc.cyan('  Done! Run `btech add button` to install your first component.'));
}
