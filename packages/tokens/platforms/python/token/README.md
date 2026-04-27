# btech-tokens

BTech design tokens for Python UI consumers. Source-of-truth tokens shared with
the web (`@btech/tokens`) and Flutter (`btech_tokens`) packages — same DTCG
sources, same values, just exposed as typed Python.

Designed for **single-process UI applications**: Streamlit, Gradio, NiceGUI,
Reflex, Solara, and notebook / design-tooling scripts. Backend web frameworks
(FastAPI / Django / Flask) are not a target — see `set_mode` notes below.

## Install

The package is published to the internal Azure Artifacts `btech` feed.

```bash
pip install keyring artifacts-keyring
pip install \
  --index-url https://pkgs.dev.azure.com/buma/BUMA%20-%20Bspace%20Design%20System/_packaging/btech/pypi/simple/ \
  btech-tokens
```

`artifacts-keyring` handles Azure AD auth via the system keyring on first call.

## Basic use

```python
from btech_tokens import (
    BTechColor, BTechSpacing, BTechRadius, BTechStroke,
    BTechFont, BTechShadow,
    LIGHT, DARK, set_mode, to_css,
)

BTechColor.bg.primary           # '#ffffff'   (default tenant, light)
BTechColor.text.primary         # '#0a0a0a'
BTechColor.brand.primary        # default brand color
BTechSpacing.md                 # 12.0
BTechRadius.md                  # 8.0
BTechFont.family.sans           # 'Geist, system-ui, -apple-system, sans-serif'
```

Color groups: `text`, `icon`, `border`, `bg`, `brand`, `ext`. Each carries a
flat field set such as `primary`, `primary_hover`, `secondary`, `disabled`,
`subtle`, etc. (auto-derived from `sources/semantic/color.json` — see
`btech_tokens._data.COLOR_LIGHT.keys()` to enumerate at runtime).

All token values are plain hex strings or floats — drop them into any UI
library that accepts those (Streamlit color args, Gradio theme, NiceGUI
`ui.colors`, matplotlib `rcParams`, Pillow draw calls, …).

## Mode switching (light / dark)

```python
set_mode('dark')
BTechColor.bg.primary           # '#181c20'   ← dark value
set_mode('light')
BTechColor.bg.primary           # '#ffffff'   ← back to light
```

`set_mode` mutates module-level state. **It is safe for single-process UI
apps** — notebooks, local Streamlit, desktop tools. It is **not safe** for
multi-user-deployed dashboards where two users may want different modes
concurrently. Use the namespace constants below for that case.

## Side-by-side / no-global-state access

```python
from btech_tokens import LIGHT, DARK

LIGHT.color.bg.primary          # always '#ffffff' regardless of set_mode
DARK.color.bg.primary           # always '#181c20' regardless of set_mode
```

Useful for theme preview UIs, settings screens that show both swatches at
once, parametrized tests, and multi-user-deployed Streamlit apps where each
user picks their preferred mode per session.

## CSS injection

```python
import streamlit as st
from btech_tokens import to_css

st.markdown(f'<style>{to_css(mode="dark")}</style>', unsafe_allow_html=True)
```

`to_css` emits a `:root { --btech-... }` block. CSS variable names follow
`--btech-color-{group}-{name}` with snake_case keys converted to kebab-case
(e.g. `color.bg.primary_hover` → `--btech-color-bg-primary-hover`).

These names are intentionally simpler than the `@btech/tokens` web variables
(web drops the `color.` prefix and renames `stroke` → `border`). Token
*values* match the web package exactly; only CSS variable *names* differ.
Use the typed accessors (`BTechColor.bg.primary` etc.) when you need
cross-platform parity guaranteed.

Same helper works for any framework that supports raw CSS injection:

```python
# Gradio
gr.HTML(f'<style>{to_css()}</style>')

# NiceGUI
ui.add_css(to_css())

# Solara / Reflex / Flet — all support raw CSS strings.
```

## Tenants

Each tenant ships as a separate package — install the one you need instead of
the base:

```bash
pip install btech-tokens-bspace
```

```python
from btech_tokens_bspace import BTechColor, to_css     # same API, bspace values

BTechColor.bg.primary            # '#145bc3'   ← tenant override
BTechColor.brand.primary         # '#145bc3'
```

## Type checking

The package ships `py.typed` (PEP 561). `mypy --strict` and Pyright pass out
of the box on the public surface.

## License

Proprietary — internal use only.
