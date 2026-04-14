# @ramaMS06/tokens-web

## 1.0.1

### Patch Changes

- Strip `-default` suffix from all CSS custom property names

  CSS variables like `--btech-color-background-primary-default` have been
  renamed to `--btech-color-background-primary`. The `-default` suffix was
  a leaky DTCG implementation detail — base values are now accessed directly
  without any suffix, consistent with the Dart API.

  Migration:
  - `--btech-color-background-primary-default` → `--btech-color-background-primary`
  - `--btech-color-background-secondary-default` → `--btech-color-background-secondary`
  - `--btech-color-stroke-primary-default` → `--btech-color-stroke-primary`
  - `--btech-color-stroke-neutral-default` → `--btech-color-stroke-neutral`
  - `--btech-color-text-neutral-default` → `--btech-color-text-neutral`
  - `--btech-color-background-surface-default` → `--btech-color-background-surface`
  - `--btech-color-background-danger-default` → `--btech-color-background-danger`

## 1.0.0

### Major Changes

- Initial stable release 1.0.0
  - Framework-agnostic design tokens for all JS/TS consumers
  - Full multi-tenant CSS custom property output (`data-tenant` scoping)
  - Typed TS exports: `BTechColor`, `BTechSpacing`, `BTechRadius`, `BTechTypography`
  - `activateTenant()` vanilla JS API for runtime tenant switching
  - Tenant support: `default` (green), `tenant-a` (blue), `tenant-bjb` (deep blue)
