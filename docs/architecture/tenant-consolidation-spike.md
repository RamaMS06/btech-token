# Spike — Consolidate Tenant Web Packages

**Status:** Proposed · Needs decision
**Branch:** `feat/setup-auth-script` (PR #72538)
**Authors:** Design System team
**Date:** 2026-04

---

## Problem

We currently publish **4 separate web packages** to Azure Artifacts:

| Package | Size (styles.css) | Purpose |
|---|---:|---|
| `@btech/tokens` | 18 KB | Base tokens + default tenant |
| `@btech/tokens-bspace` | 19 KB | Full override CSS for bspace |
| `@btech/tokens-tenant-a` | 19 KB | Full override CSS for tenant-a |
| `@btech/tokens-tenant-bjb` | 19 KB | Full override CSS for tenant-bjb |

Each tenant package is **standalone** — a full duplicate of the base variables
with tenant values substituted in. The consumer installs exactly one of:

```bash
pnpm add @btech/tokens @btech/tokens-bspace
# then: import '@btech/tokens-bspace/styles.css'
```

### Pain points

1. **Publish surface × N** — every release bumps 4 versions in lockstep. RC bumps
   already skip tenants (see `scripts/bump-version.ts` rc branch), but stable
   releases still multiply the blast radius of a mistake.
2. **Version skew risk** — nothing enforces `@btech/tokens` and
   `@btech/tokens-bspace` are on the same version in consumer apps.
3. **No runtime switch** — a consumer app cannot preview two tenants
   side-by-side without loading two full CSS files, which can't both own
   `:root`.
4. **CI/pipeline cost** — 4 `npm publish` calls, 4 tarballs, 4 feed entries.

---

## Proposed architecture

Collapse all tenants into a single `@btech/tokens` CSS file using
`[data-tenant="..."]` selectors:

```css
/* @btech/tokens/dist/styles.css */
:root {
  --btech-color-primary: #default;
  /* …all tokens at default values… */
}

[data-tenant="bspace"] {
  --btech-color-primary: #15803d;       /* override only */
  --btech-color-bg-primary: #0f5132;    /* override only */
  /* …only overridden tokens… */
}

[data-tenant="tenant-a"]   { /* overrides… */ }
[data-tenant="tenant-bjb"] { /* overrides… */ }
```

Consumer:

```html
<html data-tenant="bspace">
  …
</html>
```

```ts
// runtime tenant switch (no reload, no re-install)
document.documentElement.setAttribute('data-tenant', 'tenant-a');
```

No separate tenant package to install.

---

## Measurements

### CSS size

| Strategy | Bundle shipped to consumer | Notes |
|---|---:|---|
| Current (4 packages) | 18 KB (only one tenant loaded) | Full standalone CSS |
| Consolidated | ~20 KB (all tenants in 1 file) | Base + 3 override blocks (~600 B each) |

Per-tenant override count (from generated files):

- `bspace`: ~17 overridden vars (--bg-primary, --brand-primary-*, --radius-*, fonts)
- `tenant-a`: ~14 overridden vars
- `tenant-bjb`: ~16 overridden vars

Override blocks are **far** smaller than the full base (~300 vars), so 1 consolidated
file is **only ~11 % larger than one tenant today** and **73 % smaller than
loading all four**.

### Publish cost

- Current: 4 tarballs, 4 versions, 4 feed publishes per release
- Consolidated: 1 tarball, 1 version, 1 publish

---

## Trade-offs

### ✅ Pros

- **Single source of truth** — 1 package, 1 version, no skew.
- **Runtime tenant switch** — just flip `data-tenant` attribute; useful for admin/preview tooling, side-by-side comparisons, and A/B tests.
- **Simpler CI** — one publish command, no rc/stable tenant branching in `bump-version.ts` or `publish.yml`.
- **Simpler auth setup** — consumer apps only need to know one package name.
- **Matches Flutter architecture intent** — Flutter already ships a single package with tenant themes resolved at runtime via `BTechTheme.forTenant(id)`. Consolidating web brings the two platforms back in alignment.

### ⚠️ Cons

- **All tenants ship to every consumer** — a white-label app for tenant A still downloads tenant B + bjb CSS (~3 × 600 B = 1.8 KB). Negligible today, grows linearly with tenant count.
- **Security / confidentiality** — if one tenant's brand values are confidential (rare for design tokens), bundling them into every consumer breaks isolation. **Not our case** — all tenants under the same parent org.
- **Migration effort** — consumers need to swap `import '@btech/tokens-bspace/styles.css'` → `import '@btech/tokens/styles.css'` + `<html data-tenant="bspace">`. Low effort, but requires a coordinated release.

### Threshold for reversal

We should revisit this decision if **any** of the following become true:

- Tenant count exceeds ~15–20 (CSS size impact starts to matter)
- A tenant legally cannot share its tokens with another tenant's consumer
- A white-label partner contractually refuses to ship "competitor" tokens

---

## Implementation sketch (if approved)

1. **Generator change** — `generators/web/web-tenant-format.ts` becomes
   `web-consolidated-tenants.ts` that **appends** per-tenant override blocks to
   the base `styles.css` instead of writing 3 standalone packages.
2. **Delete tenant packages** — remove `platforms/web/{bspace,tenant-a,tenant-bjb}/`.
3. **Remove tenant publish from `publish.yml`** — only `@btech/tokens` publishes.
4. **Remove tenant sync from `bump-version.ts`** — no more rc branch needed.
5. **Add `activateTenant()` helper** to `@btech/tokens` JS exports:
   ```ts
   export function activateTenant(id: string) {
     document.documentElement.setAttribute('data-tenant', id);
   }
   ```
6. **Update demo apps** (`apps/demo-react`, `apps/demo-vue`) and this repo's
   README to use the new pattern.
7. **Deprecation path** — publish `@btech/tokens-bspace@2.0.0` as a stub that
   re-exports nothing + logs a migration warning; unpublish after 1 release
   cycle. Or: skip deprecation since we are still in RC and have no external
   consumers.

Estimated effort: **~2 days** (generator + publish pipeline + docs + demo apps).

---

## Recommendation

**Go — consolidate, before we exit RC.**

We are still pre-1.0 with no external consumers locked to the `tokens-{tenant}`
package names. The consolidation simplifies CI, removes a whole class of
version-skew bugs, and brings web architecture in line with Flutter. The CSS
size impact is trivial at the current tenant count, and the reversal threshold
(15+ tenants) is years away.

## Next steps

- [ ] Decision meeting — approve / reject / defer
- [ ] If approved: open separate epic `epic/consolidate-tenant-web` with sub-tasks above
- [ ] Update `docs/architecture/flutter-token-architecture.md` cross-reference
