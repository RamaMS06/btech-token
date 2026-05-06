# BTLoadingSkeleton

> Placeholder animasi shimmer yang ditampilkan saat konten sedang dimuat, menggantikan layout yang kosong.

Figma: — · Category: Atoms · **Flutter only** (Vue/React coming soon)

---

## Overview

`BTLoadingSkeleton` digunakan sebagai placeholder saat data sedang di-fetch atau komponen sedang diinisialisasi. Animasi shimmer memberikan feedback visual bahwa konten sedang dalam proses pemuatan tanpa menampilkan spinner yang mengganggu. Tersedia dalam bentuk persegi panjang (untuk teks, card, gambar) dan lingkaran (untuk avatar atau ikon).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `width` | `double` | **required** | Lebar skeleton dalam logical pixels |
| `height` | `double` | **required** | Tinggi skeleton dalam logical pixels |
| `borderRadius` | `double` | `4.0` | Radius sudut skeleton |

### Named constructor: `.circle`

| Prop | Type | Default | Description |
|---|---|---|---|
| `size` | `double` | **required** | Diameter lingkaran |

## Variants / States

- **rectangle** — Default constructor, untuk placeholder teks, gambar, atau card.
- **circle** — Named constructor `.circle`, untuk placeholder avatar atau ikon bulat.
- **shimmer** — Semua skeleton otomatis menampilkan animasi shimmer (tidak ada prop tambahan).

## Usage

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// Text placeholder
BTLoadingSkeleton(width: 200, height: 16),

// Paragraph simulation
Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    BTLoadingSkeleton(width: 240, height: 16),
    const SizedBox(height: 8),
    BTLoadingSkeleton(width: 180, height: 16),
    const SizedBox(height: 8),
    BTLoadingSkeleton(width: 210, height: 16),
  ],
),

// Image/card placeholder
BTLoadingSkeleton(width: double.infinity, height: 200, borderRadius: 12),

// Avatar placeholder (circle)
BTLoadingSkeleton.circle(size: 40),
BTLoadingSkeleton.circle(size: 56),

// Card loading state example
Card(
  child: Padding(
    padding: const EdgeInsets.all(16),
    child: Row(
      children: [
        BTLoadingSkeleton.circle(size: 48),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BTLoadingSkeleton(width: double.infinity, height: 16),
              const SizedBox(height: 8),
              BTLoadingSkeleton(width: 120, height: 12),
            ],
          ),
        ),
      ],
    ),
  ),
),
```

### Vue

> **Coming soon.** Vue implementation belum tersedia. Gunakan library skeleton loading pihak ketiga sementara, atau tampilkan spinner dengan `BTButton` loading state.

### React

> **Coming soon.** React implementation belum tersedia. Gunakan library skeleton loading pihak ketiga sementara, atau tampilkan spinner dengan `BTButton` loading state.

---

## Notes

- Gunakan `BTLoadingSkeleton` di dalam kondisi `isLoading == true` dan tampilkan konten asli saat data sudah tersedia — jangan tampilkan keduanya sekaligus.
- Untuk komponen yang sudah punya prop `isLoading` (seperti `BTAvatar` dan `BTAvatarGroup`), tidak perlu melapisi dengan `BTLoadingSkeleton` secara manual.
- Ukuran skeleton sebaiknya mendekati ukuran konten asli yang akan ditampilkan, untuk menghindari layout shift saat konten muncul.
