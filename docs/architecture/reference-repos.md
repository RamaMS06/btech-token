# Reference repos (per framework)

**Status:** MANDATORY  •  **Applies to:** AI-driven slicing + manual implementation

## Why we have references

When generating btech_ui components from Figma frames, the AI (and
human reviewers) need a **trusted code-pattern reference** per
framework. Without one, output drifts into "made-up idioms" or
"transliteration from another framework" — both are halu and unreliable.

Each reference is **READ-ONLY pattern source**. Never installed as
runtime dependency. Never copied verbatim. Never used as visual SoT
(see [figma-visual-rule.md](./figma-visual-rule.md)).

## Table

| Framework | Primary internal reference | External (secondary) |
|---|---|---|
| **Flutter** | `~/Documents/FlutterProjects/Shared.Package.Mobile.DesignSystem`<br>(`buma_design_system` v2.0.39) | — |
| **Vue 3** | `~/Documents/Vue/Shared.Package.Frontend.DesignSystem`<br>(`@buma-dev/buma-ui-v2`) | — |
| **React 18+** | _(no internal — gap)_ | [shadcn/ui](https://github.com/shadcn-ui/ui) |

## What we borrow vs reject

**✅ Borrow (code patterns):**
- File / folder structure (atomic design, per-component subfolder)
- Naming conventions (file names, class names, CSS class prefixes)
- API patterns (named constructors in Flutter, `withDefaults` in Vue,
  `data-slot` attributes in React)
- Doc-comment style (`///` Dart, `<!--` Vue, JSDoc React)
- Schema co-location (`component.meta.yaml`)
- Linter config (`very_good_analysis` for Flutter)

**❌ Reject (everything visual + everything runtime):**
- Visual values (sizes, colors, palettes, typography) — Figma wins
- Runtime dependencies on the reference packages
- Their tokens (`UIColors.primary600`, `@buma-dev/styles` SCSS funcs)
- Their composition shapes when they conflict with our cross-framework
  parity rule (e.g. shadcn's `<Avatar>+<AvatarImage>+<AvatarFallback>`
  composition → we use single `<BTAvatar item={...} />`)

## Strict constraint — runtime deps

`btech-ds` consumers (apps that import `@btech/ui-react`,
`@btech/ui-vue`, `btech_ui` Flutter) **MUST NEVER need to install**:

- `@buma-dev/buma-ui-v2`, `@buma-dev/styles`, or any `@buma-dev/*`
- `shadcn/ui`, `radix-ui`, `class-variance-authority`, Headless UI,
  Mantine, Naive UI, etc.
- `buma_design_system` Flutter pub package

btech_ui components ship **fully self-contained**:
- Web: bundled JSX/SFC + CSS + types in our own packages
- Flutter: bundled widgets in our own pub package

If a pattern from a reference is needed, **rewrite it in our codebase**
adapting to btech tokens. Don't add the reference as a dependency.

## Per-framework specifics

### Flutter — `buma_design_system`

- Path: `~/Documents/FlutterProjects/Shared.Package.Mobile.DesignSystem/`
- Highlights: atomic design (`atoms/molecules/organisms/patterns`),
  `*.widget.dart` + `*.types.dart` + `internal/` + `models/` per
  component, named constructors for variants (`UIButton.primary()`),
  `ThemeExtension<T>` + `extension on ThemeData` theming, `///` doc
  comments with `dart` code-block usage examples,
  `component.meta.yaml` schema co-located.

### Vue — `@buma-dev/buma-ui-v2`

- Path: `~/Documents/Vue/Shared.Package.Frontend.DesignSystem/`
- Highlights: atomic + organisms split (Avatar = molecule,
  AvatarGroup = **organism**), per-component folder = `Avatar.vue` +
  `component.meta.yaml` + `stories/` + `style/_avatar.scss` +
  `types/avatar.ts`, `withDefaults(defineProps<Props>(), {...})`
  pattern, `computed` for class binding, global plugin registration
  (`app.component('BAvatar', ...)`), Storybook with play tests.
- **DO NOT borrow:** their `@buma-dev/styles` SCSS function approach
  (we use `var(--btech-...)` CSS custom properties). See
  [figma-visual-rule.md](./figma-visual-rule.md).

### React — shadcn/ui

- URL: https://github.com/shadcn-ui/ui (fetched via WebFetch as needed)
- Highlights: data-slot attributes (`data-slot="avatar"`),
  `class-variance-authority` for variants (`cva()`), `asChild`
  polymorphism via Radix Slot, function components (no forwardRef in
  v4 / React 19+), Tailwind utility classes.
- **DO NOT borrow:** the composition pattern (multi-component
  `<Avatar>+<AvatarImage>+<AvatarFallback>`). btech-ds uses single
  component with discriminated props for cross-framework parity.

## Generation flow

See [generation-flow.md](./generation-flow.md) — Figma → Vue + Flutter
in parallel → React via Vue→React converter agent.
