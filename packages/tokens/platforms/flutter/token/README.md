# btech_tokens — Flutter Design Tokens

Auto-generated Flutter package that exposes BTech Design System tokens (color, radius, spacing, stroke, shadow, typography) as type-safe Dart constants.

> **Do not edit files in this package manually.**
> All `.dart` files under `lib/src/` are regenerated every time `pnpm generate` runs.
> Edit token values in `packages/tokens/sources/` then run the generator.

---

## Table of Contents

1. [Package structure](#package-structure)
2. [Setup](#setup)
3. [Usage](#usage)
   - [Pattern A — Static class (no context)](#pattern-a--static-class-no-context)
   - [Pattern B — Const instance (light only)](#pattern-b--const-instance-light-only)
   - [Pattern C — Context extension (reactive, preferred)](#pattern-c--context-extension-reactive-preferred)
4. [Token categories](#token-categories)
5. [Inner shadow](#inner-shadow)
6. [Multi-tenant](#multi-tenant)
7. [Changing token values](#changing-token-values)
8. [Generated file locations](#generated-file-locations)
9. [CI pipeline](#ci-pipeline)

---

## Package structure

```
packages/tokens/platforms/flutter/
├── pubspec.yaml
├── lib/
│   ├── btech_tokens.dart          ← public barrel (import this)
│   └── src/
│       ├── color/
│       │   ├── color.dart         ← barrel
│       │   ├── color.theme.dart   ← BTechColorTheme + BTechColorText/Bg/… classes
│       │   ├── color.token.dart   ← BTechColor static class (Pattern A)
│       │   └── shades.color.dart  ← BTechShadesColor (raw palette)
│       ├── radius/
│       │   ├── radius.theme.dart  ← BTechRadiusTheme ThemeExtension
│       │   └── radius.token.dart  ← BTechRadius static class
│       ├── spacing/
│       │   └── spacing.token.dart ← BTechSpacing static class
│       ├── stroke/
│       │   └── stroke.token.dart  ← BTechStroke static class
│       ├── shadow/
│       │   ├── shadow.token.dart  ← BTechShadow (nested groups)
│       │   └── inner_shadow.dart  ← InnerShadowDecoration utility
│       ├── typography/
│       │   ├── font.token.dart    ← BTechTypography static class
│       │   └── font_registry.dart ← BTechFontRegistry
│       ├── defaults.dart          ← btechColor, btechRadius const instances + btechTheme()
│       ├── theme_builder.dart     ← buildBtechTheme() shared builder
│       └── context.dart           ← BuildContext extensions (.btechColor, .btechRadius, .btechFont)
└── tenants/
    ├── bspace/                    ← btech_tokens_bspace package
    ├── tenant-a/                  ← btech_tokens_tenant_a package
    └── tenant-bjb/                ← btech_tokens_tenant_bjb package
```

---

## Setup

### 1. Add dependency

In your app's `pubspec.yaml`, depend on the **tenant package** — not `btech_tokens` directly.
The tenant package re-exports everything and provides tenant-specific values.

```yaml
# pubspec.yaml
dependencies:
  btech_tokens_bspace:
    path: ../../packages/tokens/platforms/flutter/tenants/bspace
```

Available tenants: `bspace`, `tenant-a`, `tenant-bjb`

### 2. Wire the theme

```dart
import 'package:btech_tokens_bspace/btech_tokens_bspace.dart';

MaterialApp(
  theme:     btechTheme(),
  darkTheme: btechTheme(brightness: Brightness.dark),
  themeMode: ThemeMode.system,  // or ThemeMode.light / ThemeMode.dark
)
```

That's it. All `context.btech*` calls now resolve to bspace values and react to the system brightness.

---

## Usage

There are three access patterns. Use **Pattern C** in all `btech_ui` components.

### Pattern A — Static class (no context)

Available anywhere, even outside a widget tree. Always returns **light-mode** values.
Good for constants, tests, or code that doesn't have a `BuildContext`.

```dart
// Color
BTechColor.bg.primary          // Color
BTechColor.text.secondary      // Color
BTechColor.brand.primary       // Color
BTechColor.ext.successSubtler  // Color

// Radius
BTechRadius.sm   // 8.0
BTechRadius.md   // 12.0
BTechRadius.rd   // 9999.0

// Spacing
BTechSpacing.xs  // 4.0
BTechSpacing.md  // 12.0
BTechSpacing.xl  // 24.0

// Stroke
BTechStroke.sm   // 1.0

// Typography
BTechTypography.heading.h1           // TextStyle
BTechTypography.body.regular         // TextStyle
BTechTypography.subheading.h5        // TextStyle

// Shadow
BTechShadow.elevation.md             // List<BoxShadow>
BTechShadow.button.pressed           // List<BoxShadow>  (inset — use InnerShadowDecoration)
BTechShadow.table.left               // List<BoxShadow>
```

### Pattern B — Const instance (light only)

Pre-built const instances. Same values as Pattern A, no context needed.

```dart
btechColor.bg.primary      // Color (light)
btechRadius.sm             // double
```

### Pattern C — Context extension (reactive, preferred)

Reads from the active `ThemeExtension`, so it reacts to both **tenant switching** and **light/dark mode**.
Use this in every widget inside `btech_ui`.

```dart
// inside build(BuildContext context):
final c = context.btechColor;
final r = context.btechRadius;

c.bg.primary               // Color — auto light/dark
c.text.secondary           // Color
c.brand.primary            // Color
c.ext.warningSubtler       // Color
c.border.primary           // Color

r.sm                       // double
r.md                       // double
r.rd                       // double
```

---

## Token categories

### Color

| Group | Example accessors |
|---|---|
| `bg` | `.primary` `.secondary` `.tertiary` `.inverse` `.subtle` `.subtler` `.subtlest` |
| `text` | `.primary` `.secondary` `.tertiary` `.inverse` `.disabled` `.link` `.success` `.error` `.warning` `.info` |
| `icon` | same as `text` |
| `border` | `.primary` `.secondary` `.tertiary` `.inverse` `.disabled` |
| `brand` | `.primary` `.primarySubtle` `.primaryBold` `.secondary` `.secondarySubtle` `.secondaryBold` |
| `ext` | `.successSubtler` `.successSubtle` `.success` `.successBold` `.info*` `.warning*` `.error*` |

### Radius

| Token | Value | Use |
|---|---|---|
| `s2xs` | 2 px | Chip, tag |
| `xs` | 4 px | Input, small button |
| `sm` | 8 px | Button, card corner |
| `md` | 12 px | Modal, sheet |
| `lg` | 16 px | Large card |
| `xl` | 24 px | Bottom sheet |
| `s2xl` | 32 px | Hero card |
| `rd` | 9999 px | Pill / fully rounded |

### Spacing

`s2xs` (2) · `xs` (4) · `sm` (8) · `md` (12) · `lg` (16) · `xl` (24) · `s2xl` (32) · `s3xl` (48)

### Shadow

| Token | Type | Use |
|---|---|---|
| `BTechShadow.elevation.xs` | drop shadow | Subtle lift |
| `BTechShadow.elevation.sm` | drop shadow | Card, input focus |
| `BTechShadow.elevation.md` | drop shadow | Dropdown |
| `BTechShadow.elevation.lg` | drop shadow | Modal |
| `BTechShadow.elevation.xl` | drop shadow | Full-screen overlay |
| `BTechShadow.button.pressed` | **inset** | Button pressed state |
| `BTechShadow.table.left` | drop shadow | Sticky left column edge |
| `BTechShadow.table.right` | drop shadow | Sticky right column edge |

```dart
// Drop shadow — use with BoxDecoration
Container(
  decoration: BoxDecoration(
    color: context.btechColor.bg.primary,
    borderRadius: BorderRadius.circular(BTechRadius.sm),
    boxShadow: BTechShadow.elevation.md,
  ),
)
```

---

## Inner shadow

Flutter's `BoxShadow(blurStyle: BlurStyle.inner)` does not work correctly on the Impeller renderer (Flutter ≥ 3.10). Use `InnerShadowDecoration` instead — it is a drop-in for `BoxDecoration` that renders the inset effect correctly on both Skia and Impeller.

```dart
// Pressed button container
Container(
  decoration: InnerShadowDecoration(
    color: context.btechColor.bg.subtle,
    borderRadius: BorderRadius.circular(BTechRadius.sm),
    border: Border.all(color: context.btechColor.border.primary),
    boxShadow: BTechShadow.button.pressed,   // passes List<BoxShadow> directly
  ),
  child: ...,
)
```

`InnerShadowDecoration` supports `lerp` — so it works with `AnimatedContainer` **as long as both states use `InnerShadowDecoration`**. To animate between a drop shadow (idle) and an inset shadow (pressed), use a `Stack` with `AnimatedOpacity`:

```dart
Stack(
  children: [
    // Idle elevation (BoxDecoration)
    AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      decoration: BoxDecoration(
        color: _pressed ? c.bg.subtle : c.bg.primary,
        borderRadius: BorderRadius.circular(r.sm),
        boxShadow: _pressed ? [] : BTechShadow.elevation.sm,
      ),
    ),
    // Pressed inner shadow fades in
    AnimatedOpacity(
      duration: const Duration(milliseconds: 150),
      opacity: _pressed ? 1.0 : 0.0,
      child: Container(
        decoration: InnerShadowDecoration(
          borderRadius: BorderRadius.circular(r.sm),
          boxShadow: BTechShadow.button.pressed,
        ),
      ),
    ),
  ],
)
```

---

## Multi-tenant

Each tenant is a separate Flutter package that re-exports `btech_tokens` and overrides the token values it needs. The app only imports the tenant package — never `btech_tokens` directly.

```
packages/tokens/platforms/flutter/tenants/
├── bspace/
│   ├── pubspec.yaml          → name: btech_tokens_bspace
│   └── lib/
│       └── btech_tokens_bspace.dart   → btechTheme() with bspace overrides
├── tenant-a/
│   └── lib/btech_tokens_tenant_a.dart
└── tenant-bjb/
    └── lib/btech_tokens_tenant_bjb.dart
```

All `BTechColor.*`, `context.btechColor.*`, `btechColor.*` automatically resolve to the active tenant — no code changes needed when switching tenants, only the pubspec dependency changes.

**Switching tenant at runtime** is not supported — tenant is set at compile time via the package dependency.

---

## Changing token values

### 1. Edit the source JSON

Token sources live in `packages/tokens/sources/`:

| Category | File |
|---|---|
| Color palette | `sources/core/color.primitive.json` |
| Semantic colors | `sources/semantic/color.json` |
| Radius | `sources/core/radius.primitive.json` |
| Spacing | `sources/core/size.primitive.json` |
| Stroke | `sources/core/stroke.primitive.json` |
| Shadow | `sources/core/shadow.primitive.json` |
| Typography | `sources/core/font.primitive.json` + `sources/semantic/typography.json` |
| Tenant overrides | `sources/tenants/{id}/overrides.json` |

All files use the [DTCG](https://tr.designtokens.org/format/) token format:

```json
{
  "radius": {
    "sm": { "$type": "dimension", "$value": "8px" }
  }
}
```

### 2. Regenerate

```bash
# from repo root
pnpm exec tsx packages/tokens/sd.config.ts
```

This regenerates all files under `packages/tokens/platforms/flutter/lib/src/` and all tenant packages.

### 3. Verify

```bash
cd packages/tokens/platforms/flutter
flutter pub get
flutter analyze --no-fatal-infos
```

### 4. The pre-commit hook handles it automatically

`.githooks/pre-commit` detects changes to `sources/` and runs the generator automatically before every commit. No manual step needed when working locally.

---

## Generated file locations

| What | Where |
|---|---|
| Token classes (color, radius, shadow…) | `lib/src/{category}/{category}.token.dart` |
| ThemeExtension definitions | `lib/src/{category}/{category}.theme.dart` |
| Context extensions | `lib/src/context.dart` |
| Default const instances + `btechTheme()` | `lib/src/defaults.dart` |
| Tenant packages | `tenants/{id}/lib/btech_tokens_{id}.dart` |

**None of these files should be edited by hand.** If you notice a bug in generated output, fix the generator in `packages/tokens/generators/flutter/` and re-run.

---

## CI pipeline

| Pipeline | File | Triggered by | What it does |
|---|---|---|---|
| **generate** | `pipelines/generate.yml` | Push to any branch when `sources/**`, `generators/**`, or `sd.config.ts` changes | Runs `pnpm exec tsx packages/tokens/sd.config.ts`, runs `flutter analyze`, commits updated generated files back to the branch with `***NO_CI***` |
| **validate** | `pipelines/validate.yml` | PR targeting `main` | Runs the generator, checks no generated files differ (ensures PR includes up-to-date outputs), runs `flutter analyze` |
| **publish** | `pipelines/publish.yml` | Manual / `v*` tag | Publishes `@btech/tokens` (web package) to Azure Artifacts feed `btech` |
| **auto-version** | `pipelines/auto-version.yml` | PR merge to `main` | Bumps semver, creates git tag, triggers publish |

### Generate pipeline detail

```
sources/** or generators/** changed on a branch
  └─▶ generate.yml
        ├── pnpm install
        ├── flutter install (stable)
        ├── pnpm exec tsx packages/tokens/sd.config.ts   ← regenerates lib/src/
        ├── flutter pub get && flutter analyze
        └── git commit -m "chore(generate): sync …  ***NO_CI***"
              └─▶ push back to same branch (no pipeline loop — ***NO_CI*** skips re-trigger)
```

Auth: uses `System.AccessToken` (built-in Azure Pipelines token). No personal PAT required.
