---
name: Verify Figma Mapping
description: Map a Figma color to a btech token by hex lookup, never by name — enforces CLAUDE.md §7
---

## Verify Figma Mapping

Use whenever mapping a Figma variable / hex to a btech token.

Triggers (any of):

- "map this Figma color to a token"
- "what token is this hex"
- "verify color mapping"
- "is `<name>` the right token for this Figma value"
- ANY situation where you're choosing between `subtle` / `subtler` /
  `subtlest` or similar variants

### Why this skill exists

[`CLAUDE.md`](../../CLAUDE.md) §7 documents two real footguns:

1. `subtle` / `subtler` / `subtlest` are 3 DIFFERENT values, not synonyms.
2. Lightness ordering is NOT consistent across families:
   - `bg.*`: `subtle` (lightest) → `subtler` → `subtlest`
   - `color.ext.*-subtle/-subtler`: `subtler` (lightest) → `subtle`

Past bug: BTBadge web CSS shipped Tailwind `green.100` (#dcfce7) when
Figma asked for btech `green.100` (#e2f3e9). Picking by name shipped a
WRONG color that LOOKED right.

### Steps (do EVERY time, no exceptions)

1. **Get the EXACT hex from Figma**. Use one of:
   - `mcp__figma__get_variable_defs` with the fileKey + nodeId
   - `mcp__figma__get_design_context` (variables included in response)
   - User pastes hex directly

2. **Search the token sources for that hex**:
   ```bash
   grep -rn "<hex-without-#>" packages/tokens/sources/
   # also try the lowercase form, and the {color.x.y} alias form
   ```

3. **Match by hex value, NOT by name**.
   - If exactly one token resolves to that hex → use it.
   - If multiple tokens share that hex → prefer the one whose semantic
     role matches the component context (badge background → `color.ext.*`,
     surface bg → `bg.*`, text → `text.*`).
   - If NO token matches → the color is component-specific. HARDCODE it
     per [`CLAUDE.md`](../../CLAUDE.md) §2 (never add to
     `packages/tokens/sources/`).

4. **Write the reference**:
   - Flutter: `context.btechColor.<path>` for tokens; `Color(0xFF...)` for
     hardcoded values (in `internal/<name>.constants.dart`).
   - Web CSS: `var(--<token-name>)` for tokens (NO hex fallback per §6);
     `#hex` directly for hardcoded values, with a comment noting the
     Figma source.

5. **Document the choice** in a comment when hardcoding:
   ```dart
   // Figma 72:1516 — component-specific palette per CLAUDE.md §2
   const _badgeBrandSubtle = Color(0xFFf9f6f1);
   ```

### Forbidden shortcuts

- "Figma says `subtle` so it must be `bg.subtle`" — verify hex first.
- "It looks like a light green, must be `green.100`" — Tailwind
  `green.100` ≠ btech `green.100`. Check the source file.
- "The web CSS var `--btech-color-green-100` should be the same as the
  DTCG primitive" — IT IS NOT. Web generator currently emits Tailwind
  values. See §7 footgun list.
- Skipping step 2 because "I remember this hex." Don't trust memory;
  grep is cheap.

### Output format expected

When you finish a mapping, report to the user in this shape:

```
Figma `success-subtler` (#e2f3e9)
  → packages/tokens/sources/core/color.primitive.json:green.100
  → semantic: color.ext.success-subtler
  → Flutter: context.btechColor.ext.successSubtler
  → Web CSS: var(--color-ext-success-subtler)
```

Or for hardcoded colors:

```
Figma badge brand bg (#f9f6f1)
  → no matching btech token (component-specific palette)
  → Flutter: Color(0xFFf9f6f1) in internal/badge.constants.dart
  → Web CSS: #f9f6f1 in BTBadge.css with comment
```
