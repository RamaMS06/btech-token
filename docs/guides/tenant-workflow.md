# Tenant Workflow Guide

Panduan lengkap untuk manage tenant di BTech Design System — dari bikin baru, ubah existing, sampai handling typography.

---

## 1. Bikin Tenant Baru

### Cara A — Auto (via script)

```bash
pnpm add-tenant
```

Interactive prompt akan nanya:
- Tenant ID (slug, mis. `mandiri`)
- Primary brand color (hex, mis. `#003D7C`)
- Base interactive radius (px, mis. `6`)

Script auto:
- Bikin `sources/tenants/<id>/overrides.json` dengan template default
- Generator auto-scan saat `pnpm generate` jalan

---

### Cara B — Manual (tanpa script)

**1. Bikin folder + file:**
```bash
mkdir -p packages/tokens/sources/tenants/<id>
```

**2. Isi `overrides.json`:**
```json
{
  "$description": "Tenant <id>",
  "color": {
    "brand": {
      "primary":        { "$value": "#003D7C",   "$type": "color" },
      "primary-subtle": { "$value": "#003D7C26", "$type": "color" },
      "primary-bold":   { "$value": "#003D7C",   "$type": "color" }
    }
  },
  "radius": {
    "sm": { "$value": "6px", "$type": "dimension" },
    "md": { "$value": "8px", "$type": "dimension" }
  }
}
```

> **Catatan:** Generator auto-scan `sources/tenants/*` — tidak perlu register manual di config mana pun.

---

### Lanjutan (sama untuk Cara A & B)

**3. Generate:**
```bash
pnpm generate
```

Auto-create:
- `platforms/web/<id>/` → package `@btech/tokens-<id>` (version mirror base, mis. `1.0.0-rc.3`)
- `platforms/flutter/<id>/` (kalau ada Flutter tenant)
- Lockfile auto-sync

**4. Commit + PR:**
```bash
git add .
git commit -m "feat(tenant): add <id>"
git push
```

**5. Tag PR di Azure DevOps:**
- `release:rc` (atau `release:patch`, `release:minor`, `release:major`)
- `scope:tenant:<id>`

**6. Merge → Manual trigger `Publish Packages` pipeline.**

`publish-changed.ts` lihat `@btech/tokens-<id>` belum ada di feed → publish. Package existing skip.

---

## 2. Ubah Tenant Existing

### Cara A — Manual generate lokal (aman, recommended)

```bash
# 1. Edit tokens
vim packages/tokens/sources/tenants/bspace/overrides.json

# 2. Generate lokal
pnpm generate

# 3. Commit semua (sources + generated + lockfile)
git add .
git commit -m "chore(bspace): update brand color"
git push
```

Buka PR → tag `release:rc` + `scope:tenant:bspace` → merge → manual publish.

| Plus | Minus |
|---|---|
| PR utuh — reviewer lihat source + output sekaligus | Harus ingat run `pnpm generate` |
| Lockfile sync terjamin sebelum push | Perlu install deps lokal |

---

### Cara B — Skip generate, biar CI handle

```bash
# 1. Edit tokens saja
vim packages/tokens/sources/tenants/bspace/overrides.json

# 2. Commit source doang
git add packages/tokens/sources/tenants/bspace/overrides.json
git commit -m "chore(bspace): update brand color"
git push
```

Setelah push:
- `generate.yml` pipeline auto-jalan (trigger: perubahan di `sources/**`)
- Pipeline run `pnpm generate` + auto-commit generated files balik ke branch-mu
- `git pull` lokal untuk sync

Lalu: buka PR → tag `release:rc` + `scope:tenant:bspace` → merge → manual publish.

| Plus | Minus |
|---|---|
| Cepat, tidak perlu install deps lokal | Tunggu CI selesai baru PR siap review |
| Tidak ribet kalau cuma edit 1 field | Harus `git pull` sebelum commit tambahan |

---

### Setelah merge (sama untuk semua cara)

