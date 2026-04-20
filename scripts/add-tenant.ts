/**
 * Interactive CLI to scaffold a new tenant.
 *
 * Produces two outputs:
 *   1. packages/tokens/sources/tenants/{id}/overrides.json  — synced into btech-ds
 *   2. /tmp/btech-ds-{id}/                                  — full tenant repo scaffold
 *        ├── overrides.json
 *        ├── token.schema.json
 *        ├── azure-pipelines.yml
 *        └── README.md
 *
 * Usage: pnpm add-tenant
 */
import { createInterface } from 'readline';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise(res => rl.question(question, res));
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
}

async function askHex(prompt: string, allowEmpty = false): Promise<string> {
  while (true) {
    const raw = (await ask(prompt)).trim();
    if (allowEmpty && raw === '') return '';
    if (isValidHex(raw)) return raw;
    console.log('  ⚠️  Must be a hex color like #003D7C or #RGB. Try again.');
  }
}

async function askPx(prompt: string, allowEmpty = false): Promise<string> {
  while (true) {
    const raw = (await ask(prompt)).trim();
    if (allowEmpty && raw === '') return '';
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n >= 0) return `${n}px`;
    console.log('  ⚠️  Must be a non-negative integer (e.g. 6). Try again.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🎨  Add a new BTech tenant\n');

  // ── Tenant ID ──────────────────────────────────────────────────────────────
  const rawId = await ask('Tenant ID (slug, e.g. bspace): ');
  const tenantId = slugify(rawId.trim());

  if (!tenantId) {
    console.error('❌  Invalid tenant ID');
    process.exit(1);
  }
  if (tenantId.length > 20) {
    console.error('❌  Tenant ID must be 20 chars or fewer');
    process.exit(1);
  }

  const internalDir = resolve(ROOT, 'packages', 'tokens', 'sources', 'tenants', tenantId);
  if (existsSync(internalDir)) {
    console.error(`❌  Tenant "${tenantId}" already exists at ${internalDir}`);
    process.exit(1);
  }

  console.log('\n── Brand colors ──────────────────────────────────────────────────────');

  // ── Colors ─────────────────────────────────────────────────────────────────
  const primaryColor  = await askHex('Primary background color (hex, e.g. #0066CC): ');
  const hoverColor    = await askHex('Primary hover color (hex, leave blank to auto-darken): ', true);
  const strokeColor   = await askHex('Primary stroke/border color (hex, leave blank = same as primary): ', true);
  const textOnPrimary = await askHex('Text color on primary background (hex, e.g. #FFFFFF): ');

  console.log('\n── Typography ────────────────────────────────────────────────────────');
  const fontFamily = (await ask('Font family (e.g. "Inter, system-ui", leave blank = keep default): ')).trim();

  console.log('\n── Radius ────────────────────────────────────────────────────────────');
  const interactiveRadius = await askPx('Interactive element radius in px (e.g. 6, leave blank = keep default): ', true);
  const cardRadius        = await askPx('Card radius in px (e.g. 8, leave blank = keep default): ', true);

  rl.close();

  // ── Derive defaults ────────────────────────────────────────────────────────
  const resolvedHover   = hoverColor  || primaryColor;
  const resolvedStroke  = strokeColor || primaryColor;

  // ── Build overrides.json ───────────────────────────────────────────────────
  const overrides: Record<string, unknown> = {
    $description: `${tenantId} tenant — official brand configuration`,
    color: {
      background: {
        primary: {
          default: { $value: primaryColor,   $type: 'color' },
          hover:   { $value: resolvedHover,   $type: 'color' },
        },
      },
      stroke: {
        primary: {
          default: { $value: resolvedStroke, $type: 'color' },
        },
      },
      text: {
        primary: {
          default: { $value: textOnPrimary,  $type: 'color' },
        },
      },
    },
  };

  if (fontFamily) {
    (overrides as Record<string, Record<string, unknown>>).typography = {
      fontFamily: {
        sans: { $value: fontFamily, $type: 'fontFamily' },
      },
    };
  }

  if (interactiveRadius || cardRadius) {
    const radius: Record<string, unknown> = {};
    if (interactiveRadius) radius.interactive = { $value: interactiveRadius, $type: 'dimension' };
    if (cardRadius)        radius.card        = { $value: cardRadius,        $type: 'dimension' };
    (overrides as Record<string, unknown>).radius = radius;
  }

  const overridesJson = JSON.stringify(overrides, null, 2) + '\n';

  // ── Write to btech-ds internal path ───────────────────────────────────────
  mkdirSync(internalDir, { recursive: true });
  writeFileSync(resolve(internalDir, 'overrides.json'), overridesJson);
  console.log(`\n  ✅  packages/tokens/sources/tenants/${tenantId}/overrides.json (source of truth)`);

  // ── Scaffold full tenant repo at /tmp/btech-ds-{id}/ ─────────────────────
  const repoDir = `/tmp/btech-ds-${tenantId}`;
  mkdirSync(repoDir, { recursive: true });

  // 1. overrides.json
  writeFileSync(resolve(repoDir, 'overrides.json'), overridesJson);
  console.log(`  ✅  ${repoDir}/overrides.json`);

  // 2. token.schema.json — copy from schema/
  const schemaPath = resolve(ROOT, 'schema/token.schema.json');
  if (existsSync(schemaPath)) {
    writeFileSync(resolve(repoDir, 'token.schema.json'), readFileSync(schemaPath));
    console.log(`  ✅  ${repoDir}/token.schema.json`);
  } else {
    console.warn('  ⚠️  schema/token.schema.json not found — skipping copy');
  }

  // 3. azure-pipelines.yml — validate on push
  const pipelineYml = `# azure-pipelines.yml
# Validates overrides.json on every push to main.
# Generation happens in btech-ds (triggered by sync-tenant + generate-tenant pipelines).

trigger:
  branches:
    include: [main]

pool:
  vmImage: ubuntu-latest

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: Setup Node 20

  - script: npm install -g ajv-cli ajv-formats
    displayName: Install AJV validator

  - script: |
      ajv validate -s token.schema.json -d overrides.json --strict=false
    displayName: Validate overrides.json against schema

  - script: |
      # Ensure no unexpected keys snuck in (belt-and-suspenders)
      node -e "
        const schema = require('./token.schema.json');
        const data   = require('./overrides.json');
        const allowed = Object.keys(schema.properties || {});
        const actual  = Object.keys(data).filter(k => !k.startsWith('\\$'));
        const bad     = actual.filter(k => !allowed.includes(k));
        if (bad.length) { console.error('Disallowed keys:', bad); process.exit(1); }
        console.log('Boundary check passed.');
      "
    displayName: Boundary check (no extra top-level keys)
`;
  writeFileSync(resolve(repoDir, 'azure-pipelines.yml'), pipelineYml);
  console.log(`  ✅  ${repoDir}/azure-pipelines.yml`);

  // 4. README.md
  const readme = `# btech-ds-${tenantId}

> Brand token overrides for the **${tenantId}** tenant of the BTech Design System.

## What lives here

| File | Purpose |
|---|---|
| \`overrides.json\` | Brand-specific token values (the only file you edit) |
| \`token.schema.json\` | Allowed override paths — do **not** edit |
| \`azure-pipelines.yml\` | Validates \`overrides.json\` on every push |

## How to update brand tokens

1. Edit \`overrides.json\` with your brand values.
2. Push to \`main\` — CI validates the file automatically.
3. Ask the **btech team** to run the **sync-tenant** pipeline, which opens a PR in \`btech-ds\`.
4. After the PR merges, \`@btech/tokens-${tenantId}\` is published automatically.

## What can be overridden

| Token path | Description |
|---|---|
| \`color.background.primary.*\` | Primary button / accent background |
| \`color.stroke.primary.*\` | Primary border / outline color |
| \`color.text.primary.*\` | Text color on primary surfaces |
| \`color.icon.primary.*\` | Icon color on primary surfaces |
| \`typography.fontFamily.sans\` | Body / UI font stack |
| \`typography.fontFamily.serif\` | Serif font (if used) |
| \`radius.interactive\` | Button / input border-radius |
| \`radius.card\` | Card border-radius |

See \`token.schema.json\` for the full allowed structure.

## Contact

Questions or changes to the token boundary? Reach out to the **btech design-system team**.
`;
  writeFileSync(resolve(repoDir, 'README.md'), readme);
  console.log(`  ✅  ${repoDir}/README.md`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Tenant "${tenantId}" scaffolded successfully!
╚══════════════════════════════════════════════════════════════╝

  Source of truth (edit this file to update brand):
    packages/tokens/sources/tenants/${tenantId}/overrides.json

  Generated outputs (after pnpm generate --tenant ${tenantId}):
    packages/tenants/${tenantId}/dist/styles.css   ← web CSS (:root)
    packages/tenants/${tenantId}/package.json       ← @btech/tokens-${tenantId}
    platforms/flutter/tenants/${tenantId}/lib/      ← Dart package (coming soon)

Next steps:
  1. Review packages/tokens/sources/tenants/${tenantId}/overrides.json
  2. Open a PR in btech-ds with the new overrides.json
  3. After merge → generate-tenant pipeline auto-runs
     → @btech/tokens-${tenantId} published to Azure Artifacts
  4. Web app:    npm install @btech/tokens-${tenantId}
  5. Flutter app: git dependency on platforms/flutter/tenants/${tenantId}
`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
