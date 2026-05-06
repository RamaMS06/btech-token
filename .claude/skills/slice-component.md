---
name: Slice Component
description: Generate a UI component for Flutter + Vue + React from a Figma frame URL, following btech-ds conventions
---

## Slice Component

Use when the user provides a Figma frame URL and asks to slice / generate
/ create / build a component for `packages/ui/`.

Triggers (any of):

- "slice this Figma frame"
- "generate a component from Figma"
- "create [component] from this Figma URL"
- "build the BT[X] component"

### Required reading before action

You MUST follow these rules:

1. [`CLAUDE.md`](../../CLAUDE.md) §1 — Figma URL is the visual source of
   truth. Sizes, colors, radii, typography come from Figma, NEVER from
   reference repos.
2. [`CLAUDE.md`](../../CLAUDE.md) §2 — Component-specific colors are
   HARDCODED, never tokenized.
3. [`CLAUDE.md`](../../CLAUDE.md) §3 — Reference repos for code patterns
   ONLY (Flutter: `~/Documents/FlutterProjects/Shared.Package.Mobile.DesignSystem`;
   Vue: `~/Documents/Vue/Shared.Package.Frontend.DesignSystem`).
3. [`CLAUDE.md`](../../CLAUDE.md) §4 — Generation flow: Figma → Vue +
   Flutter (parallel) → React (via `tools/vue-to-react/`). NEVER generate
   React in parallel from Figma.
4. [`CLAUDE.md`](../../CLAUDE.md) §5 — Clean-code: file < 200 lines,
   one component per folder, `component.meta.yaml` co-located, etc.
5. [`CLAUDE.md`](../../CLAUDE.md) §6 — Web CSS `var(--token)` only, no
   hex fallbacks.
6. [`CLAUDE.md`](../../CLAUDE.md) §7 — Color tokens looked up by HEX,
   never by name. Use the `verify-figma-mapping` skill for each color.
7. [`CLAUDE.md`](../../CLAUDE.md) §8 — Cross-framework prop / variant /
   render parity is mandatory.
8. [`CLAUDE.md`](../../CLAUDE.md) §9 — Use the per-framework conventions
   doc in `docs/architecture/component-conventions/`.

### Steps

1. **Confirm the Figma URL and component name** with the user. Ask if
   uncertain about atomic layer (atoms / molecules / organisms / patterns).

2. **Fetch the design** via `mcp__figma__get_design_context` with the
   `nodeId` and `fileKey` parsed from the URL. Note: `node-id=72-1516`
   in the URL maps to `nodeId=72:1516` (replace `-` with `:`).

3. **Review the variable definitions** Figma returns. For EACH color:
   - Run grep over `packages/tokens/sources/` for the exact hex.
   - If hex matches a semantic token → use the token reference.
   - If hex matches no token → hardcode (Flutter `Color(0xFF...)`,
     web `#hex`) per §2.
   - Per §7: NEVER pick a token name by linguistic intuition.

4. **Read the relevant reference repo** for code patterns (NOT visual
   values):
   - Flutter: corresponding component under
     `~/Documents/FlutterProjects/Shared.Package.Mobile.DesignSystem/lib/src/components/`
   - Vue: corresponding component under
     `~/Documents/Vue/Shared.Package.Frontend.DesignSystem/src/components/`
   - React: shadcn/ui (read the GitHub source) for React idioms ONLY
     when no Vue equivalent exists.

5. **Generate Vue + Flutter in parallel.** Use the slicer if available
   (`pnpm slice <url>`), otherwise hand-write following the conventions
   docs and the patterns observed in step 4.

6. **Generate React via the converter agent**:
   `pnpm convert-vue-to-react <vue-file>`. Never generate React from
   scratch — always go through Vue.

7. **Validate**:
   ```bash
   flutter analyze packages/ui/flutter --no-fatal-infos
   pnpm --filter @btech/ui-react exec tsc --noEmit
   pnpm --filter @btech/ui-vue exec vue-tsc --noEmit
   ```
   All MUST be clean.

8. **Add showcase entries** in all 3 apps (`apps/ui/react/`,
   `apps/ui/ui-showcase-vue/`, `apps/ui/ui-showcase-flutter/`). The
   slicer auto-appends, but verify manually.

9. **Write `component.meta.yaml`** for each framework with `figmaUrl`,
   `figmaNodeId`, props, variants. This is non-negotiable per §5.

10. **Report to the user**: list the files written, confirm validators
    passed, and call out any colors that were hardcoded vs tokenized.

### Cost discipline

The slicer pipeline uses Claude Sonnet with prompt caching. Each slice
should hit the cache (input tokens charged at 10% rate). If you see
high token usage in tool results, flag it — possibly cache breakpoints
need tuning.

### Forbidden

- Inventing visual values — always trace to Figma.
- Picking color tokens by name without hex verification.
- Generating React in parallel from Figma — Vue first, always.
- Inline `<style>` in `.vue` files — separate `BT<Name>.css` per §9.
- Adding component-specific colors to `packages/tokens/sources/`.
- Hex fallbacks in `var(--token, #fallback)` — forbidden by §6.
