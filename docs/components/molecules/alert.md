# BTAlert

> Banner feedback kontekstual — menampilkan pesan informasi, sukses, error, peringatan, atau netral.

Figma: [node 681-11285](https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=681-11285) · Category: Molecules

---

## Overview

`BTAlert` adalah komponen feedback yang menampilkan pesan singkat (label) dengan ikon semantik sesuai variantnya. Ketika `description` disertakan, label menjadi bold dan komponen beralih ke layout dua baris yang lebih ekspansif. Tersedia juga link inline (`linkLabel`) di dalam body, tombol aksi (`actionLabel`), dan tombol dismiss (×).

Untuk notifikasi programatik (toast-style), gunakan `useAlert()` / `BTAlertProvider` (Vue/React) atau `BTAlert.show()` (Flutter) — alert muncul di pojok kanan bawah layar dan auto-dismiss setelah `duration`.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Pesan utama alert. Bold saat `description` ada. **Wajib.** |
| `variant` | `BTAlertVariant` | `'info'` | Gaya visual alert (lihat Variants di bawah). |
| `description` | `string` | — | Teks pendukung di bawah label. |
| `linkLabel` | `string` | — | Label link inline di dalam body, di bawah `description`. Hanya tampil jika `description` ada. |
| `actionLabel` | `string` | — | Label tombol aksi. Tampil sebagai text link (tanpa description) atau bordered button (dengan description). |
| `dismissible` | `boolean` | `false` | Tampilkan tombol dismiss (×) di trailing edge. |

### Callbacks

| Event / Prop | Dipanggil saat |
|---|---|
| `@action` / `onAction` | Tombol / link `actionLabel` diklik |
| `@link` / `onLink` | Link `linkLabel` diklik |
| `@dismiss` / `onDismiss` | Tombol dismiss (×) diklik |

### BTAlertVariant

| Value | Warna background | Border | Icon |
|---|---|---|---|
| `'info'` | `ext.infoSubtler` | `ext.infoBold` | ● info |
| `'success'` | `ext.successSubtler` | `ext.successBold` | ● check circle |
| `'error'` | `ext.errorSubtler` | `ext.errorBold` | ● error |
| `'warning'` | `ext.warningSubtler` | `ext.warningBold` | ● warning triangle |
| `'neutral'` | `bg.secondary` | `border.primary` | ● info |
| `'neutral-dark'` | `bg.inverse` | _(none)_ | ● info (inverse) |

## Variants / States

- **Simple** — hanya `label`. Padding horizontal 12px. `actionLabel` tampil sebagai text link di kanan.
- **With description** — `label` (bold) + `description` + opsional `linkLabel`. Padding 8px semua sisi. `actionLabel` tampil sebagai bordered button.
- **Dismissible** — tombol × di trailing edge, memanggil `onDismiss`.
- **Programmatic / toast** — muncul di pojok kanan bawah via `useAlert().show()` / `BTAlert.show()`. Auto-dismiss, slide animasi dari kanan (web) atau bawah (Flutter), swipe-down untuk dismiss (Flutter).

## Usage

### Vue

```vue
<script setup lang="ts">
import { BTAlert, BTAlertContainer, useAlert } from '@btech/ui-vue';

// ── Inline alert ──
</script>

<template>
  <!-- Simple -->
  <BTAlert variant="success" label="Perubahan berhasil disimpan." />

  <!-- Dengan description + link + action + dismiss -->
  <BTAlert
    variant="error"
    label="Gagal memuat data"
    description="Koneksi terputus. Coba lagi beberapa saat."
    link-label="Pelajari lebih lanjut"
    action-label="Coba lagi"
    dismissible
    @action="retry"
    @link="openDocs"
    @dismiss="hideAlert"
  />

  <!-- Container untuk toast programatik (mount sekali di root app) -->
  <BTAlertContainer />
</template>
```

