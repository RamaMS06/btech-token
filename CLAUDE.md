# BTech Design System — Project Memory

## Project Overview

Monorepo for BTech Design System (BUMA). Generates design tokens for Flutter and Web from DTCG JSON sources.

```
packages/
├── tokens/          ← token generator (TypeScript) + Flutter/Web platform outputs
└── ui/              ← btech_ui component library (future)
apps/
├── demo-react/
└── demo-vue/
```

---

## Token Generator

**Entry point:** `packages/tokens/sd.config.ts`
**Run:** `pnpm exec tsx packages/tokens/sd.config.ts`
**Sources:** `packages/tokens/sources/{core,semantic,components,tenants}/`
**Outputs:** `packages/tokens/platforms/flutter/` and `packages/tokens/platforms/web/`

---

## Flutter Token Architecture (approved 2026-04)

Full spec: `docs/architecture/flutter-token-architecture.md`

### Three access patterns

```dart
// Setup — supports light + dark mode:
MaterialApp(
  theme:     btechTheme(),
  darkTheme: btechTheme(brightness: Brightness.dark),
  themeMode: ThemeMode.system,
)

// A — Static class (PascalCase), no context, always light:
BTechColor.background.primary         // Color
BTechColor.background.primary.hover   // Color
BTechColor.text.neutral.subtle        // Color
BTechRadius.interactive               // double
BTechFont.family.sans                 // String

// B — Const instance (camelCase), light only (dark is private _btechColorDark):
btechColor.background.primary         // Color — light
btechRadius.interactive               // double

// C — Context extension (reactive light/dark, use in btech_ui components):
context.btechColor.background.primary       // Color — auto light/dark
context.btechColor.text.neutral.subtle      // Color
context.btechColor.text.danger              // Color  (NO .on — removed)
context.btechRadius.interactive             // double
context.btechFont.family.sans               // String
```

**Rule:** `btech_ui` components MUST use pattern C (context) — reactive to both tenant AND light/dark mode.

**No `.on` group** — `color.text.on` and `color.icon.on` are removed from source JSON. Use `text.neutral.inverse` for white text on colored backgrounds.

### Key classes (auto-generated)
- `BTechColorVariants extends Color` — leaf node, IS a Color + has `.hover`, `.pressed`, `.subtle`, `.disable`, `.disabled`, `.raised`, `.bolder`, `.inverse`, `.strong`
- `BTechColorTheme extends ThemeExtension<BTechColorTheme>` — root with `.background`, `.text`, `.icon`, `.stroke`
- `BTechRadiusTheme extends ThemeExtension<BTechRadiusTheme>` — flat double fields (interactive, card, badge, tooltip)
- `BTechFontTheme extends ThemeExtension<BTechFontTheme>` — `.family.sans`
- `BTechColor` — static abstract class with `activateBoth(light, dark)`, shortcuts always return light
- `BTechRadius` / `BTechFont` — static abstract classes, activated by `btechTheme()`
- `BTechContextExtension on BuildContext` — `.btechColor`, `.btechRadius`, `.btechFont`
- `buildBtechTheme(colorLight, colorDark, radius, font, {brightness, base})` — in base, used by tenant one-liners

### Tenant structure (monorepo)
```
packages/tokens/sources/tenants/{id}/overrides.json   ← diffs only (small)
packages/tokens/platforms/flutter/tenants/{id}/       ← generated package
    ├── pubspec.yaml
    └── lib/btech_tokens_{id}.dart                    ← const instances + btechTheme()
```
Consuming app: git path dependency → `packages/tokens/platforms/flutter/tenants/{id}`

### Generator files
- `generators/flutter/flutter-theme-generator.ts` — generates `*.theme.dart` + `context.dart`
- `generators/flutter/flutter-tenant-format.ts` — generates per-tenant packages
- `generators/flutter/flutter-generator.ts` — generates static token classes (color, spacing, radius, typography)

---

## Web Token Architecture (future refactor — same pattern as Flutter)

