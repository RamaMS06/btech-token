# BTech Design System

Multi-platform, multi-tenant design tokens for Web, Flutter, and Python. One
source under `packages/tokens/sources/` compiles into platform outputs:

| Package | Platform | Registry |
|---|---|---|
| `@btech/tokens` | Web — TypeScript API + CSS variables | Azure Artifacts `btech` (npm) |
| `btech_tokens` | Flutter — Dart API + tenant themes | pub.dev (path dep in dev) |
| `btech-tokens` | Python — typed dataclass API + `to_css()` for Streamlit / Gradio / NiceGUI | Azure Artifacts `btech` (PyPI) |

---

## Setup — Azure Artifacts Authentication

`@btech/tokens` is published to the **btech** Azure Artifacts feed. Consuming
it requires a Personal Access Token (PAT) in your global `~/.npmrc`.

### Quick Setup (recommended)

Run this once from the repo root after cloning:

```bash
pnpm install
pnpm setup:auth
```

The script will:
1. Prompt for your PAT (masked input).
2. Validate it against the feed.
3. Base64-encode and write the auth block to your global `~/.npmrc`.
4. Stop — safe to re-run, never touches other feed blocks (e.g. `buma-dev`).

**Generate a PAT first** at
[buma.visualstudio.com/_usersSettings/tokens](https://buma.visualstudio.com/_usersSettings/tokens)
with scope **Packaging → Read & Write** (1 year expiration recommended).

**Verify:**

```bash
npm view @btech/tokens --registry https://buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/
```

> This script manages the `btech` feed only. Other feeds (e.g. `buma-dev`) are
> scoped to their own projects — set them up per the instructions in those repos.

### Manual Setup (fallback)

If `pnpm setup:auth` is unavailable (e.g. outside the monorepo), add this block
to your global `~/.npmrc` manually — replace `<base64-pat>` with your
base64-encoded PAT:

```ini
; begin btech auth token
//buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/:username=buma
//buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/:_password=<base64-pat>
//buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/:email=npm requires email to be set but doesn't use the value
//buma.pkgs.visualstudio.com/_packaging/btech/npm/:username=buma
//buma.pkgs.visualstudio.com/_packaging/btech/npm/:_password=<base64-pat>
//buma.pkgs.visualstudio.com/_packaging/btech/npm/:email=npm requires email to be set but doesn't use the value
; end btech auth token
```

Base64-encode your PAT with:

```bash
# macOS / Linux / Windows (PowerShell)
node -e "process.stdout.write(Buffer.from(process.argv[1]).toString('base64'))" "YOUR_PAT_HERE"
```

> **CI Pipelines** — no setup needed. Pipelines authenticate automatically via
> `System.AccessToken`. No PAT or env var required.

---

## Quick Start — Consuming Tokens

### Web (React / Vue / any CSS)

Your project's `.npmrc` must point to the `btech` feed:

```ini
@btech:registry=https://buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/
```

Then install:

```bash
pnpm add @btech/tokens
```

**Setup (once at app entry):**

```ts
import '@btech/tokens/styles.css';
import { activateTenant } from '@btech/tokens';

// Call once after user login — CSS cascade handles the rest
activateTenant({ tenant: user.tenantId });
```

---

### Using `token()` — Type-safe Token Access

```ts
import { token } from '@btech/tokens';

// CSS-in-JS / inline style / Vue :style binding
const buttonStyles = {
  backgroundColor: token('color.background.primary'),
  color:           token('color.text.on-primary'),
  borderRadius:    token('radius.interactive'),
  padding:         `${token('spacing.sm')} ${token('spacing.md')}`,
};

// With CSS fallback value
token('color.background.primary', '#15803d')
// → "var(--btech-color-background-primary, #15803d)"

// Just the CSS variable name (for SCSS #{} or third-party libs)
import { cssVar } from '@btech/tokens';
cssVar('color.background.primary')
// → "--btech-color-background-primary"
```

**TypeScript catches typos at compile time:**

```ts
token('color.backgrond.primary')  // ❌ Type error — typo caught
token('color.background.primary') // ✅
```

---

### Using CSS Variables Directly

```css
.btn-primary {
  background:    var(--btech-color-background-primary);
  color:         var(--btech-color-text-on-primary);
  border-radius: var(--btech-radius-interactive);
  padding:       var(--btech-spacing-sm) var(--btech-spacing-md);
}
```

---

### Multi-Tenant Switching

```ts
// After login: set once, all components update automatically
activateTenant({ tenant: 'bspace' });

// Or directly via DOM
document.documentElement.setAttribute('data-tenant', 'bspace');
```

```html
<!-- Scoped tenant region (useful for previews or mixed-tenant views) -->
<div data-tenant="bspace">
  <Button /> <!-- bspace theme -->
</div>
```

---

### Flutter

**Local / monorepo (development):**

```yaml
# pubspec.yaml
dependencies:
  btech_tokens:
    path: ../../packages/tokens/platforms/flutter
```

**Published release:**

```yaml
# pubspec.yaml
dependencies:
  btech_tokens:
    git:
      url: https://dev.azure.com/buma/BUMA%20-%20Bspace%20Design%20System/_git/btech-ds
      ref: main
      path: packages/tokens/platforms/flutter
```

**Usage:**

```dart
// main.dart — set tenant once
MaterialApp(
  theme: BTechTheme.forTenant('bspace', Brightness.light),
  home: HomePage(),
);

// Inside widgets — tenant-aware via BuildContext
Container(
  color: context.btechColor.background.primary,
  child: Text(
    'Hello',
    style: TextStyle(color: context.btechColor.text.neutral),
  ),
)
```

---

### Python (Streamlit / Gradio / NiceGUI / notebooks)

```bash
pip install keyring artifacts-keyring
pip install \
  --index-url https://pkgs.dev.azure.com/buma/BUMA%20-%20Bspace%20Design%20System/_packaging/btech/pypi/simple/ \
  btech-tokens
# Or, for a tenant variant:
pip install --index-url ... btech-tokens-bspace
```

```python
from btech_tokens import BTechColor, BTechSpacing, set_mode, LIGHT, DARK, to_css

BTechColor.bg.primary             # '#ffffff'
BTechSpacing.md                   # 12.0

set_mode('dark')
BTechColor.bg.primary             # '#181c20'

# CSS injection for raw HTML/CSS frameworks (Streamlit example):
import streamlit as st
st.markdown(f'<style>{to_css()}</style>', unsafe_allow_html=True)
```

Designed for **single-process UI consumers**. For multi-user-deployed dashboards
where two users may want different modes, use the deterministic `LIGHT` / `DARK`
namespace constants instead of `set_mode`. See the
[base package README](packages/tokens/platforms/python/token/README.md) for full
API + tenant + Streamlit / Gradio / NiceGUI examples.

---

## Token Naming Convention

```
[category].[property].[role].[emphasis].[state]
```

| Segment | Examples |
|---|---|
| `category` | `color`, `spacing`, `radius`, `typography`, `motion`, `shadow` |
| `property` | `background`, `text`, `stroke`, `icon` |
| `role` | `primary`, `neutral`, `danger`, `success`, `warning` |
| `emphasis` | `subtle`, `strong`, `inverse` |
| `state` | `hover`, `disabled`, `base`, `bolder` |

**Examples:**

```
color.background.primary          → primary CTA background (per tenant)
color.background.primary.hover    → hover state
color.text.neutral                → default body text
color.text.neutral.subtle         → secondary / placeholder
color.text.on-primary             → text on primary background
spacing.md                        → 16px
radius.interactive                → button/input corner radius
```

**CSS variable mapping** — dots → dashes, prefixed `--btech-`:

```
color.background.primary  →  --btech-color-background-primary
spacing.md                →  --btech-spacing-md
```

---

## Token Layer Architecture

```
packages/tokens/
├── sources/
│   ├── core/          Primitive tokens   — raw values (color.blue.500)
│   ├── semantic/      Semantic tokens    — meaningful names (color.background.primary)
│   ├── components/    Component tokens   — scoped (button.primary.background)
│   └── tenants/
│       └── bspace/    Brand overrides for bspace tenant
├── generators/        Style Dictionary formatters (web, flutter, python)
├── platforms/
│   ├── web/           @btech/tokens — TypeScript + CSS output
│   ├── flutter/       btech_tokens  — Dart output
│   └── python/        (future) PyPI output
└── sd.config.ts       Style Dictionary entry point
```

**Rule:** components reference **semantic** or **component** tokens only —
never primitive tokens directly.

---

## Quick Start — Editing Tokens

```
1. Edit  packages/tokens/sources/tenants/<id>/overrides.json   — tenant brand values
         packages/tokens/sources/semantic/color.json           — semantic meaning
         packages/tokens/sources/core/color.primitive.json     — primitive palette

2. pnpm generate        — regenerate all Web/Flutter/CSS outputs

3. pnpm validate        — contrast + boundary checks

4. git push             — CI auto-commits generated files to your branch

5. Open PR to main      — validate pipeline is the final gate
```

> **Do not edit** `packages/tokens/platforms/**/src/` or `**/lib/src/` —
> these are auto-generated and will be overwritten by `pnpm generate`.

**Add a new tenant:**

```bash
pnpm add-tenant
# Interactive CLI: enter tenant ID, primary color, border radius
```

---

## `token()` vs `var()` — When to Use Which

| Context | Use |
|---|---|
| CSS / SCSS file | `var(--btech-color-background-primary)` |
| React inline style | `token('color.background.primary')` |
| Vue `:style` binding | `token('color.background.primary')` |
| CSS-in-JS (emotion, styled-components) | `token('color.background.primary')` |
| Chart.js / Canvas / D3 | `token('color.background.primary')` |
| SCSS variable name | `cssVar('color.background.primary')` |
| Flutter | `context.btechColor.background.primary` |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 20.x |
| pnpm | 9.x |
| Flutter | 3.22.x stable |

```bash
pnpm install
```

---

## CI/CD — Azure Pipelines

| Pipeline | Trigger | Purpose |
|---|---|---|
| `btech-ds.validate` | PR / push to `main` | Schema · contrast · sync check · flutter analyze |
| `btech-ds.generate` | Push touching `sources/**` | Auto-generate outputs, commit back to branch |
| `btech-ds.publish` | Push `v*` tag (manual) | Build + publish to Azure Artifacts |
| `btech-ds.auto-version` | PR merged to `main` | Bump semver, tag, publish |

**Release flow (hybrid versioning):**

Each package tracks its own version. PR labels control what gets bumped:

| Label | Effect |
|---|---|
| `release:major\|minor\|patch\|rc` | Semver bump type (default `patch`) |
| `scope:all` | Bump base + all tenants (lockstep) |
| `scope:base` | Bump only base packages (`@btech/tokens`, `btech_tokens`) |
| `scope:tenants` | Bump only tenant packages |
| `scope:tenant:<id>` | Bump a single tenant (e.g. `scope:tenant:bspace`) |
| `no-release` | Skip publishing (docs, chore PRs) |
| *(no scope label)* | Auto-detect from changed files in `sources/` |

Tenant-only bumps commit new package.json(s) to main **without** a git tag — run `publish.yml` manually to release them. Base-version bumps tag + auto-publish as before.

Local bump (`pnpm bump`) supports the same flags: `--scope=<s>`, `--auto`, `--dry-run`. See **[docs/architecture/versioning.md](./docs/architecture/versioning.md)** for the full decision matrix.

---

## Deeper Docs

- [docs/architecture.md](./docs/architecture.md) — Pipeline, token model, naming conventions
- [docs/architecture/versioning.md](./docs/architecture/versioning.md) — Hybrid auto-scope versioning
- [docs/contributing.md](./docs/contributing.md) — Token maintainer guide (add/modify tenants, validators)
- [docs/contributing-ui.md](./docs/contributing-ui.md) — **UI component developer guide** (slicing pipeline, reference repos, Figma MCP setup)
- [docs/architecture/slicing-workflow.md](./docs/architecture/slicing-workflow.md) — Step-by-step Figma → 3 frameworks
- [docs/ci-cd.md](./docs/ci-cd.md) — Pipeline details, release flow, versioning
