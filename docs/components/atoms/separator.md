# BTSeparator

> A 1px visual divider line, horizontal or vertical.

Figma: [node 194:756](https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/Btech---Design-System?node-id=194-756) · Category: Atoms

---

## Overview

BTSeparator renders a single 1px line using the `border.primary` token. It stretches to fill
the available width (horizontal) or height (vertical) of its parent flex container.
Supports dark mode automatically via the token.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Direction of the divider line |
| `className` | `string` | — | Additional CSS class names (web only) |

## Variants

- **horizontal** — Full-width 1px line. Place inside a `flex-col` / `Column` container.
- **vertical** — Full-height 1px line. Place inside a `flex-row` / `Row` container with a bounded height.

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTSeparator } from '@btech/ui-vue';
</script>

<template>
  <!-- Horizontal (default) -->
  <div style="display: flex; flex-direction: column; gap: 12px;">
    <span>Section A</span>
    <BTSeparator />
    <span>Section B</span>
  </div>

  <!-- Vertical — parent must have a defined height -->
  <div style="display: flex; align-items: center; height: 32px; gap: 12px;">
    <span>Item A</span>
    <BTSeparator orientation="vertical" />
    <span>Item B</span>
  </div>
</template>
```

### React

```tsx
import { BTSeparator } from '@btech/ui-react';

export function Example() {
  return (
    <>
      {/* Horizontal (default) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span>Section A</span>
        <BTSeparator />
        <span>Section B</span>
      </div>

      {/* Vertical — parent must have a defined height */}
      <div style={{ display: 'flex', alignItems: 'center', height: 32, gap: 12 }}>
        <span>Item A</span>
        <BTSeparator orientation="vertical" />
        <span>Item B</span>
      </div>
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Horizontal (default) — inside a Column
Column(
  children: [
    Text('Section A'),
    const SizedBox(height: 12),
    const BTSeparator(),
    const SizedBox(height: 12),
    Text('Section B'),
  ],
)

// Vertical — inside a SizedBox + Row with bounded height
SizedBox(
  height: 32,
  child: Row(
    children: [
      Text('Item A'),
      const SizedBox(width: 12),
      const BTSeparator(orientation: BTSeparatorOrientation.vertical),
      const SizedBox(width: 12),
      Text('Item B'),
    ],
  ),
)
```

---

## Notes

- **Token**: uses `border.primary` — automatically adapts to dark mode.
- **Sizing**: the component itself is 1px; spacing around it must be provided by the parent
  (gap, SizedBox, margin).
- **Accessibility**: renders with `role="separator"` and `aria-orientation` on web.
- **Flutter**: for vertical use, the parent `Row` must have a bounded height
  (wrap in `SizedBox(height: ...)` or `IntrinsicHeight`).
