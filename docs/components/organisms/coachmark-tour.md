# BTCoachmarkTour

> Multi-step onboarding overlay with a spotlight cutout, animated balloon, and built-in prev/next/close navigation.

Figma: node `2157-1726` · Category: Organisms

---

## Overview

`BTCoachmarkTour` renders a darkened backdrop with a 5 px border-radius spotlight cutout around the current step's target element, and positions a `BTTooltipStep` balloon adjacent to it. The tour is fully controlled — the host provides a step index and receives change events.

All overlay logic (spotlight, positioning, animation, navigation) lives inside the component package. Developers only declare steps with target refs/keys and a step index.

## API

### Vue — `BTCoachmarkTour`

| Prop | Type | Default | Description |
|---|---|---|---|
| `steps` | `BTCoachmarkStep[]` | — | Ordered list of step definitions |
| `step` | `number` | — | Active step index; −1 = hidden. Use `v-model:step`. |
| `dismissable` | `boolean` | `true` | Whether clicking the backdrop closes the tour |
| `step-variant` | `BTTooltipStepVariant` | `'button'` | Tour-level footer variant (overridden per step) |
| `prev-label` | `string` | `'Prev'` | Tour-level prev label (overridden per step) |
| `next-label` | `string` | `'Next'` | Tour-level next label (overridden per step) |

**Emits:** `update:step(index)`, `finish`, `prev(index)`, `next(index)`

### React — `BTCoachmarkTour`

| Prop | Type | Default | Description |
|---|---|---|---|
| `steps` | `BTCoachmarkStep[]` | — | Ordered list of step definitions |
| `step` | `number` | — | Active step index; −1 = hidden |
| `dismissable` | `boolean` | `true` | Whether clicking the backdrop closes the tour |
| `stepVariant` | `BTTooltipStepVariant` | `'button'` | Tour-level footer variant |
| `prevLabel` | `string` | `'Prev'` | Tour-level prev label |
| `nextLabel` | `string` | `'Next'` | Tour-level next label |
| `onStepChange` | `(index: number) => void` | — | Called when the step changes or tour closes (−1) |
| `onFinish` | `() => void` | — | Called when the final step's Next is pressed |

### Flutter — `BTCoachmarkController`

| Constructor param | Type | Default | Description |
|---|---|---|---|
| `steps` | `List<BTCoachmarkStep>` | — | Ordered list of step definitions |
| `dismissable` | `bool` | `true` | Whether tapping the backdrop closes the tour |
| `stepVariant` | `BTTooltipStepVariant` | `button` | Tour-level footer variant |
| `prevLabel` | `String` | `'Prev'` | Tour-level prev label |
| `nextLabel` | `String` | `'Next'` | Tour-level next label |
| `onFinish` | `VoidCallback?` | — | Called when the final step's Next is pressed |

**Methods:** `show(BuildContext, {int startAt = 0})`, `dismiss()`, `dispose()`

## BTCoachmarkStep (data class)

| Field | Vue/React type | Flutter type | Description |
|---|---|---|---|
| `targetRef` / `targetKey` | `Ref<HTMLElement\|null>` / `RefObject<…>` | `GlobalKey` | Reference to the target widget/element |
| `description` | `string` | `String` | Main coachmark text (required) |
| `label` | `string?` | `String?` | Bold heading above description |
| `stepLabel` | `string?` | `String?` | Step counter e.g. "Step 1 of 5" |
| `stepVariant` | `BTTooltipStepVariant?` | `BTTooltipStepVariant` | Per-step footer variant |
| `position` | `BTTooltipStepPosition?` | `BTTooltipPosition?` | Arrow side; auto-detected when null |
| `prevLabel` | `string?` | `String?` | Per-step prev label |
| `nextLabel` | `string?` | `String?` | Per-step next label |

## Variants / States

- **button** — Prev/Next rendered as secondary buttons (default)
- **link** — Prev/Next rendered as text links
- **centered** — Centered chevron icon-buttons

## Usage

### Vue

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { BTCoachmarkTour } from '@btech/ui-vue';
import type { BTCoachmarkStep } from '@btech/ui-vue';

