# Molecules

Molecules adalah komponen yang terbentuk dari kombinasi satu atau lebih atoms. Mereka memiliki satu fungsi yang jelas dan kohesif, namun lebih kompleks dari atom tunggal. Molecules berdiri sendiri dan dapat digunakan langsung di dalam organisms atau halaman.

Dalam BTech Design System, molecules mencakup komponen seperti avatar yang menggabungkan gambar, inisial, dan indikator status dalam satu unit yang bermakna.

## Daftar Molecules

| Component | Description | Figma |
|---|---|---|
| [BTAvatar](./avatar.md) | Representasi visual pengguna dengan gambar, inisial, atau placeholder loading | [497-979] |
| [BTTabs](./tabs.md) | Tab strip dengan dua variant: segmented (pill tray) dan line (underline) | [1-53] |

## Prinsip penggunaan

- Molecules **tidak** mengandung logika bisnis yang kompleks — mereka menerima data melalui props dan merender tampilan.
- Gunakan molecules sebagai building block untuk organisms, atau langsung di halaman untuk elemen tunggal yang berdiri sendiri.
- Prop API molecules dirancang konsisten di ketiga framework — pastikan menggunakan nama prop yang sama saat berpindah framework.
