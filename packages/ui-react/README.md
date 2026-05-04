# @btech/ui-react

React component library for the BTech Design System. Components are sliced
from Figma frames and consume design tokens from `@btech/tokens`.

## Install

```bash
pnpm add @btech/ui-react @btech/tokens-bspace
```

(`@btech/tokens-bspace` ships the tenant-specific CSS — swap for any other
tenant package or `@btech/tokens` for the default theme.)

## Usage

```tsx
import { Avatar } from '@btech/ui-react';
import '@btech/ui-react/styles.css';
import '@btech/tokens-bspace/styles.css';

export function App() {
  return (
    <>
      <Avatar size="md" initials="FL" color="green" />
      <Avatar size="lg" src="/john.jpg" alt="John" />
      <Avatar size="sm" count={5} />
      <Avatar size="md" />              {/* empty placeholder */}
      <Avatar size="md" status="error" />{/* broken-image state */}
    </>
  );
}
```

## Components

| Component | Status | Figma node |
|---|---|---|
| `Avatar` | ✅ alpha | `497:979` |

## Architecture

- **Tenant-agnostic** — components consume CSS variables (`--bg-subtler`,
  `--radius-rd`, etc.) so the active tenant package transparently themes
  every avatar/button/card.
- **Idiomatic React** — function components, props are plain TS types, no
  framework-specific magic.
- **Pure CSS** (not CSS-in-JS) — single `styles.css` import, zero runtime
  cost.
