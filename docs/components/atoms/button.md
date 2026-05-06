# BTButton

> Tombol aksi utama dengan lima variant gaya yang mencerminkan hierarki dan maksud tindakan.

Figma: — · Category: Atoms

---

## Overview

`BTButton` adalah komponen tombol serbaguna yang digunakan untuk memicu aksi di seluruh aplikasi. Lima variant mencerminkan hierarki visual: `primary` untuk aksi utama, `secondary` untuk aksi pendukung, `destructive` untuk aksi berbahaya, `outline` dan `ghost` untuk aksi tersier atau kontekstual. Mendukung dua ukuran dan mode icon-only.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'destructive' \| 'outline' \| 'ghost'` | `'primary'` | Menentukan gaya visual tombol |
| `size` | `'default' \| 'small'` | `'default'` | Ukuran tombol |
| `label` | `string` | — | Teks label tombol |
| `iconOnly` | `boolean` | `false` | Mode icon-only — menyembunyikan label, hanya tampilkan ikon |
| `leftIcon` | `ReactNode` | — | Ikon di sisi kiri label |
| `rightIcon` | `ReactNode` | — | Ikon di sisi kanan label |
| `disabled` | `boolean` | `false` | Menonaktifkan tombol (native HTML attr) |
| `onClick` / `onPressed` | `() => void` | — | Handler klik/tap |

> Semua native button attributes (`type`, `form`, `aria-*`, dll.) juga diteruskan ke elemen button yang mendasarinya (web) atau `ElevatedButton` (Flutter).

## Variants / States

- **primary** — Latar berwarna brand, teks putih. Gunakan untuk satu aksi utama per halaman/section.
- **secondary** — Latar lebih subtle, teks brand. Untuk aksi pendukung yang tidak terlalu menonjol.
- **destructive** — Latar/teks merah. Untuk aksi yang tidak dapat dibalik seperti hapus atau batalkan.
- **outline** — Border saja, tanpa latar berwarna. Untuk aksi tersier atau di atas background berwarna.
- **ghost** — Tidak ada border maupun latar. Untuk aksi minimal, biasanya dalam toolbar atau list.
- **disabled** — Semua variant mendukung state disabled dengan opacity yang dikurangi dan pointer-events: none.

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTButton } from '@btech/ui-vue';

function handleSave() { /* ... */ }
function handleDelete() { /* ... */ }
</script>

<template>
  <!-- Hierarchy variants -->
  <BTButton label="Save" variant="primary" @click="handleSave" />
  <BTButton label="Cancel" variant="secondary" />
  <BTButton label="Delete" variant="destructive" @click="handleDelete" />
  <BTButton label="Export" variant="outline" />
  <BTButton label="More" variant="ghost" />

  <!-- Small size -->
  <BTButton label="Save" variant="primary" size="small" />

  <!-- With icons -->
  <BTButton label="Upload" variant="primary" :left-icon="UploadIcon" />
  <BTButton label="Next" variant="primary" :right-icon="ArrowRightIcon" />

  <!-- Icon only -->
  <BTButton variant="ghost" :icon-only="true" :left-icon="SearchIcon" />

  <!-- Disabled -->
  <BTButton label="Save" variant="primary" disabled />
</template>
```

### React

```tsx
import { BTButton } from '@btech/ui-react';
import { UploadIcon, ArrowRightIcon } from './icons';

export function Example() {
  return (
    <>
      {/* Hierarchy variants */}
      <BTButton label="Save" variant="primary" onClick={handleSave} />
      <BTButton label="Cancel" variant="secondary" />
      <BTButton label="Delete" variant="destructive" onClick={handleDelete} />
      <BTButton label="Export" variant="outline" />
      <BTButton label="More" variant="ghost" />

      {/* Small size */}
      <BTButton label="Save" variant="primary" size="small" />

      {/* With icons */}
      <BTButton label="Upload" variant="primary" leftIcon={<UploadIcon />} />
      <BTButton label="Next" variant="primary" rightIcon={<ArrowRightIcon />} />

      {/* Icon only */}
      <BTButton variant="ghost" iconOnly leftIcon={<SearchIcon />} />

      {/* Disabled */}
      <BTButton label="Save" variant="primary" disabled />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Hierarchy variants
BTButton(
  label: 'Save',
  variant: BTButtonVariant.primary,
  onPressed: handleSave,
),
BTButton(label: 'Cancel', variant: BTButtonVariant.secondary),
BTButton(
  label: 'Delete',
  variant: BTButtonVariant.destructive,
  onPressed: handleDelete,
),
BTButton(label: 'Export', variant: BTButtonVariant.outline),
BTButton(label: 'More', variant: BTButtonVariant.ghost),

// Small size
BTButton(
  label: 'Save',
  variant: BTButtonVariant.primary,
  size: BTButtonSize.small,
  onPressed: handleSave,
),

// Disabled (pass null to onPressed)
BTButton(
  label: 'Save',
  variant: BTButtonVariant.primary,
  onPressed: null,
),
```

---

## Notes

- Gunakan hanya **satu** `primary` button per halaman atau section untuk menjaga hierarki visual yang jelas.
- Mode `iconOnly` tetap memerlukan prop `label` untuk aksesibilitas — label dirender sebagai `aria-label` (web) atau `Semantics.label` (Flutter).
- `destructive` button sebaiknya selalu dikonfirmasi dengan modal sebelum aksi dijalankan.
