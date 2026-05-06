# BTTooltip

> Hover / tap tooltip that wraps a trigger widget and shows a floating balloon.

Figma: [node 479-2624](https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=479-2624) · Category: Atoms

---

## Overview

`BTTooltip` wraps any trigger element and displays a dark-background balloon with a rounded-tip arrow caret when the user hovers (desktop/web) or taps (mobile). The balloon is rendered outside the normal layout tree (Teleport / portal / OverlayEntry) so it never clips. Text content or a rich widget slot can be passed.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` / `String?` | — | Plain-text content shown in the balloon. Use `content`/`children` for rich widgets. |
| `content` / `children` | `ReactNode` / `Widget?` | — | Rich widget rendered inside the balloon — overrides `text`. |
| `position` | `BTTooltipPosition` | `'top'` | Which side of the trigger the balloon appears on. |
| `arrowPosition` | `BTTooltipArrowPosition` | `'mid'` | Where the arrow caret sits along its edge. |
| `disabled` | `boolean` / `bool` | `false` | When true the tooltip never shows. |
| `showDelay` (web) | `number` | `120` | Ms before the balloon appears on hover-in. |
| `hideDelay` (web) | `number` | `80` | Ms before the balloon hides on hover-out. |
| `child` (Flutter) | `Widget` | required | The trigger widget. |

## Variants / States

- **`position`**: `top` · `bottom` · `left` · `right`
- **`arrowPosition`**: `left` · `left-mid` · `mid` · `right-mid` · `right`
- **Disabled** — tooltip never shows when `disabled` is true.

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTTooltip } from '@btech/ui-vue';
</script>
<template>
  <!-- Simple text -->
  <BTTooltip text="Klik untuk menyimpan">
    <BTButton label="Simpan" @click="save" />
  </BTTooltip>

  <!-- Custom content -->
  <BTTooltip position="bottom" arrow-position="left-mid">
    <template #content><strong>Bold label</strong> with details</template>
    <span>hover me</span>
  </BTTooltip>
</template>
```

### React

```tsx
import { BTTooltip } from '@btech/ui-react';

export function Example() {
  return (
    <BTTooltip text="Klik untuk menyimpan">
      <button>Simpan</button>
    </BTTooltip>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

BTTooltip(
  text: 'Klik untuk menyimpan',
  child: BTButton(label: 'Simpan', onPressed: _save),
)

// Custom content
BTTooltip(
  position: BTTooltipPosition.bottom,
  content: const Text('Rich content', style: TextStyle(color: Colors.white)),
  child: const Icon(Icons.info_outline),
)
```

---

## Notes

- **Token usage**: background uses `--bg-inverse` / `context.btechColor.bg.inverse`; text uses `--text-inverse` / `context.btechColor.text.inverse`; radius uses `--radius-sm` / `context.btechRadius.sm`.
- **Font**: `var(--typography-font-family-sans)` (web) / `BTechTypography.fontFamily` (Flutter).
- **Arrow shape**: 16×8 px (horizontal) or 8×16 px (vertical) with a rounded quadratic-bezier tip — "agak rounded, tidak lancip".
- **Positioning**: web uses `position: fixed` + JS `getBoundingClientRect()` with viewport clamping; Flutter uses `OverlayEntry` with `localToGlobal`.
- **Dark mode**: all colors come from context tokens — automatically switches with theme.
