# BTech UI Component Library

BTech Design System menyediakan komponen UI yang siap pakai untuk tiga platform: **Vue 3**, **React**, dan **Flutter**. Semua komponen dihasilkan dari source of truth yang sama (Figma) dan menggunakan token desain dari `@btech/tokens`.

## Package imports

| Framework | Package |
|---|---|
| Vue 3 | `@btech/ui-vue` |
| React | `@btech/ui-react` |
| Flutter | `package:btech_ui/btech_ui.dart` |

## Atomic layers

Komponen diorganisir dalam tiga lapisan sesuai prinsip Atomic Design:

### [Atoms](./atoms/README.md)
Unit UI terkecil — building block dasar. Tidak bergantung pada komponen lain.

| Component | Description |
|---|---|
| [BTBadge](./atoms/badge.md) | Status label dengan warna semantik |
| [BTButton](./atoms/button.md) | Tombol aksi utama |
| [BTButtonLink](./atoms/button-link.md) | Tombol bergaya tautan |
| [BTCheckbox](./atoms/checkbox.md) | Input pilihan boolean |
| [BTHint](./atoms/hint.md) | Indikator notifikasi / badge angka |
| [BTLoadingSkeleton](./atoms/loading-skeleton.md) | Placeholder loading animasi |
| [BTRadioButton](./atoms/radio-button.md) | Input pilihan tunggal dari sekelompok opsi |

### [Molecules](./molecules/README.md)
Kombinasi atoms yang membentuk komponen dengan satu fungsi yang jelas.

| Component | Description |
|---|---|
| [BTAlert](./molecules/alert.md) | Banner feedback kontekstual dengan dukungan toast programatik |
| [BTAvatar](./molecules/avatar.md) | Representasi visual pengguna |

### [Organisms](./organisms/README.md)
Komponen kompleks yang terdiri dari molecules dan/atau atoms.

| Component | Description |
|---|---|
| [BTAvatarGroup](./organisms/avatar-group.md) | Kumpulan avatar dengan overflow counter |
| [BTCoachmarkTour](./organisms/coachmark-tour.md) | Multi-step onboarding overlay dengan spotlight |

## Conventions

- Semua komponen web menerima `className` prop untuk custom styling tambahan.
- Prop API dirancang identik di Vue dan React — perbedaan hanya pada idiom framework (`v-model` vs controlled props, `onClick` vs `onPress`).
- Flutter named constructors mengikuti prop yang sama (lihat masing-masing doc).
- CSS tokens selalu ditulis sebagai `var(--token-name)` tanpa hex fallback.
