# btech-tokens-bspace

Tenant variant of `btech-tokens` with `bspace`-specific token
overrides applied at generate time. Auto-generated — do not edit by hand.

## Install

```bash
pip install \
  --index-url https://pkgs.dev.azure.com/buma/BUMA%20-%20Bspace%20Design%20System/_packaging/btech/pypi/simple/ \
  btech-tokens-bspace
```

## Use

Identical API to the base `btech-tokens` package — just import from the
tenant module instead:

```python
from btech_tokens_bspace import BTechColor, BTechSpacing, set_mode, to_css

BTechColor.background.primary    # ← bspace override
```

See the base `btech-tokens` README for full API documentation.