When refactoring web tokens, follow the same per-category approach:
- Split into `BTechColorTheme`, `BTechRadiusTheme`, `BTechFontTheme` CSS custom property groups
- Per-tenant CSS packages at `platforms/web/tenants/{id}/`
- Nested accessor pattern mirroring token path: `btechColor.background.primary`
- Each tenant generates a scoped CSS file with overridden variables
- One-line setup equivalent: `<link rel="stylesheet" href="btech-tokens-bspace.css">` or CSS-in-JS provider

Reference: `docs/architecture/flutter-token-architecture.md` for the approved Flutter design — apply same principles to web.

---

## Demo App Sync Rule (MANDATORY)

**Every change to design tokens MUST be reflected in all three demo apps.**

This is a hard rule — token changes are not complete until the demos are updated.

### Scope

| Token change | What to update in demos |
|---|---|
| New token added | Add entry to token list in all 3 demos |
| Token renamed | Update name + usage string in all 3 demos |
| Token removed | Remove entry from all 3 demos |
| Token category added | Add badge colour mapping in all 3 demos |
| New token group (e.g. motion, z-index) | Add tab + entries in all 3 demos |
| Shadow token changed | Update `BTechShadow.*` references + CSS var strings |
| Radius / spacing changed | Update value display if hardcoded |

### Demo app locations

| App | File |
|---|---|
| Flutter | `apps/demo-flutter/lib/main.dart` |
| Vue | `apps/demo-vue/src/App.vue` |
| React | `apps/demo-react/src/App.tsx` |

### Shadow token naming rule

Figma uses `/` separator → implementation uses `.` separator.

| Figma | Flutter | Web (CSS var) | Web (TS) |
|---|---|---|---|
| `button/pressed` | `BTechShadow.button.pressed` | `var(--btech-shadow-button-pressed)` | `BTechShadow.button.pressed` |
| `elevation/md` | `BTechShadow.elevation.md` | `var(--btech-shadow-elevation-md)` | `BTechShadow.elevation.md` |

### Inner shadow (Flutter)

Use `InnerShadowDecoration` (not `BoxDecoration`) for inset shadows.
Available via `import 'package:btech_tokens/btech_tokens.dart'`.

```dart
// Normal shadow
Container(decoration: BoxDecoration(boxShadow: BTechShadow.elevation.md))

// Inner / inset shadow
Container(
  decoration: InnerShadowDecoration(
    color: context.btechColor.background.primary,
    borderRadius: BorderRadius.circular(BTechRadius.sm),
    boxShadow: BTechShadow.button.pressed,
  ),
)
```

---

## Branch Workflow (MANDATORY)

**Every new feature branch MUST be created from an up-to-date main.**
Run these 3 commands in order — no exceptions:

```bash
git checkout main
git pull origin main
git checkout -b feat/<component-name>
```

**Before pushing a branch**, always rebase/merge latest main to avoid
conflicts on shared files (barrel exports, App entry points):

```bash
git fetch origin
git rebase origin/main   # or: git merge origin/main
# resolve any conflicts (keep BOTH sets of changes)
git push origin feat/<component-name>
```

**Why this matters**: multiple feature branches frequently touch the same
shared files:
- `packages/ui/{vue,react}/src/index.ts` — component barrel exports
- `apps/ui/{vue,react}/src/App.{vue,tsx}` — showcase sidebar + template
- `apps/ui/flutter/lib/main.dart` — Flutter showcase page registry
- `packages/ui/flutter/lib/src/components/atoms/atoms.dart` — Flutter barrel

Conflicts in these files are always resolved by **keeping BOTH sets of
additions** in alphabetical order — never dropping one side.

---

## Versioning

Hybrid auto-scope: every package tracks its own version. `pnpm bump [type] [flags]` supports `--scope=all|base|tenants|tenant:<id>`, `--auto` (diff-driven), `--dry-run`. Defaults to `all` for back-compat. Tenant `package.json` preserves its version across `pnpm generate` — generator no longer overwrites with base. Publishes via `scripts/publish-changed.ts` (skips already-published). See `docs/architecture/versioning.md`.

---

## CI / Azure DevOps

