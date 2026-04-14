# Architecture

How token sources turn into the artefacts that apps consume.

---

## 1. Pipeline

```
                           +------------------------------------+
                           |           tokens/ (source)         |
                           |                                    |
                           |   core/      primitive palette     |
                           |   semantic/  named roles/aliases   |
                           |   components/ composite tokens     |
                           |   tenants/   per-brand overrides   |
                           +------------------+-----------------+
                                              |
                                              v
                           +------------------------------------+
                           |   config/sd.config.ts (generator)  |
                           |   - flatten + resolve references   |
                           |   - strip `.default` suffix        |
                           |   - per-platform codegen           |
                           +------------------+-----------------+
                                              |
                 +----------------------------+----------------------------+
                 |                            |                            |
                 v                            v                            v
        +------------------+        +--------------------+        +------------------+
        | tokens-web (TS)  |        | styles.css + tenant|        | tokens-dart      |
        | BTechColor,      |        | overrides appended |        | BTechColor,      |
        | BTechSpacing,    |        | [data-tenant="..."]|        | BTechSpacing,    |
        | BTechRadius,     |        |                    |        | BTechTenantTokens|
        | BTechFont        |        |                    |        |                  |
        +---------+--------+        +----------+---------+        +---------+--------+
                  |                            |                            |
                  v                            v                            v
           React / TS app            Any web app (CSS vars            Flutter app via
           via typed imports         + data-tenant attribute)         BTechTheme.forTenant
```

Two consumption models co-exist:

  - **CSS variables + `data-tenant`** — zero JS cost, tenant swap = single
    attribute write.
  - **Typed API (TS / Dart)** — compile-time safety when you have an IDE and
    a type system.

---

## 2. Token model

Tokens follow the Design Token Community Group (DTCG) shape: every leaf has
`$value` and `$type`. References use curly-brace syntax.

```json
// tokens/core/color.primitive.json  (primitive)
{
  "color": {
    "blue":    { "500": { "$value": "#3b82f6", "$type": "color" } },
    "neutral": { "900": { "$value": "#111827", "$type": "color" } }
  }
}
```

```json
// tokens/semantic/color.json  (role / alias)
{
  "color": {
    "background": {
      "primary": {
        "default": { "$value": "{color.green.700}", "$type": "color" },
        "hover":   { "$value": "{color.green.800}", "$type": "color" }
      }
    }
  }
}
```

```json
// tokens/tenants/tenant-a/overrides.json  (tenant override)
{
  "color": {
    "background": {
      "primary": {
        "default": { "$value": "{color.blue.500}", "$type": "color" }
      }
    }
  }
}
```

### Layer boundary

```
  core (primitives)       semantic (roles)        tenant (overrides)
  +----------------+  -->  +----------------+ -->  +------------------+
  | color.blue.500 |       | bg.primary     |      | primary.default =|
  | color.green.700|       |  .default      |      | {color.blue.500} |
  +----------------+       +----------------+      +------------------+
```

Enforced by `tools/validators/boundary.ts`:

  - Tenants may only override **semantic** and **component** tokens.
  - Tenants **must not** redefine **core** primitives.

---

## 3. Naming conventions

A token path maps deterministically to each platform.

```
  token path:          color.background.primary.default
                       color.background.primary.hover

  CSS variable:        --btech-color-background-primary            (note: .default stripped)
                       --btech-color-background-primary-hover

  TypeScript:          BTechColor.background.primary
                       BTechColor.background.primaryHover

  Dart:                BTechColor.background.primary
                       BTechColor.background.primaryHover
```

Rules:

  - The `.default` suffix is always stripped from CSS var names and API
    properties (see `config/sd.config.ts`, commit `fd9b6da`).
  - Color shades use `s<NNN>` in Dart to avoid leading digits
    (`BTechColor.blue.s500`).
  - Dart reserved words get a trailing underscore (`default_`, `class_`).
  - All CSS variables are namespaced under `--btech-`.
