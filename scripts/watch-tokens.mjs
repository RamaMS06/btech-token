#!/usr/bin/env node
/**
 * watch-tokens.mjs
 *
 * Watches tokens/ and packages/tokens/sd.config.ts.
 * Re-runs the token generator whenever a file changes.
 *
 * Usage:  pnpm tokens:watch
 */

import { watch } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const WATCH_DIRS = [
  resolve(ROOT, 'packages/tokens/sources'),
  resolve(ROOT, 'packages/tokens/sd.config.ts'),
];

let debounceTimer = null;
let running = false;

function generate(changedFile) {
  if (running) return;
  running = true;

  const rel = changedFile.replace(ROOT + '/', '');
  console.log(`\n📁  Changed: ${rel}`);
  console.log('🔄  Regenerating packages...\n');

  const proc = spawn('pnpm', ['exec', 'tsx', 'packages/tokens/sd.config.ts'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  });

  proc.on('close', (code) => {
    running = false;
    if (code === 0) {
      console.log('\n👀  Watching for changes...');
    } else {
      console.error(`\n❌  Generator exited with code ${code} — fix the error and save again.`);
    }
  });
}

for (const target of WATCH_DIRS) {
  watch(target, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    // Ignore non-source files
    if (filename.endsWith('.dart') || filename.includes('node_modules')) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      generate(resolve(target, filename));
    }, 200); // 200ms debounce — coalesces rapid saves
  });
}

console.log('👀  Watching tokens/ and packages/tokens/sd.config.ts...');
console.log('    Edit any file in tokens/ to trigger generation.\n');
