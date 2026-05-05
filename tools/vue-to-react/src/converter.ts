/**
 * Vue → React converter — Anthropic Claude Sonnet via prompt cache.
 *
 * Phase C: skeleton implementation. The actual `runConversion` is
 * gated behind `ANTHROPIC_API_KEY` env var. Without the key, the CLI
 * prints what would be sent and exits 0 (smoke-test friendly).
 *
 * Cache breakpoints (5-min TTL, 90% off on hit):
 *   1. STATIC_INSTRUCTIONS  (system.md)
 *   2. CONVENTIONS_DOC      (docs/architecture/component-conventions/react.md)
 *   3. FEW_SHOT_PAIRS       (avatar.vue ↔ avatar.tsx, future: badge, button)
 */
import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Resolve to package source dir whether running from `dist/` (built) or
// `src/` (tsx). Prompts + few-shot live in `src/` (not compiled).
const PACKAGE_ROOT = resolve(__dirname, __dirname.endsWith('dist') ? '..' : '..');
const SRC_DIR = resolve(PACKAGE_ROOT, 'src');

interface ConvertOptions {
  /** Path to the Vue SFC source file. */
  vueFilePath: string;
  /** Output directory (typically packages/ui/react/src/components/{layer}/{Name}/). */
  outputDir: string;
  /** When true, do not call Anthropic; print prompt + exit. */
  dryRun?: boolean;
}

interface ConversionOutput {
  files: Record<string, string>;
  notes: string[];
}

/** Read all cache-breakpoint sources from disk. */
async function loadCacheSources(): Promise<{
  systemPrompt: string;
  conventionsDoc: string;
  fewShotPairs: string;
}> {
  const promptDir = resolve(SRC_DIR, 'prompts');
  const fewShotDir = resolve(SRC_DIR, 'few-shot');
  const conventionsPath = resolve(
    PACKAGE_ROOT,
    '../../docs/architecture/component-conventions/react.md',
  );

  const [systemPrompt, conventionsDoc, vueExample, tsxExample] = await Promise.all([
    readFile(resolve(promptDir, 'system.md'), 'utf8'),
    readFile(conventionsPath, 'utf8'),
    readFile(resolve(fewShotDir, 'avatar.vue'), 'utf8'),
    readFile(resolve(fewShotDir, 'avatar.tsx'), 'utf8'),
  ]);

  const fewShotPairs = [
    '# Few-shot example: Avatar',
    '',
    '## Vue input',
    '```vue',
    vueExample,
    '```',
    '',
    '## Expected React output',
    '```tsx',
    tsxExample,
    '```',
  ].join('\n');

  return { systemPrompt, conventionsDoc, fewShotPairs };
}

export async function runConversion(opts: ConvertOptions): Promise<ConversionOutput | null> {
  const { vueFilePath, dryRun = false } = opts;
  const sources = await loadCacheSources();
  const vueSource = await readFile(vueFilePath, 'utf8');

  if (dryRun || !process.env.ANTHROPIC_API_KEY) {
    // Skeleton mode — print prompt + bail
    console.log('--- DRY RUN ---');
    console.log(`vueFilePath: ${vueFilePath}`);
    console.log(`outputDir:   ${opts.outputDir}`);
    console.log(`system prompt: ${sources.systemPrompt.length} chars`);
    console.log(`conventions:   ${sources.conventionsDoc.length} chars`);
    console.log(`few-shot:      ${sources.fewShotPairs.length} chars`);
    console.log(`vue source:    ${vueSource.length} chars`);
    if (!process.env.ANTHROPIC_API_KEY) {
      console.log('\n⚠ ANTHROPIC_API_KEY not set — set env var to run live conversion.');
    }
    return null;
  }

  const client = new Anthropic();
  // Cast cache_control: SDK type defs are sometimes behind the API.
  // Anthropic's prompt-caching API accepts cache_control on system text blocks.
  const systemBlocks = [
    { type: 'text', text: sources.systemPrompt, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: '## React conventions doc\n\n' + sources.conventionsDoc, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: sources.fewShotPairs, cache_control: { type: 'ephemeral' } },
  ] as unknown as Anthropic.TextBlockParam[];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 8192,
    system: systemBlocks,
    messages: [
      {
        role: 'user',
        content: `Convert this Vue SFC to React (output JSON only):\n\n\`\`\`vue\n${vueSource}\n\`\`\``,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Log cache stats for cost monitoring
  console.log(
    `Tokens: in=${response.usage.input_tokens}, ` +
      `cache_read=${(response.usage as unknown as { cache_read_input_tokens?: number }).cache_read_input_tokens ?? 0}, ` +
      `cache_create=${(response.usage as unknown as { cache_creation_input_tokens?: number }).cache_creation_input_tokens ?? 0}, ` +
      `out=${response.usage.output_tokens}`,
  );

  return JSON.parse(textBlock.text) as ConversionOutput;
}
