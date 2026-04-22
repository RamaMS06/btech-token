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

## CI / Azure DevOps

- **Repo:** `https://dev.azure.com/buma/BUMA%20-%20Bspace%20Design%20System/_git/btech-ds`
- **Pipelines:** `pipelines/validate.yml`, `pipelines/generate.yml`, `pipelines/publish.yml`, `pipelines/auto-version.yml`
- **Feed:** Azure Artifacts `btech` feed — `@btech/tokens` npm package
- **Auth:** `System.AccessToken` via `npmAuthenticate@0` task (no personal PAT needed in CI)
- **Pre-commit hook:** `.githooks/pre-commit` — auto-regenerates tokens when sources change

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
