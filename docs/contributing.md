# Contributing — Token Maintainer Guide

For anyone editing `tokens/` or adding a new tenant.

---

## 1. Rules

  - Edit only under `tokens/`. Generated code under `packages/**/src/` and
    `packages/**/lib/src/` is overwritten on every `pnpm generate`.
  - Do not modify `tokens/core/**` unless you intend to change *every* tenant.
  - Prefer references (`{color.blue.700}`) over raw hex values — tenants stay
    coherent with the palette.
  - Override only what differs. Tenants inherit everything unspecified.

---

## 2. Add a new tenant

```
$ pnpm add-tenant
Tenant ID (slug):          my-bank
Primary brand color (hex): #003D7C
Base interactive radius:   4
  -> created tokens/tenants/my-bank/overrides.json
```

The scaffolder writes a minimal `overrides.json`. Extend it as needed:

```json
// tokens/tenants/my-bank/overrides.json
{
  "color": {
    "background": {
      "primary": {
        "default": { "$value": "{color.blue.700}", "$type": "color" },
        "hover":   { "$value": "{color.blue.800}", "$type": "color" }
      }
    }
  },
  "typography": {
    "fontFamily": {
      "sans": { "$value": "'MyBank Sans', Inter, system-ui, sans-serif",
                "$type": "fontFamily" }
    }
  },
  "radius": {
    "interactive": { "$value": "4px", "$type": "dimension" },
    "card":        { "$value": "6px", "$type": "dimension" }
  }
}
```

---

## 3. Modify an existing tenant

Edit the file directly:

  - `tokens/tenants/default/overrides.json`   — base brand
  - `tokens/tenants/tenant-a/overrides.json`

Then run `pnpm generate` and preview (§4).

---

## 4. Preview locally

```
pnpm generate                    # regenerate all platform outputs
pnpm --filter demo-react dev     # verify in the React demo
pnpm --filter demo-vue  dev      # or the Vue demo
cd apps/demo-flutter && flutter run -d chrome
```

  - Web demos read the tenant id from the `data-tenant` attribute.
  - Flutter demo uses `BTechTheme.forTenant('<id>', brightness)`.

---

## 5. Validate

```
pnpm validate
  - tools/validators/contrast.ts  (WCAG AA text/background pairs)
  - tools/validators/boundary.ts  (tenants can't override primitives)
```

`pnpm validate` **must** pass — the same validators run on every PR to `main`.

---

## 6. Typical pull-request flow

```
  feature branch                       main (protected)
       |                                    |
  1. edit tokens/**
  2. git push
       |                                    |
  3. generate.yml fires on the branch
       - regenerates TS + Dart + CSS outputs
       - auto-commits the diff back to your branch
       |                                    |
  4. open PR --> validate.yml fires --------+
       - re-runs pnpm generate (fails if stale)
       - runs contrast + boundary validators
       - runs flutter analyze
       |                                    |
  5. merge PR ----------------------------->|
```

You commit **only** edits under `tokens/`. CI writes the generated files back.
Running `pnpm generate` locally and committing the result is also accepted —
the diff is identical. See [ci-cd.md](./ci-cd.md) for the full trigger contract.

---

## 7. Local dev reference

Prerequisites: Node 20, pnpm 9, Flutter 3.22.x (stable).

```
pnpm install                # install JS deps
pnpm bootstrap              # + melos bootstrap (Flutter side)

pnpm generate               # regenerate TS/Dart/CSS outputs
pnpm build                  # generate + tsup build
pnpm validate               # contrast + boundary validators
pnpm add-tenant             # scaffold a new tenant

pnpm flutter:get            # melos: flutter pub get across packages
pnpm flutter:analyze        # melos: flutter analyze
pnpm flutter:test           # melos: flutter test
```

---

## 8. Common pitfalls

  - **PR fails with "Generated files are out of sync with tokens/"**
    Push `tokens/**` changes and let generate.yml auto-commit the outputs, or
    run `pnpm generate` locally and commit the result yourself. Either works.

  - **Boundary validator fails**
    A tenant override reaches into `tokens/core/**`. Move the override up to
    the semantic layer, or adjust the semantic role instead.

  - **Contrast validator fails**
    `color.text.onPrimary` vs `color.background.primary` (or a similar pair)
    does not meet WCAG AA. Switch to a darker/lighter primitive shade.
