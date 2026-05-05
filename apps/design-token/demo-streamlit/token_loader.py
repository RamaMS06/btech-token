"""
token_loader.py
Reads DTCG JSON token sources directly — no published package required.
Resolves {alias} references and returns a flat dict of resolved values.
"""
from __future__ import annotations
import json
import re
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────
_ROOT    = Path(__file__).parent.parent.parent  # repo root
SOURCES  = _ROOT / "packages" / "tokens" / "sources"
TENANTS  = SOURCES / "tenants"

_SOURCE_FILES = [
    SOURCES / "core" / "color.primitive.json",
    SOURCES / "core" / "color.brand.json",
    SOURCES / "core" / "size.primitive.json",
    SOURCES / "core" / "radius.primitive.json",
    SOURCES / "core" / "stroke.primitive.json",
    SOURCES / "core" / "shadow.primitive.json",
    SOURCES / "core" / "font.primitive.json",
    SOURCES / "semantic" / "color.json",
    SOURCES / "semantic" / "typography.json",
]

# ── Internal helpers ──────────────────────────────────────────────────────────

def _load(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _flatten(data: dict, prefix: str = "") -> dict[str, dict]:
    """Recursively flatten nested DTCG token tree to dotted-path leaf nodes."""
    out: dict[str, dict] = {}
    for k, v in data.items():
        if k.startswith("$"):
            continue
        path = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            if "$value" in v:
                out[path] = v           # leaf node
            else:
                out.update(_flatten(v, path))
    return out


_ALIAS_RE = re.compile(r"^\{(.+)\}$")


def _resolve(value, nodes: dict[str, dict]) -> str:
    """Recursively resolve a single alias string to its primitive value."""
    if not isinstance(value, str):
        return value
    m = _ALIAS_RE.match(value)
    if not m:
        return value
    key = m.group(1)
    if key not in nodes:
        return value                    # unresolvable — return as-is
    return _resolve(nodes[key]["$value"], nodes)


def _shadow_css(val, nodes: dict[str, dict]) -> str:
    """Convert a DTCG shadow value (object or list) to a CSS box-shadow string."""
    def _one(s: dict) -> str:
        color  = _resolve(s.get("color", "rgba(0,0,0,0.1)"), nodes)
        ox, oy = s.get("offsetX", "0px"), s.get("offsetY", "0px")
        blur   = s.get("blur",   "0px")
        spread = s.get("spread", "0px")
        inset  = "inset " if s.get("inset") else ""
        return f"{inset}{ox} {oy} {blur} {spread} {color}"

    if isinstance(val, list):
        return ", ".join(_one(s) for s in val)
    if isinstance(val, dict):
        return _one(val)
    return str(val)


# ── Public API ────────────────────────────────────────────────────────────────

def build_token_map(tenant: str = "default", dark: bool = False) -> dict[str, str]:
    """
    Build a fully-resolved flat token map.

    Returns
    -------
    dict[str, str]
        e.g. {
            'color.bg.primary':  '#ffffff',
            'spacing.md':        '12px',
            'shadow.elevation.md': '0px 4px 6px -2px rgba(...)',
        }

    Parameters
    ----------
    tenant : str
        Tenant id matching a folder under sources/tenants/.
        Use 'default' for the base palette.
    dark : bool
        When True, applies semantic/color.dark.json overrides on top of light.
    """
    # 1. Load base sources
    nodes: dict[str, dict] = {}
    for p in _SOURCE_FILES:
        if p.exists():
            nodes.update(_flatten(_load(p)))

    # 2. Tenant overrides (brand primitives + typography + radius overrides)
    tenant_path = TENANTS / tenant / "overrides.json"
    if tenant_path.exists():
        nodes.update(_flatten(_load(tenant_path)))

    # 3. Dark-mode semantic override
    if dark:
        dark_path = SOURCES / "semantic" / "color.dark.json"
        if dark_path.exists():
            nodes.update(_flatten(_load(dark_path)))

    # 4. Resolve all leaves
    resolved: dict[str, str] = {}
    for key, node in nodes.items():
        val  = node["$value"]
        typ  = node.get("$type", "")
        if typ == "shadow":
            resolved[key] = _shadow_css(val, nodes)
        else:
            resolved[key] = _resolve(val, nodes)

    return resolved


def available_tenants() -> list[str]:
    """Return all tenant ids that have an overrides.json."""
    if not TENANTS.exists():
        return ["default"]
    ids = [d.name for d in TENANTS.iterdir() if (d / "overrides.json").exists()]
    return sorted(ids) or ["default"]
