# Create Tenant Flow — Fork From Default

**Status:** Draft
**Author:** Token Studio team
**Date:** 2026-04-27
**Related:** `pkg/tokens` boundary validator, ThemeSwitcher, tenant-resolver

---

## Problem

Today the only way to add a new tenant is to hand-author
`packages/tokens/sources/tenants/<id>/overrides.json` outside the plugin and
push it through git. That is hostile to the audience the plugin exists for —
designers — and it forces them onto a workflow (file-watching, JSON syntax,
folder conventions) that the rest of the plugin successfully hides.

Designers should be able to create a new tenant inside the plugin: pick an
id, click create, start editing brand colors right away. The tenant should
appear in the existing tenant filter dropdown and behave like every other
tenant from the moment it's created.

## Goal

A "+ New tenant…" entry in the tenant dropdown that opens a modal asking
only for an id. Confirming forks every value the boundary validator allows
tenants to override (`color.brand`, `color.bg`, `radius`,
`typography.fontFamily`) into a freshly-minted override file pre-populated
with the current base values. The active tenant switches to the new id and
the designer is now editing real overrides.

The new tenant's override file lives only in plugin state until the
designer pushes — same lifecycle as any other dirty edit. No special "save
tenant" step, no extra round trip to the repo.

## Non-goals

- **No empty / from-scratch tenants.** The designer asked for fork-only;
  empty start would force them to learn the path syntax up front, which
  defeats the point of an in-plugin flow.
- **No tenant rename or delete in this iteration.** Out of scope; will be
  follow-up work once the create flow proves out.
- **No display-name field.** The id is what designers see in the dropdown
  (title-cased by `prettifyTenantId`). Adding a separate label would be a
  second source of truth that drifts; we don't need it.
- **Repo-side scaffolding (`pubspec.yaml`, package.json) stays in
  `add-tenant.ts` / generators.** The plugin only writes
  `overrides.json` — the rest is generated downstream from CI when the PR
  lands. Keeping the plugin source-only matches how every other edit flows.

## Design

### User flow

1. Designer opens the tenant dropdown in the header.
2. At the bottom of the list, separated by a thin divider, sits
   `+ New tenant…`.
3. Selecting it opens **CreateTenantModal**:
   - **Tenant id** — text input, validated live against
     `^[a-z][a-z0-9-]{1,30}$`. Inline error shows on invalid input or on
     collision with an existing tenant id.
   - Body copy explains in one sentence: "Starts as a copy of the
     default brand. You'll be able to override brand colors, surface
     backgrounds, radii, and font family."
   - Buttons: **Cancel** (close, no state change) /
     **Create tenant** (primary, disabled while id is invalid).
4. On confirm:
   - `forkDefaultIntoTenant(sets, newId)` builds a fresh override tree by
     walking every base set's tree, keeping only leaves whose path falls
     under one of the four allowed prefixes.
   - The new override set is inserted into `sets` with `dirty: true` and
     `originalTree: {}` (so a future "Clear changes" makes the tenant
     vanish — same convention as `ensureTenantOverrideSet`).
   - `activeTenant` is set to `newId`. The dropdown closes; the modal
     closes; the designer is now looking at the freshly-forked values.
5. Designer edits some `color.brand.primary` values. Push flow is
   unchanged: the new override file appears as a single dirty set in the
   push modal and lands as `tenants/<id>/overrides.json` in the PR.

### Component shape

```
CreateTenantModal
├── id input (validated)
├── id error message (live)
├── description copy (static)
└── footer: Cancel | Create tenant (primary)
```

Modal uses the existing `.modal` / `.modal-overlay` / `.modal__*` styles —
it's structurally identical to ConfirmDialog with one form field.

### State flow

```
ThemeSwitcher
  └── option "+ New tenant…" → setShowCreateTenant(true)

CreateTenantModal
  ├── local state: { id: string, error: string | null }
  └── onConfirm
       └── tokenStore.createTenant(id)
            ├── forkDefaultIntoTenant(sets, id)        // pure helper
            ├── sets[`tenants/${id}/overrides`] = newSet
            ├── activeTenant = id
            └── schedulePersist()                       // existing debounced save
```

`createTenant` is a new store action. It collapses three calls
(`ensureTenantOverrideSet` + populate + `setActiveTenant`) into one atomic
transition so the dropdown can't briefly show the new tenant id without
the override set being loaded yet.

### Fork helper

```ts
// btech-token-studio/src/shared/tenant-fork.ts (new file)

const ALLOWED_PREFIXES = [
  'color.brand',
  'color.bg',
  'radius',
  'typography.fontFamily',
];

/**
 * Walk every base set's tree, harvest leaves whose path falls under an
 * allowed prefix, and emit them into a single override tree shaped like
 * `tenants/<id>/overrides.json`. Values are deep-cloned from base.
 */
export function forkDefaultIntoTenant(
  sets: Record<string, TokenSet>,
  tenantId: string,
): TokenSet;
```

The prefix list is **duplicated** from the boundary validator
(`tools/validators/boundary.ts`). This is intentional — the alternative is
a shared module imported from both the build-time tool and the plugin
bundle, which means the plugin has to wire `tools/` into its
TypeScript include paths and bundling. The list is short and stable; we
add a comment in both files referencing the other so future drift is at
least visible.

The plugin-side copy is the **looser** of the two checks (it can never
add paths the validator forbids, only fail to include paths the validator
would have allowed) — divergence is therefore safe in the direction
we're likely to drift.

### ID validation rules

