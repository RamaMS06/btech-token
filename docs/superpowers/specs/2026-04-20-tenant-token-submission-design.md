# Design Spec: Per-Tenant Token Isolation & Publishing

**Date:** 2026-04-20
**Status:** Draft — pending implementation plan

---

## Context

The BTech design system currently bundles all tenant overrides into one shared `@btech/tokens`
package. Every tenant's CSS lives in `styles.css` under a `[data-tenant="id"]` selector, and
consuming apps call `activateTenant()` at runtime to switch themes.

This works for internal use but fails the isolation requirement for external tenants:
- One tenant's package update forces all other tenants to upgrade
- Consuming apps receive CSS for tenants they don't use
- A tenant's brand values are visible inside every consumer's bundle

The goal is **hard isolation per tenant**: each tenant gets their own private repo (source only)
and their own published package, generated centrally by `btech-ds`.

---

## Architecture

### Repos

```
btech-ds/                        ← central core (generator lives here)
btech-ds-bjb/                    ← private repo, BJB team only
btech-ds-a/                      ← private repo, Tenant A team only
btech-ds-{id}/                   ← one per tenant, same structure
```

Naming convention: `btech-ds-{id}` groups all design system repos together in Azure DevOps.
The `{id}` slug must be lowercase, hyphen-separated, max 20 chars, and match the folder
name in `sources/tenants/{id}/`.

### Tenant Repo Structure (all identical)

```
btech-ds-{id}/
├── overrides.json               ← only file the tenant controls (DTCG format)
├── token.schema.json            ← copy of main schema for local validation
├── azure-pipelines.yml          ← validates JSON on every push
└── README.md                    ← what can be overridden + format guide
```

### btech-ds Structure (additions)

```
btech-ds/
├── packages/tokens/
│   └── sources/tenants/
│       ├── bjb/overrides.json   ← synced from btech-ds-bjb
│       └── a/overrides.json     ← synced from btech-ds-a
├── packages/
│   ├── tokens-bjb/              ← generated web package per tenant
│   │   ├── package.json         ← name: @btech/tokens-bjb
│   │   └── dist/styles.css      ← :root { --btech-*: bjb values }
│   └── tokens-a/
│       ├── package.json         ← name: @btech/tokens-a
│       └── dist/styles.css
├── platforms/flutter/
│   ├── bjb/                     ← generated dart package per tenant
│   └── a/
└── pipelines/
    ├── sync-tenant.yml          ← NEW: pulls overrides.json from tenant repo
    ├── generate-tenant.yml      ← NEW: generates per-tenant package
    ├── validate.yml             ← existing
    └── publish.yml              ← extended: publishes per-tenant packages
```

---

## Flow

### Onboarding a New Tenant (one-time)

```
1. btech team creates btech-ds-{id} repo in Azure DevOps
   → private, only btech team + tenant team have access

2. btech team collects brand values from tenant (meeting/Figma/email):
   - Primary color (hex)
   - Hover color (hex)
   - Border/stroke color (hex)
   - Font family (name, e.g. "Poppins")
   - Interactive border radius (px)

3. btech team runs:
   pnpm add-tenant
   → generates sources/tenants/{id}/overrides.json

4. btech team pushes overrides.json to btech-ds-{id} repo

5. btech team runs sync-tenant pipeline in btech-ds
   → copies overrides.json into btech-ds/sources/tenants/{id}/
   → opens PR for internal review

6. PR approved + merged
   → generate-tenant pipeline runs
   → per-tenant package built + published
   → @btech/tokens-{id} available on Azure Artifacts
```

### Future Override Updates (rare)

Same flow — tenant shares new brand values via email/meeting, btech team updates
`overrides.json` in the tenant repo, sync pipeline triggers, PR reviewed, published.

---

## Pipelines

### `pipelines/sync-tenant.yml` (new)

Manually triggered. Input variables:
- `tenantId` — e.g. `bjb`
- `tenantRepoUrl` — Azure DevOps repo URL for `btech-ds-{id}`

Steps:
1. Checkout `btech-ds-{id}` repo
2. Validate `overrides.json` against `token.schema.json`
3. Run contrast validator: `pnpm exec tsx tools/validators/contrast.ts`
4. Run boundary validator: `pnpm exec tsx tools/validators/boundary.ts`
5. Copy `overrides.json` to `sources/tenants/{id}/overrides.json` in `btech-ds`
6. Open a PR in `btech-ds` targeting `main`

### `pipelines/generate-tenant.yml` (new)

Triggered automatically after a PR merges that touches `sources/tenants/`.

Steps:
1. Run generator: `pnpm exec tsx packages/tokens/sd.config.ts --tenant {id}`
2. Output goes to `packages/tokens-{id}/dist/`
3. Changeset version bump for `@btech/tokens-{id}`
4. Publish to Azure Artifacts

### Tenant repo `azure-pipelines.yml`

Runs on every push to the tenant repo. Only validates — does not publish.

Steps:
1. Validate `overrides.json` against `token.schema.json`
2. Check that only allowed token paths are overridden (boundary check)
3. Pass/fail — no generation, no publishing

---

## Generator Changes Required

The current generator in `sd.config.ts` produces one combined output for all tenants.
It must be extended to support a `--tenant {id}` flag:

- When `--tenant bjb` is passed: read only `sources/tenants/bjb/overrides.json`
- Generate CSS into `packages/tokens-bjb/dist/styles.css` with `:root {}` (not `[data-tenant]`)
- Generate Dart into `platforms/flutter/bjb/lib/src/`
- Each per-tenant CSS has no selector — it IS the root, no runtime switching needed

Existing behavior (no flag = all tenants bundled) stays for backward compatibility during migration.

---

## Consuming App

### Before (shared package)

```ts
import '@btech/tokens/dist/styles.css';
import { activateTenant } from '@btech/tokens';

activateTenant({ tenant: 'bjb' }); // must call this
```

### After (isolated package)

```ts
import '@btech/tokens-bjb/dist/styles.css'; // tokens already scoped
// no activateTenant() needed
```

Flutter equivalent:

```dart
// Before
BTechTheme.forTenant('bjb', brightness)

// After — package IS the tenant, just use default
BTechTheme.defaultTheme(brightness)
```

---

## What Is NOT in Scope

- No web form UI or self-service portal for tenants
- No generator running inside tenant repos (tenant repos are source-only)
- No tenant access to `btech-ds` repo
- No per-tenant Figma token sync (future consideration)

---

## Verification

1. Create a test tenant repo `btech-ds-test` with a sample `overrides.json`
2. Run `sync-tenant.yml` pipeline → confirm PR opens in `btech-ds`
3. Merge PR → confirm `generate-tenant.yml` runs and produces `packages/tokens-test/dist/styles.css`
4. Confirm CSS uses `:root {}` not `[data-tenant]`
5. Install `@btech/tokens-test` in `apps/demo-react` → confirm brand values render correctly
6. Confirm `btech-ds-bjb` repo has zero visibility of `btech-ds-a` files
