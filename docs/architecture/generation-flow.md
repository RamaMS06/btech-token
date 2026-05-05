# UI component generation flow

**Status:** MANDATORY  •  **Applies to:** every component generated via slicer

## Diagram

```
                Designer Figma frame URL
                (e.g. node-id=497-979)
                        │
                        │  visual source of truth
                        ▼
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
  Vue generator                   Flutter generator
  • slicer fetches Figma          • slicer fetches Figma
  • prompt-cache: Vue conv. doc   • prompt-cache: Flutter conv. doc
  • few-shot: Shared.Package      • few-shot: Shared.Package
    .Frontend Avatar/Badge          .Mobile Avatar/Button
        │                               │
        ▼                               ▼
  Vue SFC                         Flutter widget
  (.vue + types.ts +              (.widget.dart + .types.dart
   component.meta.yaml)            + component.meta.yaml)
        │
        │ Vue → React converter agent
        │ (tools/vue-to-react/)
        ▼
  React TSX
  (.tsx + types.ts + .css +
   component.meta.yaml)
```

## Why this flow (not "Figma → 3 frameworks parallel")

The original plan had Vue, React, and Flutter all generated in parallel
from Figma. That worked when we had buma-ui (Flutter) as the only
reference repo — every framework treated identically.

After confirming **internal Vue reference exists** (`Shared.Package
.Frontend.DesignSystem`) but **no internal React reference**, we
realized parallel generation for React would be "halu":
- React would have no trusted internal pattern source
- Slicer would either invent React idioms or transliterate Flutter code
- Result: React API drifts from Vue/Flutter, designers can't trust it

By making React a **transformation of Vue** (which we DO have a trusted
reference for), we guarantee:
1. Same prop names across all 3 frameworks
2. Same variant precedence logic (Vue → React converter preserves it)
3. Same render priority (image > initials > count > error > empty)
4. shadcn/ui consulted only for React-specific idioms the converter
   needs (e.g. `data-slot` attributes, `cva` for tailwind variants)

## When to use what

| Scenario | Tool |
|---|---|
| New component from Figma frame URL | `pnpm slice <figma-url>` (Phase D4 slicer) — generates Vue + Flutter in parallel |
| Existing Vue component → React | `pnpm convert-vue-to-react <path-to-vue>` (Phase C agent) |
| Manually written Vue/Flutter | Skip slicer; run converter on the manual Vue file to produce React |
| Hot-fix to existing component | Edit Vue + Flutter directly; re-run converter to update React |

## Slicer prompt cache structure

Each generator (Vue / Flutter) uses 3 cache breakpoints (Anthropic
prompt caching, 5-min TTL):

1. **Static instructions** — "you are slicing Figma → component code"
2. **Conventions doc** — `docs/architecture/component-conventions/{vue|flutter}.md`
3. **Few-shot examples** — 1-2 components from the reference repo, copied verbatim

Plus dynamic (no cache) per-call:
- Compressed Figma AST for the target frame
- Token digest from `@btech/tokens`
- Schema requirements (props, variants from `component.meta.yaml` if updating)

## Vue → React converter prompt cache

Same 3-breakpoint structure, but conventions = React doc, few-shot =
2-3 paired Vue↔React examples we author:
- `tools/vue-to-react/few-shot/avatar.{vue,tsx}` (manual, hand-validated)
- `tools/vue-to-react/few-shot/badge.{vue,tsx}` (after badge implemented)
- `tools/vue-to-react/few-shot/button.{vue,tsx}` (when button comes)

Dynamic per-call: the source Vue SFC content.

## Cost projection

- First component slice: ~$0.20 (3 cache breakpoints filled, no hit)
- Components 2-N within 5 min: ~$0.05 (cache hit on instructions +
  conventions + few-shot)
- Vue→React conversion: ~$0.04 per component (smaller prompt scope)
- 100 components total: ~**$8** including cache misses

## Validation per generation

After every slicer / converter run:
1. Syntax: `tsc --noEmit` (TS) or `flutter analyze` (Dart)
2. Imports resolve from `@btech/tokens` only
3. Class signature matches `component.meta.yaml` props array
4. Visual snapshot rendered, eyeballed against Figma frame
5. If any check fails → 1 retry with error context, then escalate to human

See [component-conventions/{flutter,vue,react}.md](./component-conventions/)
for per-framework idiom details.
