# BTech Design System — Flutter Token Architecture

> Approved: 2026-04 | Status: Ready for implementation

---

## Goals

1. **Zero manual field maps** — token fields auto-derived from `sources/semantic/*.json`
2. **Per-category ThemeExtension** — `BTechColorTheme`, `BTechRadiusTheme`, `BTechFontTheme`
3. **Nested dot-notation accessors** — `context.btechColor.background.primary` mirrors token path
4. **Leaf nodes ARE Colors** — `BTechColorVariants extends Color` — is a Color AND exposes `.hover`, `.pressed`, etc.
5. **No `.on` group** — `color.text.on` and `color.icon.on` removed from source JSON; not in access tree
6. **Dark mode** — `btechTheme()` supports `Brightness.light` and `Brightness.dark` via separate `btechColorLight`/`btechColorDark` const instances
7. **All tenants in monorepo** — small generated packages, centrally controlled
8. **Three access patterns** — static class `BTechColor.background.primary`, const instance `btechColorLight.background.primary`, context extension `context.btechColor.background.primary`
9. **One-line setup** — `MaterialApp(theme: btechTheme(), darkTheme: btechTheme(brightness: Brightness.dark))`

---

## Repository Structure

```
packages/tokens/
├── generators/flutter/
│   ├── flutter-theme-generator.ts    ← generates *.theme.dart + theme_builder.dart + context.dart
│   ├── flutter-tenant-format.ts      ← generates per-tenant packages
│   └── flutter-generator.ts          ← generates static token classes
├── sources/
│   ├── semantic/
│   │   ├── color.json                ← light mode (NO color.text.on, NO color.icon.on)
│   │   ├── color.dark.json           ← dark mode overrides (empty = dark falls back to light)
│   │   ├── radius.json
│   │   └── typography.json
│   └── tenants/
│       ├── default/overrides.json
│       ├── tenant-bjb/overrides.json
│       └── tenant-a/overrides.json
└── platforms/flutter/
    ├── lib/                           ← btech_tokens base package
    │   ├── btech_tokens.dart          ← barrel export
    │   └── src/
    │       ├── color/color.theme.dart     ← BTechColorVariants + accessor classes + BTechColorTheme + BTechColor
    │       ├── radius/radius.theme.dart   ← BTechRadiusTheme + BTechRadius
    │       ├── font/font.theme.dart       ← BTechFontTheme + BTechFontFamily + BTechFont
    │       ├── theme_builder.dart         ← buildBtechTheme() — ONE place, no duplication
    │       └── context.dart               ← BTechContextExtension
    └── tenants/
        ├── default/
        ├── tenant-bjb/
        └── tenant-a/
```

---

## Token Accessor Design

### Leaf type: `BTechColorVariants extends Color`

Every terminal color node extends `Color`. It IS a Color (default value) AND exposes named variants. Unused variants fall back to the default value.

```dart
class BTechColorVariants extends Color {
  const BTechColorVariants(int value, {
    Color? hover, Color? pressed, Color? subtle, Color? raised,
    Color? disable, Color? bolder, Color? inverse, Color? strong, Color? disabled,
  })  : hover    = hover    ?? Color(value),
        pressed  = pressed  ?? Color(value),
        subtle   = subtle   ?? Color(value),
        raised   = raised   ?? Color(value),
        disable  = disable  ?? Color(value),
        bolder   = bolder   ?? Color(value),
        inverse  = inverse  ?? Color(value),
        strong   = strong   ?? Color(value),
        disabled = disabled ?? Color(value),
        super(value);

  final Color hover, pressed, subtle, raised, disable, bolder, inverse, strong, disabled;
}
```

### Full access tree

```
btechColor  (BTechColorTheme — ThemeExtension)
  .background  (BTechColorBackground)
    .surface      → BTechColorVariants  (.subtle .raised)
    .primary      → BTechColorVariants  (.hover .pressed .disable .subtle .bolder)
    .secondary    → BTechColorVariants  (.hover .pressed .disable .subtle .bolder)
    .danger       → BTechColorVariants  (.hover .pressed .disable .subtle .bolder)
    .success      → BTechColorVariants  (.hover .pressed .disable .subtle .bolder)
    .warning      → BTechColorVariants  (.hover .pressed .disable .subtle .bolder)
    .info         → BTechColorVariants  (.hover .pressed .disable .subtle .bolder)
    .neutral      → BTechColorVariants  (.subtle .bolder)
  .text  (BTechColorText)           ← NO .on group
    .neutral      → BTechColorVariants  (.subtle .disabled .inverse)
    .danger       → BTechColorVariants  (.bolder)
    .success      → BTechColorVariants  (.bolder)
    .warning      → BTechColorVariants  (.bolder)
    .info         → BTechColorVariants  (.bolder)
    .secondary    → BTechColorVariants  (.bolder)
  .icon  (BTechColorIcon)           ← NO .on group
    .neutral      → BTechColorVariants  (.subtle .disabled .inverse)
    .danger       → BTechColorVariants  (.bolder)
    .success      → BTechColorVariants  (.bolder)
    .warning      → BTechColorVariants  (.bolder)
    .info         → BTechColorVariants  (.bolder)
    .secondary    → BTechColorVariants  (.bolder)
  .stroke  (BTechColorStroke)
    .neutral      → BTechColorVariants  (.strong .subtle)
    .primary      → BTechColorVariants  (.bolder)
    .danger       → BTechColorVariants  (.bolder)
    .success      → BTechColorVariants  (.bolder)
    .warning      → BTechColorVariants  (.bolder)
    .info         → BTechColorVariants  (.bolder)
    .secondary    → BTechColorVariants  (.bolder)

btechRadius  (BTechRadiusTheme — ThemeExtension)
  .interactive / .card / .badge / .tooltip  → double

btechFont  (BTechFontTheme — ThemeExtension)
  .family  (BTechFontFamily)
    .sans  → String
```

