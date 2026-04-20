# Per-Tenant Isolated Packages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `btech-ds` so each tenant gets their own isolated npm package (`@btech/tokens-bspace`) generated centrally from a lightweight tenant source repo (`btech-ds-bspace`) containing only `overrides.json`.

**Architecture:** Each tenant repo holds only `overrides.json` (DTCG JSON). A `sync-tenant` pipeline copies it into `btech-ds/sources/tenants/{id}/`. The generator in `sd.config.ts` is extended with a `--tenant {id}` flag that merges base tokens with tenant overrides and outputs a standalone `:root {}` CSS + re-export JS into `packages/tokens-{id}/`. A `generate-tenant` pipeline auto-runs on merge and publishes to Azure Artifacts.

**Tech Stack:** TypeScript, Style Dictionary v4, pnpm workspaces, Azure DevOps Pipelines, Azure Artifacts

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `schema/token.schema.json` | **Create** | JSON Schema — allowed override paths |
| `packages/tokens/generators/web/web-tenant-isolated.ts` | **Create** | Generate per-tenant `:root {}` CSS |
| `packages/tokens/sd.config.ts` | **Modify** | Add `--tenant` flag + call per-tenant generator |
| `packages/tokens-{id}/package.json` | **Create (template)** | Per-tenant npm package descriptor |
| `pnpm-workspace.yaml` | **Modify** | Add `packages/tokens-*` wildcard |
| `pipelines/sync-tenant.yml` | **Create** | Pull overrides from tenant repo → PR in btech-ds |
| `pipelines/generate-tenant.yml` | **Create** | Auto-build + publish per-tenant package on merge |
| `scripts/add-tenant.ts` | **Modify** | Scaffold full 4-file tenant repo |
| `btech-ds-bspace/overrides.json` | **Create** (tenant repo) | BSpace brand values |
| `btech-ds-bspace/token.schema.json` | **Create** (tenant repo) | Validation schema copy |
| `btech-ds-bspace/azure-pipelines.yml` | **Create** (tenant repo) | Validate on push |
| `btech-ds-bspace/README.md` | **Update** (tenant repo) | Onboarding guide |

---

## Phase 1 — Schema

### Task 1: Create `schema/token.schema.json`

**Files:**
- Create: `schema/token.schema.json`

- [ ] **Step 1: Create the schema file**

```bash
mkdir -p schema
```

