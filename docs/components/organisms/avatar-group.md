# BTAvatarGroup

> Kumpulan avatar yang ditampilkan berdampingan dengan overflow counter otomatis.

Figma: [node 504-705] · Category: Organisms

---

## Overview

`BTAvatarGroup` menampilkan daftar `BTAvatarItem` sebagai barisan avatar yang saling tumpang tindih. Ketika jumlah item melebihi prop `max`, sisa item digantikan oleh overflow counter ("+N"). Mendukung semua ukuran avatar yang sama dengan `BTAvatar`, state loading untuk seluruh grup, dan override angka overflow melalui `customOverflowNumber`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `items` | `BTAvatarItem[]` | **required** | Daftar data pengguna yang ditampilkan |
| `max` | `number` | `3` | Jumlah maksimum avatar yang ditampilkan sebelum overflow |
| `customOverflowNumber` | `number` | — | Override angka overflow (mengganti hitung otomatis "+N") |
| `size` | `BTAvatarSize` | `'md'` | Ukuran semua avatar dalam grup |
| `isLoading` | `boolean` | `false` | Tampilkan skeleton shimmer untuk seluruh grup |
| `className` | `string` | — | Class tambahan untuk layout/positioning |

### BTAvatarItem (sama dengan BTAvatar)

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Nama lengkap pengguna |
| `imageUrl` | `string` | no | URL foto profil |
| `color` | `BTAvatarColor` | no | Warna background untuk inisial |

### BTAvatarSize

`'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'`

## Variants / States

- **normal** — Menampilkan hingga `max` avatar, lebih dari itu tampil overflow counter.
- **overflow** — Counter `"+N"` muncul otomatis ketika `items.length > max`.
- **custom overflow** — `customOverflowNumber` mengganti angka N dengan nilai yang ditentukan.
- **loading** — `isLoading: true` → semua avatar digantikan skeleton shimmer.
- **single item** — `items.length === 1` → tampil seperti satu `BTAvatar` biasa.

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTAvatarGroup, type BTAvatarItem } from '@btech/ui-vue';

const teamMembers: BTAvatarItem[] = [
  { name: 'Faisal Lestari', color: 'green' },
  { name: 'Sari Dewi', imageUrl: 'https://example.com/sari.jpg' },
  { name: 'Budi Santoso', color: 'blue' },
  { name: 'Rina Kusuma', color: 'orange' },
  { name: 'Ahmad Yusuf', color: 'purple' },
];
</script>

<template>
  <!-- Basic: shows 3, overflow "+2" -->
  <BTAvatarGroup :items="teamMembers" :max="3" />

  <!-- Show more -->
  <BTAvatarGroup :items="teamMembers" :max="5" />

  <!-- Custom overflow number (e.g. show total from API) -->
  <BTAvatarGroup :items="teamMembers" :max="3" :custom-overflow-number="42" />

  <!-- Different sizes -->
  <BTAvatarGroup :items="teamMembers" size="sm" />
  <BTAvatarGroup :items="teamMembers" size="lg" />

  <!-- Loading state -->
  <BTAvatarGroup :items="[]" :max="3" :is-loading="true" />
</template>
```

### React

```tsx
import { BTAvatarGroup, type BTAvatarItem } from '@btech/ui-react';

const teamMembers: BTAvatarItem[] = [
  { name: 'Faisal Lestari', color: 'green' },
  { name: 'Sari Dewi', imageUrl: 'https://example.com/sari.jpg' },
  { name: 'Budi Santoso', color: 'blue' },
  { name: 'Rina Kusuma', color: 'orange' },
  { name: 'Ahmad Yusuf', color: 'purple' },
];

export function Example() {
  return (
    <>
      {/* Basic: shows 3, overflow "+2" */}
      <BTAvatarGroup items={teamMembers} max={3} />

      {/* Show more */}
      <BTAvatarGroup items={teamMembers} max={5} />

      {/* Custom overflow number */}
      <BTAvatarGroup items={teamMembers} max={3} customOverflowNumber={42} />

      {/* Different sizes */}
      <BTAvatarGroup items={teamMembers} size="sm" />
      <BTAvatarGroup items={teamMembers} size="lg" />

      {/* Loading state */}
      <BTAvatarGroup items={[]} max={3} isLoading />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

final List<BTAvatarItem> teamMembers = [
  const BTAvatarItem(name: 'Faisal Lestari', color: BTAvatarColor.green),
  const BTAvatarItem(
    name: 'Sari Dewi',
    imageUrl: 'https://example.com/sari.jpg',
  ),
  const BTAvatarItem(name: 'Budi Santoso', color: BTAvatarColor.blue),
  const BTAvatarItem(name: 'Rina Kusuma', color: BTAvatarColor.orange),
  const BTAvatarItem(name: 'Ahmad Yusuf', color: BTAvatarColor.purple),
];

// Basic: shows 3, overflow "+2"
BTAvatarGroup(items: teamMembers, max: 3),

// Show more
BTAvatarGroup(items: teamMembers, max: 5),

// Custom overflow number
BTAvatarGroup(
  items: teamMembers,
  max: 3,
  customOverflowNumber: 42,
),

// Different sizes
BTAvatarGroup(items: teamMembers, size: BTAvatarSize.sm),
BTAvatarGroup(items: teamMembers, size: BTAvatarSize.lg),

// Loading state
BTAvatarGroup(items: const [], max: 3, isLoading: true),
```

---

## Notes

- `BTAvatarGroup` menggunakan tipe `BTAvatarItem` yang sama dengan `BTAvatar` — tidak ada tipe khusus tambahan.
- Overflow counter menampilkan jumlah item yang tersembunyi (`items.length - max`), kecuali `customOverflowNumber` ditentukan. Gunakan `customOverflowNumber` ketika data yang ditampilkan adalah subset dari total (misalnya API mengembalikan 5 item tapi total di server adalah 42).
- Pada state loading, komponen merender sejumlah `max` skeleton avatar untuk mempertahankan ukuran layout yang konsisten.
- Jangan render banyak `BTAvatar` secara manual dengan CSS overlap — selalu gunakan `BTAvatarGroup` untuk grup avatar agar spacing dan overlap konsisten.
