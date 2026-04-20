# BTech Design System

Multi-platform, multi-tenant design tokens for Web and Flutter. One source under
`packages/tokens/sources/` compiles into platform outputs:

| Package | Platform | Registry |
|---|---|---|
| `@btech/tokens` | Web — TypeScript API + CSS variables | Azure Artifacts `btech` |
| `btech_tokens` | Flutter — Dart API + tenant themes | pub.dev (path dep in dev) |

---

## Setup — Azure Artifacts Authentication

`@btech/tokens` is published to the **btech** Azure Artifacts feed.
Follow the steps for your OS — same pattern as `buma-dev`.

---

### macOS / Linux

**Step 1 — Generate a Personal Access Token**

1. Go to: **https://buma.visualstudio.com/_usersSettings/tokens**
2. Click **+ New Token**
3. Set:
   - Name: `btech-npm` (or anything descriptive)
   - Organization: `buma`
   - Expiration: 1 year (recommended)
   - Scopes: **Packaging → Read & Write**
4. Click **Create** and copy the token

**Step 2 — Base64-encode your PAT**

Open Terminal and run:

```bash
node -e "require('readline').createInterface({input:process.stdin,output:process.stdout,historySize:0}).question('PAT> ',p=>{console.log(Buffer.from(p.trim()).toString('base64'));process.exit();})"
```

Paste your PAT when prompted → copy the base64 output.

**Step 3 — Add credentials to your global `~/.npmrc`**

```bash
code ~/.npmrc
```

Add the following block (replace `<base64-pat>` with your encoded token):

```ini
; begin auth token — btech feed
//buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/:username=buma
//buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/:_password=<base64-pat>
//buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/:email=npm requires email to be set but doesn't use the value
//buma.pkgs.visualstudio.com/_packaging/btech/npm/:username=buma
//buma.pkgs.visualstudio.com/_packaging/btech/npm/:_password=<base64-pat>
//buma.pkgs.visualstudio.com/_packaging/btech/npm/:email=npm requires email to be set but doesn't use the value
; end auth token
```

**Step 4 — Verify**

```bash
npm view @btech/tokens --registry https://buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/
```

---

### Windows

**Step 1 — Generate a Personal Access Token**

1. Go to: **https://buma.visualstudio.com/_usersSettings/tokens**
2. Click **+ New Token**
3. Set:
   - Name: `btech-npm`
   - Organization: `buma`
   - Expiration: 1 year
   - Scopes: **Packaging → Read & Write**
4. Click **Create** and copy the token

**Step 2 — Base64-encode your PAT**

Open **Command Prompt** or **PowerShell** and run:

```powershell
node -e "require('readline').createInterface({input:process.stdin,output:process.stdout,historySize:0}).question('PAT> ',p=>{console.log(Buffer.from(p.trim()).toString('base64'));process.exit();})"
```

Paste your PAT when prompted → copy the base64 output.

**Step 3 — Add credentials to your global `.npmrc`**

Open your global `.npmrc` file:

```powershell
# PowerShell
code $env:USERPROFILE\.npmrc

# Or Command Prompt
code %USERPROFILE%\.npmrc
```

Add the following block (replace `<base64-pat>` with your encoded token):

```ini
; begin auth token — btech feed
//buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/:username=buma
//buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/:_password=<base64-pat>
//buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/:email=npm requires email to be set but doesn't use the value
//buma.pkgs.visualstudio.com/_packaging/btech/npm/:username=buma
//buma.pkgs.visualstudio.com/_packaging/btech/npm/:_password=<base64-pat>
//buma.pkgs.visualstudio.com/_packaging/btech/npm/:email=npm requires email to be set but doesn't use the value
; end auth token
```

**Step 4 — Verify**

```powershell
npm view @btech/tokens --registry https://buma.pkgs.visualstudio.com/_packaging/btech/npm/registry/
```

---

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
activateTenant({ tenant: 'tenant-bjb' });

// Or directly via DOM
document.documentElement.setAttribute('data-tenant', 'tenant-a');
```

```html
<!-- Side-by-side tenant preview -->
<div data-tenant="tenant-a">
  <Button /> <!-- blue theme -->
</div>
<div data-tenant="tenant-bjb">
  <Button /> <!-- red theme, same component -->
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
  theme: BTechTheme.forTenant('tenant-bjb', Brightness.light),
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
│       ├── default/   Fallback values for all tokens
│       ├── tenant-a/  Brand overrides for Tenant A
│       └── tenant-bjb/ Brand overrides for Tenant BJB
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

**Release flow:**
- Add PR tag `release:major`, `release:minor`, or `release:patch` before merging
- Add `no-release` to skip publishing (docs, chore PRs)
- Default bump is `patch` if no tag is set

---

## Deeper Docs

- [docs/architecture.md](./docs/architecture.md) — Pipeline, token model, naming conventions
- [docs/contributing.md](./docs/contributing.md) — Add/modify tenants, local dev, validators
- [docs/ci-cd.md](./docs/ci-cd.md) — Pipeline details, release flow, versioning