Create `schema/token.schema.json`:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BTech Tenant Override Schema",
  "description": "Defines which token paths a tenant is allowed to override.",
  "type": "object",
  "properties": {
    "$description": { "type": "string" },
    "color": {
      "type": "object",
      "properties": {
        "background": { "$ref": "#/definitions/colorGroup" },
        "stroke":     { "$ref": "#/definitions/colorGroup" },
        "text":       { "$ref": "#/definitions/colorGroup" },
        "icon":       { "$ref": "#/definitions/colorGroup" }
      },
      "additionalProperties": false
    },
    "typography": {
      "type": "object",
      "properties": {
        "fontFamily": {
          "type": "object",
          "properties": {
            "sans":  { "$ref": "#/definitions/fontFamilyToken" },
            "serif": { "$ref": "#/definitions/fontFamilyToken" },
            "mono":  { "$ref": "#/definitions/fontFamilyToken" }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "radius": {
      "type": "object",
      "properties": {
        "interactive": { "$ref": "#/definitions/dimensionToken" },
        "card":        { "$ref": "#/definitions/dimensionToken" },
        "pill":        { "$ref": "#/definitions/dimensionToken" }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "definitions": {
    "colorToken": {
      "type": "object",
      "required": ["$value", "$type"],
      "properties": {
        "$value": {
          "type": "string",
          "description": "Hex color (#RRGGBB) or token reference ({color.blue.500})"
        },
        "$type": { "type": "string", "enum": ["color"] }
      },
      "additionalProperties": false
    },
    "dimensionToken": {
      "type": "object",
      "required": ["$value", "$type"],
      "properties": {
        "$value": {
          "type": "string",
          "pattern": "^[0-9]+(px|rem|em|%)$"
        },
        "$type": { "type": "string", "enum": ["dimension"] }
      },
      "additionalProperties": false
    },
    "fontFamilyToken": {
      "type": "object",
      "required": ["$value", "$type"],
      "properties": {
        "$value": { "type": "string" },
        "$type": { "type": "string", "enum": ["fontFamily"] }
      },
      "additionalProperties": false
    },
    "colorGroup": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "additionalProperties": { "$ref": "#/definitions/colorToken" }
      }
    }
  }
}
```

- [ ] **Step 2: Verify schema is valid JSON**

```bash
node -e "require('./schema/token.schema.json'); console.log('Schema valid')"
```

Expected: `Schema valid`

- [ ] **Step 3: Commit**

```bash
git add schema/token.schema.json
git commit -m "feat: add token.schema.json — defines allowed tenant override paths"
```

---

## Phase 2 — Per-Tenant CSS Generator

### Task 2: Create `web-tenant-isolated.ts`

This generates a standalone `:root {}` CSS file for a single tenant — all base token values with tenant overrides applied. No `[data-tenant]` selector needed.

**Files:**
- Create: `packages/tokens/generators/web/web-tenant-isolated.ts`

- [ ] **Step 1: Create the generator file**

Create `packages/tokens/generators/web/web-tenant-isolated.ts`:

```typescript
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import {
  ROOT,
  flattenDTCG,
  resolveRef,
  pathToCssVarStem,
} from '../utils.js';

/**
 * Generates a standalone :root {} CSS file for a single tenant.
 * Merges base resolved token map with tenant overrides.
 * Output: packages/tokens-{tenantId}/dist/styles.css
 *
 * @param tenantId   e.g. 'bspace'
 * @param baseMap    fully resolved base token map from loadTokenData().baseMap
 */
export function generateTenantIsolatedCss(
  tenantId: string,
  baseMap: Record<string, string>,
): void {
  const overridePath = `${ROOT}/sources/tenants/${tenantId}/overrides.json`;
  if (!existsSync(overridePath)) {
    throw new Error(
      `[tenant-isolated] No overrides.json found for tenant "${tenantId}" at ${overridePath}`,
    );
  }

  // Load + flatten tenant overrides
  const rawOverrides = flattenDTCG(
    JSON.parse(readFileSync(overridePath, 'utf-8')),
  );

  // Resolve tenant override refs against base map
  const resolvedOverrides: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawOverrides)) {
    resolvedOverrides[k] = resolveRef(v, baseMap);
  }

  // Merge: base map patched with tenant overrides
  const mergedMap: Record<string, string> = { ...baseMap };
  for (const [path, value] of Object.entries(resolvedOverrides)) {
    // Strip trailing .default from override path for matching
    const cleanPath = path.replace(/\.default$/, '');
    // Update both the exact key and any .default variant
    mergedMap[cleanPath] = value;
    mergedMap[`${cleanPath}.default`] = value;
  }

  // Build CSS lines from merged map — emit only semantic tokens (skip primitives)
  const SKIP_PREFIXES = ['color.blue', 'color.red', 'color.green', 'color.orange',
    'color.neutral', 'color.pink', 'color.purple', 'color.teal', 'color.slate',
    'color.yellow'];

  const lines: string[] = [
    '/* AUTO-GENERATED by @btech/design-system — do not edit manually. */',
    `/* Tenant: ${tenantId} — generated from sources/tenants/${tenantId}/overrides.json */',`,
    '/* Run `pnpm generate --tenant ' + tenantId + '` to regenerate. */',
    '',
    ':root {',
  ];

  for (const [path, value] of Object.entries(mergedMap)) {
    if (SKIP_PREFIXES.some(p => path.startsWith(p))) continue;
    // Skip internal refs that weren't resolved
    if (value.startsWith('{')) continue;

    const cleanPath = path.replace(/\.default$/, '');
    const parts = cleanPath.split('.');
    const stem = pathToCssVarStem(parts)
      .replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
    const cssVar = `--btech-${stem}`;
    lines.push(`  ${cssVar}: ${value};`);
  }

  lines.push('}', '');

  // Deduplicate lines (same cssVar may appear from both .default and plain path)
  const seen = new Set<string>();
  const deduped = lines.filter(line => {
    if (!line.startsWith('  --')) return true;
    if (seen.has(line)) return false;
    seen.add(line);
    return true;
  });

  // Write to packages/tokens-{id}/dist/styles.css
  const MONOREPO_ROOT = resolve(ROOT, '../..');
  const outDir = resolve(MONOREPO_ROOT, 'packages', `tokens-${tenantId}`, 'dist');
  mkdirSync(outDir, { recursive: true });

  writeFileSync(resolve(outDir, 'styles.css'), deduped.join('\n'), 'utf-8');
  console.log(`  Tenant CSS  — packages/tokens-${tenantId}/dist/styles.css`);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/tokens && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add packages/tokens/generators/web/web-tenant-isolated.ts
git commit -m "feat: add web-tenant-isolated generator — per-tenant :root {} CSS"
```

---

### Task 3: Add `--tenant` flag to `sd.config.ts`

**Files:**
- Modify: `packages/tokens/sd.config.ts`

- [ ] **Step 1: Add tenant flag parsing + `generateTenantPackage` call**

At the top of `sd.config.ts`, after all imports, add the tenant arg parser. Then at the bottom of the IIFE, add the branch:

```typescript
// Add after all imports (around line 20, before any constants):
import { generateTenantIsolatedCss } from './generators/web/web-tenant-isolated.js';
import { ensureTenantPackageJson } from './generators/web/web-tenant-package.js';
```

Replace the closing of the IIFE `})();` with:

```typescript
  // Parse --tenant flag
  const tenantIdx = process.argv.indexOf('--tenant');
  const tenantArg = tenantIdx !== -1
    ? process.argv[tenantIdx + 1]
    : process.argv.find(a => a.startsWith('--tenant='))?.split('=')[1];

  if (tenantArg) {
    // Per-tenant mode: generate isolated package for one tenant only
    console.log(`\n  Generating isolated package for tenant: ${tenantArg}\n`);
    generateTenantIsolatedCss(tenantArg, resolvedBaseMap);
    ensureTenantPackageJson(tenantArg);
    console.log(`\n  ✅ @btech/tokens-${tenantArg} ready\n`);
  } else {
    // Default mode: existing full-generate behavior (unchanged)
    appendTenantCSS(resolvedBaseMap);
    console.log('\n pnpm generate complete\n');
    console.log('  Flutter → packages/tokens/platforms/flutter/lib/src/');
    console.log('  Web     → packages/tokens/platforms/web/src/ + dist/');
    console.log('');
  }

})();
```

- [ ] **Step 2: Verify existing generate still works**

```bash
pnpm exec tsx packages/tokens/sd.config.ts
```

Expected: completes without error, `platforms/web/dist/styles.css` is updated.

- [ ] **Step 3: Commit**

```bash
git add packages/tokens/sd.config.ts
git commit -m "feat(generator): add --tenant flag for per-tenant isolated package generation"
```

---

## Phase 3 — Package Infrastructure

### Task 4: Create `web-tenant-package.ts` — per-tenant `package.json` generator

**Files:**
- Create: `packages/tokens/generators/web/web-tenant-package.ts`

- [ ] **Step 1: Create the file**

Create `packages/tokens/generators/web/web-tenant-package.ts`:

```typescript
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import { ROOT } from '../utils.js';

