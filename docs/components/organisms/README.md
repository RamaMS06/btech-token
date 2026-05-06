# Organisms

Organisms adalah komponen UI yang kompleks, terdiri dari kombinasi molecules dan/atau atoms yang bekerja bersama membentuk satu bagian antarmuka yang memiliki fungsi mandiri. Organisms biasanya mengelola state internal yang lebih kaya atau mengorkestrasi interaksi antar sub-komponen.

Dalam BTech Design System, organisms mencakup komponen seperti avatar group yang menggabungkan beberapa avatar dengan logika overflow, dan komponen-komponen level tinggi lainnya yang siap dipasang langsung di halaman.

## Daftar Organisms

| Component | Description | Figma |
|---|---|---|
| [BTAvatarGroup](./avatar-group.md) | Kumpulan avatar dengan overflow counter otomatis | [504-705] |
| [BTCoachmarkTour](./coachmark-tour.md) | Multi-step onboarding overlay dengan spotlight cutout dan navigasi prev/next | [2157-1726] |

## Prinsip penggunaan

- Organisms boleh menerima state kompleks (list of objects, async data) — berbeda dengan atoms yang hanya menerima nilai sederhana.
- Organisms bertanggung jawab atas layout internal sub-komponennya (spacing, overflow, alignment).
- Gunakan organisms langsung di halaman atau layout template — jangan bungkus organism dalam organism lain kecuali benar-benar diperlukan.
