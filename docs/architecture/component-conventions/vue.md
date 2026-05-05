# Vue 3 component conventions (@btech/ui-vue)

**Status:** MANDATORY  •  **Reference:** [Shared.Package.Frontend.DesignSystem](../reference-repos.md#vue--buma-devbuma-ui-v2)

## Folder structure

```
packages/ui/vue/src/
├── components/
│   ├── atoms/         # BTBadge, BTButton, BTCheckbox, ...
│   ├── molecules/     # BTAvatar, BTAlert, BTDropdown, ...
│   ├── organisms/     # BTAvatarGroup, BTFormInput, BTModal, BTCard, ...
│   └── patterns/      # BTEmptyState, BTChat, ...
└── index.ts           # plugin install function + ESM exports
```

**Note:** `BTAvatarGroup` lives in `organisms/`, not `molecules/` —
mirrors `Shared.Package.Frontend` convention. Group = composition of
multiple molecules.

## Per-component anatomy

```
{layer}/{Name}/
├── BT{Name}.vue              # main SFC
├── BT{Name}.types.ts         # public types (interfaces, type aliases)
├── component.meta.yaml       # props/variants/figmaUrl schema
├── style/                    # OPTIONAL — separate CSS for complex components
│   └── _bt-{name}.css        # extracted styles (if <style> block grows >100 lines)
└── index.ts                  # barrel: re-exports default + types
```

For simple components, `<style>` block inside the SFC is fine. Extract
to `style/` only when CSS grows beyond ~100 lines or when shared
across multiple SFCs in the same domain.

## Naming

| Kind | Pattern | Example |
|---|---|---|
| Folder | PascalCase under atomic layer | `Avatar`, `AvatarGroup` |
| SFC file | `BT` + PascalCase + `.vue` | `BTAvatar.vue`, `BTAvatarGroup.vue` |
| Types file | `BT` + PascalCase + `.types.ts` | `BTAvatar.types.ts` |
| Component name in `<script>` | `BT{Name}` | `BTAvatar` (matches file) |
| Registered name | Same as component name | `<BTAvatar>` (no separate prefix) |
| Props interface | `BT{Name}Props` | `BTAvatarProps` |
| Item / data class interface | `BT{Name}Item` | `BTAvatarItem` |
| CSS class prefix | `btech-{kebab-name}` (matches React) | `.btech-avatar`, `.btech-avatar-group` |
| BEM modifier | `--{state}` or `--{variant}` | `.btech-avatar--md`, `.btech-avatar--color-green` |

The naming convention for btech-ds **diverges from `@buma-dev/buma-ui-v2`**
in one important way: their files are `Avatar.vue` (no prefix) and
class is registered as `BAvatar` globally; ours is `BTAvatar.vue` with
class `BTAvatar` and `BT` prefix everywhere. Reasoning: ESM-import
friendly (`import { BTAvatar } from '@btech/ui-vue'`) without needing
global plugin registration.

## Variant API — discriminated props

No constructor overloading in JavaScript, so Vue uses props with
`withDefaults`:

```vue
<script setup lang="ts">
import type { BTAvatarProps } from './BTAvatar.types';
import { computed } from 'vue';

const props = withDefaults(defineProps<BTAvatarProps>(), {
  size: 'md',
  isLoading: false,
});

// Resolve which visual variant to render. Order MUST match the
// Flutter named-constructor priority and React variant resolver.
const variant = computed<'image' | 'initials' | 'loading'>(() => {
  if (props.isLoading) return 'loading';
  if (props.item.imageUrl) return 'image';
  return 'initials';
});
</script>
```

Use `computed()` for derived state — keeps reactivity intact when
props change.

## File header & doc comments

File-level header uses **HTML comment** at the top of the SFC (above
`<script>`):

```vue
<!--
  BTAvatar — circular badge with image or auto-derived initials.
  Sliced from Figma `Avatar` (node 497:979).

  Variant precedence (highest first):
    1. isLoading=true   → skeleton placeholder
    2. item.imageUrl    → <img> (with errorBuilder fallback to initials)
    3. (default)        → initials derived from item.name
-->
<script setup lang="ts">
...
</script>
```

Per-prop JSDoc lives in the **`.types.ts` file**, NOT inline in
`defineProps<...>()`:

```ts
// BTAvatar.types.ts
export interface BTAvatarProps {
  /** The avatar payload — name (used for initials), optional image URL, optional color. */
  item: BTAvatarItem;
  /** Size of the avatar circle. Defaults to `md` (40px). */
  size?: BTAvatarSize;
  /** When `true`, renders a skeleton placeholder instead of the avatar content. */
  isLoading?: boolean;
}
```

This dual-file split (SFC + types) lets consumers `import type { BTAvatarProps }`
without pulling SFC runtime code. Mirrors `Shared.Package.Frontend`
convention.

## Token consumption

ALWAYS use `var(--btech-...)` CSS custom properties from
`@btech/tokens`. NEVER use SCSS function approach (`color()`, `space()`)
even though `Shared.Package.Frontend` does — see
[reference-repos.md](../reference-repos.md#vue--buma-devbuma-ui-v2)
for the divergence rationale.

```css
.btech-avatar {
  background: var(--bg-subtler, #dbdde1);
  color: var(--text-secondary, #64748b);
  border-radius: var(--radius-rd, 9999px);
  font-family: var(--font-family-sans, 'Geist', system-ui, sans-serif);
}
```

For component-specific palettes (avatar's 6 brand colors): hardcode
hex per [component-specific colors rule](../figma-visual-rule.md).

## Template patterns

Use `v-if` / `v-else-if` / `v-else` chain (NOT multiple separate
`v-if` — causes layout flicker):

```vue
<template>
  <div :class="classes" role="img" :aria-label="ariaLabel">
    <img v-if="variant === 'image' && item.imageUrl" :src="item.imageUrl" :alt="item.name" />
    <span v-else-if="variant === 'initials'">{{ initials }}</span>
    <div v-else class="btech-avatar__skeleton" />
  </div>
</template>
```

Keep `<style>` non-scoped (no `<style scoped>`) for design system styles
— we want CSS classes to work globally across the consumer app.

## Barrel pattern

```ts
// index.ts
export { default as BTAvatar } from './BTAvatar.vue';
export type {
  BTAvatarColor,
  BTAvatarItem,
  BTAvatarProps,
  BTAvatarSize,
} from './BTAvatar.types';
```

Top-level `src/index.ts` re-exports each component's `index.ts`:

```ts
export * from './components/molecules/Avatar/index';
export * from './components/organisms/AvatarGroup/index';
export * from './components/atoms/Badge/index';
```

**Diverges from `Shared.Package.Frontend`** which uses global plugin
registration (`app.component('BAvatar', ...)`). Our approach is pure
ESM imports — zero global side effects, tree-shaking friendly.

## component.meta.yaml

Co-located with each component. Mirrors Vue ref + Flutter ref schema:

```yaml
schemaVersion: 1
name: BTAvatar
category: molecules
figmaNodeId: '497:979'
figmaUrl: https://www.figma.com/design/.../?node-id=497-979
description: >
  Circular badge displaying a user's image or auto-derived initials.
uiConcerns:
  - identity
  - display
relatedComponents:
  - BTAvatarGroup
props:
  - { name: item, type: 'BTAvatarItem', required: true, description: '...' }
  - { name: size, type: 'BTAvatarSize', default: "'md'", description: '...' }
  - { name: isLoading, type: 'boolean', default: 'false', description: '...' }
enums:
  - { name: BTAvatarSize, values: [xs, sm, md, lg, xl, '2xl'] }
  - { name: BTAvatarColor, values: [green, blue, orange, purple, teal, pink] }
usage: |
  <BTAvatar :item="{ name: 'Faisal Lestari' }" size="md" />
  <BTAvatar :item="{ name: 'JD', imageUrl: 'https://...' }" size="lg" />
```

## Linter / build

- ESLint flat config — extends `vue/vue3-recommended` +
  `@typescript-eslint/recommended`
- `tsconfig.json` — `strict: true`, `noUnusedLocals: true`,
  `noUnusedParameters: true`
- Build: Vite library mode → `dist/{index.mjs, index.js, *.d.ts, styles.css}`
- Typecheck: `vue-tsc --noEmit` MUST be clean

## Test convention

- Storybook stories with play tests: `BTAvatar.stories.ts` (Phase 2)
- Unit tests for composables / pure helpers if any
- Smoke test = renders in `apps/ui-showcase-vue/` without errors

## Common questions answered

- **Where does the doc-comment live?** File header HTML comment
  (component overview + variant precedence) + per-prop JSDoc in
  `.types.ts`.
- **Example block format?** YAML `usage: |` block in
  `component.meta.yaml`.
- **Internals naming?** Computed properties prefix with role (no
  underscore — Vue convention). Truly private helpers extract to
  composables in `composables/use{Name}.ts`.
- **Test file convention?** `BT{Name}.stories.ts` with `play` functions.