/**
 * Creates packages/tokens-{tenantId}/package.json if it doesn't exist.
 * Also creates a minimal src/index.ts that re-exports from the base package.
 */
export function ensureTenantPackageJson(tenantId: string): void {
  const MONOREPO_ROOT = resolve(ROOT, '../..');
  const pkgDir = resolve(MONOREPO_ROOT, 'packages', `tokens-${tenantId}`);
  const srcDir = resolve(pkgDir, 'src');
  const distDir = resolve(pkgDir, 'dist');

  mkdirSync(pkgDir, { recursive: true });
  mkdirSync(srcDir, { recursive: true });
  mkdirSync(distDir, { recursive: true });

  const pkgJsonPath = resolve(pkgDir, 'package.json');
  if (!existsSync(pkgJsonPath)) {
    const pkgJson = {
      name: `@btech/tokens-${tenantId}`,
      version: '1.0.0',
      description: `BTech design tokens for ${tenantId} tenant`,
      main: './dist/index.js',
      module: './dist/index.mjs',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          import: './dist/index.mjs',
          require: './dist/index.js',
        },
        './styles.css': './dist/styles.css',
      },
      scripts: {
        build: 'tsup src/index.ts --format cjs,esm --dts',
      },
      dependencies: {
        '@btech/tokens': 'workspace:*',
      },
      devDependencies: {
        tsup: '^8.0.2',
        typescript: '^5.4.5',
      },
      publishConfig: {
        registry:
          'https://buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/',
      },
    };
    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');
    console.log(`  Created packages/tokens-${tenantId}/package.json`);
  }

  // Create src/index.ts that re-exports everything from base
  const indexPath = resolve(srcDir, 'index.ts');
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      [
        `// AUTO-GENERATED — re-exports base @btech/tokens for ${tenantId} tenant.`,
        `// Import styles.css from this package to get ${tenantId}'s token values in :root.`,
        `export * from '@btech/tokens';`,
        '',
      ].join('\n'),
    );
    console.log(`  Created packages/tokens-${tenantId}/src/index.ts`);
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/tokens && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add packages/tokens/generators/web/web-tenant-package.ts
git commit -m "feat: add web-tenant-package generator — creates per-tenant package.json"
```

---

### Task 5: Update `pnpm-workspace.yaml`

**Files:**
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Add `packages/tokens-*` wildcard**

Replace the content of `pnpm-workspace.yaml` with:

```yaml
packages:
  - 'packages/tokens/platforms/web'
  - 'packages/tokens-*'