1. `auto-version.yml` baca tag PR → bump `bspace` saja (mis. `rc.3` → `rc.4`)
2. Base **tidak** bump → tidak ada git tag `v*` → publish **tidak auto-trigger**
3. **Manual:** Azure DevOps → Pipelines → `Publish Packages` → **Run pipeline**
4. `publish-changed.ts` deteksi `@btech/tokens-bspace@1.0.0-rc.4` belum ada di feed → publish. Package lain skip.

---

## 3. Typography Handling

### Auto-download vs Manual asset

Tergantung nilai `source` di `sources/core/font-registry.json`:

| Source | Behavior | Kapan pakai |
|---|---|---|
| `google-fonts` | **Auto-download** (Google Fonts CDN di web, `google_fonts` package di Flutter) | Font publik di Google Fonts |
| `system` | **Tidak download** — pakai font pre-installed OS | Font sistem (Google Sans di Android, SF Pro di iOS) |
| `asset` | **Manual bundle** — taruh file di `assets/fonts/` + register di `pubspec.yaml` / Vite config | Font lisensi, custom brand font |
| `custom-cdn` | Load dari CDN non-Google (sediakan field `url`) | Font di CDN perusahaan |

---

### Kasus 1 — Font sudah ada di registry (mis. Poppins)

Cukup override di `sources/tenants/<id>/overrides.json`:

```json
{
  "font": {
    "family": {
      "sans": { "$value": "Poppins", "$type": "fontFamily" }
    }
  }
}
```

Done. `pnpm generate` auto-inject:
- `@import url("https://fonts.googleapis.com/...")` ke `styles.css`
- Config `google_fonts` package di Flutter

---

### Kasus 2 — Font BELUM ada di registry

**A. Google Fonts baru (mis. `Space Grotesk`)**

1. Tambah entry ke `sources/core/font-registry.json`:
```json
"Space Grotesk": {
  "$description": "Tenant X display font.",
  "source": "google-fonts",
  "weights": [400, 500, 700],
  "styles": ["normal"],
  "fallback": "sans-serif"
}
```

2. Override di tenant (sama kayak Kasus 1):
```json
{ "font": { "family": { "sans": { "$value": "Space Grotesk", "$type": "fontFamily" } } } }
```

3. `pnpm generate` → auto-download handled.

---

**B. Custom asset (font lisensi / brand-only)**

1. Tambah entry ke `sources/core/font-registry.json`:
```json
"MyCustomFont": {
  "$description": "Proprietary brand font.",
  "source": "asset",
  "weights": [400, 700],
  "fallback": "sans-serif"
}
```

2. Taruh file font:
- **Web:** `apps/demo-*/public/fonts/MyCustomFont.woff2` + import di CSS global
- **Flutter:** `assets/fonts/MyCustomFont.ttf` + daftar di `pubspec.yaml`:
```yaml
flutter:
  fonts:
    - family: MyCustomFont
      fonts:
        - asset: assets/fonts/MyCustomFont-Regular.ttf
          weight: 400
        - asset: assets/fonts/MyCustomFont-Bold.ttf
          weight: 700
```

3. Override di tenant:
```json
{ "font": { "family": { "sans": { "$value": "MyCustomFont", "$type": "fontFamily" } } } }
```

4. `pnpm generate` → tokens ter-generate, tapi file font harus manual bundle di setiap app consumer.

---

**C. Custom CDN**

```json
"CorporateFont": {
  "source": "custom-cdn",
  "url": "https://cdn.corporate.com/fonts/font.css",
  "weights": [400, 700],
  "fallback": "sans-serif"
}
```

`pnpm generate` auto-inject `@import url(...)` ke CSS.

---

## Ringkasan

| Aksi | Cara Auto | Cara Manual |
|---|---|---|
| Bikin tenant | `pnpm add-tenant` | Bikin folder + `overrides.json` langsung |
| Update tenant | `pnpm generate` lokal | Skip, biar `generate.yml` CI handle |
| Font Google Fonts | `source: google-fonts` — auto-download | — |
| Font custom | — | `source: asset` + bundle file di app |

**Inti:** semua jalan ke alur yang sama — edit source → generate → commit → PR tag → merge → (manual) publish.
