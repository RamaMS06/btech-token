# Slicing Workflow — Figma to 3 Frameworks

Step-by-step recipe for turning a Figma frame URL into shipping
components in `packages/ui/{flutter,react,vue}/`.

Read [`figma-visual-rule.md`](./figma-visual-rule.md),
[`generation-flow.md`](./generation-flow.md), and
[`reference-repos.md`](./reference-repos.md) before your first slice.

---

## Quick reference

```
Figma URL  →  Vue + Flutter (parallel)  →  React (via vue-to-react agent)
```

Three frameworks, two generation passes. Never generate React
in parallel from Figma — always go through Vue first.

---

## 0. Pre-flight checks

Before invoking the slicer:

1. **Reference repos cloned** at the paths in [`CLAUDE.md`](../../CLAUDE.md) §3.
2. **Figma MCP configured** (see [`docs/contributing-ui.md`](../contributing-ui.md) §3).
3. **`pnpm install` clean.**
4. **Showcase apps boot** (`pnpm showcase`, `:vue`, `:flutter`).
5. **You have read the conventions doc for each framework**
   (`docs/architecture/component-conventions/{flutter,react,vue}.md`).

---

## 1. Get the Figma URL from the designer

Designer sends a frame URL like:

```
https://www.figma.com/design/ABC123/Foo?node-id=72-1516
```

Confirm with designer:

- Is this a **single component** or a **set / variants page**?
- What's the **component name** (matches a noun, e.g. `Badge`, `Avatar`)?
- Does the design depend on any **other component** already shipped?
- Does it use **animation / interaction states** beyond hover/pressed?

---

## 2. Inspect the design via Figma MCP

In Claude Code, ask:

> "Get the design context for `https://www.figma.com/design/.../?node-id=72-1516`"

Claude calls `mcp__figma__get_design_context` and returns:

- A code reference (React + Tailwind — for shape, NOT to copy)
- A screenshot
- Variable definitions — **the canonical hex values per variant**
- Annotations

**Cross-check the hex values against btech tokens** per
[`CLAUDE.md`](../../CLAUDE.md) §7:

```bash
# example: Figma says #e2f3e9 for badge success bg
grep -rn "#e2f3e9\|e2f3e9" packages/tokens/sources/
# → packages/tokens/sources/core/color.primitive.json: { "green": { "100": "#e2f3e9" } }
# → packages/tokens/sources/semantic-color/light.json: "success-subtler": { "$value": "{color.green.100}" }
```

If hex matches a semantic token → use the token reference.
If hex matches NO existing token → hardcode per §2.

---

## 3. Run the slicer (Vue + Flutter parallel)

```bash
# Dry-run first — fetches Figma JSON, builds prompt, prints token count, no API call
pnpm slice --dry-run https://www.figma.com/design/.../?node-id=72-1516

# Full run — generates Vue + Flutter
pnpm slice https://www.figma.com/design/.../?node-id=72-1516
```

The slicer writes:

```
packages/ui/flutter/lib/src/components/<atomic-layer>/<name>/
  ├── <name>.dart
  ├── <name>.widget.dart
  ├── <name>.types.dart
  ├── component.meta.yaml
  └── internal/<name>.constants.dart   (if hardcoded palette)

packages/ui/vue/src/components/<atomic-layer>/BT<Name>/
  ├── BT<Name>.vue
  ├── BT<Name>.types.ts
  ├── BT<Name>.css
  ├── component.meta.yaml
  └── index.ts
```

Atomic layer (`atoms`/`molecules`/`organisms`/`patterns`) is inferred
from the schema or buma-ui's classification; correct manually if wrong.

---

## 4. Convert Vue → React

```bash
pnpm convert-vue-to-react packages/ui/vue/src/components/atoms/BTBadge/BTBadge.vue
```

Writes:

```
packages/ui/react/src/components/atoms/BTBadge/
  ├── BTBadge.tsx
  ├── BTBadge.types.ts   (typically a re-export of the Vue types)
  ├── BTBadge.css        (SHARED with Vue — may already exist)
  ├── component.meta.yaml
  └── index.ts
```