```

- [ ] **Step 2: Test per-tenant generation end-to-end (local)**

Run the generator for `bspace` tenant (using existing `tenant-bjb` as a stand-in to verify the path works):

```bash
pnpm exec tsx packages/tokens/sd.config.ts --tenant tenant-bjb
```

Expected output:
```
  Generating isolated package for tenant: tenant-bjb

  Tenant CSS  — packages/tokens-tenant-bjb/dist/styles.css
  Created packages/tokens-tenant-bjb/package.json
  Created packages/tokens-tenant-bjb/src/index.ts

  ✅ @btech/tokens-tenant-bjb ready
```

- [ ] **Step 3: Verify the CSS output has `:root {}` not `[data-tenant]`**

```bash
head -10 packages/tokens-tenant-bjb/dist/styles.css
```

Expected: first non-comment line is `:root {`

- [ ] **Step 4: Run pnpm install to register new workspace packages**

```bash
pnpm install
```

Expected: resolves without error, `packages/tokens-tenant-bjb` is now a workspace package.

- [ ] **Step 5: Commit**

```bash
git add pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat: add packages/tokens-* to pnpm workspace for per-tenant packages"
```

---

## Phase 4 — Pipelines

### Task 6: Create `pipelines/sync-tenant.yml`

Manually triggered by btech team. Pulls `overrides.json` from a tenant repo, validates it, and opens a PR in `btech-ds`.

**Files:**
- Create: `pipelines/sync-tenant.yml`

- [ ] **Step 1: Create the pipeline file**

Create `pipelines/sync-tenant.yml`:

```yaml
# sync-tenant.yml
# Manually triggered by btech team to pull a tenant's overrides.json
# from their private repo and open a PR in btech-ds for review.
#
# Parameters:
#   tenantId     — slug, e.g. "bspace"
#   tenantRepoUrl — Azure DevOps repo URL, e.g. https://dev.azure.com/buma/.../_git/btech-ds-bspace

trigger: none

parameters:
  - name: tenantId
    displayName: 'Tenant ID (slug, e.g. bspace)'
    type: string
  - name: tenantRepoUrl
    displayName: 'Tenant repo URL'
    type: string
    default: ''

variables:
  - group: btech-ds-secrets

pool:
  vmImage: ubuntu-latest

steps:
  - checkout: self
    persistCredentials: true

  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: Setup Node 20

  - task: npmAuthenticate@0
    inputs:
      workingFile: .npmrc
    displayName: Authenticate npm (Azure Artifacts)

  - script: npm install -g pnpm@9 && pnpm install --frozen-lockfile
    displayName: Install dependencies

  - script: |
      set -e
      TENANT_REPO="${{ parameters.tenantRepoUrl }}"
      TENANT_ID="${{ parameters.tenantId }}"

      if [ -z "$TENANT_REPO" ]; then
        TENANT_REPO="https://$(System.AccessToken)@dev.azure.com/buma/BUMA%20-%20Bspace%20Design%20System/_git/btech-ds-${TENANT_ID}"
      fi

      echo "Cloning tenant repo: $TENANT_REPO"
      git clone "$TENANT_REPO" /tmp/tenant-repo

      OVERRIDE_SRC="/tmp/tenant-repo/overrides.json"
      if [ ! -f "$OVERRIDE_SRC" ]; then
        echo "##[error] overrides.json not found in btech-ds-${TENANT_ID}"
        exit 1
      fi

      DEST_DIR="packages/tokens/sources/tenants/${TENANT_ID}"
      mkdir -p "$DEST_DIR"
      cp "$OVERRIDE_SRC" "$DEST_DIR/overrides.json"
      echo "Copied overrides.json to $DEST_DIR"
    displayName: Pull overrides.json from tenant repo

  - script: pnpm exec tsx tools/validators/contrast.ts
    displayName: Validate contrast (WCAG AA)

  - script: pnpm exec tsx tools/validators/boundary.ts
    displayName: Validate boundary (allowed overrides only)

  - script: |
      set -e
      TENANT_ID="${{ parameters.tenantId }}"
      BRANCH="sync/tenant-${TENANT_ID}-$(Build.BuildId)"

      git config user.email "pipeline@btech-ds.com"
      git config user.name "BTech Pipeline"
      git checkout -b "$BRANCH"
      git add "packages/tokens/sources/tenants/${TENANT_ID}/"
      git commit -m "sync: update ${TENANT_ID} overrides from btech-ds-${TENANT_ID} ***NO_CI***"
      git push origin "$BRANCH"

      echo "##vso[task.setvariable variable=SYNC_BRANCH]$BRANCH"
    displayName: Push sync branch

  - script: |
      set -e
      TENANT_ID="${{ parameters.tenantId }}"
      BRANCH="sync/tenant-${TENANT_ID}-$(Build.BuildId)"
      PROJECT="BUMA%20-%20Bspace%20Design%20System"
      REPO="btech-ds"
      API="https://dev.azure.com/buma/${PROJECT}/_apis/git/repositories/${REPO}/pullrequests?api-version=7.1"

      curl -s -X POST "$API" \
        -H "Authorization: Bearer $(System.AccessToken)" \
        -H "Content-Type: application/json" \
        -d "{
          \"title\": \"sync: update ${TENANT_ID} tenant overrides\",
          \"description\": \"Automated sync from btech-ds-${TENANT_ID} repo. Review the overrides.json change before merging.\",
          \"sourceRefName\": \"refs/heads/${BRANCH}\",
          \"targetRefName\": \"refs/heads/main\"
        }"
      echo ""
      echo "PR created — btech team should review before merging."
    displayName: Open PR in btech-ds