- **Repo:** `https://dev.azure.com/buma/BUMA%20-%20Bspace%20Design%20System/_git/btech-ds`
- **Pipelines:** `pipelines/validate.yml`, `pipelines/generate.yml`, `pipelines/publish.yml`, `pipelines/auto-version.yml`, `pipelines/plugin-publish.yml`
- **Feed:** Azure Artifacts `btech` feed — `@btech/tokens` npm package + `btech-token-studio` Universal package (plugin ZIPs)
- **Auth:** `System.AccessToken` via `npmAuthenticate@0` task (no personal PAT needed in CI)
- **Pre-commit hook:** `.githooks/pre-commit` — auto-regenerates tokens when sources change

---

## Figma Plugin (`btech-token-studio`)

The plugin ships **separately** from `@btech/tokens` — independent
semver, independent release cadence, independent tag namespace
(`plugin-v*`). It lets designers pull/edit/push tokens from Figma
without leaving the canvas.

- **Source:** `btech-token-studio/`
- **Manifest:** `btech-token-studio/manifest.json`
- **Assets:** `btech-token-studio/assets/{icon.png,cover.png}` — uploaded by Figma admin at publish (NOT bundled in `dist/`)
- **Build:** `pnpm --filter @btech/token-studio build` → `dist/code.js` + `dist/index.html`
- **Release pipeline:** `pipelines/plugin-publish.yml` triggers on `plugin-v*` tags → builds → ZIP → Azure Artifacts Universal feed → admin uploads to Figma org manually (Figma has no public publish API for org plugins)
- **PAT model:** per-user, stored in Figma `clientStorage` (encrypted)

Docs:
- `docs/plugin-publishing.md` — maintainer + admin release runbook
- `docs/plugin-onboarding.md` — designer first-time setup guide

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Dart classes | BTech prefix, PascalCase | `BTechColorTheme`, `BTechColorVariants` |
| Dart const instances | btechCamelCase | `btechColor`, `btechRadius`, `btechFont` |
| Dart theme function | btechTheme() | `btechTheme({Brightness brightness})` |
| Dart accessor classes | BTechColor{Category} | `BTechColorBackground`, `BTechColorText` |
| Dart tenant package | btech_tokens_{id} | `btech_tokens_bspace`, `btech_tokens_default` |
| CSS variables | --btech-{path} | `--btech-background-primary` |
| Token source files | DTCG JSON | `sources/semantic/color.json` |

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
|------|----------|
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

---

## UI components — slicing rules (MANDATORY)

These rules govern every component in `packages/ui/{flutter,react,vue}/`.
Full docs at `docs/architecture/`.

### 1. Figma URL = visual source of truth

When implementing or refactoring any UI component, **all visual values
(sizes, colors, radii, shadows, typography, spacing) come from the Figma
URL provided by the designer**. No exceptions, no fallbacks to other
design systems.

Reference repos give us **code patterns only** — never visual values.
See `docs/architecture/figma-visual-rule.md`.

### 2. Component-specific colors → HARDCODE, do NOT tokenize

When Figma uses a palette unique to one component (Avatar's 6 brand
colors, Badge tones if unique to badge), **HARDCODE** the hex values
directly in the component file:

- Flutter: `Color(0xFF89AE68)` in `internal/<name>.constants.dart`
- Web CSS: `background: #89ae68;` in `BT<Name>.css` or `<style>` block

**Do NOT** add component-specific palettes to `packages/tokens/sources/`.
The foundation token layer is for values that REPEAT across multiple
components (text colors, surface backgrounds, semantic status colors).
One-off palettes belong in the component.

Only tokenize a palette when it appears in **2+ components** — refactor
the duplication then, not preemptively.

### 3. Reference repos (per framework)

These repos live **outside** the workspace — read them directly, never
copy files into `btech-ds`. No few-shot or cache copies in the workspace.

#### Flutter — `~/Documents/FlutterProjects/Shared.Package.Mobile.DesignSystem`

Package name: `buma_design_system`. Use for: atomic-design folder structure,
named constructors, `*.widget.dart` / `*.types.dart` / `internal/` pattern,
doc-comment style, `component.meta.yaml` co-location, linter config.

Key files to read for patterns:

