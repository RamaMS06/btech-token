"""
btech_tokens.streamlit_adapter
================================
Bridges the btech design system tokens into Streamlit apps.

Three entry points
------------------
1. ``inject_theme(tokens)``   — injects CSS variables + Streamlit element overrides
2. ``get_streamlit_config()`` — returns a dict for .streamlit/config.toml [theme]
3. Helper wrappers for components that cannot be styled via CSS alone
   (charts, dataframes)

Single Source of Truth
-----------------------
All values come from ``BTechColor``, ``BTechTypography``, ``BTechSpacing``, and
``BTechRadius`` classes in the generated ``btech_tokens`` package.
No hex codes or sizes are hardcoded here.

Usage
-----
    import streamlit as st
    from btech_tokens.streamlit_adapter import inject_theme, get_streamlit_config

    # ── 1. Inject CSS theme (call once, early in app.py) ──
    inject_theme()

    # ── 2. Optional: write config.toml programmatically ──
    config = get_streamlit_config()
    print(config)  # paste into .streamlit/config.toml
"""

from __future__ import annotations

import textwrap
from typing import Any

from .color import BTechColor
from .spacing import BTechSpacing
from .radius import BTechRadius
from .typography import BTechTypography

# ---------------------------------------------------------------------------
# Internal: Streamlit import guard
# ---------------------------------------------------------------------------

def _get_st() -> Any:
    """
    Return the ``streamlit`` module, or raise a clear error if the caller is
    not inside a Streamlit environment.
    """
    try:
        import streamlit as st  # noqa: PLC0415
        return st
    except ImportError as exc:
        raise RuntimeError(
            "btech_tokens.streamlit_adapter requires Streamlit. "
            "Install it with: pip install streamlit"
        ) from exc


def _assert_streamlit_context() -> Any:
    """
    Guard: raise if called outside an active Streamlit script run context.
    Returns the ``st`` module on success.
    """
    st = _get_st()
    try:
        # ScriptRunContext is only available while a script is executing.
        from streamlit.runtime.scriptrunner import get_script_run_ctx  # noqa
        if get_script_run_ctx() is None:
            raise RuntimeError(
                "inject_theme() must be called from within a running Streamlit "
                "app (i.e. inside a script that Streamlit is executing). "
                "It cannot be called from a plain Python script or test."
            )
    except ImportError:
        pass  # older Streamlit — skip check
    return st


# ---------------------------------------------------------------------------
# 1. CSS Variable Injector
# ---------------------------------------------------------------------------