```

- [ ] **Step 2: Commit**

```bash
git add pipelines/sync-tenant.yml
git commit -m "feat(ci): add sync-tenant pipeline — pulls overrides from tenant repo"
```

---

### Task 7: Create `pipelines/generate-tenant.yml`

Auto-triggered after a PR merges that touches `sources/tenants/**`. Detects which tenant changed, generates their isolated package, and publishes it.

**Files:**
- Create: `pipelines/generate-tenant.yml`

- [ ] **Step 1: Create the pipeline file**

Create `pipelines/generate-tenant.yml`:

```yaml
# generate-tenant.yml
# Auto-triggered when sources/tenants/** changes on main.
# Detects the changed tenant, generates their isolated package,
# and publishes @btech/tokens-{id} to Azure Artifacts.

trigger:
  branches:
    include:
      - main
  paths:
    include:
      - packages/tokens/sources/tenants/**

pr: none

pool:
  vmImage: ubuntu-latest

steps:
  - checkout: self
    fetchDepth: 2

  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
    displayName: Setup Node 20

  - task: npmAuthenticate@0
    inputs:
      workingFile: .npmrc
    displayName: Authenticate npm (Azure Artifacts)

  - script: npm install -g pnpm@9 && pnpm install --frozen-lockfile
    displayName: Install dependencies

  - script: |
      set -e
      # Detect which tenant folder changed in the last merge commit
      CHANGED=$(git diff HEAD~1 --name-only | grep 'sources/tenants/' | head -1)
      echo "Changed file: $CHANGED"

      # Extract tenant ID from path: packages/tokens/sources/tenants/{id}/overrides.json
      TENANT_ID=$(echo "$CHANGED" | awk -F'/' '{print $5}')
      echo "Detected tenant: $TENANT_ID"

      if [ -z "$TENANT_ID" ] || [ "$TENANT_ID" = "default" ]; then
        echo "No actionable tenant detected — skipping generation."
        echo "##vso[task.setvariable variable=SKIP_GENERATE]true"
      else
        echo "##vso[task.setvariable variable=TENANT_ID]$TENANT_ID"
        echo "##vso[task.setvariable variable=SKIP_GENERATE]false"
      fi
    displayName: Detect changed tenant

  - script: |
      set -e
      if [ "$(SKIP_GENERATE)" = "true" ]; then
        echo "Skipping — no actionable tenant detected."
        exit 0
      fi
      pnpm exec tsx packages/tokens/sd.config.ts --tenant $(TENANT_ID)
    displayName: Generate per-tenant package
    condition: ne(variables['SKIP_GENERATE'], 'true')

  - script: |
      set -e
      if [ "$(SKIP_GENERATE)" = "true" ]; then exit 0; fi

      PKG_DIR="packages/tokens-$(TENANT_ID)"
      if [ ! -d "$PKG_DIR" ]; then
        echo "##[error] $PKG_DIR not found after generation"
        exit 1
      fi

      cd "$PKG_DIR"
      # Build TS (src/index.ts → dist/index.js)
      pnpm build
    displayName: Build per-tenant package
    condition: ne(variables['SKIP_GENERATE'], 'true')

  - script: |
      set -e
      if [ "$(SKIP_GENERATE)" = "true" ]; then exit 0; fi

      cd "packages/tokens-$(TENANT_ID)"
      npm publish
      echo "Published @btech/tokens-$(TENANT_ID) to Azure Artifacts"
    displayName: Publish @btech/tokens-{id}
    condition: ne(variables['SKIP_GENERATE'], 'true')
```

- [ ] **Step 2: Commit**

```bash
git add pipelines/generate-tenant.yml
git commit -m "feat(ci): add generate-tenant pipeline — auto-builds and publishes per-tenant package"
```

---

## Phase 5 — Tenant Repo Scaffold

### Task 8: Extend `scripts/add-tenant.ts`

Extend the existing interactive CLI to collect more brand values and scaffold all 4 files for the tenant repo.

**Files:**
- Modify: `scripts/add-tenant.ts`

- [ ] **Step 1: Replace `scripts/add-tenant.ts` with extended version**

```typescript
/**
 * Interactive CLI to scaffold a new tenant.
 *
 * Outputs:
 *   1. packages/tokens/sources/tenants/{id}/overrides.json  — local copy
 *   2. /tmp/btech-ds-{id}/                                  — full tenant repo scaffold
 *      ├── overrides.json
 *      ├── token.schema.json
 *      ├── azure-pipelines.yml
 *      └── README.md
 *
 * Usage: pnpm add-tenant
 */