| What | Path |
|---|---|
| Atom — button (named constructors) | `lib/src/components/atoms/button/button.widget.dart` |
| Atom — badge | `lib/src/components/atoms/badge/` |
| Atom — checkbox | `lib/src/components/atoms/checkbox/` |
| Atom — switch | `lib/src/components/atoms/switch/` |
| Molecule — avatar (data-class) | `lib/src/components/molecules/avatar/avatar.widget.dart` |
| Molecule — loading | `lib/src/components/molecules/loading/` |
| Organism — card | `lib/src/components/organisms/card/` |
| Organism — modal | `lib/src/components/organisms/modal/` |
| Organism — form input | `lib/src/components/organisms/form.input/` |
| Pattern — empty state | `lib/src/components/patterns/empty.state/` |
| analysis_options | `analysis_options.yaml` (very_good_analysis config) |

Available atomic layers: `atoms/` (badge, button, button.link, checkbox,
chips, divider, floating.button, hint, label, radio, scrollbar, slider,
switch) · `molecules/` (action, alert, avatar, dropdown, loading,
numberindicator, pagination, progressbar, segmented.switch, tab,
tab.switch) · `organisms/` (accordion, appbar, bottom.navigation,
bottom.sheet, calendar, card, chart, choice, choice.tile, form.input,
input.number, modal, search.input, tooltip, tooltip.navigation, wizzard)
· `patterns/` (chat, comment, download, empty.state, infinteloader,
notification, table)

#### Vue 3 — `~/Documents/Vue/Shared.Package.Frontend.DesignSystem`

Package name: `@buma-dev/buma-ui-v2`. Use for: Vue 3 SFC structure,
`<script setup>` + `withDefaults(defineProps<T>())` pattern, `v-if`
chain idioms, `<style>` (non-scoped), `component.meta.yaml` co-location.

Key files to read for patterns:

| What | Path |
|---|---|
| Atom — badge | `src/components/atoms/badge/` |
| Atom — button | `src/components/atoms/button/` |
| Atom — checkbox | `src/components/atoms/checkbox/` |
| Atom — input | `src/components/atoms/input/` |
| Atom — switch | `src/components/atoms/switch/` |
| Atom — tooltip | `src/components/atoms/tooltip/` |
| Molecule — avatar | `src/components/molecules/avatar/Avatar.vue` |
| Molecule — modal | `src/components/molecules/modal/` |
| Molecule — select | `src/components/molecules/select/` |
| Molecule — tab | `src/components/molecules/tab/` |
| Molecule — toast | `src/components/molecules/toast/` |
| Organism — avatar-group | `src/components/organisms/avatar-group/` |
| Organism — table | `src/components/organisms/table/` |

Available atomic layers: `atoms/` (badge, button, button-group,
button-hover, button-link, checkbox, circular-progress, divider,
dropdown, heading, hint, icon, input, input-group, input-number,
input-search, label, loading, loading-bar, logo, progress-bar,
radio-button, skeleton, slider, spinner, sub-heading, switch, text,
tooltip) · `molecules/` (accordion, alert, avatar, breadcrumb, calendar,
calendar-date, card-content, card-empty-state, card-summary, chart,
chips, choice-tile, date-picker, download, drawer, filter-button,
filter-calendar, input-rich-editor, input-textarea, input-time,
input-upload, list-choice, modal, pagination, select, step,
step-progress, tab, title, title-section, toast) · `organisms/`
(avatar-group, card-profile, card-section, modal-confirmation,
modal-preview, table, tree-card, wizard)

#### React — shadcn/ui (read-only, no runtime dep)

URL: `https://github.com/shadcn-ui/ui` — inspiration only for React
idioms (data-slot pattern, asChild, accessibility, displayName).
btech-ds consumers NEVER install shadcn. Components are self-contained.

---

**ZERO external runtime UI dependency** for btech-ds consumers.
Components ship with their own JSX/SFC + CSS + types + Flutter widgets.
Never add `@buma-dev/*`, `shadcn/ui`, `radix-ui`, etc. as runtime deps.

