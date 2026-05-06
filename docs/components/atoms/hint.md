# BTHint

> Indikator notifikasi kecil — tampil sebagai dot atau badge angka untuk menandai item yang perlu perhatian.

Figma: [node 658-1960] · Category: Atoms

---

## Overview

`BTHint` digunakan untuk menandai notifikasi, pesan belum dibaca, atau item yang perlu perhatian. Ketika `count` tidak diberikan atau bernilai `null`, komponen tampil sebagai **dot** (titik merah). Ketika `count` diberikan, tampil sebagai badge angka. Angka di atas 99 disingkat menjadi `"99+"`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `count` | `number \| null \| undefined` | `undefined` | Angka yang ditampilkan. `null`/`undefined` = dot |
| `size` | `'lg' \| 'md' \| 'sm'` | `'lg'` | Ukuran komponen |
| `className` | `string` | — | Class tambahan untuk layout/positioning |

## Variants / States

- **dot** — Tidak ada prop `count` (atau `null`) → lingkaran kecil tanpa teks, menandai keberadaan notifikasi.
- **count** — `count > 0` → menampilkan angka di dalam badge.
- **overflow** — `count > 99` → menampilkan `"99+"`.
- **size lg** — Ukuran default, paling terlihat.
- **size md** — Ukuran sedang, untuk sidebar atau nav yang lebih compact.
- **size sm** — Ukuran paling kecil, untuk indikator dalam list atau ikon.

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTHint } from '@btech/ui-vue';
</script>

<template>
  <!-- Dot (no count) -->
  <BTHint />

  <!-- With count -->
  <BTHint :count="5" />
  <BTHint :count="5" size="md" />
  <BTHint :count="5" size="sm" />

  <!-- Overflow -->
  <BTHint :count="120" />
  <!-- renders "99+" -->

  <!-- Positioned on an icon (example layout) -->
  <div style="position: relative; display: inline-block;">
    <BellIcon />
    <BTHint :count="3" style="position: absolute; top: -4px; right: -4px;" />
  </div>
</template>
```

### React

```tsx
import { BTHint } from '@btech/ui-react';
import { BellIcon } from './icons';

export function Example() {
  return (
    <>
      {/* Dot (no count) */}
      <BTHint />

      {/* With count */}
      <BTHint count={5} />
      <BTHint count={5} size="md" />
      <BTHint count={5} size="sm" />

      {/* Overflow */}
      <BTHint count={120} />
      {/* renders "99+" */}

      {/* Positioned on an icon */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <BellIcon />
        <BTHint count={3} style={{ position: 'absolute', top: -4, right: -4 }} />
      </div>
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Dot (no count)
const BTHint(),

// With count
BTHint(count: 5),
BTHint(count: 5, size: BTHintSize.md),
BTHint(count: 5, size: BTHintSize.sm),

// Overflow — renders "99+"
BTHint(count: 120),

// Positioned on an icon
Stack(
  clipBehavior: Clip.none,
  children: [
    const Icon(Icons.notifications_outlined),
    Positioned(
      top: -4,
      right: -4,
      child: BTHint(count: 3, size: BTHintSize.sm),
    ),
  ],
),
```

---

## Notes

- `BTHint` tidak menyediakan positioning bawaan — letakkan di dalam `Stack` (Flutter) atau `position: absolute` (web) saat digunakan di atas ikon atau elemen lain.
- Gunakan `count={0}` / `count: 0` untuk menyembunyikan hint secara kondisional sambil mempertahankan space-nya, atau kondisikan render-nya dari luar dengan `v-if` / conditional expression.
