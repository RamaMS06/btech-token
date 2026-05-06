# BTCheckbox

> Input pilihan boolean yang mendukung state indeterminate, disabled, dan error.

Figma: — · Category: Atoms

---

## Overview

`BTCheckbox` adalah komponen input pilihan yang dapat berada dalam tiga state utama: unchecked, checked, dan indeterminate. Mendukung label dan subtext untuk konteks tambahan. Digunakan dalam form, list selection, dan pengaturan preferensi pengguna.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `checked` | `boolean` | `false` | State terpilih atau tidak |
| `indeterminate` | `boolean` | `false` | State sebagian terpilih (misalnya pada select-all) |
| `disabled` | `boolean` | `false` | Menonaktifkan interaksi |
| `error` | `boolean` | `false` | Menampilkan state error (border merah) |
| `label` | `string` | — | Label teks yang ditampilkan di samping checkbox |
| `subtext` | `string` | — | Teks penjelasan tambahan di bawah label |
| `onChange` | `(checked: boolean) => void` | — | Callback saat nilai berubah (React) |
| `className` | `string` | — | Class tambahan untuk layout/positioning |

> Vue menggunakan `v-model` alih-alih `checked` + `onChange`.

## Variants / States

- **default** — Unchecked, interaktif.
- **checked** — Terpilih, menampilkan ikon centang.
- **indeterminate** — Sebagian terpilih (dash), biasanya untuk kontrol "select all" pada list.
- **disabled** — Tidak dapat diinteraksi, opasitas dikurangi.
- **disabled-checked** — Terpilih namun tidak dapat diubah.
- **error** — Border merah, menandakan validasi gagal.
- **error-checked** — Terpilih namun dengan state error (misalnya konflik validasi).

## Usage

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { BTCheckbox } from '@btech/ui-vue';

const rememberMe = ref(false);
const allSelected = ref(false);
const isIndeterminate = ref(true);
</script>

<template>
  <!-- Basic controlled checkbox -->
  <BTCheckbox v-model="rememberMe" label="Remember me" />

  <!-- With subtext -->
  <BTCheckbox
    v-model="rememberMe"
    label="Send notifications"
    subtext="Kami akan mengirim email saat ada pembaruan penting."
  />

  <!-- Indeterminate (select all) -->
  <BTCheckbox
    v-model="allSelected"
    :indeterminate="isIndeterminate"
    label="Select all"
  />

  <!-- Disabled -->
  <BTCheckbox v-model="rememberMe" label="Remember me" disabled />

  <!-- Error state -->
  <BTCheckbox v-model="rememberMe" label="Setuju dengan syarat" :error="true" />
</template>
```

### React

```tsx
import { useState } from 'react';
import { BTCheckbox } from '@btech/ui-react';

export function Example() {
  const [checked, setChecked] = useState(false);
  const [allSelected, setAllSelected] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(true);

  return (
    <>
      {/* Basic controlled checkbox */}
      <BTCheckbox
        checked={checked}
        label="Remember me"
        onChange={setChecked}
      />

      {/* With subtext */}
      <BTCheckbox
        checked={checked}
        label="Send notifications"
        subtext="Kami akan mengirim email saat ada pembaruan penting."
        onChange={setChecked}
      />

      {/* Indeterminate (select all) */}
      <BTCheckbox
        checked={allSelected}
        indeterminate={isIndeterminate}
        label="Select all"
        onChange={setAllSelected}
      />

      {/* Disabled */}
      <BTCheckbox checked={checked} label="Remember me" disabled />

      {/* Error state */}
      <BTCheckbox
        checked={checked}
        label="Setuju dengan syarat"
        error
        onChange={setChecked}
      />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Basic controlled checkbox
BTCheckbox(
  checked: checked,
  label: 'Remember me',
  onChanged: (v) => setState(() => checked = v),
),

// With subtext
BTCheckbox(
  checked: checked,
  label: 'Send notifications',
  subtext: 'Kami akan mengirim email saat ada pembaruan penting.',
  onChanged: (v) => setState(() => checked = v),
),

// Indeterminate (select all)
BTCheckbox(
  checked: allSelected,
  indeterminate: isIndeterminate,
  label: 'Select all',
  onChanged: (v) => setState(() => allSelected = v),
),

// Disabled
BTCheckbox(
  checked: checked,
  label: 'Remember me',
  disabled: true,
),

// Error state
BTCheckbox(
  checked: checked,
  label: 'Setuju dengan syarat',
  error: true,
  onChanged: (v) => setState(() => checked = v),
),
```

---

## Notes

- State `indeterminate` mengabaikan nilai `checked` secara visual — pastikan logic "select all" di aplikasi mengelola keduanya dengan benar.
- Untuk aksesibilitas, selalu sertakan prop `label`. Jika label tidak ditampilkan secara visual, gunakan teknik visually-hidden.
- State `error` tidak otomatis menampilkan pesan error — tampilkan pesan error di luar komponen menggunakan teks atau `BTHint`.