const step1Ref = ref<HTMLElement | null>(null);
const step2Ref = ref<HTMLElement | null>(null);
const tourStep = ref(-1);

const steps = computed<BTCoachmarkStep[]>(() => [
  {
    targetRef: step1Ref,
    label: 'Fitur Baru',
    description: 'Mulai perjalanan di sini.',
    stepLabel: 'Step 1 of 2',
    position: 'bottom',
  },
  {
    targetRef: step2Ref,
    description: 'Langkah terakhir.',
    stepLabel: 'Step 2 of 2',
    position: 'top',
  },
]);
</script>

<template>
  <button ref="step1Ref" @click="tourStep = 0">Start Tour</button>
  <button ref="step2Ref">Another button</button>

  <BTCoachmarkTour
    :steps="steps"
    v-model:step="tourStep"
    :dismissable="true"
    step-variant="button"
    @finish="tourStep = -1"
  />
</template>
```

### React

```tsx
import { useRef, useMemo, useState } from 'react';
import { BTCoachmarkTour } from '@btech/ui-react';
import type { BTCoachmarkStep } from '@btech/ui-react';

export function Example() {
  const ref1 = useRef<HTMLButtonElement | null>(null);
  const ref2 = useRef<HTMLButtonElement | null>(null);
  const [tourStep, setTourStep] = useState(-1);

  const steps = useMemo<BTCoachmarkStep[]>(() => [
    { targetRef: ref1, label: 'Fitur Baru', description: 'Mulai di sini.', stepLabel: 'Step 1 of 2', position: 'bottom' },
    { targetRef: ref2, description: 'Langkah terakhir.', stepLabel: 'Step 2 of 2', position: 'top' },
  ], []);

  return (
    <>
      <button ref={ref1} onClick={() => setTourStep(0)}>Start Tour</button>
      <button ref={ref2}>Another button</button>
      <BTCoachmarkTour
        steps={steps}
        step={tourStep}
        onStepChange={setTourStep}
        onFinish={() => setTourStep(-1)}
      />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class MyPage extends StatefulWidget {
  const MyPage({super.key});
  @override
  State<MyPage> createState() => _MyPageState();
}

class _MyPageState extends State<MyPage> {
  final _key1 = GlobalKey();
  final _key2 = GlobalKey();
  late final BTCoachmarkController _tour;

  @override
  void initState() {
    super.initState();
    _tour = BTCoachmarkController(
      steps: [
        BTCoachmarkStep(
          targetKey: _key1,
          label: 'Fitur Baru',
          description: 'Mulai di sini.',
          stepLabel: 'Step 1 of 2',
          position: BTTooltipPosition.bottom,
        ),
        BTCoachmarkStep(
          targetKey: _key2,
          description: 'Langkah terakhir.',
          stepLabel: 'Step 2 of 2',
          position: BTTooltipPosition.top,
        ),
      ],
      dismissable: true,
      onFinish: () => print('Tour selesai'),
    );
  }

  @override
  void dispose() {
    _tour.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        KeyedSubtree(
          key: _key1,
          child: ElevatedButton(
            onPressed: () => _tour.show(context),
            child: const Text('Start Tour'),
          ),
        ),
        KeyedSubtree(
          key: _key2,
          child: const Text('Another element'),
        ),
      ],
    );
  }
}
```

---

## Notes

- **Spotlight**: implemented via `box-shadow: 0 0 0 9999px rgba(0,0,0,0.55)` (web) and `PathFillType.evenOdd` CustomPainter (Flutter). No canvas or SVG required.
- **Auto-position**: if `position` is omitted, the component auto-detects — elements in the bottom 60% of the screen get `top`, others get `bottom`.
- **Arrow placement**: pixel-accurate `arrowOffset` is computed so the arrow caret always points to the center of the target element regardless of balloon position.
- **Gap**: exactly 2 px between the target element edge and the balloon edge on all 4 sides.
- **z-index**: backdrop at 9000, balloon at 9001.
- **Accessibility**: focus management is not yet implemented — planned for Phase 2.
