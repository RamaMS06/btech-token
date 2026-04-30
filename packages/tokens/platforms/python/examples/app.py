"""
btech_tokens Streamlit demo
============================
Shows all three adapter entry points:
  1. inject_theme()         — CSS variables + element overrides
  2. get_streamlit_config() — config.toml theme dict
  3. themed_dataframe()     — styled pandas table
  4. get_chart_theme()      — Plotly chart theming

Run:
    pip install streamlit pandas plotly btech-tokens
    streamlit run examples/app.py
"""

import streamlit as st

# ── 1. Inject theme FIRST — before any other st.* call ─────────────────────
from btech_tokens.streamlit_adapter import (
    get_chart_theme,
    get_streamlit_config,
    inject_theme,
    themed_dataframe,
)

inject_theme()

# ── Page config ─────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="btech Design System",
    page_icon="🎨",
    layout="wide",
)

# ── Header ───────────────────────────────────────────────────────────────────
st.title("btech Design System — Token Preview")
st.caption("All colors, spacing, and typography come from `btech_tokens`.")

st.divider()

# ── Tabs ─────────────────────────────────────────────────────────────────────
tab_colors, tab_components, tab_data, tab_chart, tab_config = st.tabs([
    "🎨 Colors",
    "🧩 Components",
    "📊 DataFrame",
    "📈 Chart",
    "⚙️ config.toml",
])

