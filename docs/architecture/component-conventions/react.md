# React component conventions (@btech/ui-react)

**Status:** MANDATORY  •  **Reference:** [shadcn/ui](../reference-repos.md#react--shadcnui) (READ-ONLY)

> ⚠️ **React components are GENERATED** by the `tools/vue-to-react/`
> converter agent from existing Vue SFCs. Do NOT hand-write React
> components from scratch — write Vue first, then convert. Manual
> edits to converter output ARE allowed for fine-tuning, but the
> "starting point" is always converter output.

## Folder structure

Mirrors the Vue layout (atomic + organisms split):

```
packages/ui/react/src/
├── components/
│   ├── atoms/         # BTBadge, BTButton, BTCheckbox, ...
│   ├── molecules/     # BTAvatar, BTAlert, BTDropdown, ...
│   ├── organisms/     # BTAvatarGroup, BTFormInput, BTModal, ...
│   └── patterns/      # BTEmptyState, BTChat, ...
└── index.ts           # ESM barrel + side-effect CSS import
```

## Per-component anatomy

```
{layer}/{Name}/
├── BT{Name}.tsx              # function component + displayName
├── BT{Name}.types.ts         # public types (interfaces, type aliases)
├── BT{Name}.css              # plain CSS (NOT CSS modules)
├── component.meta.yaml       # props/variants/figmaUrl schema
└── index.ts                  # barrel: re-exports component + types
```

## Naming

| Kind | Pattern | Example |
|---|---|---|
| Folder | PascalCase | `Avatar`, `AvatarGroup`, `Badge` |
| Component file | `BT` + PascalCase + `.tsx` | `BTAvatar.tsx` |
| Types file | `BT` + PascalCase + `.types.ts` | `BTAvatar.types.ts` |
| CSS file | `BT` + PascalCase + `.css` | `BTAvatar.css` |
| Component name | `BT` + PascalCase | `BTAvatar`, `BTAvatarGroup` |
| Props interface | `BT{Name}Props` | `BTAvatarProps` |
| Item interface | `BT{Name}Item` | `BTAvatarItem` |
| CSS class prefix | `btech-{kebab-name}` (matches Vue) | `.btech-avatar` |
| BEM modifier | `--{state}` or `--{variant}` | `.btech-avatar--md` |
| Data-slot attribute | `data-slot="{kebab-name}"` (shadcn idiom) | `data-slot="avatar"` |

`data-slot` is a shadcn idiom worth borrowing — lets parent components
target child markup without exposing CSS classes. Useful for theming
hooks.

## Component pattern

Use **function components with explicit Props interface**. NO
`React.FC` (deprecated pattern). NO `forwardRef` for components that
don't need a ref (React 19 passes ref via props).

```tsx
import * as React from 'react';
import type { BTAvatarProps } from './BTAvatar.types';
import './BTAvatar.css';

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

/**
 * BTAvatar — circular badge with image or auto-derived initials.
 * Sliced from Figma `Avatar` (node 497:979).
 *
 * Mirrors @btech/ui-vue and btech_ui (Flutter) one-to-one.
 *
 * Variant precedence (highest first):
 *   1. isLoading=true   → skeleton placeholder
 *   2. item.imageUrl    → <img> with errorBuilder fallback
 *   3. (default)        → initials derived from item.name
 */
export const BTAvatar: React.FC<BTAvatarProps> = ({
  item,
  size = 'md',
  isLoading = false,
  className,
}) => {
  // Same variant resolution order as Vue/Flutter
  const variant = isLoading
    ? 'loading'
    : item.imageUrl
      ? 'image'
      : 'initials';

  const classes = cn(
    'btech-avatar',
    `btech-avatar--${size}`,
    `btech-avatar--${variant}`,
    className,
  );

  return (
    <div
      data-slot="avatar"
      data-size={size}
      data-variant={variant}
      className={classes}
      role="img"
      aria-label={item.name}
    >
      {/* variant-specific render */}
    </div>
  );
};

BTAvatar.displayName = 'BTAvatar';
```

## Variant API — discriminated props (no forwardRef-only patterns)

Same prop names + values as Vue/Flutter — guaranteed by the converter
agent. Component resolves variant via priority order matching the Vue
`computed` and Flutter named-constructor logic.

```tsx
<BTAvatar item={{ name: 'FL' }} size="md" />
<BTAvatar item={{ name: 'JD', imageUrl: 'https://...' }} size="lg" />
<BTAvatar item={{ name: 'AB' }} isLoading />
```

For polymorphism (rendering as different element), use the **`asChild`
pattern via Radix Slot** (shadcn idiom) when needed:

```tsx
<BTBadge asChild><a href="/profile">Active</a></BTBadge>
```

Only use `asChild` when there's a concrete need (e.g. rendering as
`<a>` for links). Default = render as expected element type.

