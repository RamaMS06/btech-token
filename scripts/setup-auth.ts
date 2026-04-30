/**
 * setup-auth.ts
 *
 * One-command setup for Azure Artifacts `btech` feed authentication.
 * Writes (or updates) the `btech` auth block in ~/.npmrc so developers can
 * `pnpm install` / `pnpm add @btech/tokens@rc` without hitting 401s.
 *
 * Scope: this script manages the `btech` feed ONLY. Other feeds (e.g.
 * `buma-dev`) must be configured separately by each project that uses them.
 *
 * Usage:
 *   pnpm setup:auth
 *
 * Behaviour:
 *   1. Prompts for a Personal Access Token (PAT) with "Packaging: Read & Write".
 *      Get one at: https://buma.visualstudio.com/_usersSettings/tokens
 *   2. Validates the PAT against the feed metadata endpoint (401 = bad PAT).
 *   3. Base64-encodes the PAT and writes 6 .npmrc auth lines between the
 *      markers `; begin btech auth token` / `; end btech auth token`.
 *   4. Idempotent: re-running replaces the block in place (no duplicates).
 *   5. Never touches other blocks (e.g. `buma-dev`).
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { resolve } from 'path';
import { createInterface, Interface } from 'readline';
import { Writable } from 'stream';
import { request } from 'https';

const NPMRC_PATH         = resolve(homedir(), '.npmrc');
const BEGIN_MARKER       = '; begin btech auth token';
const END_MARKER         = '; end btech auth token';
const FEED_BASE          = 'buma.pkgs.visualstudio.com/_packaging/btech/npm';
const VALIDATE_URL       = `https://${FEED_BASE}/registry/@btech%2Ftokens`;
const PAT_DOCS_URL       = 'https://buma.visualstudio.com/_usersSettings/tokens';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Prompt for a secret from stdin with echo suppressed. */
function promptSecret(question: string): Promise<string> {
  return new Promise((res) => {
    const mutableOut = new Writable({
      write(_chunk, _enc, cb) { cb(); },
    });
    (mutableOut as Writable & { muted: boolean }).muted = false;

    const rl: Interface = createInterface({
      input: process.stdin,
      output: mutableOut,
      terminal: true,
    });

    process.stdout.write(question);
    (mutableOut as Writable & { muted: boolean }).muted = true;

    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      res(answer.trim());
    });
  });
}

/**
 * Validate the PAT by calling the feed metadata endpoint.
 * Azure Artifacts expects Basic auth with `base64("buma:<rawPat>")`.
 * The `_password` field in .npmrc is a separate base64 encoding of the PAT
 * used by the npm client — it's NOT the Basic auth header value.
 */
function validatePat(rawPat: string): Promise<{ ok: boolean; status: number }> {
  const basic = Buffer.from(`buma:${rawPat}`, 'utf8').toString('base64');
  return new Promise((res) => {
    const req = request(
      VALIDATE_URL,
      {
        method: 'GET',
        headers: { Authorization: `Basic ${basic}` },
      },
      (response) => {
        // Drain response to free the socket.
        response.resume();
        const status = response.statusCode ?? 0;
        // 200 = ok, 404 = auth ok but package not yet published (still valid)
        res({ ok: status === 200 || status === 404, status });
      },
    );
    req.on('error', () => res({ ok: false, status: 0 }));
    req.end();
  });
}

/** Build the 6-line .npmrc auth block for the btech feed. */
function buildAuthBlock(base64Pat: string): string {
  const emailLine = 'email=npm requires email to be set but doesn\'t use the value';
  return [
    BEGIN_MARKER,
    `//${FEED_BASE}/registry/:username=buma`,
    `//${FEED_BASE}/registry/:_password=${base64Pat}`,
    `//${FEED_BASE}/registry/:${emailLine}`,
    `//${FEED_BASE}/:username=buma`,
    `//${FEED_BASE}/:_password=${base64Pat}`,
    `//${FEED_BASE}/:${emailLine}`,
    END_MARKER,
  ].join('\n');
}

/**
 * Idempotently insert/replace the btech auth block in .npmrc.
 * All other content (including other feed blocks) is preserved exactly.
 */
function upsertAuthBlock(contents: string, newBlock: string): string {
  const beginIdx = contents.indexOf(BEGIN_MARKER);
  const endIdx   = contents.indexOf(END_MARKER);

  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    const before = contents.slice(0, beginIdx);
    const after  = contents.slice(endIdx + END_MARKER.length);
    return `${before.trimEnd()}\n\n${newBlock}${after}`;
  }

  // Append with spacing.
  const trimmed = contents.replace(/\s+$/, '');
  return `${trimmed}${trimmed ? '\n\n' : ''}${newBlock}\n`;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('┌───────────────────────────────────────────────────────────┐');
  console.log('│  BTech — Azure Artifacts `btech` feed auth setup          │');
  console.log('└───────────────────────────────────────────────────────────┘');
  console.log();
  console.log(`Generate a PAT (scope: Packaging Read & Write) at:`);
  console.log(`  ${PAT_DOCS_URL}`);
  console.log();

  const pat = await promptSecret('Paste PAT: ');
  if (!pat) {
    console.error('❌  Empty PAT — aborted.');
    process.exit(1);
  }

  console.log('🔎  Validating PAT against feed…');
  const { ok, status } = await validatePat(pat);
  if (!ok) {
    console.error(`❌  PAT validation failed (HTTP ${status || 'network error'}).`);
    console.error('    Check the scope (Packaging Read & Write) and try again.');
    process.exit(1);
  }
  console.log(`✅  PAT valid (HTTP ${status}).`);

  // The npm `_password` field is the PAT re-encoded as base64 (npm convention).
  const base64Pat = Buffer.from(pat, 'utf8').toString('base64');

  const existing = existsSync(NPMRC_PATH)
    ? readFileSync(NPMRC_PATH, 'utf8')
    : '';
  const replaced = existing.includes(BEGIN_MARKER);

  const block   = buildAuthBlock(base64Pat);
  const updated = upsertAuthBlock(existing, block);
  writeFileSync(NPMRC_PATH, updated, { mode: 0o600 });

  console.log();
  console.log(`✅  ${replaced ? 'Replaced' : 'Appended'} btech auth block in ${NPMRC_PATH}`);
  console.log();
  console.log('Next steps:');
  console.log('  pnpm install');
  console.log('  # or, in a sandbox folder:');
  console.log('  pnpm add @btech/tokens@rc');
}

main().catch((err) => {
  console.error('❌  Unexpected error:', err);
  process.exit(1);
});