The converter preserves prop names + variant precedence + render
priority; CLAUDE.md §8 (parity rule) requires this.

---

## 5. Validate

```bash
flutter analyze packages/ui/flutter --no-fatal-infos
pnpm --filter @btech/ui-react exec tsc --noEmit
pnpm --filter @btech/ui-vue exec vue-tsc --noEmit
```

All three MUST be clean. The slicer + converter retry once on
validation failure; if it still fails, read the error and either fix
the prompt or hand-edit.

---

## 6. Add showcase entries

The slicer auto-appends showcase entries to all 3 apps:

| App | Showcase file | App entry updated |
|---|---|---|
| React | `apps/ui/react/src/showcases/BT<Name>Showcase.tsx` | `apps/ui/react/src/App.tsx` |
| Vue | `apps/ui/ui-showcase-vue/src/showcases/BT<Name>Showcase.vue` | `apps/ui/ui-showcase-vue/src/App.vue` |
| Flutter | `apps/ui/ui-showcase-flutter/lib/showcases/<name>_showcase.dart` | `apps/ui/ui-showcase-flutter/lib/main.dart` |

Verify by running each showcase:

```bash
pnpm showcase           # React
pnpm showcase:vue
pnpm showcase:flutter
```

The new component should render with all variants documented in the
schema's `component.meta.yaml`.

---

## 7. Visual diff against Figma

This is a **manual** step — the slicer can't fully verify pixel
accuracy. Open the Figma frame side-by-side with the showcase and
check:

- Sizes match (within 1px)
- Colors match exactly (use a color picker if uncertain)
- Spacing, gap, padding match
- Typography (font family, size, weight, line height)
- Border radius
- Shadow / elevation
- Hover / pressed / disabled states

If anything diverges, fix in the source file (NOT in the showcase).
The slicer-generated file is the source of truth.

---

## 8. Commit

```bash
git checkout -b feat/ui-<component>
git add packages/ui/{flutter,react,vue}/src/.../<name>/
git add apps/ui/*/src/showcases/BT<Name>Showcase.*
git add apps/ui/*/src/App.*  apps/ui/ui-showcase-flutter/lib/main.dart
git commit -m "feat(ui): add BT<Name> across 3 frameworks"
git push -u origin feat/ui-<component>
```

CI will run `flutter analyze`, `tsc`, `vue-tsc`, and lint validators
on the PR.

---

## 9. When the slicer fails or output is wrong

Common issues and fixes:

| Symptom | Likely cause | Fix |
|---|---|---|
| Color in output doesn't match Figma | Slicer mismapped a hex to wrong token | Re-run with `--force`, or fix manually following CLAUDE.md §7 workflow |
| Vue output uses `<style>` block | Slicer ignored web CSS rule | File a prompt-tuning bug; hand-fix per §9 (clean-code rule 9) |
| React `as` polymorphism missing | Vue→React converter conservative | Add manually — converter prefers safe output |
| Flutter widget >200 lines | Slicer didn't split internals | Manually extract to `internal/` per CLAUDE.md §5 (clean-code rule 2) |
| `tsc` fails on prop type | Schema in `component.meta.yaml` lies | Fix the YAML, re-run converter |
| Visual diff fails | Slicer confused by Figma auto-layout | Capture screenshot, hand-tune CSS / Flutter sizing |

For systematic problems (recurring across components), file an issue
on the slicer / converter, and update the cache-breakpoint prompts in
`tools/slicer/conventions/` and `tools/vue-to-react/src/prompts/`.

---

## 10. Cost expectations

Per CLAUDE.md / pipeline projection:

- First slice in a 5-minute window: ~$0.23 (no cache hit)
- Subsequent slices in the same window: ~$0.05 (90% cache hit)
- 100 components total: < $10

If you see costs spike, check that the prompt cache is hitting:
the slicer logs `cache_read_input_tokens > 0` on cached calls.
