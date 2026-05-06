# Atoms

Atoms adalah unit UI terkecil yang tidak dapat dipecah lagi. Mereka adalah building block dasar dari design system dan berdiri sendiri tanpa bergantung pada komponen lain. Setiap atom dirancang untuk satu tanggung jawab yang spesifik.

Dalam BTech Design System, atoms mencakup elemen-elemen seperti badge, button, checkbox, dan indikator kecil lainnya yang digunakan berulang kali di seluruh antarmuka.

## Daftar Atoms

| Component | Description | Figma |
|---|---|---|
| [BTBadge](./badge.md) | Status label dengan enam variant warna semantik | [72-1516] |
| [BTButton](./button.md) | Tombol aksi utama dengan lima variant | — |
| [BTButtonLink](./button-link.md) | Tombol bergaya tautan (inline action) | [480-3197] |
| [BTCheckbox](./checkbox.md) | Input pilihan boolean dengan state indeterminate dan error | — |
| [BTHint](./hint.md) | Indikator notifikasi — dot atau angka (badge count) | [658-1960] |
| [BTLoadingSkeleton](./loading-skeleton.md) | Placeholder animasi shimmer saat konten sedang dimuat | — |
| [BTRadioButton](./radio-button.md) | Input pilihan tunggal dari sekelompok opsi | [555-3529] |

## Prinsip penggunaan

- Atoms **tidak** mengandung logic bisnis — mereka hanya menerima props dan merender UI.
- Gunakan atoms sebagai building block saat membangun molecules atau organisms baru.
- Hindari memodifikasi tampilan atom dari luar selain melalui props yang tersedia — gunakan `className` hanya untuk layout/positioning, bukan untuk mengubah warna atau ukuran internal.