- Format: `^[a-z][a-z0-9-]{1,30}$` (lowercase alpha first char, 2–31
  chars total, alphanumeric + hyphen). Mirrors what the boundary
  validator and folder name conventions already accept.
- Reserved: `default` is forbidden. The current sources have no
  `default/` folder, but we keep the name reserved so it can't shadow the
  base later.
- Collision: live-checked against `Object.keys(sets)` for any id matching
  `tenants/<input>/`. Inline error: "A tenant with this id already
  exists."

### Edge cases

| Case | Behaviour |
|------|-----------|
| Designer cancels the modal | No state change. `showCreateTenant` flips back to `false`. |
| Designer confirms with no base sets loaded (sets is `{}`) | Modal disables Create. Status text: "Pull from main first to load the default brand." |
| Designer creates tenant `acme`, edits a value, then runs Clear changes | The locally-created tenant disappears entirely (already-correct behaviour in `discardAll` thanks to the `originalTree.length === 0` rule for `tenants/*` sets). |
| Designer creates tenant `acme`, switches away to Default before pushing | The tenant remains in `sets` and is selectable from the dropdown again. Push will still write it. Switching does NOT discard locally-created tenants — only edits to existing pulled sets. |
| Designer creates tenant `acme`, pushes successfully | `snapshotAfterPush` flips `originalTree = current tree`, so future Clear changes reverts to "the values I just pushed" rather than dropping the tenant. Same shape as base sets after push. |

### What gets persisted

The new override set rides the existing `schedulePersist` flow — same as
any edit. No new persistence surface. Reload reconstructs the tenant from
`figma.clientStorage` exactly the way it does for any other dirty set.

## Architecture impact

| Module | Change |
|--------|--------|
| `btech-token-studio/src/shared/tenant-fork.ts` | New. Pure helper: `forkDefaultIntoTenant(sets, id) → TokenSet`. Owns the duplicated `ALLOWED_PREFIXES` list. |
| `btech-token-studio/src/ui/store/tokens.ts` | Add `createTenant(id)` action. Internally calls `forkDefaultIntoTenant`, inserts the set, sets `activeTenant`, schedules persist. |
| `btech-token-studio/src/ui/components/CreateTenantModal.tsx` | New. Single-field form modal. |
| `btech-token-studio/src/ui/components/ThemeSwitcher.tsx` | Append `+ New tenant…` entry; opens modal. |
| `btech-token-studio/src/ui/styles/globals.css` | Divider rule for the dropdown (visual separator between tenant list and create entry); modal field styles already exist. |
| `tools/validators/boundary.ts` | One-line comment: "Mirror this list in `btech-token-studio/src/shared/tenant-fork.ts`." |

No changes to: tenant-resolver, sync flow, generators, CI, schemas.

## Verification

### Unit (pure helper)
1. `forkDefaultIntoTenant({}, 'acme')` → returns set with empty tree.
   `dirty: true`, `originalTree: {}`. (The modal blocks this path in the
   UI, but the helper stays robust.)
2. Given a base set whose tree contains `color.brand.primary`,
   `color.text.neutral`, and `spacing.xs` → returned tree contains only
   `color.brand.primary`. Forbidden prefixes are dropped silently.
3. Values in the returned tree are deep-cloned (mutating the result
   doesn't affect the input base).

### Component (CreateTenantModal)
4. Type `Acme` → live error shows "Lowercase letters, digits, and
   hyphens only." Create disabled.
5. Type `bspace` (existing tenant) → live error "A tenant with this id
   already exists." Create disabled.
6. Type `acme` → no error. Create enabled.
7. Cancel → modal closes, `showCreateTenant === false`,
   `activeTenant` unchanged.
8. Confirm `acme` with base loaded → modal closes, `sets['tenants/acme/overrides']` exists,
   `activeTenant === 'acme'`, the new set is dirty.

### End-to-end (manual in Figma)
9. Pull main. Tenant dropdown shows `Default` and `Bspace`.
10. Select `+ New tenant…` → modal opens.
11. Enter `acme` → confirm. Dropdown now reads `Acme`. Token list shows
    base values (because acme's overrides match base — that's the fork
    invariant).
12. Edit `color.brand.primary` to a new color. Push modal shows one dirty
    set: `packages/tokens/sources/tenants/acme/overrides.json`.
13. Push. PR contains the new file at the expected path with the full
    forked tree (every allowed leaf seeded from base, with the designer's
    edit applied). Push always writes the full tree of a dirty set — it
    does not diff against `originalTree`.
14. Run `pnpm validate` against the new file → boundary validator passes.

### TypeScript
15. `pnpm --filter @btech/token-studio tsc --noEmit` clean.

## Open / Deferred

- **Push payload size.** Forking copies every allowed leaf, so the
  initial override file may have ~40–80 entries that all match base.
  Decision: ship as-is. The boundary validator will accept a no-op leaf
  fine, and the auto-version logic only triggers a tenant patch when the
  file *content* differs from main — which it will, by definition, since
  the file is new. If file size becomes a concern we can prune leaves
  whose value === base value at push time. Not in this iteration.
- **Default tenant folder.** Reserved name only; no folder exists.
  Future work could materialise a `tenants/default/overrides.json`
  containing the canonical brand for documentation/diff purposes, but
  it's not required for the create flow.
- **Tenant delete / rename.** Out of scope; covered by a follow-up spec.
- **Boundary list duplication.** Accepted for now (see "Fork helper"
  above). If the prefix list grows or starts changing per release, we
  promote it to a shared package and import from both sides.
