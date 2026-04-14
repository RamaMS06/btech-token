# Changelog — btech_tokens

All notable changes to this package are documented here.
Versioning mirrors `@ramaMS06/tokens-web` — both packages always share the same version number.

## 1.0.0

### Major Release

- Initial stable release
- Full multi-tenant color token support (`BTechColor`, `BTechSpacing`, `BTechRadius`, `BTechTypography`)
- `extends Color` pattern — token objects ARE Colors, no `.default_` suffix needed
  - `BTechColor.background.primary` → `Color(0xFF15803D)` directly
  - `BTechColor.background.primary.hover` → `Color(0xFF166534)`
- Runtime tenant switching via `BTechContext` and `BTechTenantTokens`
- Tenant support: `default` (green), `tenant-a` (blue), `tenant-bjb` (deep blue)
- Auto-generated from `tokens/` source — do not edit generated files manually
