# BTBadge

> Status label dengan warna semantik untuk menampilkan kondisi atau kategori suatu item.

Figma: [node 72-1516] · Category: Atoms

---

## Overview

`BTBadge` digunakan untuk menampilkan status singkat pada item seperti dokumen, permintaan, atau entitas lainnya. Tersedia enam variant warna yang masing-masing membawa makna semantik. Prop `reverseColors` membalik warna latar dan teks untuk tampilan yang lebih subtle atau bold sesuai konteks.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | `'Badge'` | Teks yang ditampilkan di dalam badge |
| `variant` | `'success' \| 'waiting' \| 'neutral' \| 'draft' \| 'reject' \| 'custom'` | `'success'` | Menentukan skema warna badge |
| `reverseColors` | `boolean` | `false` | Membalik warna latar dan teks |
| `leftIcon` | `ReactNode` | — | Ikon di sisi kiri label (Vue: slot, React: prop) |
| `rightIcon` | `ReactNode` | — | Ikon di sisi kanan label (Vue: slot, React: prop) |
| `className` | `string` | — | Class tambahan untuk layout/positioning |

## Variants / States

- **success** — Warna hijau, digunakan untuk status berhasil, disetujui, atau aktif.
- **waiting** — Warna kuning/amber, digunakan untuk status menunggu persetujuan atau proses.
- **neutral** — Warna abu-abu, digunakan untuk status informatif atau tidak ada aksi yang diperlukan.
- **draft** — Warna biru, digunakan untuk item yang masih dalam tahap draft atau belum dipublikasi.
- **reject** — Warna merah, digunakan untuk status ditolak atau error.
- **custom** — Warna dapat dikonfigurasi, untuk kebutuhan khusus di luar skema standar.
- **reverseColors: true** — Membalik pasangan warna foreground/background pada variant manapun.

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTBadge } from '@btech/ui-vue';
</script>

<template>
  <!-- Basic status badges -->
  <BTBadge label="Approved" variant="success" />
  <BTBadge label="Pending" variant="waiting" />
  <BTBadge label="Draft" variant="draft" />
  <BTBadge label="Rejected" variant="reject" />
  <BTBadge label="Info" variant="neutral" />

  <!-- Reversed colors -->
  <BTBadge label="Draft" variant="draft" :reverse-colors="true" />

  <!-- With icons (using slots) -->
  <BTBadge label="Approved" variant="success">
    <template #leftIcon><IconCheck /></template>
  </BTBadge>
</template>
```

### React

```tsx
import { BTBadge } from '@btech/ui-react';
import { IconCheck } from './icons';

export function Example() {
  return (
    <>
      {/* Basic status badges */}
      <BTBadge label="Approved" variant="success" />
      <BTBadge label="Pending" variant="waiting" />
      <BTBadge label="Draft" variant="draft" />
      <BTBadge label="Rejected" variant="reject" />
      <BTBadge label="Info" variant="neutral" />

      {/* Reversed colors */}
      <BTBadge label="Draft" variant="draft" reverseColors />

      {/* With icons */}
      <BTBadge label="Approved" variant="success" leftIcon={<IconCheck />} />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Basic status badges
const BTBadge(label: 'Approved', variant: BTBadgeVariant.success),
const BTBadge(label: 'Pending', variant: BTBadgeVariant.waiting),
const BTBadge(label: 'Draft', variant: BTBadgeVariant.draft),
const BTBadge(label: 'Rejected', variant: BTBadgeVariant.reject),
const BTBadge(label: 'Info', variant: BTBadgeVariant.neutral),

// Reversed colors
const BTBadge(
  label: 'Draft',
  variant: BTBadgeVariant.draft,
  reverseColors: true,
),
```

---

## Notes

- Warna badge menggunakan token `color.ext.*` dari `@btech/tokens` — tidak ada hex hardcode di dalam komponen.
- Variant `custom` memerlukan konfigurasi warna tambahan melalui CSS variables atau theme override; konsultasikan dengan tim desain sebelum menggunakannya.
- Jangan gunakan badge sebagai tombol interaktif — gunakan `BTButton` atau `BTButtonLink` untuk aksi.