import { createInterface } from 'readline';
import { mkdirSync, writeFileSync, existsSync, readFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const MONOREPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS_ROOT   = resolve(MONOREPO_ROOT, 'packages', 'tokens');

const rl = createInterface({ input: process.stdin, output: process.stdout });
function ask(q: string): Promise<string> {
  return new Promise(resolve => rl.question(q, resolve));
}
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function isHex(h: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(h);
}
async function askHex(label: string): Promise<string> {
  let v = '';
  while (!isHex(v)) {
    v = (await ask(`${label} (hex, e.g. #0066CC): `)).trim();
    if (!isHex(v)) console.log('  ❌ Invalid hex. Use #RRGGBB format.');
  }
  return v;
}

async function main() {
  console.log('\n🎨  Add a new tenant\n');

  const rawId = await ask('Tenant ID (slug, e.g. bspace): ');
  const tenantId = slugify(rawId);
  if (!tenantId) { console.error('❌ Invalid tenant ID'); process.exit(1); }

  const localDir = resolve(TOKENS_ROOT, 'sources', 'tenants', tenantId);
  if (existsSync(localDir)) {
    console.error(`❌ Tenant "${tenantId}" already exists at ${localDir}`);
    process.exit(1);
  }

  const primaryColor  = await askHex('Primary brand color');
  const hoverColor    = await askHex('Hover color (slightly darker primary)');
  const borderColor   = await askHex('Border/stroke color');
  const textOnPrimary = await askHex('Text color on primary background (usually #FFFFFF)');

  const fontFamily = (await ask('Font family (e.g. "Inter, system-ui"): ')).trim()
    || 'Inter, system-ui';

  const radiusStr = await ask('Interactive border radius in px (e.g. 6): ');
  const radius = parseInt(radiusStr.trim(), 10);
  if (isNaN(radius) || radius < 0) { console.error('❌ Invalid radius'); process.exit(1); }

  const cardRadiusStr = await ask(`Card border radius in px (e.g. ${radius + 2}): `);
  const cardRadius = parseInt(cardRadiusStr.trim(), 10) || radius + 2;

  rl.close();

  // Build overrides object
  const overrides = {
    $description: `${tenantId} tenant — configured during onboarding`,
    color: {
      background: {
        primary: {
          default: { $value: primaryColor, $type: 'color' },
          hover:   { $value: hoverColor,   $type: 'color' },
        },
      },
      stroke: {
        primary: {
          default: { $value: borderColor, $type: 'color' },
        },
      },
      text: {
        primary: {
          default: { $value: textOnPrimary, $type: 'color' },
        },
      },
    },
    typography: {
      fontFamily: {
        sans: { $value: fontFamily, $type: 'fontFamily' },
      },
    },
    radius: {
      interactive: { $value: `${radius}px`,     $type: 'dimension' },
      card:        { $value: `${cardRadius}px`,  $type: 'dimension' },
    },
  };

  const overridesJson = JSON.stringify(overrides, null, 2) + '\n';

  // 1. Write local overrides (in btech-ds)
  mkdirSync(localDir, { recursive: true });
  writeFileSync(resolve(localDir, 'overrides.json'), overridesJson);
  console.log(`\n✅ Created packages/tokens/sources/tenants/${tenantId}/overrides.json`);

  // 2. Scaffold full tenant repo in /tmp/btech-ds-{id}/
  const repoDir = resolve('/tmp', `btech-ds-${tenantId}`);
  mkdirSync(repoDir, { recursive: true });

  // overrides.json
  writeFileSync(resolve(repoDir, 'overrides.json'), overridesJson);

  // token.schema.json (copy from main repo)
  const schemaPath = resolve(MONOREPO_ROOT, 'schema', 'token.schema.json');
  if (existsSync(schemaPath)) {
    copyFileSync(schemaPath, resolve(repoDir, 'token.schema.json'));
  }

  // azure-pipelines.yml
  writeFileSync(resolve(repoDir, 'azure-pipelines.yml'), [
    '# Validates overrides.json on every push.',
    '# Generation and publishing are handled by btech-ds pipelines.',
    'trigger:',
    '  branches:',
    '    include: [main]',
    '',
    'pool:',
    '  vmImage: ubuntu-latest',
    '',
    'steps:',
    '  - task: NodeTool@0',
    '    inputs:',
    '      versionSpec: "20.x"',
    '',
    '  - script: |',
    '      npm install -g ajv-cli',
    '      ajv validate -s token.schema.json -d overrides.json',
    `    displayName: Validate overrides.json schema for ${tenantId}`,
    '',
  ].join('\n'));

  // README.md
  writeFileSync(resolve(repoDir, 'README.md'), [
    `# btech-ds-${tenantId}`,
    '',
    `Brand token overrides for the **${tenantId}** tenant of the BTech design system.`,
    '',
    '## What you can override',
    '',
    '| Category | Tokens |',
    '|---|---|',
    '| `color.background.primary` | `.default`, `.hover` |',
    '| `color.stroke.primary` | `.default` |',
    '| `color.text.primary` | `.default` |',
    '| `typography.fontFamily` | `.sans`, `.serif`, `.mono` |',
    '| `radius` | `.interactive`, `.card`, `.pill` |',
    '',
    '## What you CANNOT override',
    '',
    '- Primitive color scales (`color.blue.*`, `color.red.*`, etc.)',
    '- Spacing / font sizes / font weights / line heights',
    '- Motion / z-index / shadow',
    '',
    '## Updating your brand',
    '',
    '1. Edit `overrides.json` using DTCG format',
    '2. Push to `main` — pipeline validates automatically',
    '3. Contact BTech team to trigger publishing',
    '',
    '## Format',
    '',
    '```json',
    '{',
    '  "color": {',
    '    "background": {',
    '      "primary": {',
    '        "default": { "$value": "#0066CC", "$type": "color" },',
    '        "hover":   { "$value": "#004EA3", "$type": "color" }',
    '      }',
    '    }',
    '  }',
    '}',
    '```',
    '',
    '## Contact',
    '',
    'BTech Design System team — raise issues in this repo or contact via Teams.',
    '',
  ].join('\n'));

  console.log(`✅ Scaffolded tenant repo → /tmp/btech-ds-${tenantId}/`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review /tmp/btech-ds-${tenantId}/overrides.json`);
  console.log(`  2. Push to btech-ds-${tenantId} Azure DevOps repo`);
  console.log(`  3. Run pnpm validate`);
  console.log(`  4. Run sync-tenant pipeline in btech-ds`);
  console.log('');
}

main().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Test the script**

```bash
echo -e "bspace\n#0066CC\n#004EA3\n#0066CC\n#FFFFFF\nInter, system-ui\n6\n8" | pnpm exec tsx scripts/add-tenant.ts
```

Expected:
```
✅ Created packages/tokens/sources/tenants/bspace/overrides.json
✅ Scaffolded tenant repo → /tmp/btech-ds-bspace/
```

- [ ] **Step 3: Verify all 4 files exist**

```bash
ls /tmp/btech-ds-bspace/
```

Expected: `overrides.json  token.schema.json  azure-pipelines.yml  README.md`

- [ ] **Step 4: Commit**

```bash
git add scripts/add-tenant.ts
git commit -m "feat(scripts): extend add-tenant to scaffold full tenant repo (4 files)"
```

---

## Phase 6 — Populate `btech-ds-bspace` + End-to-End Test

### Task 9: Populate `btech-ds-bspace` repo

**Files:**
- Create in `btech-ds-bspace`: `overrides.json`, `token.schema.json`, `azure-pipelines.yml`, `README.md`

- [ ] **Step 1: Run add-tenant to generate files for bspace**

```bash
echo -e "bspace\n#0066CC\n#004EA3\n#005BBB\n#FFFFFF\nInter, system-ui\n6\n8" | pnpm exec tsx scripts/add-tenant.ts
```

- [ ] **Step 2: Clone the btech-ds-bspace repo**

```bash
PAT="<your-pat>"
git clone "https://buma:${PAT}@dev.azure.com/buma/BUMA%20-%20Bspace%20Design%20System/_git/btech-ds-bspace" /tmp/btech-ds-bspace-repo
```

- [ ] **Step 3: Copy generated files into repo and push**

```bash
cp /tmp/btech-ds-bspace/overrides.json        /tmp/btech-ds-bspace-repo/
cp /tmp/btech-ds-bspace/token.schema.json      /tmp/btech-ds-bspace-repo/
cp /tmp/btech-ds-bspace/azure-pipelines.yml    /tmp/btech-ds-bspace-repo/
cp /tmp/btech-ds-bspace/README.md              /tmp/btech-ds-bspace-repo/

cd /tmp/btech-ds-bspace-repo
git config user.email "pipeline@btech-ds.com"
git config user.name "BTech Team"
git add .
git commit -m "chore: initial tenant configuration for bspace"
git push origin main
```

Expected: 4 files pushed to `btech-ds-bspace`.

- [ ] **Step 4: Push pipelines + schema to btech-ds Azure main**

```bash
cd /Users/p-rama.msugiyanto/Documents/btech/btech-ds
git add schema/ pipelines/sync-tenant.yml pipelines/generate-tenant.yml pnpm-workspace.yaml packages/tokens/
git status
```

(Follow existing PR process to merge into Azure main.)

---

### Task 10: End-to-End Verification

- [ ] **Step 1: Run generator for bspace locally**

```bash
pnpm exec tsx packages/tokens/sd.config.ts --tenant bspace
```

Expected:
```
  Generating isolated package for tenant: bspace
  Tenant CSS  — packages/tokens-bspace/dist/styles.css
  Created packages/tokens-bspace/package.json
  Created packages/tokens-bspace/src/index.ts
  ✅ @btech/tokens-bspace ready
```

- [ ] **Step 2: Inspect the generated CSS**

```bash
grep -A5 ":root" packages/tokens-bspace/dist/styles.css | head -15
```

Expected: `:root {` with `--btech-background-primary: #0066CC;` (not `[data-tenant]`)

- [ ] **Step 3: Verify no cross-tenant leakage**

```bash
grep "tenant-bjb\|tenant-a" packages/tokens-bspace/dist/styles.css
```

Expected: no output (bspace CSS has zero reference to other tenants)

- [ ] **Step 4: Install and test in demo-react**

Update `apps/demo-react/package.json` — replace `@btech/tokens` with `@btech/tokens-bspace`:

```json
{
  "dependencies": {
    "@btech/tokens-bspace": "workspace:*"
  }
}
```

Update `apps/demo-react/src/main.tsx`:

```tsx
// Replace:
import '@btech/tokens/dist/styles.css';

// With:
import '@btech/tokens-bspace/dist/styles.css';
// Remove activateTenant() call — no longer needed
```

Then run:

```bash
cd apps/demo-react && pnpm install && pnpm dev
```

Expected: app loads with BSpace brand colors (primary `#0066CC`) without any `activateTenant()` call.

- [ ] **Step 5: Confirm base package still works (no regression)**

```bash
pnpm exec tsx packages/tokens/sd.config.ts
```

Expected: completes without error, `platforms/web/dist/styles.css` still has `[data-tenant]` blocks (existing behavior unchanged).

- [ ] **Step 6: Final commit — push everything to Azure main via PR**

```bash
git add .
git status  # review all changes
git commit -m "feat: per-tenant isolated package architecture — bspace as first tenant"
```

(Open PR, follow existing bypass policy process to merge.)

---

## Self-Review Checklist

- [x] **schema/token.schema.json** — Task 1
- [x] **web-tenant-isolated.ts** — Task 2 (generates `:root {}` CSS)
- [x] **sd.config.ts `--tenant` flag** — Task 3
- [x] **web-tenant-package.ts** — Task 4 (package.json + src/index.ts)
- [x] **pnpm-workspace.yaml wildcard** — Task 5
- [x] **sync-tenant.yml pipeline** — Task 6
- [x] **generate-tenant.yml pipeline** — Task 7
- [x] **add-tenant.ts extension** — Task 8
- [x] **btech-ds-bspace population** — Task 9
- [x] **End-to-end verification** — Task 10
- [x] **No `activateTenant()` in per-tenant consumer** — Task 10 Step 4
- [x] **Base package regression check** — Task 10 Step 5
- [x] **Cross-tenant leakage check** — Task 10 Step 3
