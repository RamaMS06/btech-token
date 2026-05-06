# BTAvatar

> Representasi visual pengguna — menampilkan foto profil, inisial otomatis, atau state loading.

Figma: [node 497-979] · Category: Molecules

---

## Overview

`BTAvatar` menampilkan identitas pengguna dalam format lingkaran. Jika `item.imageUrl` tersedia, gambar akan ditampilkan. Jika tidak, inisial dari `item.name` di-generate otomatis (contoh: "Faisal Lestari" → "FL"). Background warna dipilih dari enam warna brand melalui prop `item.color`. State `isLoading` menampilkan skeleton shimmer, dan `status="error"` menampilkan indikator error di atas avatar.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `item` | `BTAvatarItem` | — | Data pengguna (lihat tipe di bawah) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Ukuran avatar |
| `isLoading` | `boolean` | `false` | Tampilkan skeleton shimmer |
| `status` | `'error'` | — | Tampilkan indikator status di atas avatar |
| `className` | `string` | — | Class tambahan untuk layout/positioning |

### BTAvatarItem

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | yes | Nama lengkap pengguna (digunakan untuk inisial dan aksesibilitas) |
| `imageUrl` | `string` | no | URL foto profil |
| `color` | `BTAvatarColor` | no | Warna background untuk inisial |

### BTAvatarColor

`'green' | 'blue' | 'orange' | 'purple' | 'teal' | 'pink'`

Enam warna brand yang digunakan sebagai background avatar inisial. Warna ini adalah hardcoded brand palette spesifik untuk komponen ini — bukan token semantik.

## Variants / States

- **image** — `item.imageUrl` tersedia → menampilkan foto profil.
- **initials** — `item.imageUrl` tidak ada → menampilkan 1-2 inisial dari `item.name` dengan warna background dari `item.color`.
- **loading** — `isLoading: true` → skeleton shimmer, tidak ada konten.
- **error** — `status: 'error'` → ikon atau indikator error di sudut avatar.
- **sizes** — `xs` (20px) · `sm` (24px) · `md` (32px) · `lg` (40px) · `xl` (48px) · `2xl` (64px).

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTAvatar, type BTAvatarItem } from '@btech/ui-vue';

const user: BTAvatarItem = {
  name: 'Faisal Lestari',
  color: 'green',
};

const userWithPhoto: BTAvatarItem = {
  name: 'Sari Dewi',
  imageUrl: 'https://example.com/sari.jpg',
};
</script>

<template>
  <!-- Initials with color -->
  <BTAvatar :item="user" />

  <!-- With photo -->
  <BTAvatar :item="userWithPhoto" />

  <!-- Sizes -->
  <BTAvatar :item="user" size="xs" />
  <BTAvatar :item="user" size="sm" />
  <BTAvatar :item="user" size="md" />
  <BTAvatar :item="user" size="lg" />
  <BTAvatar :item="user" size="xl" />
  <BTAvatar :item="user" size="2xl" />

  <!-- All colors -->
  <BTAvatar :item="{ name: 'A B', color: 'green' }" />
  <BTAvatar :item="{ name: 'C D', color: 'blue' }" />
  <BTAvatar :item="{ name: 'E F', color: 'orange' }" />
  <BTAvatar :item="{ name: 'G H', color: 'purple' }" />
  <BTAvatar :item="{ name: 'I J', color: 'teal' }" />
  <BTAvatar :item="{ name: 'K L', color: 'pink' }" />

  <!-- Loading state -->
  <BTAvatar :is-loading="true" size="md" />

  <!-- Error state -->
  <BTAvatar :item="user" status="error" />
</template>
```

### React

```tsx
import { BTAvatar, type BTAvatarItem } from '@btech/ui-react';

const user: BTAvatarItem = {
  name: 'Faisal Lestari',
  color: 'green',
};

const userWithPhoto: BTAvatarItem = {
  name: 'Sari Dewi',
  imageUrl: 'https://example.com/sari.jpg',
};

export function Example() {
  return (
    <>
      {/* Initials with color */}
      <BTAvatar item={user} />

      {/* With photo */}
      <BTAvatar item={userWithPhoto} />

      {/* Sizes */}
      <BTAvatar item={user} size="xs" />
      <BTAvatar item={user} size="sm" />
      <BTAvatar item={user} size="md" />
      <BTAvatar item={user} size="lg" />
      <BTAvatar item={user} size="xl" />
      <BTAvatar item={user} size="2xl" />

      {/* Loading state */}
      <BTAvatar isLoading size="md" />

      {/* Error state */}
      <BTAvatar item={user} status="error" />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Initials with color
BTAvatar(
  item: const BTAvatarItem(
    name: 'Faisal Lestari',
    color: BTAvatarColor.green,
  ),
),

// With photo
BTAvatar(
  item: const BTAvatarItem(
    name: 'Sari Dewi',
    imageUrl: 'https://example.com/sari.jpg',
  ),
),

// Sizes
BTAvatar(
  item: const BTAvatarItem(name: 'Faisal Lestari', color: BTAvatarColor.blue),
  size: BTAvatarSize.xs,
),
BTAvatar(
  item: const BTAvatarItem(name: 'Faisal Lestari', color: BTAvatarColor.blue),
  size: BTAvatarSize.lg,
),
BTAvatar(
  item: const BTAvatarItem(name: 'Faisal Lestari', color: BTAvatarColor.blue),
  size: BTAvatarSize.xl,
),

// Loading state
BTAvatar(isLoading: true, size: BTAvatarSize.md),

// Error state
BTAvatar(
  item: const BTAvatarItem(name: 'Faisal Lestari', color: BTAvatarColor.green),
  status: BTAvatarStatus.error,
),
```

---

## Notes

- Inisial diambil dari karakter pertama setiap kata dalam `item.name` (maksimal 2 karakter). "Faisal Lestari" → "FL", "Budi" → "B".
- Keenam warna background (`green`, `blue`, `orange`, `purple`, `teal`, `pink`) adalah hardcoded brand palette khusus `BTAvatar` — tidak menggunakan token semantik warna.
- Jika `item` tidak diberikan dan `isLoading` juga `false`, komponen menampilkan avatar placeholder netral.
- Untuk grup avatar, gunakan `BTAvatarGroup` — jangan merender banyak `BTAvatar` secara manual dengan overlap CSS.