def _build_css_variables() -> str:
    """
    Build the :root block with every btech token as a CSS custom property.
    """
    c = BTechColor
    sp = BTechSpacing
    r = BTechRadius
    t = BTechTypography

    lines: list[str] = []

    # ── Color — text ──────────────────────────────────────────────────────
    lines += [
        f"  --btech-text-default:          {c.text.neutral.default};",
        f"  --btech-text-subtle:           {c.text.neutral.subtle};",
        f"  --btech-text-disabled:         {c.text.neutral.disabled};",
        f"  --btech-text-inverse:          {c.text.neutral.inverse};",
        f"  --btech-text-danger:           {c.text.danger.base};",
        f"  --btech-text-success:          {c.text.success.base};",
        f"  --btech-text-warning:          {c.text.warning.base};",
        f"  --btech-text-info:             {c.text.info.base};",
        f"  --btech-text-on-primary:       {c.text.on.primary};",
    ]

    # ── Color — background ───────────────────────────────────────────────
    lines += [
        f"  --btech-bg-surface:            {c.background.surface.default};",
        f"  --btech-bg-surface-subtle:     {c.background.surface.subtle};",
        f"  --btech-bg-surface-raised:     {c.background.surface.raised};",
        f"  --btech-bg-primary:            {c.background.primary.default};",
        f"  --btech-bg-primary-hover:      {c.background.primary.hover};",
        f"  --btech-bg-primary-subtle:     {c.background.primary.subtle};",
        f"  --btech-bg-primary-disabled:   {c.background.primary.disable};",
        f"  --btech-bg-danger:             {c.background.danger.default};",
        f"  --btech-bg-danger-subtle:      {c.background.danger.subtle};",
        f"  --btech-bg-success:            {c.background.success.default};",
        f"  --btech-bg-success-subtle:     {c.background.success.subtle};",
        f"  --btech-bg-warning:            {c.background.warning.default};",
        f"  --btech-bg-warning-subtle:     {c.background.warning.subtle};",
        f"  --btech-bg-info:               {c.background.info.default};",
        f"  --btech-bg-info-subtle:        {c.background.info.subtle};",
    ]

    # ── Color — stroke ───────────────────────────────────────────────────
    lines += [
        f"  --btech-stroke-default:        {c.stroke.neutral.default};",
        f"  --btech-stroke-subtle:         {c.stroke.neutral.subtle};",
        f"  --btech-stroke-primary:        {c.stroke.primary.default};",
        f"  --btech-stroke-danger:         {c.stroke.danger.default};",
    ]

    # ── Spacing ───────────────────────────────────────────────────────────
    lines += [
        f"  --btech-spacing-xs:            {sp.xs};",
        f"  --btech-spacing-sm:            {sp.sm};",
        f"  --btech-spacing-md:            {sp.md};",
        f"  --btech-spacing-lg:            {sp.lg};",
        f"  --btech-spacing-xl:            {sp.xl};",
    ]

    # ── Radius ────────────────────────────────────────────────────────────
    lines += [
        f"  --btech-radius-sm:             {r.sm};",
        f"  --btech-radius-md:             {r.md};",
        f"  --btech-radius-lg:             {r.lg};",
        f"  --btech-radius-full:           {r.full};",
    ]

    # ── Typography ───────────────────────────────────────────────────────
    lines += [
        f"  --btech-font-sans:             {t.family.sans};",
        f"  --btech-font-mono:             {t.family.mono};",
        f"  --btech-font-size-sm:          {t.size.sm};",
        f"  --btech-font-size-base:        {t.size.base};",
        f"  --btech-font-size-lg:          {t.size.lg};",
        f"  --btech-font-weight-regular:   {t.weight.regular};",
        f"  --btech-font-weight-medium:    {t.weight.medium};",
        f"  --btech-font-weight-semibold:  {t.weight.semibold};",
        f"  --btech-font-weight-bold:      {t.weight.bold};",
    ]

    return "  \n".join(lines)


