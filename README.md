# BTech Design Tokens

Multi-platform, multi-tenant design tokens for Web and Flutter. One source under
`tokens/` compiles into three outputs:

- `@ramaMS06/tokens-web` — TypeScript API + CSS variables (GitHub Packages)
- `btech_tokens`          — Dart/Flutter API + tenant themes
- `dist/styles.css`       — CSS variables with per-tenant overrides

---

## Quick Start — Consuming Tokens

### Web (React / Vue / anything that runs CSS)

**Install:**

```
pnpm add @ramaMS06/tokens-web
```

Add this to your repo's `.npmrc`:

```
@ramaMS06:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**Setup (once at app entry):**

```ts
import '@ramaMS06/tokens-web/styles.css';
import { activateTenant } from '@ramaMS06/tokens-web';

// Call once after user login — CSS cascade handles the rest
activateTenant({ tenant: user.tenantId });
```

---

### Using `token()` — Type-safe Token Access

Inspired by Atlassian's `@atlaskit/tokens`, the `token()` helper gives you
**autocomplete and type-safety** for every token name. TypeScript will catch
any invalid or mistyped token path at compile time.

```ts
import { token } from '@ramaMS06/tokens-web';

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
import { cssVar } from '@ramaMS06/tokens-web';
cssVar('color.background.primary')
// → "--btech-color-background-primary"
```

**TypeScript will error on invalid paths:**

```ts
token('color.backgrond.primary')  // ❌ Type error — typo caught at compile time
token('color.background.primary') // ✅
```

**All valid token paths are exported as `TokenPath`:**

```ts
import type { TokenPath } from '@ramaMS06/tokens-web';

function applyToken(path: TokenPath) { ... }
```

---

### Using CSS Variables Directly

For plain CSS / SCSS files where `token()` cannot be used:

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

Set `data-tenant` **once** on `<html>` — CSS cascade updates every component automatically.
No per-component changes needed.

```ts
// After login: set once, everything updates
activateTenant({ tenant: 'tenant-bjb' });

// Or directly via DOM
document.documentElement.setAttribute('data-tenant', 'tenant-a');
```

```html
<!-- Side-by-side tenant preview (e.g. design review) -->
<div data-tenant="tenant-a">
  <Button /> <!-- blue theme -->
</div>
<div data-tenant="tenant-bjb">
  <Button /> <!-- red theme, same component -->
</div>
```

---

### Flutter

```yaml
# pubspec.yaml
dependencies:
  btech_tokens:
    git:
      url: https://github.com/RamaMS06/btech-token.git
      ref: main
      path: packages/tokens-dart
```

```dart
// main.dart — set tenant once
MaterialApp(
  theme: BTechTheme.forTenant('tenant-bjb', Brightness.light),
  home: HomePage(),
);

// Inside widgets — tenant-aware via BuildContext
Container(
  color:  context.btechColor.background.primary,   // Color (IS a Color, not a getter)
  child:  Text(
    'Hello',
    style: TextStyle(color: context.btechColor.text.neutral),
  ),
)

// Variant states
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: context.btechColor.background.primary,
    // hover variant — accessible as a field, not a separate token call
    // (hover resolved by Flutter gesture layer, not CSS)
  ),
)
```

---

## Token Naming Convention

Tokens follow a predictable grammar — same philosophy as Atlassian Design System:

```
[category].[property].[role].[emphasis].[state]
```

| Segment | Examples | Notes |
|---|---|---|
| `category` | `color`, `spacing`, `radius`, `typography`, `motion`, `shadow` | Top-level domain |
| `property` | `background`, `text`, `stroke`, `icon` | What UI element receives this token |
| `role` | `primary`, `neutral`, `danger`, `success`, `warning` | Semantic meaning / brand role |
| `emphasis` | `subtle`, `strong`, `inverse` | Visual weight variant |
| `state` | `hover`, `disabled`, `base`, `bolder` | Interaction or hierarchy state |

**Examples:**

```
color.background.primary          → primary CTA background (green/blue/red per tenant)
color.background.primary.hover    → hover state of primary background
color.text.neutral                → default body text
color.text.neutral.subtle         → secondary / placeholder text
color.text.neutral.disabled       → disabled text
color.text.on-primary             → text on top of a primary background
color.stroke.neutral              → default border / divider
color.stroke.neutral.strong       → stronger border for emphasis
spacing.md                        → 16px
radius.interactive                → button/input corner radius (overridable per tenant)
radius.card                       → card corner radius
typography.fontFamily.sans        → brand sans-serif font stack
```

**CSS Variable mapping** — dots become dashes, prefixed with `--btech-`:

```
color.background.primary  →  --btech-color-background-primary
spacing.md                →  --btech-spacing-md
radius.interactive        →  --btech-radius-interactive
```

**Primitive tokens** (raw palette values — do not use directly in components):

```
color.blue.500       →  #3b82f6
color.neutral.900    →  #111827
color.green.700      →  #15803d
```

---

## Token Layer Architecture

```
tokens/
├── core/          Primitive tokens   — raw values (color.blue.500, radius.md)
├── semantic/      Semantic tokens    — meaningful names (color.background.primary)
├── components/    Component tokens   — scoped to a component (button.primary.background)
└── tenants/
    ├── default/   Fallback values for all tokens
    ├── tenant-a/  Brand overrides for Tenant A
    └── tenant-bjb/ Brand overrides for Tenant BJB
```

**Rule:** components should only reference **semantic** or **component** tokens,
never primitive tokens directly. The `token()` function enforces this — primitives
are valid `TokenPath` values but are clearly labelled as `color.blue.500` etc.,
making intent obvious.

---

## Quick Start — Editing Tokens

```
1. Edit  tokens/tenants/<id>/overrides.json   — tenant brand values
         tokens/semantic/color.json           — semantic meaning
         tokens/core/color.primitive.json     — primitive palette
2. pnpm generate                              — regenerate all TS/Dart/CSS outputs
3. pnpm validate                              — contrast + boundary checks
4. git push                                   — CI auto-commits generated files
5. Open PR to main                            — validate.yml is the final gate
```

> **Do not edit** `packages/**/src/**` or `packages/**/lib/src/**` —
> those are auto-generated. Changes will be overwritten by `pnpm generate`.

**Add a new tenant:**

```
pnpm add-tenant
# Interactive CLI: enter tenant ID, primary color, border radius
```

---

## Token() vs var() — When to Use Which

| Context | Use |
|---|---|
| CSS / SCSS file | `var(--btech-color-background-primary)` |
| React inline style | `token('color.background.primary')` |
| Vue `:style` binding | `token('color.background.primary')` |
| CSS-in-JS (emotion, styled-components) | `token('color.background.primary')` |
| Chart.js / Canvas / D3 | `token('color.background.primary')` |
| SCSS variable name | `cssVar('color.background.primary')` |
| Flutter | `context.btechColor.background.primary` |

The `token()` function always returns a `var(--btech-*)` string — so it works
anywhere a CSS value is accepted in JS/TS.

---

## Prerequisites

Node 20, pnpm 9, Flutter 3.22.x (stable).

```
pnpm install
```

---

## Deeper Docs

- [docs/architecture.md](./docs/architecture.md) — Pipeline, token model, naming conventions
- [docs/contributing.md](./docs/contributing.md) — Add/modify tenants, local dev, validators
- [docs/ci-cd.md](./docs/ci-cd.md) — CI workflows, release flow, versioning
