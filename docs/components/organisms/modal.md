# BTModal

> Centred modal dialog with header, optional content slot, and footer with primary/secondary actions plus optional checkbox.

Figma: [D-Modal node `2123-1992`](https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=2123-1992) · [M-Modal node `2124-2190`](https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=2124-2190) · Category: Organisms

---

## Overview

`BTModal` renders a centred dialog over a darkened backdrop. The header sits in a white section (title + optional subtext + optional X button). An optional content slot follows in the same white section. The footer renders in a `bg-subtle` grey section with optional checkbox on the left and a primary action plus optional secondary action on the right.

On the web (Vue / React), the modal supports three width presets: `sm` (500 px), `md` (720 px), `lg` (1042 px). On Flutter (mobile), the panel is fixed at 328 dp and the footer stacks vertically — primary on top, secondary below.

Body scroll is locked while the modal is open. Clicking the backdrop dismisses the modal when `dismissable` is `true` (default).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `open` | `boolean` | — | Controls visibility. |
| `title` | `string` | — | Bold title shown at the top. |
| `subtext` | `string?` | — | Optional supporting text below the title. |
| `size` (web) | `'sm' \| 'md' \| 'lg'` | `'sm'` | Width preset. |
| `hasClose` | `boolean` | `true` | Show the X button in the header. |
| `hasFooter` | `boolean` | `true` | Show the footer section. |
| `primaryLabel` | `string` | `'Confirm'` | Label for the primary action button. |
| `hasSecondaryButton` | `boolean` | `true` | Show the secondary (cancel) button. |
| `secondaryLabel` | `string` | `'Cancel'` | Label for the secondary action button. |
| `hasCheckbox` | `boolean` | `false` | Show a checkbox at the left of the footer. |
| `checkboxLabel` | `string` | `"Don't show again"` | Label rendered next to the footer checkbox. |
| `dismissable` | `boolean` | `true` | Click backdrop closes the modal. |

### Vue emits

- `update:open(boolean)` — supports `v-model:open`.
- `primary()` — primary button pressed.
- `secondary()` — secondary button pressed.
- `close()` — X button or backdrop dismissed.
- `checkbox(checked: boolean)` — footer checkbox toggled.

### React callbacks

- `onPrimary?: () => void`
- `onSecondary?: () => void`
- `onClose?: () => void`
- `onCheckbox?: (checked: boolean) => void`

### Default slot / `children`

If a default slot (Vue) or `children` (React) is provided, it renders inside the white header section, below the title row.

## Variants / States

- **size = sm / md / lg** — three width presets on web. No effect on Flutter (always 328 dp).
- **hasClose = false** — hide the X button to force a deliberate primary/secondary choice.
- **hasFooter = false** — hide the entire footer section (useful for purely informational modals).
- **hasCheckbox = true** — show a checkbox + label on the left of the footer (e.g. "Don't show again").

## Usage

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { BTModal } from '@btech/ui-vue';

const open = ref(false);
</script>

<template>
  <button @click="open = true">Open</button>
  <BTModal
    v-model:open="open"
    title="Confirm action"
    subtext="Are you sure you want to continue?"
    size="md"
    @primary="open = false"
    @secondary="open = false"
  >
    <p>Optional content goes here.</p>
  </BTModal>
</template>
```

### React

```tsx
import { useState } from 'react';
import { BTModal } from '@btech/ui-react';

export function Example() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <BTModal
        open={open}
        title="Confirm action"
        subtext="Are you sure you want to continue?"
        size="md"
        onPrimary={() => setOpen(false)}
        onSecondary={() => setOpen(false)}
        onClose={() => setOpen(false)}
      >
        <p>Optional content goes here.</p>
      </BTModal>
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Programmatic — recommended:
final result = await BTModalSheet.show<bool>(
  context,
  title: 'Delete account',
  subtext: 'This action cannot be undone.',
  primaryLabel: 'Delete',
  onPrimary: () => Navigator.pop(context, true),
  onSecondary: () => Navigator.pop(context, false),
);

// Or embedded panel (no backdrop / route):
BTModal(
  open: true,
  title: 'Confirm',
  onPrimary: () { /* ... */ },
  onSecondary: () { /* ... */ },
)
```

---

## Notes

- **Tokens**: header background uses `bg.primary`, footer uses `bg.subtle`, secondary button uses `bg.secondary`, primary button uses `color.brand-primary` with `text.inverse` text. Corner radius uses `radius.md`; buttons use `radius.sm`.
- **Backdrop**: the dark overlay uses raw `rgba(0, 0, 0, 0.5)` — opacity overlays are exempt from the no-hex-fallback rule because they're not part of the named token system.
- **Accessibility**: panel has `role="dialog"` and `aria-modal="true"`; the close button has `aria-label="Close"`; body scroll is locked while open.
- **Animation**: web uses CSS keyframe enter (`bt-modal-panel-in`, 0.2s ease) plus Vue `<Transition>` for leave; Flutter relies on the default Material `showDialog` transition.
- **Mobile vs desktop**: Flutter footer stacks vertically (primary first, secondary below) per the M-Modal Figma spec — there is no `size` prop on Flutter.