def _build_element_overrides() -> str:
    """
    Map CSS variables to Streamlit's built-in element class names.
    Covers the most commonly customized elements.
    """
    c = BTechColor
    r = BTechRadius
    t = BTechTypography

    return textwrap.dedent(f"""
        /* ── Global app shell ─────────────────────────────────────── */
        .stApp {{
            background-color: var(--btech-bg-surface);
            color:            var(--btech-text-default);
            font-family:      var(--btech-font-sans);
        }}

        /* ── Sidebar ──────────────────────────────────────────────── */
        [data-testid="stSidebar"] {{
            background-color: var(--btech-bg-surface-subtle);
            border-right: 1px solid var(--btech-stroke-subtle);
        }}

        /* ── Primary button ───────────────────────────────────────── */
        .stButton > button[kind="primary"],
        .stButton > button {{
            background-color: var(--btech-bg-primary) !important;
            color:            var(--btech-text-on-primary) !important;
            border:           none !important;
            border-radius:    var(--btech-radius-md) !important;
            font-family:      var(--btech-font-sans) !important;
            font-weight:      var(--btech-font-weight-medium) !important;
            padding:          var(--btech-spacing-sm) var(--btech-spacing-md) !important;
            transition:       background-color 0.15s ease;
        }}
        .stButton > button:hover {{
            background-color: var(--btech-bg-primary-hover) !important;
        }}
        .stButton > button:disabled {{
            background-color: var(--btech-bg-primary-disabled) !important;
            color:            var(--btech-text-disabled) !important;
        }}

        /* ── Secondary / outline button ───────────────────────────── */
        .stButton > button[kind="secondary"] {{
            background-color: transparent !important;
            color:            var(--btech-bg-primary) !important;
            border:           1.5px solid var(--btech-stroke-primary) !important;
            border-radius:    var(--btech-radius-md) !important;
        }}
        .stButton > button[kind="secondary"]:hover {{
            background-color: var(--btech-bg-primary-subtle) !important;
        }}

        /* ── Text inputs ──────────────────────────────────────────── */
        .stTextInput > div > div > input,
        .stTextArea > div > div > textarea,
        .stNumberInput > div > div > input {{
            background-color: var(--btech-bg-surface-raised) !important;
            color:            var(--btech-text-default) !important;
            border:           1px solid var(--btech-stroke-default) !important;
            border-radius:    var(--btech-radius-md) !important;
            font-family:      var(--btech-font-sans) !important;
            font-size:        var(--btech-font-size-base) !important;
        }}
        .stTextInput > div > div > input:focus,
        .stTextArea > div > div > textarea:focus {{
            border-color: var(--btech-stroke-primary) !important;
            box-shadow:   0 0 0 2px var(--btech-bg-primary-subtle) !important;
        }}

        /* ── Select / multiselect ─────────────────────────────────── */
        .stSelectbox > div > div,
        .stMultiSelect > div > div {{
            background-color: var(--btech-bg-surface-raised) !important;
            border:           1px solid var(--btech-stroke-default) !important;
            border-radius:    var(--btech-radius-md) !important;
        }}

        /* ── Labels & headings ────────────────────────────────────── */
        .stTextInput label,
        .stTextArea label,
        .stSelectbox label,
        .stMultiSelect label,
        .stSlider label,
        .stCheckbox label,
        .stRadio label {{
            color:       var(--btech-text-default) !important;
            font-weight: var(--btech-font-weight-medium) !important;
            font-size:   var(--btech-font-size-sm) !important;
        }}

        h1, h2, h3, h4, h5, h6 {{
            font-family: var(--btech-font-sans) !important;
            font-weight: var(--btech-font-weight-bold) !important;
            color:       var(--btech-text-default) !important;
        }}

        /* ── Metric cards ─────────────────────────────────────────── */
        [data-testid="stMetric"] {{
            background-color: var(--btech-bg-surface-raised);
            border:           1px solid var(--btech-stroke-subtle);
            border-radius:    var(--btech-radius-lg);
            padding:          var(--btech-spacing-md);
        }}
        [data-testid="stMetricValue"] {{
            color:       var(--btech-text-default) !important;
            font-weight: var(--btech-font-weight-bold) !important;
        }}
        [data-testid="stMetricLabel"] {{
            color: var(--btech-text-subtle) !important;
        }}

        /* ── Info / warning / error / success boxes ───────────────── */
        .stAlert[data-baseweb="notification"][aria-label*="info"] {{
            background-color: var(--btech-bg-info-subtle) !important;
            border-left:      4px solid var(--btech-text-info) !important;
        }}
        .stAlert[data-baseweb="notification"][aria-label*="warning"] {{
            background-color: var(--btech-bg-warning-subtle) !important;
            border-left:      4px solid var(--btech-text-warning) !important;
        }}
        .stAlert[data-baseweb="notification"][aria-label*="error"] {{
            background-color: var(--btech-bg-danger-subtle) !important;
            border-left:      4px solid var(--btech-text-danger) !important;
        }}
        .stAlert[data-baseweb="notification"][aria-label*="success"] {{
            background-color: var(--btech-bg-success-subtle) !important;
            border-left:      4px solid var(--btech-text-success) !important;
        }}

        /* ── Divider ──────────────────────────────────────────────── */
        hr {{
            border-color: var(--btech-stroke-subtle) !important;
        }}

        /* ── Code blocks ──────────────────────────────────────────── */
        code, pre {{
            font-family: var(--btech-font-mono) !important;
            font-size:   var(--btech-font-size-sm) !important;
            background-color: var(--btech-bg-surface-subtle) !important;
            border-radius:    var(--btech-radius-sm) !important;
        }}

        /* ── Tabs ─────────────────────────────────────────────────── */
        .stTabs [data-baseweb="tab-list"] {{
            border-bottom: 2px solid var(--btech-stroke-subtle);
        }}
        .stTabs [data-baseweb="tab"][aria-selected="true"] {{
            color:         var(--btech-bg-primary) !important;
            border-bottom: 2px solid var(--btech-bg-primary) !important;
            font-weight:   var(--btech-font-weight-semibold) !important;
        }}

        /* ── Progress bar ─────────────────────────────────────────── */
        .stProgress > div > div > div > div {{
            background-color: var(--btech-bg-primary) !important;
        }}

        /* ── Spinner ──────────────────────────────────────────────── */
        .stSpinner > div {{
            border-top-color: var(--btech-bg-primary) !important;
        }}
    """)


