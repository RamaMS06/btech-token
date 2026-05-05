# Figma URL = Visual Source of Truth

**Status:** MANDATORY  •  **Applies to:** every UI component in `packages/ui/*`

## The rule

When implementing or refactoring **any btech_ui component**, the visual
specification — sizes, colors, radii, shadows, typography, spacing,
borders — **ALWAYS comes from the Figma URL provided by the designer**.

No exceptions. No fallbacks to other design systems' values. No
"this seems consistent with X library so I'll use it".

## Why

We are a **branded design system for btech**, not a generic library.
The Figma file authored by our design team encodes brand decisions
(green primary, specific avatar palette, Geist typography, OKLCH color
ramps, etc.) that no upstream library can reproduce.

If our implementation drifts from Figma, designers can't trust the
component. The whole "design tokens as single source of truth" pipeline
collapses.

## Code-pattern references are NOT visual references

We use multiple reference repos for code patterns:

| Framework | Pattern reference repo | Type |
|---|---|---|
| Flutter | `Shared.Package.Mobile.DesignSystem` | Internal (BUMA) |
| Vue | `Shared.Package.Frontend.DesignSystem` | Internal (BUMA) |
| React | shadcn/ui (GitHub) | External, READ-ONLY |

**These give us code idioms only** — file structure, naming, doc-comment
style, variant API patterns, accessibility patterns. **Never visual
values.**

Concrete examples of mismatches we've already encountered:

| Property | Reference says | Figma says | Use |
|---|---|---|---|
| Avatar sizes | `24/32/48/64/96/120` (buma-ui) | `24/32/40/48/64/96` (497:979) | **Figma** |
| Brand palette | `UIColors.primary600 = #08A94C` | green = `#89AE68` (Figma fill) | **Figma** |
| Border radius | shadcn `rounded-full` (9999px) | Figma full circle | Same — keep token |

When in doubt about a Figma value: **ask the designer**, never fall
back to reference defaults.

## Token-gap policy

When Figma uses a value that has **no equivalent token** in
`@btech/tokens`:

- **Component-specific palettes** (avatar's 6 colors, badge's tones if
  unique to badge) → **HARDCODE** the hex in the component file.
  Never tokenize one-off palettes — they pollute the foundation layer.
- **Shared semantic values** (text colors, surface backgrounds, status
  colors used across many components) → **add to `@btech/tokens`** in
  `packages/tokens/sources/`, regenerate, then use.

See [reference-repos.md](./reference-repos.md) for the full per-framework
reference table and constraint rules.

## Verification when implementing a component

1. Open the Figma URL → measure the frame
2. Compare with `@btech/tokens` — pick the closest existing token
3. If no token matches: hardcode (component-specific) OR propose to
   designer to add the token (shared semantic)
4. Commit the visual decision in `component.meta.yaml.figmaUrl` field
   so reviewers can verify

## Related rules

- [Component-specific colors → hardcode](../../CLAUDE.md#component-specific-colors)
- [Reference repos (per framework)](./reference-repos.md)
- [Generation flow](./generation-flow.md)