When in doubt about React idioms, prefer (in order):
1. Patterns from `Shared.Package.Frontend` (Vue) re-expressed as React
2. shadcn/ui patterns adapted to btech tokens
3. Ask designer / user — never make it up.

See `docs/architecture/reference-repos.md`.

### 4. Generation flow

```
Figma frame URL  →  Vue + Flutter (parallel slicer)
                    Vue → React (via tools/vue-to-react/ converter agent)
```

**Never generate React in parallel** from Figma — always go through Vue
first. Reasons: we have a trusted internal Vue reference; React has only
external (shadcn). Vue→React converter guarantees prop-name parity,
variant-precedence parity, render-priority parity. shadcn consulted only
for React-specific idioms the converter needs.

See `docs/architecture/generation-flow.md`.

### 5. Clean-code requirements

1. **One component per folder** (atomic-design layer: atoms /
   molecules / organisms / patterns).
2. **Component widget file <200 lines** — extract to `internal/`.
3. **Barrel exports public API only**; internals never re-exported.
4. **No `any` (TS) / `dynamic` (Dart) / unspecified `Object`** for
   known shapes — always concrete types/interfaces.
5. **Every component MUST have example-usage doc comment** in header
   (per framework convention in
   `docs/architecture/component-conventions/`).
6. **Every component MUST have `component.meta.yaml`** co-located
   (props, variants, `figmaUrl`, `figmaNodeId`).
7. **Every component MUST have a markdown doc** at
   `docs/components/{layer}/{kebab-name}.md` — created or updated
   whenever a component is added or its API changes.
   Also update **two README files** in the same commit:
   - `docs/components/{layer}/README.md` — add row to the component table
   - `docs/components/README.md` — add row to the matching atomic-layer table
   **Do not ship a component without its doc.** This is part of the
   definition of done for every component task.

   **Doc template** (copy-paste and fill in):
   ```md
   # BT{Name}

   > One-line description.

   Figma: [node {id}](https://figma.com/...) · Category: {Layer}

   ---

   ## Overview

   2-3 sentences.

   ## Props

   | Prop | Type | Default | Description |
   |---|---|---|---|
   | ... | ... | ... | ... |

   ## Variants / States

   - **variant-name** — description

   ## Usage

   ### Vue

   ```vue
   <script setup lang="ts">
   import { BT{Name} } from '@btech/ui-vue';
   </script>
   <template>
     <BT{Name} ... />
   </template>
   ```

   ### React

   ```tsx
   import { BT{Name} } from '@btech/ui-react';
   export function Example() {
     return <BT{Name} ... />;
   }
   ```

   ### Flutter

   ```dart
   import 'package:btech_ui/btech_ui.dart';
   BT{Name}(...)
   ```

   ---

   ## Notes

   Token usage, dark mode, accessibility notes.
   ```

   Layer README (`docs/components/{layer}/README.md`) must also be
   updated to add the new component to the component list table.
7. **File naming**:
   - Flutter: `lower_snake_case.dart` with dot separators
     (`avatar.widget.dart`)
   - Web: `BT{Name}.{tsx|vue|ts|css}` PascalCase, folders PascalCase
8. **Class prefix**: `BT` for UI components, `BTech` for theme tokens
   (which live in `btech_tokens` package).
9. **Web CSS MUST live in a dedicated file** — never inline in a Vue
   `<style>` block or embedded inside a `.tsx` file.
   - React: `BT{Name}.css` imported at the top of `BT{Name}.tsx`
   - Vue: `BT{Name}.css` imported inside `<script setup>` with
     `import './BT{Name}.css'` — the `<style>` block in the `.vue`
     file MUST be absent or empty.
   - Both React and Vue components in the same folder share the exact
     same `BT{Name}.css` file — one CSS file per component, not one
     per framework.
   - Folder anatomy (web):
     ```
     BT{Name}/
     ├── index.ts          ← barrel
     ├── BT{Name}.tsx      ← React component (imports BT{Name}.css)
     ├── BT{Name}.vue      ← Vue SFC (imports BT{Name}.css, no <style>)
     ├── BT{Name}.types.ts ← shared prop/enum types
     ├── BT{Name}.css      ← single shared stylesheet
     └── component.meta.yaml
     ```

