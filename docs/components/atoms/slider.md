# BTSlider

**Category:** Atom  
**Figma:** node `434:7617`

Interactive range slider. Supports three layout types and three color variants.

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `'default' \| 'range' \| 'vertical'` | `'default'` | Layout type |
| `variant` | `'primary' \| 'secondary' \| 'destructive'` | `'primary'` | Color variant |
| `value` | `number` | — | Controlled value (default/vertical) |
| `startValue` | `number` | — | Controlled range start |
| `endValue` | `number` | — | Controlled range end |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Increment step |
| `showTooltip` | `boolean` | `true` | Show value callout above/beside thumb |
| `disabled` | `boolean` | `false` | Disable all interaction |

---

## Variants & Types

| Type | Description |
|---|---|
| `default` | Horizontal, single thumb |
| `range` | Horizontal, two thumbs (start + end) |
| `vertical` | Vertical, single thumb |

| Variant | Active color |
|---|---|
| `primary` | Brand blue `#145bc3` |
| `secondary` | Neutral `#64748b` |
| `destructive` | Error red `#991515` |

---

## Usage

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { BTSlider } from '@btech/ui-vue';

const value    = ref(50);
const from     = ref(20);
const to       = ref(80);
const vertical = ref(60);
</script>

<template>
  <!-- Default horizontal -->
  <BTSlider v-model:value="value" />

  <!-- Secondary variant -->
  <BTSlider v-model:value="value" variant="secondary" />

  <!-- Range -->
  <BTSlider type="range" v-model:startValue="from" v-model:endValue="to" />

  <!-- Vertical destructive -->
  <BTSlider type="vertical" variant="destructive" v-model:value="vertical" />

  <!-- Disabled -->
  <BTSlider :value="30" :disabled="true" />

  <!-- No tooltip -->
  <BTSlider v-model:value="value" :show-tooltip="false" />
</template>
```

### React

```tsx
import { useState } from 'react';
import { BTSlider } from '@btech/ui-react';

export function Example() {
  const [value,    setValue]    = useState(50);
  const [from,     setFrom]     = useState(20);
  const [to,       setTo]       = useState(80);
  const [vertical, setVertical] = useState(60);

  return (
    <>
      {/* Default horizontal */}
      <BTSlider value={value} onValueChange={setValue} />

      {/* Secondary */}
      <BTSlider value={value} variant="secondary" onValueChange={setValue} />

      {/* Range */}
      <BTSlider
        type="range"
        startValue={from}
        endValue={to}
        onStartValueChange={setFrom}
        onEndValueChange={setTo}
      />

      {/* Vertical destructive */}
      <BTSlider
        type="vertical"
        variant="destructive"
        value={vertical}
        onValueChange={setVertical}
      />

      {/* Disabled */}
      <BTSlider value={30} disabled />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class SliderExample extends StatefulWidget {
  const SliderExample({super.key});

  @override
  State<SliderExample> createState() => _SliderExampleState();
}

class _SliderExampleState extends State<SliderExample> {
  double _value    = 50;
  double _from     = 20;
  double _to       = 80;
  double _vertical = 60;

  @override
  Widget build(final BuildContext context) {
    return Column(
      children: [
        // Default horizontal
        BTSlider(
          value: _value,
          onValueChanged: (v) => setState(() => _value = v),
        ),

        // Secondary variant
        BTSlider(
          value: _value,
          variant: BTSliderVariant.secondary,
          onValueChanged: (v) => setState(() => _value = v),
        ),

        // Range
        BTSlider.range(
          startValue: _from,
          endValue: _to,
          onStartChanged: (v) => setState(() => _from = v),
          onEndChanged:   (v) => setState(() => _to   = v),
        ),

        // Vertical destructive
        SizedBox(
          height: 200,
          child: BTSlider.vertical(
            value: _vertical,
            variant: BTSliderVariant.destructive,
            onValueChanged: (v) => setState(() => _vertical = v),
          ),
        ),

        // Disabled
        const BTSlider(value: 30, disabled: true),
      ],
    );
  }
}
```