---

## Static Class Access — `BTechColor` / `BTechRadius` / `BTechFont`

Abstract classes with static getters. `BTechColor` stores both light and dark instances. Shortcuts always return light (static access is non-reactive — use context extension for dark-aware access).

```dart
// AUTO-GENERATED in color/color.theme.dart
abstract class BTechColor {
  static BTechColorTheme _light = const BTechColorTheme(/* default light values */);
  static BTechColorTheme _dark  = const BTechColorTheme(/* default dark values — initially same as light */);

  static BTechColorBackground get background => _light.background;
  static BTechColorText       get text       => _light.text;
  static BTechColorIcon       get icon       => _light.icon;
  static BTechColorStroke     get stroke     => _light.stroke;

  // Called by btechTheme() — do not call directly.
  static void activateBoth(BTechColorTheme light, BTechColorTheme dark) {
    _light = light;
    _dark  = dark;
  }
}
```

---

## Theme Builder (base package — generated once, zero duplication)

```dart
// AUTO-GENERATED in src/theme_builder.dart
ThemeData buildBtechTheme(
  BTechColorTheme colorLight,
  BTechColorTheme colorDark,
  BTechRadiusTheme radius,
  BTechFontTheme font, {
  Brightness brightness = Brightness.light,
  ThemeData? base,
}) {
  BTechColor.activateBoth(colorLight, colorDark);
  BTechRadius.activate(radius);
  BTechFont.activate(font);
  final activeColor = brightness == Brightness.dark ? colorDark : colorLight;
  return (base ?? ThemeData(brightness: brightness))
      .copyWith(extensions: [activeColor, radius, font]);
}
```

---

## Context Extension — `context.btechColor`

```dart
// AUTO-GENERATED in context.dart
extension BTechContextExtension on BuildContext {
  BTechColorTheme  get btechColor  => Theme.of(this).extension<BTechColorTheme>()!;
  BTechRadiusTheme get btechRadius => Theme.of(this).extension<BTechRadiusTheme>()!;
  BTechFontTheme   get btechFont   => Theme.of(this).extension<BTechFontTheme>()!;
}
```

`Theme.of(this)` returns the active ThemeData (light or dark), so `context.btechColor` **automatically** returns the correct color theme for the current brightness.

---

## Tenant Package

Each tenant in `sources/tenants/{id}/overrides.json` maintains only diffs from base. Generator produces two color instances (light + dark) and a one-liner `btechTheme()`.

```dart
// platforms/flutter/tenants/{id}/lib/btech_tokens_{id}.dart — AUTO-GENERATED

const BTechColorTheme btechColorLight = BTechColorTheme(...);  // override ?? light base
const BTechColorTheme btechColorDark  = BTechColorTheme(...);  // override ?? dark base ?? light base
const BTechRadiusTheme btechRadius    = BTechRadiusTheme(...);
const BTechFontTheme   btechFont      = BTechFontTheme(...);

// One-liner — delegates to buildBtechTheme in base, no logic here
ThemeData btechTheme({Brightness brightness = Brightness.light, ThemeData? base}) =>
    buildBtechTheme(btechColorLight, btechColorDark, btechRadius, btechFont,
                    brightness: brightness, base: base);
```

---

## Developer Usage

```dart
// pubspec.yaml
// btech_tokens_tenant_bjb:
//   git: { url: ..., path: packages/tokens/platforms/flutter/tenants/tenant-bjb }

import 'package:btech_tokens_tenant_bjb/btech_tokens_tenant_bjb.dart';

// Setup — light + dark + auto system switch:
MaterialApp(
  theme:     btechTheme(),
  darkTheme: btechTheme(brightness: Brightness.dark),
  themeMode: ThemeMode.system,
)

// ── Pattern A: static class (no context, always light) ────────────────────────
BTechColor.background.primary           // Color
BTechColor.background.primary.hover     // Color
BTechColor.text.neutral.subtle          // Color
BTechRadius.interactive                 // double
BTechFont.family.sans                   // String

// ── Pattern B: const instance (compile-time) ──────────────────────────────────
btechColorLight.background.primary      // Color — light
btechColorDark.background.primary       // Color — dark
btechRadius.interactive                 // double

// ── Pattern C: context extension (reactive light/dark) ────────────────────────
context.btechColor.background.primary          // Color — auto light/dark
context.btechColor.background.primary.hover    // Color
context.btechColor.text.neutral                // Color
context.btechColor.text.neutral.subtle         // Color
context.btechColor.text.danger                 // Color
context.btechColor.text.danger.bolder          // Color
context.btechColor.stroke.neutral.strong       // Color
context.btechRadius.interactive                // double
context.btechFont.family.sans                  // String
```

### Rule for `btech_ui` components

**Always use Pattern C** (`context.btechColor.*`) inside `btech_ui` — reactive to both tenant AND light/dark mode. Never use Pattern A or B inside components.

---

## Web Refactor (future)

Apply the same per-category, nested-accessor pattern to web:
- CSS custom properties grouped by category
- Per-tenant CSS at `platforms/web/tenants/{id}/`
- JS/TS accessor mirroring token path
- Dark mode via `@media (prefers-color-scheme: dark)` or `[data-theme="dark"]`

See `CLAUDE.md` for web architecture notes.
