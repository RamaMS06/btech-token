# BTech Design Tokens

Multi-platform, multi-tenant design tokens for Web and Flutter. One source under
`tokens/` compiles into three outputs:

  - `@ramaMS06/tokens-web` — TypeScript API + CSS variables (GitHub Packages)
  - `btech_tokens`         — Dart/Flutter API + tenant themes (pub.dev)
  - `dist/styles.css`      — CSS variables with per-tenant overrides

---

## Quick start — I want to *use* tokens

### Web (React / Vue / anything that runs CSS)

```
pnpm add @ramaMS06/tokens-web
```

Add this to your consumer repo's `.npmrc` (scope is `@ramaMS06`, registry is
GitHub Packages):

```
@ramaMS06:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```ts
// app entry
import '@ramaMS06/tokens-web/styles.css';
```

```tsx
<body data-tenant="tenant-a">
  <button
    style={{
      backgroundColor: 'var(--btech-color-background-primary)',
      color:           'var(--btech-color-text-on-primary)',
      borderRadius:    'var(--btech-radius-interactive)',
    }}
  >
    Submit
  </button>
</body>
```

For the typed TS API:

```ts
import { BTechColor, BTechSpacing, BTechRadius, BTechFont } from '@ramaMS06/tokens-web';
```

### Flutter

```yaml
# pubspec.yaml
dependencies:
  btech_tokens: ^1.0.1
```

```dart
import 'package:btech_tokens/btech_tokens.dart';

MaterialApp(
  theme: BTechTheme.forTenant('tenant-a', Brightness.light),
  home:  HomePage(),
);

// inside widgets — tenant-aware:
context.btechColor.background.primary
context.btechFont.body.md
```

---

## Quick start — I want to *edit* tokens

```
1. edit  tokens/tenants/<id>/overrides.json   (or tokens/core, tokens/semantic)
2. pnpm generate                              (regenerate TS/Dart/CSS outputs)
3. pnpm validate                              (contrast + boundary checks)
4. git push                                   (CI auto-commits generated files)
5. open PR to main                            (validate.yml is the final gate)
```

Do not edit `packages/**/src/**` or `packages/**/lib/src/**` — those are
generated. Edits will be overwritten on the next `pnpm generate`.

To scaffold a new tenant:

```
pnpm add-tenant
```

---

## Deeper docs

  - [docs/architecture.md](./docs/architecture.md)
    High-level pipeline, token model (core / semantic / components / tenants),
    naming conventions across CSS / TS / Dart.

  - [docs/contributing.md](./docs/contributing.md)
    Step-by-step for token maintainers: add/modify tenants, local dev,
    validators, common pitfalls.

  - [docs/ci-cd.md](./docs/ci-cd.md)
    The three workflows, exact trigger paths, the edit → workflow decision
    table, versioning, and release flow.

---

## Prerequisites

Node 20, pnpm 9, Flutter 3.22.x (stable).

```
pnpm install && pnpm bootstrap
```