# ── Tab 1: Color palette ─────────────────────────────────────────────────────
with tab_colors:
    from btech_tokens import BTechColor

    st.subheader("Semantic color tokens")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("**Backgrounds**")
        swatches = {
            "bg-surface":       BTechColor.background.surface.default,
            "bg-surface-subtle":BTechColor.background.surface.subtle,
            "bg-surface-raised":BTechColor.background.surface.raised,
            "bg-primary":       BTechColor.background.primary.default,
            "bg-primary-subtle":BTechColor.background.primary.subtle,
            "bg-danger":        BTechColor.background.danger.default,
            "bg-success":       BTechColor.background.success.default,
            "bg-warning":       BTechColor.background.warning.default,
            "bg-info":          BTechColor.background.info.default,
        }
        for name, value in swatches.items():
            st.markdown(
                f'<div style="display:flex;align-items:center;gap:10px;margin:4px 0">'
                f'<div style="width:32px;height:32px;border-radius:6px;'
                f'background:{value};border:1px solid #e5e7eb"></div>'
                f'<code style="font-size:12px">{name}</code>'
                f'<span style="color:#6b7280;font-size:12px">{value}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )

    with col2:
        st.markdown("**Text**")
        text_swatches = {
            "text-default":  BTechColor.text.neutral.default,
            "text-subtle":   BTechColor.text.neutral.subtle,
            "text-disabled": BTechColor.text.neutral.disabled,
            "text-inverse":  BTechColor.text.neutral.inverse,
            "text-danger":   BTechColor.text.danger.base,
            "text-success":  BTechColor.text.success.base,
            "text-warning":  BTechColor.text.warning.base,
            "text-info":     BTechColor.text.info.base,
        }
        for name, value in text_swatches.items():
            st.markdown(
                f'<div style="display:flex;align-items:center;gap:10px;margin:4px 0">'
                f'<div style="width:32px;height:32px;border-radius:6px;'
                f'background:{value};border:1px solid #e5e7eb"></div>'
                f'<code style="font-size:12px">{name}</code>'
                f'<span style="color:#6b7280;font-size:12px">{value}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )

    with col3:
        st.markdown("**Stroke**")
        stroke_swatches = {
            "stroke-default": BTechColor.stroke.neutral.default,
            "stroke-subtle":  BTechColor.stroke.neutral.subtle,
            "stroke-primary": BTechColor.stroke.primary.default,
            "stroke-danger":  BTechColor.stroke.danger.default,
        }
        for name, value in stroke_swatches.items():
            st.markdown(
                f'<div style="display:flex;align-items:center;gap:10px;margin:4px 0">'
                f'<div style="width:32px;height:32px;border-radius:6px;'
                f'background:{value};border:1px solid #e5e7eb"></div>'
                f'<code style="font-size:12px">{name}</code>'
                f'<span style="color:#6b7280;font-size:12px">{value}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )


# ── Tab 2: Components ────────────────────────────────────────────────────────
with tab_components:
    st.subheader("Themed Streamlit components")
    st.caption("All styles come from injected CSS variables — no hardcoded colors below.")

    col_a, col_b = st.columns(2)

    with col_a:
        st.markdown("**Buttons**")
        st.button("Primary button", key="btn_primary")
        st.button("Secondary button", key="btn_secondary", type="secondary")

        st.markdown("**Inputs**")
        st.text_input("Text input", placeholder="Enter something…")
        st.text_area("Text area", placeholder="Long form content…", height=80)
        st.number_input("Number input", value=42)
        st.selectbox("Select", ["Option A", "Option B", "Option C"])

    with col_b:
        st.markdown("**Feedback**")
        st.info("ℹ️  This is an **info** alert.")
        st.success("✅  Operation **succeeded**.")
        st.warning("⚠️  Check the **warning** below.")
        st.error("❌  Something went **wrong**.")

        st.markdown("**Metrics**")
        m1, m2, m3 = st.columns(3)
        m1.metric("Revenue", "Rp 2.4M", "+12%")
        m2.metric("Users", "8,420", "-3%")
        m3.metric("Sessions", "14k", "+7%")

        st.markdown("**Progress**")
        st.progress(0.68)
        st.slider("Slider", 0, 100, 42)


# ── Tab 3: DataFrame ─────────────────────────────────────────────────────────
with tab_data:
    st.subheader("Themed DataFrame")
    st.caption("Styled with `themed_dataframe()` — uses btech tokens via pandas Styler.")

    try:
        import pandas as pd

        df = pd.DataFrame({
            "Token":    ["bg-primary", "bg-surface", "text-default", "stroke-default", "radius-md"],
            "Category": ["Background", "Background", "Text",         "Stroke",         "Radius"],
            "Value":    [
                BTechColor.background.primary.default,
                BTechColor.background.surface.default,
                BTechColor.text.neutral.default,
                BTechColor.stroke.neutral.default,
                "8px",
            ],
            "Platform": ["Web", "Web/Flutter", "Web/Flutter", "Web", "Web/Flutter"],
        })

        st.dataframe(
            themed_dataframe(df, highlight_primary=True),
            use_container_width=True,
        )

    except ImportError:
        st.warning("Install pandas to see the themed DataFrame: `pip install pandas`")


# ── Tab 4: Chart ─────────────────────────────────────────────────────────────
with tab_chart:
    st.subheader("Themed Plotly chart")
    st.caption("Colors and fonts from `get_chart_theme()` — no hardcoded hex values.")

    try:
        import plotly.graph_objects as go

        theme = get_chart_theme()

        fig = go.Figure()
        fig.add_trace(go.Bar(
            name="Q1", x=["Jan", "Feb", "Mar"],
            y=[120, 180, 150],
            marker_color=theme["colorway"][0],
        ))
        fig.add_trace(go.Bar(
            name="Q2", x=["Jan", "Feb", "Mar"],
            y=[200, 160, 210],
            marker_color=theme["colorway"][1],
        ))
        fig.update_layout(
            plot_bgcolor=theme["plot_bgcolor"],
            paper_bgcolor=theme["paper_bgcolor"],
            font={"color": theme["font_color"], "family": theme["font_family"], "size": theme["font_size"]},
            xaxis={"gridcolor": theme["grid_color"], "linecolor": theme["axis_color"]},
            yaxis={"gridcolor": theme["grid_color"], "linecolor": theme["axis_color"]},
            legend={"bgcolor": theme["paper_bgcolor"]},
            barmode="group",
        )
        st.plotly_chart(fig, use_container_width=True)

    except ImportError:
        st.warning("Install plotly to see the themed chart: `pip install plotly`")


# ── Tab 5: config.toml ───────────────────────────────────────────────────────
with tab_config:
    st.subheader("Generated `.streamlit/config.toml`")
    st.caption(
        "Copy this into `.streamlit/config.toml` so Streamlit applies the "
        "btech theme before the first render (no flash-of-unstyled-content)."
    )

    config = get_streamlit_config()

    toml_str = "[theme]\n" + "\n".join(f'{k} = "{v}"' for k, v in config.items())
    st.code(toml_str, language="toml")

    st.markdown("**Or generate it automatically:**")
    st.code(
        "from btech_tokens.streamlit_adapter import write_streamlit_config\n"
        "write_streamlit_config()   # writes .streamlit/config.toml",
        language="python",
    )

    st.info(
        "**Deployment tip:** Run `write_streamlit_config()` in a `prerun.py` "
        "or Docker `ENTRYPOINT` script so the theme is always in sync with the "
        "installed `btech-tokens` package version — no manual copy-paste needed."
    )
