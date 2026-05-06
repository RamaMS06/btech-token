# BTButtonLink

> Tombol bergaya tautan untuk aksi inline yang tidak memerlukan emphasis visual seperti button biasa.

Figma: [node 480-3197] · Category: Atoms

---

## Overview

`BTButtonLink` digunakan ketika aksi perlu terlihat seperti teks yang dapat diklik (link), bukan tombol persegi. Cocok untuk aksi sekunder dalam teks, footer card, atau navigasi ringkas. Berbeda dari elemen `<a>` — ini tetap sebuah aksi (button), bukan navigasi URL, sehingga semantiknya lebih tepat untuk aksi yang memicu logika, bukan perpindahan halaman.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | **required** | Teks yang ditampilkan |
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'invert' \| 'custom'` | `'primary'` | Skema warna teks/ikon |
| `leftIcon` | `ReactNode` | — | Ikon di sisi kiri label |
| `rightIcon` | `ReactNode` | — | Ikon di sisi kanan label |
| `disabled` | `boolean` | `false` | Menonaktifkan tombol |
| `onClick` / `onPressed` | `() => void` | — | Handler klik/tap |

> Semua native button attributes juga diteruskan ke elemen button yang mendasarinya.

## Variants / States

- **primary** — Warna brand utama. Untuk aksi inline yang paling penting.
- **secondary** — Warna lebih subtle. Untuk aksi pendukung di dalam konten.
- **tertiary** — Warna netral/abu-abu. Untuk aksi opsional atau kurang penting.
- **invert** — Teks putih. Digunakan di atas background gelap atau berwarna.
- **custom** — Untuk kebutuhan warna di luar skema standar; konsultasikan dengan tim desain.
- **disabled** — Semua variant mendukung state disabled.

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTButtonLink } from '@btech/ui-vue';
</script>

<template>
  <!-- Variants -->
  <BTButtonLink label="Learn more" variant="primary" @click="handleLearnMore" />
  <BTButtonLink label="View details" variant="secondary" />
  <BTButtonLink label="Skip" variant="tertiary" />
  <BTButtonLink label="View on dark bg" variant="invert" />

  <!-- With icons -->
  <BTButtonLink label="Download" variant="primary" :right-icon="DownloadIcon" />

  <!-- Disabled -->
  <BTButtonLink label="Learn more" variant="primary" disabled />
</template>
```

### React

```tsx
import { BTButtonLink } from '@btech/ui-react';
import { DownloadIcon } from './icons';

export function Example() {
  return (
    <>
      {/* Variants */}
      <BTButtonLink label="Learn more" variant="primary" onClick={handleLearnMore} />
      <BTButtonLink label="View details" variant="secondary" />
      <BTButtonLink label="Skip" variant="tertiary" />
      <BTButtonLink label="View on dark bg" variant="invert" />

      {/* With icon */}
      <BTButtonLink label="Download" variant="primary" rightIcon={<DownloadIcon />} />

      {/* Disabled */}
      <BTButtonLink label="Learn more" variant="primary" disabled />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Variants
BTButtonLink(
  label: 'Learn more',
  variant: BTButtonLinkVariant.primary,
  onPressed: handleLearnMore,
),
BTButtonLink(
  label: 'View details',
  variant: BTButtonLinkVariant.secondary,
),
BTButtonLink(
  label: 'Skip',
  variant: BTButtonLinkVariant.tertiary,
),

// Disabled (pass null to onPressed)
BTButtonLink(
  label: 'Learn more',
  variant: BTButtonLinkVariant.primary,
  onPressed: null,
),
```

---

## Notes

- Gunakan `BTButtonLink` untuk **aksi** (memanggil fungsi), bukan navigasi ke URL. Untuk navigasi, gunakan elemen `<a>` atau `router-link` yang sesuai.
- Variant `invert` dirancang khusus untuk digunakan di atas surface gelap — pastikan kontras memadai jika digunakan di luar konteks itu.