## Doc comments

JSDoc on the **component file header** + per-prop in `.types.ts`:

```ts
// BTAvatar.types.ts
/** A user payload — name (used for initials derivation), optional imageUrl, optional color. */
export interface BTAvatarItem {
  /** Used to derive 1-2 character initials when imageUrl is absent. */
  name: string;
  /** When provided, renders as <img> instead of initials. */
  imageUrl?: string;
  /** Background color for initials variant. Defaults to `green`. */
  color?: BTAvatarColor;
}

export interface BTAvatarProps {
  /** The avatar payload. */
  item: BTAvatarItem;
  /** Size of the avatar circle. Defaults to `md` (40px). */
  size?: BTAvatarSize;
  /** When `true`, renders a skeleton placeholder. */
  isLoading?: boolean;
  /** Pass-through className for layout overrides. */
  className?: string;
}
```

## Token consumption

NEVER use `class-variance-authority` (cva) — even though shadcn does.
We use plain CSS with custom properties and BEM modifiers because:
1. Cross-framework parity with Vue (which uses plain CSS)
2. Avoids runtime cva dependency
3. Easier visual parity check vs Figma

```css
/* BTAvatar.css */
.btech-avatar {
  display: inline-flex;
  border-radius: var(--radius-rd, 9999px);
  background: var(--bg-subtler, #dbdde1);
  color: var(--text-secondary, #64748b);
  font-family: var(--font-family-sans, 'Geist', system-ui, sans-serif);
}
.btech-avatar--md { width: 40px; height: 40px; font-size: 16px; }
.btech-avatar--color-green { background: #89ae68; color: var(--text-inverse); }
```

For component-specific palettes: hardcode hex per
[component-specific colors rule](../figma-visual-rule.md).

## Side-effect CSS import

Each `BT{Name}.tsx` imports its own CSS. Top-level `src/index.ts`
re-imports for bundler:

```ts
// src/index.ts
export * from './components/molecules/Avatar/index.js';
export * from './components/organisms/AvatarGroup/index.js';

// Side-effect imports — bundler picks these up for styles.css aggregate
import './components/molecules/Avatar/BTAvatar.css';
import './components/organisms/AvatarGroup/BTAvatarGroup.css';
```

## Accessibility

Always set:
- `role` (e.g. `role="img"` on Avatar)
- `aria-label` (computed from props)
- `aria-hidden="true"` + `focusable="false"` on decorative SVG icons

## Barrel pattern

```ts
// index.ts
export { BTAvatar } from './BTAvatar.js';
export type {
  BTAvatarColor,
  BTAvatarItem,
  BTAvatarProps,
  BTAvatarSize,
} from './BTAvatar.types.js';
```

## component.meta.yaml

Co-located, identical schema to Vue/Flutter:

```yaml
schemaVersion: 1
name: BTAvatar
category: molecules
figmaNodeId: '497:979'
figmaUrl: https://www.figma.com/design/.../?node-id=497-979
# ... same as Vue
usage: |
  <BTAvatar item={{ name: 'Faisal Lestari' }} size="md" />
  <BTAvatar item={{ name: 'JD', imageUrl: 'https://...' }} />
```

## Linter / build

- TypeScript strict mode (`strict: true`)
- `tsup` for bundling: ESM + CJS + DTS + side-effect CSS
- `tsc --noEmit` MUST be clean

## Test convention

- React Testing Library (Phase 2)
- Smoke test = renders in `apps/ui-showcase/` without console errors
- Visual snapshot diff vs Figma frame at intended size

## Common questions answered

- **Where does the doc-comment live?** JSDoc on component file header
  + per-prop in `.types.ts`.
- **Example block format?** YAML `usage: |` block in
  `component.meta.yaml`. Plus 1-2 example calls in the JSDoc header.
- **Internals naming?** Helper functions defined at module level
  (e.g. `cn`, `deriveInitials`) inside the component file. Sub-components
  used internally extract to `BT{Name}.{Role}.tsx` only when >50 lines.
- **Test file convention?** `BT{Name}.test.tsx` (Phase 2 — RTL).

## Anti-patterns to avoid

| Don't | Why |
|---|---|
| `React.FC<Props>` everywhere | Inferred return type; arrow function with explicit props is fine |
| `forwardRef` for non-ref-needing components | React 19 ref-as-prop; only use forwardRef when interop with v17/v18 deps require it |
| `class-variance-authority` (cva) | Adds runtime dep; we use plain CSS classes for cross-framework parity |
| Composition pattern (`<Avatar>+<AvatarImage>+<AvatarFallback>`) | Breaks cross-framework API parity with Vue/Flutter |
| `useMemo` / `useCallback` on every prop | Premature optimization; only when profiler shows bottleneck |
| CSS-in-JS (styled-components, emotion) | Runtime cost; CSS files + custom properties are sufficient |
