# BTRadioButton

> Input pilihan tunggal dari sekelompok opsi yang saling eksklusif.

Figma: [node 555-3529] · Category: Atoms

---

## Overview

`BTRadioButton` digunakan ketika pengguna harus memilih tepat satu opsi dari beberapa pilihan yang tersedia. Komponen ini dirancang untuk digunakan secara berkelompok — setiap radio button dalam grup berbagi `name` yang sama dan dikendalikan melalui `modelValue`/`v-model`. Mendukung label, subtext, state disabled, dan state error.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `modelValue` | `BTRadioButtonValue` | **required** | Nilai yang sedang terpilih dalam grup |
| `value` | `BTRadioButtonValue` | **required** | Nilai unik radio button ini |
| `label` | `string` | — | Label teks yang ditampilkan di samping radio |
| `subtext` | `string` | — | Teks penjelasan tambahan di bawah label |
| `disabled` | `boolean` | `false` | Menonaktifkan interaksi |
| `error` | `boolean` | `false` | Menampilkan state error (border merah) |
| `name` | `string` | — | Nama grup untuk aksesibilitas (HTML `name` attr) |
| `onChange` | `(value: BTRadioButtonValue) => void` | — | Callback saat dipilih (React) |
| `className` | `string` | — | Class tambahan untuk layout/positioning |

> `BTRadioButtonValue` adalah `string | number | boolean`. Vue menggunakan `v-model` pada parent atau langsung di komponen.

## Variants / States

- **default** — Tidak terpilih, interaktif.
- **active** — Terpilih, menampilkan lingkaran isi.
- **disabled** — Tidak dapat diinteraksi, opasitas dikurangi.
- **disabled-active** — Terpilih namun tidak dapat diubah.
- **error** — Border merah, menandakan validasi gagal.
- **error-active** — Terpilih namun dengan state error.

## Usage

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { BTRadioButton } from '@btech/ui-vue';

const selected = ref<string>('a');
</script>

<template>
  <!-- Radio group -->
  <BTRadioButton
    v-model="selected"
    value="a"
    label="Option A"
    name="my-group"
  />
  <BTRadioButton
    v-model="selected"
    value="b"
    label="Option B"
    subtext="Penjelasan tambahan untuk opsi ini."
    name="my-group"
  />
  <BTRadioButton
    v-model="selected"
    value="c"
    label="Option C"
    name="my-group"
    disabled
  />

  <!-- Error state -->
  <BTRadioButton
    v-model="selected"
    value="a"
    label="Option A"
    name="error-group"
    :error="true"
  />
</template>
```

### React

```tsx
import { useState } from 'react';
import { BTRadioButton } from '@btech/ui-react';

export function Example() {
  const [selected, setSelected] = useState<string>('a');

  return (
    <>
      {/* Radio group */}
      <BTRadioButton
        modelValue={selected}
        value="a"
        label="Option A"
        name="my-group"
        onChange={setSelected}
      />
      <BTRadioButton
        modelValue={selected}
        value="b"
        label="Option B"
        subtext="Penjelasan tambahan untuk opsi ini."
        name="my-group"
        onChange={setSelected}
      />
      <BTRadioButton
        modelValue={selected}
        value="c"
        label="Option C"
        name="my-group"
        disabled
        onChange={setSelected}
      />

      {/* Error state */}
      <BTRadioButton
        modelValue={selected}
        value="a"
        label="Option A"
        name="error-group"
        error
        onChange={setSelected}
      />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Radio group (managed in StatefulWidget)
BTRadioButton<String>(
  groupValue: selected,
  value: 'a',
  label: 'Option A',
  onChanged: (v) => setState(() => selected = v),
),
BTRadioButton<String>(
  groupValue: selected,
  value: 'b',
  label: 'Option B',
  subtext: 'Penjelasan tambahan untuk opsi ini.',
  onChanged: (v) => setState(() => selected = v),
),

// Disabled
BTRadioButton<String>(
  groupValue: selected,
  value: 'c',
  label: 'Option C',
  disabled: true,
),

// Error state
BTRadioButton<String>(
  groupValue: selected,
  value: 'a',
  label: 'Option A',
  error: true,
  onChanged: (v) => setState(() => selected = v),
),
```

---

## Notes

- Selalu kelompokkan `BTRadioButton` dalam satu kontainer logis dan beri prop `name` yang sama untuk aksesibilitas keyboard (navigasi dengan arrow key).
- State `error` biasanya diterapkan ke semua radio dalam grup ketika validasi grup gagal — bukan hanya pada satu opsi.
- Gunakan `BTCheckbox` ketika pengguna bisa memilih lebih dari satu opsi. Gunakan `BTRadioButton` hanya untuk pilihan yang benar-benar saling eksklusif.