def inject_theme(
    *,
    include_element_overrides: bool = True,
    extra_css: str = "",
) -> None:
    """
    Inject btech design tokens into the running Streamlit app as CSS variables
    and apply default element mappings.

    Must be called from within an active Streamlit script (i.e. inside
    ``app.py`` that Streamlit is executing). Raises ``RuntimeError`` otherwise.

    Parameters
    ----------
    include_element_overrides : bool
        When True (default), also applies the default CSS mappings from CSS
        variables to Streamlit elements (.stButton, .stTextInput, etc.).
        Set to False to only inject :root variables and write your own CSS.
    extra_css : str
        Additional raw CSS to append. Useful for one-off overrides without
        creating a separate stylesheet.

    Example
    -------
        import streamlit as st
        from btech_tokens.streamlit_adapter import inject_theme

        inject_theme()

        st.title("Hello btech 👋")
        st.button("Primary action")
    """
    st = _assert_streamlit_context()

    css_vars = _build_css_variables()
    element_css = _build_element_overrides() if include_element_overrides else ""

    full_css = f"""
<style>
:root {{
{css_vars}
}}
{element_css}
{extra_css}
</style>
"""
    st.markdown(full_css, unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# 2. Config Generator  →  .streamlit/config.toml [theme]
# ---------------------------------------------------------------------------

def get_streamlit_config() -> dict[str, str]:
    """
    Return a dict that mirrors the ``[theme]`` section of
    ``.streamlit/config.toml``.

    Streamlit reads config.toml at startup — this dict gives you the exact
    values to paste (or write programmatically) into that file.

    Deployment strategy
    -------------------
    Option A — Manual (recommended for most projects):
        1. Run ``python -c "from btech_tokens.streamlit_adapter import get_streamlit_config, write_streamlit_config; write_streamlit_config()"``
        2. Commit the generated ``.streamlit/config.toml`` to your repo.
        3. Streamlit Cloud / Docker picks it up automatically on startup.

    Option B — Programmatic (CI pipeline):
        Use ``write_streamlit_config()`` in a pre-startup script so the file
        is always in sync with the token package version.

    Returns
    -------
    dict[str, str]
        Keys match Streamlit's ``[theme]`` config options:
        primaryColor, backgroundColor, secondaryBackgroundColor,
        textColor, font.

    Example
    -------
        from btech_tokens.streamlit_adapter import get_streamlit_config

        config = get_streamlit_config()
        print(config)
        # {
        #   "primaryColor":             "#15803d",
        #   "backgroundColor":          "#f9fafb",
        #   "secondaryBackgroundColor": "#f3f4f6",
        #   "textColor":               "#111827",
        #   "font":                    "sans serif",
        # }
    """
    c = BTechColor
    t = BTechTypography

    # Streamlit only accepts "sans serif", "serif", or "monospace" for font.
    font_value = "sans serif"  # btech uses Inter (sans-serif)

    return {
        "primaryColor":             c.background.primary.default,
        "backgroundColor":          c.background.surface.default,
        "secondaryBackgroundColor": c.background.surface.subtle,
        "textColor":                c.text.neutral.default,
        "font":                     font_value,
    }


def write_streamlit_config(path: str = ".streamlit/config.toml") -> None:
    """
    Write the btech theme to ``.streamlit/config.toml``.

    Creates the ``.streamlit/`` directory if it does not exist.
    Merges with existing config — only the ``[theme]`` section is overwritten.

    Parameters
    ----------
    path : str
        Destination file path. Defaults to ``.streamlit/config.toml``.

    Example
    -------
        # In a CI pre-startup step or local setup script:
        from btech_tokens.streamlit_adapter import write_streamlit_config
        write_streamlit_config()
    """
    import os  # noqa: PLC0415

    try:
        import tomllib  # Python 3.11+
    except ImportError:
        try:
            import tomllib  # type: ignore[no-redef]
        except ImportError:
            tomllib = None  # type: ignore[assignment]

    config = get_streamlit_config()

    # Read existing config (if any) so we don't clobber other sections
    existing: dict = {}
    if os.path.exists(path) and tomllib:
        with open(path, "rb") as f:
            existing = tomllib.load(f)

    existing["theme"] = config

    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    # Write as TOML manually (avoids tomli-w dependency)
    lines = []
    for section, values in existing.items():
        lines.append(f"[{section}]")
        if isinstance(values, dict):
            for k, v in values.items():
                lines.append(f'{k} = "{v}"')
        lines.append("")

    with open(path, "w") as f:
        f.write("\n".join(lines))

    print(f"✅  btech theme written to {path}")


# ---------------------------------------------------------------------------
# 3. Component Wrappers
# ---------------------------------------------------------------------------

def get_chart_theme() -> dict[str, Any]:
    """
    Return a Plotly/Altair-compatible color theme dict built from btech tokens.

    Streamlit cannot style chart internals via CSS — pass this dict directly
    to your charting library.

    Plotly example
    --------------
        import plotly.graph_objects as go
        from btech_tokens.streamlit_adapter import get_chart_theme

        theme = get_chart_theme()
        fig = go.Figure(...)
        fig.update_layout(
            plot_bgcolor=theme["plot_bgcolor"],
            paper_bgcolor=theme["paper_bgcolor"],
            font={"color": theme["font_color"], "family": theme["font_family"]},
            colorway=theme["colorway"],
        )
        st.plotly_chart(fig, use_container_width=True)

    Altair example
    --------------
        import altair as alt
        from btech_tokens.streamlit_adapter import get_chart_theme

        theme = get_chart_theme()
        alt.themes.register("btech", lambda: {
            "config": {
                "background": theme["paper_bgcolor"],
                "axis": {"labelColor": theme["font_color"], "titleColor": theme["font_color"]},
                "mark": {"color": theme["colorway"][0]},
            }
        })
        alt.themes.enable("btech")
    """
    c = BTechColor
    t = BTechTypography

    return {
        # Backgrounds
        "plot_bgcolor":  c.background.surface.raised,
        "paper_bgcolor": c.background.surface.default,

        # Text
        "font_color":   c.text.neutral.default,
        "font_family":  t.family.sans,
        "font_size":    14,

        # Grid / axis lines
        "grid_color":   c.stroke.neutral.subtle,
        "axis_color":   c.stroke.neutral.default,

        # Ordered color palette  (primary → info → warning → danger → success → secondary)
        "colorway": [
            c.background.primary.default,     # green-700  (brand)
            c.text.info.base,                  # blue-600
            c.text.warning.base,               # orange-600
            c.text.danger.base,                # red-600
            c.text.success.base,               # green-600
            c.text.secondary.base,             # purple-600
        ],
    }


def themed_dataframe(
    df: Any,
    *,
    highlight_primary: bool = False,
) -> Any:
    """
    Apply btech token colors to a pandas DataFrame via Styler.

    Parameters
    ----------
    df : pandas.DataFrame
        The dataframe to style.
    highlight_primary : bool
        When True, highlights the first column with the primary brand color.

    Returns
    -------
    pandas.io.formats.style.Styler
        Pass the result directly to ``st.dataframe()`` or ``st.table()``.

    Example
    -------
        import pandas as pd
        import streamlit as st
        from btech_tokens.streamlit_adapter import inject_theme, themed_dataframe

        inject_theme()

        df = pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})
        st.dataframe(themed_dataframe(df, highlight_primary=True))
    """
    try:
        import pandas as pd  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError(
            "themed_dataframe() requires pandas. Install it with: pip install pandas"
        ) from exc

    if not isinstance(df, pd.DataFrame):
        raise TypeError(f"Expected a pandas DataFrame, got {type(df).__name__}")

    c = BTechColor
    t = BTechTypography

    styler = df.style.set_table_styles([
        # Header row
        {
            "selector": "thead tr th",
            "props": [
                ("background-color", c.background.surface.subtle),
                ("color",            c.text.neutral.default),
                ("font-family",      t.family.sans),
                ("font-weight",      str(t.weight.semibold)),
                ("font-size",        t.size.sm),
                ("border-bottom",    f"2px solid {c.stroke.neutral.default}"),
                ("padding",          "8px 12px"),
            ],
        },
        # Body rows — alternating
        {
            "selector": "tbody tr:nth-child(even) td",
            "props": [
                ("background-color", c.background.surface.subtle),
            ],
        },
        {
            "selector": "tbody tr:nth-child(odd) td",
            "props": [
                ("background-color", c.background.surface.raised),
            ],
        },
        # Body cells
        {
            "selector": "tbody tr td",
            "props": [
                ("color",       c.text.neutral.default),
                ("font-family", t.family.sans),
                ("font-size",   t.size.sm),
                ("padding",     "8px 12px"),
                ("border-bottom", f"1px solid {c.stroke.neutral.subtle}"),
            ],
        },
        # Hover
        {
            "selector": "tbody tr:hover td",
            "props": [
                ("background-color", c.background.primary.subtle),
            ],
        },
    ])

    if highlight_primary and len(df.columns) > 0:
        first_col = df.columns[0]
        styler = styler.set_properties(
            subset=[first_col],
            **{
                "color":       c.background.primary.default,
                "font-weight": str(t.weight.semibold),
            },
        )

    return styler