### 6. Web CSS token usage rule (MANDATORY)

**Always write `var(--token-name)` — NEVER add a hex fallback as the
second argument.**

```css
/* ✅ correct */
background: var(--bg-subtle);
color: var(--text-primary);
border-color: var(--border-primary);

/* ❌ wrong — hex fallback forbidden */
background: var(--bg-subtle, #f4f5f6);
color: var(--text-primary, #292f37);
```

Why: `@btech/tokens-bspace/styles.css` (or equivalent tenant stylesheet)
is always imported by the app entry point. Every `--*` variable is
guaranteed to be defined at runtime. A hex fallback:

1. **Creates drift** — token value updates but the fallback hex stays
   stale, silently rendering the wrong colour.
2. **Defeats the token system** — the whole point of CSS vars is one
   place of truth; a hardcoded hex next to it is a second source.
3. **Hides missing imports** — if the stylesheet ever fails to load,
   a fallback masks the error instead of showing a blank that signals
   the problem.

The only place raw hex is allowed is `rgba(0, 0, 0, 0.25)` style
shadow overlays that are not tokenised (opacity-based, not a named
colour token).

### 7. Color token mapping rule (MANDATORY)

When mapping a color from a Figma frame (or Figma MCP response) to a
btech token, **NEVER pick the token name by linguistic intuition**.
The names `subtle` / `subtler` / `subtlest` are 3 DIFFERENT values, AND
the lightness ordering is NOT consistent across token families:

| Family | Lightest → Darkest |
|---|---|
| `bg.*` (neutral) | `subtle` (neutral.50) → `subtler` (neutral.200) → `subtlest` (neutral.300) |
| `color.ext.{success,info,warning,error}-*` | `subtler` (100) → `subtle` (200) |

Two traps to keep in mind:

1. **3 distinct values, not synonyms.** `bg.subtle` ≠ `bg.subtler` ≠
   `bg.subtlest`. Each maps to a different neutral step.
2. **Lightness ordering is NOT consistent across families.** In
   `bg.*`, `subtle` is the LIGHTEST. In `color.ext.*-subtle/-subtler`,
   `subtler` is the LIGHTEST.

**Required workflow when mapping a Figma color:**

1. Get the EXACT hex from Figma (MCP `get_variable_defs` or
   `get_design_context`).
2. Look up the EXACT hex in
   `packages/tokens/sources/semantic-color/light.json` (or the relevant
   tenant's source). Use Grep / Read — never guess.
3. Match by hex value, not by name. If two tokens share the same hex,
   prefer the one whose semantic role matches the component context
   (e.g. badge background → `color.ext.*` family, not `bg.*`).
4. Only then write the token reference (Flutter accessor, CSS var, or
   hardcoded hex per the component-specific-colors rule §2).

**Forbidden shortcuts:**

- "Figma says `subtle`, so I'll use `bg.subtle`" — without verifying
  the hex.
- "It looks like a light green, must be `green.100`" — without
  checking whether btech `green.100` matches the Figma hex (Tailwind
  `green.100` ≠ btech `green.100`).
- Assuming web CSS primitive vars (`--btech-color-green-100`) carry
  the same value as the btech DTCG primitive — they currently DO NOT
  (web CSS generator emits Tailwind values).

This rule applies to BOTH human-written code and slicer / converter
agent output. The Vue→React converter prompt and the slicer system
prompt must include this rule as a cache-breakpoint instruction.

### 8. Cross-framework API parity

When a component exists in 3 frameworks, **prop names + variant values
+ render priority MUST match exactly**. The Vue→React converter
preserves this for web; Flutter named constructors mirror Vue's
discriminated props.

Example: `BTAvatar` takes `item: BTAvatarItem` in all 3 frameworks
(not `src` in React vs `imageUrl` in Flutter).

### 9. Component-conventions per framework

Detailed pattern guides:
- `docs/architecture/component-conventions/flutter.md`
- `docs/architecture/component-conventions/vue.md`
- `docs/architecture/component-conventions/react.md`

Generated code MUST follow the conventions doc for its framework.
