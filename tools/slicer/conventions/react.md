# @btech/ui-react — React conventions

Generated React components transliterate buma-ui's Flutter patterns into
React idioms. Maintain cross-framework consistency with Vue/Flutter.

## 1. Folder structure (atomic design — same as Flutter)

```
packages/ui/react/src/components/
├── atoms/         # Button, Badge, Checkbox, Switch, Divider, ...
├── molecules/     # Avatar, DropdownTrigger, MenuItem, ...
├── organisms/     # FormInput, Modal, Card, Table, ...
└── patterns/      # EmptyState, Chat, ...
```

## 2. Per-component anatomy

```
components/{layer}/{Name}/
├── index.ts                  # public barrel
├── BT{Name}.tsx              # main FC + displayName
├── BT{Name}.types.ts         # public types/interfaces
├── BT{Name}.css              # plain CSS — uses --token-name vars
└── internal/                 # OPTIONAL — hooks, helpers, sub-components
    └── use{Name}State.ts
```

## 3. Class / file naming

| Kind | Pattern | Example |
|---|---|---|
| Component | `BT` + PascalCase | `BTAvatar`, `BTButton` |
| Type alias | `BT{Name}Size`, `BT{Name}Color` | `BTAvatarSize` |
| Props interface | `BT{Name}Props` | `BTAvatarProps` |
| CSS class | `btech-{kebab-name}` | `.btech-avatar`, `.btech-avatar--md` |
| BEM modifier | `--{state}` or `--{variant}` | `.btech-avatar--initials`, `.btech-avatar--color-green` |

Files are `BT{Name}.tsx` (PascalCase). The `index.ts` barrel re-exports.

## 4. Variant API — discriminated props

React doesn't have constructor overloading, so we use discriminated props.
Same prop names + values as Flutter's discriminated default constructor.

```tsx
<BTAvatar size="md" initials="FL" color="green" />
<BTAvatar size="md" src="..." alt="..." />
<BTAvatar size="md" count={5} />
<BTAvatar size="md" status="error" />
```

Component resolves the variant via priority order documented in the file
header (matches Flutter precedence exactly).

## 5. JSDoc

Public API uses JSDoc on the props interface:

```ts
export interface BTAvatarProps {
  /** Size of the avatar circle. Defaults to `md` (40px). */
  size?: BTAvatarSize;
  /** Image source URL. When provided, overrides `initials`/`count`. */
  src?: string;
}
```

File header is a JSDoc block describing the component, the Figma node
ID, and the variant precedence (mirror the Flutter `///` header).

## 6. Token usage

Never hardcode hex values for tokenized properties. Use CSS custom
properties with explicit fallback:

```css
.btech-avatar {
  border-radius: var(--radius-rd, 9999px);
  font-family: 'Geist', system-ui, sans-serif;
}
.btech-avatar--empty {
  background: var(--bg-subtler, #dbdde1);
  color: var(--text-secondary, #64748b);
}
```

Brand palette colors not yet tokenized (avatar green/blue/etc.) get
hardcoded with a `/* TODO: tokenize via color.avatar.* */` comment.

## 7. Side-effect CSS import

Every `BT{Name}.tsx` imports its own `.css` directly. The package's
`src/index.ts` adds a side-effect import so consumers get bundled CSS:

```ts
import './components/molecules/Avatar/BTAvatar.css';
```

## 8. Accessibility

Always set `role`, `aria-label` (computed from props or alt text), and
`aria-hidden` on inline SVG icons. Mark icons `focusable="false"`.

## 9. Component file template

```tsx
/**
 * BT{Name} — short description. Sliced from Figma `{NodeName}` (node {id}).
 *
 * Mirrors @btech/ui-vue and btech_ui (Flutter) one-to-one.
 *
 * Variant precedence (highest first):
 *   1. ...
 */
import * as React from 'react';
import type { BT{Name}Props } from './BT{Name}.types.js';
import './BT{Name}.css';

export const BT{Name}: React.FC<BT{Name}Props> = ({ ...props }) => { ... };
BT{Name}.displayName = 'BT{Name}';
```

## 10. Build

`pnpm --filter @btech/ui-react build` produces dist/{cjs,esm,dts,css}.
Generated code MUST pass `tsc --noEmit` with strict mode.
