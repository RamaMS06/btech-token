# BTTooltipStep

> Coachmark / onboarding step balloon with navigation buttons, an optional title, and a close action.

Figma: [node 478-2463](https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=478-2463) · Category: Molecules

---

## Overview

`BTTooltipStep` is a standalone presentational balloon used for onboarding coach marks and step-by-step guided tours. It renders a dark-background card with an arrow caret, an optional title, a description, an optional rich-content slot, and a footer with navigation buttons. Positioning relative to the target element is the **caller's responsibility** — wrap in an absolutely-positioned container or a Flutter `Positioned` + `Stack`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `description` | `string` / `String` | required | Main body text. |
| `label` | `string?` / `String?` | — | Bold title at top of card. Hidden when not provided. |
| `stepLabel` | `string?` / `String?` | — | Step indicator, e.g. "Step 1 of 5". When provided the footer is shown. |
| `stepVariant` | `BTTooltipStepVariant` | `'button'` | Navigation button style. |
| `hasClose` | `boolean` / `bool` | `false` | Show a × button in the top-right corner. |
| `prevLabel` | `string` / `String` | `'Prev'` | Label for the Prev button (button/link variants). |
| `nextLabel` | `string` / `String` | `'Next'` | Label for the Next button (button/link variants). |
| `position` | `BTTooltipPosition` | `'top'` | Which side the arrow caret renders on. |
| `arrowPosition` | `BTTooltipArrowPosition` | `'mid'` | Arrow offset along the edge. |
| `onPrev` / `@prev` | callback | — | Fired when Prev button is tapped. |
| `onNext` / `@next` | callback | — | Fired when Next button is tapped. |
| `onClose` / `@close` | callback | — | Fired when × is tapped. |
| `children` / `child` | slot / `Widget?` | — | Optional rich content rendered between description and footer. |

## Variants / States

- **`stepVariant: 'button'`** — secondary rounded-rectangle buttons (Prev / Next).
- **`stepVariant: 'link'`** — text-link buttons: grey Prev, brand-blue Next.
- **`stepVariant: 'centered'`** — icon-only chevron `<` `>` buttons centered with step label between.
- **`hasClose: true`** — shows a × icon at top-right; tapping fires `onClose`.

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTTooltipStep } from '@btech/ui-vue';
</script>
<template>
  <!-- Button variant -->
  <BTTooltipStep
    label="Fitur Baru"
    description="Klik tombol ini untuk memulai."
    step-label="Step 1 of 3"
    step-variant="button"
    :has-close="true"
    prev-label="Kembali"
    next-label="Selanjutnya"
    position="bottom"
    @prev="goPrev"
    @next="goNext"
    @close="endTour"
  />

  <!-- Centered icon-button variant -->
  <BTTooltipStep
    description="Geser untuk navigasi."
    step-label="2 / 5"
    step-variant="centered"
    position="top"
    @prev="goPrev"
    @next="goNext"
  />
</template>
```

### React

```tsx
import { BTTooltipStep } from '@btech/ui-react';

export function Example() {
  return (
    <BTTooltipStep
      label="Fitur Baru"
      description="Klik tombol ini untuk memulai."
      stepLabel="Step 1 of 3"
      stepVariant="button"
      hasClose
      prevLabel="Kembali"
      nextLabel="Selanjutnya"
      position="bottom"
      onPrev={goPrev}
      onNext={goNext}
      onClose={endTour}
    />
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Inside a Stack + Positioned for exact placement:
BTTooltipStep(
  label: 'Fitur Baru',
  description: 'Klik tombol ini untuk memulai.',
  stepLabel: 'Step 1 of 3',
  stepVariant: BTTooltipStepVariant.button,
  hasClose: true,
  prevLabel: 'Kembali',
  nextLabel: 'Selanjutnya',
  position: BTTooltipPosition.bottom,
  onPrev: _goPrev,
  onNext: _goNext,
  onClose: _endTour,
)

// Centered variant
BTTooltipStep(
  description: 'Geser untuk navigasi.',
  stepLabel: 'Step 2 of 5',
  stepVariant: BTTooltipStepVariant.centered,
  position: BTTooltipPosition.top,
  onPrev: _goPrev,
  onNext: _goNext,
)
```

---

## Notes

- **Positioning**: `BTTooltipStep` is purely presentational — it does not auto-target an element. The caller is responsible for placing it relative to the highlighted element (Flutter: `Positioned` in a `Stack`; web: absolute/fixed container).
- **Token usage**: balloon background `--bg-inverse`; title/description/step `--text-inverse`; Prev button background `--bg-secondary`; Prev text `--text-primary`; Next link / icon button `--color-brand-primary`; radius `--radius-sm`.
- **Font**: `var(--typography-font-family-sans)` (web) / `BTechTypography.fontFamily` (Flutter).
- **Arrow**: same 16×8 px quadratic-bezier caret as `BTTooltip`.
- **Dark mode**: all colors via context tokens — automatically reactive.
- **Re-exports**: `BTTooltipPosition` and `BTTooltipArrowPosition` are re-exported from the `BTTooltip` atom barrel so consumers only need to import from `BTTooltipStep`.
