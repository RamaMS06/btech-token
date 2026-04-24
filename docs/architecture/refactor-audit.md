# Refactor Audit — Dead Code & Workflow Redundancy

**Status:** Investigation · Awaiting per-item approval
**Branch:** `feat/setup-auth-script` (PR #72538)
**Method:** `code-review-graph` MCP (`refactor_tool` dead_code mode) + manual workflow review
**Date:** 2026-04

---

## Graph dead-code scan

`refactor_tool(mode="dead_code")` returned **130 symbols**. Bucketed:

### 🟢 True public API — keep (false positives)

These are the **product surface** — consumed by downstream Flutter/Web
apps, not by code inside this repo. The graph can't see consumer calls.

| Category | Examples | Action |
|---|---|---|
| Flutter token classes | `BTechRadius`, `BTechColor`, `BTechShadow`, `BTechFontSize`, `BTechFontWeight`, `BTechLineHeight`, `BTechStroke`, `BTechSpacing`, `BTechTypography`, `BTechFontRegistry` | **Keep** — public API |
| Web token classes (per-category accessors) | `BTechBrandColor`, `BTechBgColor`, `BTechIconColor`, `BTechTextColor`, `BTechBackgroundColor`, `BTechStrokeColor`, `BTechExtColor`, `BTechShades*Color` | **Keep** — public API |
| Tenant JS helpers | `activate()` in `platforms/web/{bspace,tenant-a,tenant-bjb}/src/index.ts` | **Keep** — public API |
| Token utility functions | `cssVar`, `tokenCalc`, `followSystemMode` in `platforms/web/token/src/token.ts` | **Keep** — documented in README |
| Flutter theme overrides | `BTechColorTheme.lerp`, `BTechRadiusTheme.lerp`, `InnerShadowDecoration.{lerpFrom,lerpTo,createBoxPainter,paint}`, `createState`, `build`, `initState` | **Keep** — Flutter framework hooks |

### 🟡 Entry-points / generator files — keep (import-chain false positives)

The graph flagged these as unreferenced, but they ARE imported by
`sd.config.ts` or sibling generators via `.js` extension (TypeScript
NodeNext convention). The graph likely doesn't resolve `.js` → `.ts`.

| File | Used by | Action |
|---|---|---|
| `packages/tokens/generators/web/web-tenant-isolated.ts` (`generateTenantIsolatedCss`) | `sd.config.ts:11` | **Keep** |
| `packages/tokens/generators/web/web-tenant-package.ts` (`ensureTenantPackageJson`) | `sd.config.ts:12` | **Keep** |
| `packages/tokens/generators/web/web-dark-generator.ts` (`appendDarkModeCss`) | `sd.config.ts:13` | **Keep** |
| `packages/tokens/generators/font-registry-generator.ts` | `sd.config.ts:20` | **Keep** |
| `packages/tokens/generators/web/web-typography-composites.ts` | `sd.config.ts:22` | **Keep** |
| `packages/tokens/generators/flutter/flutter-color.ts` | `flutter-generator.ts`, `web-generator.ts` | **Keep** |
| `packages/tokens/generators/web/web-generator.ts` (`generateTsFiles`, `layerToCss`) | entry via `sd.config.ts` | **Keep** |
| `packages/tokens/generators/web/web-token-types.ts` (`generateTokenTypes`) | entry via `sd.config.ts` | **Keep** |
| `packages/tokens/generators/web/web-utilities-generator.ts` (`generateUtilitiesCss`) | entry via `sd.config.ts` | **Keep** |
| `packages/tokens/generators/token-loader.ts` (`loadTokenData`) | entry via generators | **Keep** |
| `packages/tokens/generators/flutter/flutter-generator.ts` (`generateFlutterFiles`) | entry via `sd.config.ts` | **Keep** |
| `packages/tokens/generators/flutter/flutter-tenant-format.ts` (`generateFlutterTenantPackages`) | entry via `sd.config.ts` | **Keep** |
| `packages/tokens/generators/web/web-tenant-format.ts` (`generateWebTenantPackages`) | entry via `sd.config.ts` | **Keep** |
| `packages/tokens/sd.config.ts` (`buildResolvedBaseMap`) | internal to sd.config | **Keep** |
| `tools/validators/*.ts` (`contrastRatio`, `isAllowed`, `loadJson`, etc.) | run as CLI entry | **Keep** |
| `scripts/add-tenant.ts` (`err`), `scripts/watch-tokens.mjs` (`generate`) | script CLI entry | **Keep** |

### 🔴 Likely stale / iOS test scaffold — candidates

| Symbol | File | Why candidate | Recommendation |
|---|---|---|---|
| `RunnerTests`, `testExample` | `apps/demo-flutter/ios/RunnerTests/RunnerTests.swift` | Flutter iOS test stub, never invoked | **Keep** — Flutter `flutter create` scaffold. Removing could break iOS build. |
| `DemoApp`, `_Tab`, `_DemoAppState`, `_ShowcasePageState`, etc. | `apps/demo-flutter/lib/main.dart` | Flagged but Flutter entry point | **Keep** — framework-invoked |
| `App` in `apps/demo-react/src/App.tsx` | (react entry) | Flagged but React entry | **Keep** |
| `toggleDark` in `apps/demo-vue/src/App.vue` | (template-bound) | Called from Vue template, graph doesn't see SFC bindings | **Keep** |

### ⚠️ Graph staleness

The scan lists some paths under `packages/tokens/platforms/web/src/**`
and `packages/tokens/platforms/flutter/lib/**` — these directories
**do not exist on disk**. The graph was last built on branch
`feat/setup-auth-script` at commit `2a17b5e5504d`, before prior cleanup
moved files to `web/token/src/` and `flutter/token/lib/`.

**Recommendation:** run `mcp__code-review-graph__build_or_update_graph_tool`
to refresh, then re-audit. Most of the 130 findings are expected to
collapse once the graph stops reporting vanished paths.

---

## Workflow audit

Surface reviewed: `pipelines/*.yml`, `.githooks/*`, `scripts/*.ts`, `tools/validators/*.ts`.

| Item | Status | Recommendation |
|---|---|---|
| `.githooks/pre-commit` | No-op `exit 0` | **Keep as-is** — documents intent ("regeneration happens in CI, not locally"). Removing would also require removing `"prepare"` from `package.json`. |
| `pipelines/validate.yml` | Runs `pnpm validate` + flutter analyze | ✅ Fine — just simplified in Task 1.2 |
| `pipelines/generate.yml` | Auto-regenerates on source change | ✅ Fine |
| `pipelines/publish.yml` | RC skips tenant publish, stable publishes all | ✅ Fine (guarded by `ne(NPM_TAG, 'rc')`) |
| `pipelines/auto-version.yml` | Bumps on PR merge to main | ✅ Fine |
| `scripts/watch-tokens.mjs` | Dev-time file watcher (`tokens:watch`) | ✅ Keep — convenience only |
| `scripts/add-tenant.ts` | Interactive tenant scaffold | ✅ Keep |
| `scripts/bump-version.ts` | Version sync across base + tenants | ✅ Keep — may be simplified further if Task 2.1 (tenant consolidation) ships |
| `scripts/setup-auth.ts` | 1-cmd PAT setup (Task 1.1) | ✅ Keep |
| `tools/validators/contrast.ts` | WCAG check | ✅ Keep |
| `tools/validators/boundary.ts` | Tenant override boundary | ✅ Keep |
| `tools/validators/workspace-deps.ts` | Workspace protocol enforcement (Task 1.2) | ✅ Keep |

**No redundant workflow found.** Each pipeline and script has a distinct
role. The earlier surface-area concern (token generator redundancy)
appears to be addressed — there is no duplicate of Style Dictionary
config, token loader, or publish flow.

---

## Decision

**No deletions recommended from this pass.** The graph's 130 findings
are dominated by two classes of false positive:

1. **Public API with no internal callers** (library surface area) — the
   purpose of this repo is to expose these.
2. **Graph staleness** pointing at paths already removed.

Genuine cleanup opportunities, if any, are only visible after rebuilding
the graph. Suggested next pass:

- [ ] Rebuild graph on current `main` → re-run `refactor_tool(dead_code)`
- [ ] Review narrowed list with a human
- [ ] If Task 2.1 (tenant consolidation) is approved, it will naturally
      remove `web-tenant-{isolated,package,format}.ts`, tenant publish
      step in `publish.yml`, and rc-skip branch in `bump-version.ts`.

The biggest surface-area reduction lever we have is Task 2.1, not
line-level dead-code deletion.
