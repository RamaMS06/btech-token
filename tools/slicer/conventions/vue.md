# @btech/ui-vue — Vue 3 conventions

Generated Vue components transliterate buma-ui Flutter patterns into Vue 3
SFC idioms. Cross-framework consistency with React/Flutter is mandatory:
same prop names, same variant values, same precedence rules.

## 1. Folder structure (atomic design — same as Flutter/React)

```
packages/ui/vue/src/components/
├── atoms/
├── molecules/
├── organisms/
└── patterns/
```

## 2. Per-component anatomy

```
components/{layer}/{Name}/
├── index.ts                  # public barrel — re-exports default + types
├── BT{Name}.vue              # SFC: <script setup lang="ts"> + <template> + <style>
└── BT{Name}.types.ts         # public types (consumers can import for typing)
```

CSS lives inside `<style>` block of the SFC (no separate `.css` file
unless we need to share styles across components).

## 3. Class / file naming

| Kind | Pattern | Example |
|---|---|---|
| SFC class | `BT` + PascalCase | `BTAvatar`, `BTButton` |
| Type alias | `BT{Name}Size`, `BT{Name}Color` | `BTAvatarSize` |
| Props interface | `BT{Name}Props` | `BTAvatarProps` |
| CSS class | `btech-{kebab-name}` (matches React) | `.btech-avatar` |

## 4. Variant API — discriminated props with `defineProps`

```vue
<script setup lang="ts">
import type { BTAvatarProps } from './BTAvatar.types';

const props = withDefaults(defineProps<BTAvatarProps>(), {
  size: 'md',
  color: 'green',
});

const variant = computed<'error' | 'image' | 'count' | 'initials' | 'empty'>(() => {
  if (props.status === 'error') return 'error';
  if (props.src) return 'image';
  if (typeof props.count === 'number') return 'count';
  if (props.initials) return 'initials';
  return 'empty';
});
</script>
```

Use `computed()` to derive the variant — keeps reactivity intact when
props change. Same precedence order as Flutter / React.

## 5. Comment style

File header uses HTML comment in the template's parent block:

```vue
<!--
  BTAvatar — short description. Sliced from Figma `Avatar` (node 497:979).

  Variant precedence (highest first):
    1. status="error"  → ...
-->
<script setup lang="ts">
...
</script>
```

JSDoc inside `<script setup>` for inline functions; types file uses
JSDoc on each prop in the interface.

## 6. Token usage

CSS inside `<style>` (NO `scoped` for design system styles — we want
classes to work globally across the app):

```css
.btech-avatar {
  border-radius: var(--radius-rd, 9999px);
}
```

CSS rules MUST mirror @btech/ui-react CSS exactly (same class names,
same values). The two stylesheets are deliberately duplicated rather
than shared — when a token changes, only the file that needs updating
gets touched.

## 7. Template patterns

Use `v-if` / `v-else-if` / `v-else` chain for variant rendering, NOT
multiple separate `v-if` (causes layout flicker).

```vue
<template>
  <div :class="classes" role="img" :aria-label="ariaLabel">
    <img v-if="variant === 'image' && src" :src="src" :alt="alt ?? ''" />
    <span v-else-if="variant === 'initials'">{{ initials }}</span>
    <span v-else-if="variant === 'count'">{{ `+${count}` }}</span>
    <svg v-else-if="variant === 'empty'" ...>...</svg>
    <svg v-else ...>...</svg>
  </div>
</template>
```

## 8. Barrel pattern

```ts
// index.ts
export { default as BTAvatar } from './BTAvatar.vue';
export type { BTAvatarColor, BTAvatarProps, BTAvatarSize } from './BTAvatar.types';
```

The package `src/index.ts` re-exports each component's `index.ts`:

```ts
export * from './components/molecules/Avatar/index';
```

## 9. Build

`pnpm --filter @btech/ui-vue build` (Vite library mode) produces
`dist/{index.mjs,index.js,index.d.ts,styles.css}`. Generated code MUST
pass `vue-tsc --noEmit`.

## 10. Cross-framework parity check

Before shipping, run all three demos side-by-side and visually confirm
that for the same prop set, BT{Name} renders identically in:
- `pnpm showcase` (React @ 5178)
- `pnpm showcase:vue` (Vue @ 5179)
- `pnpm showcase:flutter` (Flutter Web)