```ts
// ── Programmatic (toast) ──
import { useAlert } from '@btech/ui-vue';

const { show, dismiss, dismissAll } = useAlert();

// Simple
show({ variant: 'success', label: 'Tersimpan!' });

// Dengan description + link + duration kustom
show({
  variant: 'error',
  label: 'Gagal menyimpan',
  description: 'Coba lagi atau hubungi support.',
  linkLabel: 'Pelajari lebih lanjut',
  actionLabel: 'Coba lagi',
  dismissible: true,
  duration: 5000,         // ms; 0 = tidak auto-dismiss
  onAction: () => retry(),
  onLink: () => openDocs(),
});
```

### React

```tsx
import { BTAlert, BTAlertProvider, useAlert } from '@btech/ui-react';

// ── Wrap app sekali ──
export function App() {
  return (
    <BTAlertProvider>
      <YourApp />
    </BTAlertProvider>
  );
}

// ── Inline alert ──
export function Example() {
  return (
    <>
      {/* Simple */}
      <BTAlert variant="success" label="Perubahan berhasil disimpan." />

      {/* Dengan description + link + action + dismiss */}
      <BTAlert
        variant="error"
        label="Gagal memuat data"
        description="Koneksi terputus. Coba lagi beberapa saat."
        linkLabel="Pelajari lebih lanjut"
        actionLabel="Coba lagi"
        dismissible
        onAction={retry}
        onLink={openDocs}
        onDismiss={hideAlert}
      />
    </>
  );
}

// ── Programmatic (toast) ──
function SomeComponent() {
  const { show, dismiss, dismissAll } = useAlert();

  return (
    <button onClick={() =>
      show({
        variant: 'success',
        label: 'Tersimpan!',
        duration: 5000,   // ms; 0 = tidak auto-dismiss
      })
    }>
      Simpan
    </button>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// ── Inline alert ──

// Simple
const BTAlert(
  variant: BTAlertVariant.success,
  label: 'Perubahan berhasil disimpan.',
)

// Dengan description + link + action + dismiss
BTAlert(
  variant: BTAlertVariant.error,
  label: 'Gagal memuat data',
  description: 'Koneksi terputus. Coba lagi beberapa saat.',
  linkLabel: 'Pelajari lebih lanjut',
  actionLabel: 'Coba lagi',
  dismissible: true,
  onAction: _retry,
  onLink: _openDocs,
  onDismiss: _hideAlert,
)

// ── Programmatic (toast) ──
BTAlert.show(
  context,
  variant: BTAlertVariant.success,
  label: 'Tersimpan!',
  duration: const Duration(seconds: 5), // Duration.zero = tidak auto-dismiss
);

// Dengan semua opsi
BTAlert.show(
  context,
  variant: BTAlertVariant.error,
  label: 'Gagal menyimpan',
  description: 'Coba lagi atau hubungi support.',
  linkLabel: 'Pelajari lebih lanjut',
  actionLabel: 'Coba lagi',
  dismissible: true,
  duration: const Duration(seconds: 5),
  bottomSpacing: 72,  // gap dari bawah layar, default 72
  onAction: _retry,
  onLink: _openDocs,
);
```

---

## Notes

- **Satu toast sekaligus (Flutter)** — `BTAlert.show()` otomatis menutup toast sebelumnya sebelum menampilkan yang baru. Tidak ada stacking.
- **Root overlay (Flutter)** — toast diinsert ke `rootOverlay: true`, sehingga selalu berada di atas bottom sheet, dialog, dan modal.
- **Swipe-down dismiss (Flutter)** — user bisa menggeser toast ke bawah untuk menutup. Threshold: ≥60px drag atau ≥300 px/s velocity; jika kurang, snap kembali ke posisi asal.
- **`bottomSpacing` (Flutter only)** — sesuaikan jika ada persistent bottom navigation bar atau FAB: `BTAlert.show(context, bottomSpacing: 100)`.
- **Animasi web** — enter: slide dari kanan dengan `cubic-bezier(0.16, 1, 0.3, 1)` (320ms); exit: slide ke kanan fade-out (220ms).
- **`duration: 0`** (Vue/React) atau **`duration: Duration.zero`** (Flutter) — menonaktifkan auto-dismiss.
- **Token warna** — semua warna menggunakan token semantik (`ext.*`, `bg.*`, `text.*`, `border.*`). Tidak ada hardcoded hex.
- **`linkLabel` hanya tampil saat `description` ada** — tidak ada efek jika `description` tidak diset.
