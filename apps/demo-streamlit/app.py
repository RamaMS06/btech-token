"""
BTech Design System — Streamlit Token Demo
Mirrors the React / Vue demo apps: same tabs, same token categories,
same visual previews.

Two token sources are available:
  1. btech_tokens package — generated from sources, dot-access API
  2. token_loader (fallback) — reads DTCG JSON directly, supports dark/tenant

Run:
    cd apps/demo-streamlit && .venv/bin/streamlit run app.py
"""
import sys, os
# Allow running from any working directory
sys.path.insert(0, os.path.dirname(__file__))

import streamlit as st
from token_loader import build_token_map, available_tenants
from components.token_showcase import token_showcase

try:
    import btech_tokens as _btech
    _BT_AVAILABLE = True
except ImportError:
    _BT_AVAILABLE = False

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="BTech Design System — Token Demo",
    page_icon="🎨",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Session state defaults ────────────────────────────────────────────────────
if "dark"   not in st.session_state: st.session_state.dark   = False
if "search" not in st.session_state: st.session_state.search = ""
if "tenant" not in st.session_state: st.session_state.tenant = "default"

dark   = st.session_state.dark
tenant = st.session_state.tenant

# ── Load tokens ───────────────────────────────────────────────────────────────
T = build_token_map(tenant=tenant, dark=dark)

def t(key: str, fallback: str = "") -> str:
    return T.get(key, fallback)


# ── Theme values (mapped to actual DTCG token paths) ─────────────────────────
BG_PAGE    = t("color.background.surface.subtle",  "#f8fafc")
BG_PRIMARY = t("color.background.surface.raised",  "#ffffff")
BG_SUBTLER = t("color.background.neutral.subtle",  "#f1f5f9")
TEXT_PRI   = t("color.text.neutral.default",       "#1e293b")
TEXT_SEC   = t("color.text.neutral.subtle",        "#64748b")
TEXT_TER   = t("color.text.neutral.disabled",      "#94a3b8")
BORDER     = t("color.stroke.neutral.default",     "#e2e8f0")
BRAND      = t("color.background.primary.default", "#4f46e5")
BRAND_BOLD = t("color.background.primary.bolder",  "#3730a3")
RADIUS_MD  = t("radius.md", "12px")
RADIUS_SM  = t("radius.sm", "8px")
SPACE_MD   = t("spacing.md", "16px")
SPACE_SM   = t("spacing.sm", "8px")
FONT_SANS  = t("typography.fontFamily.sans", "system-ui, sans-serif")


# ── Global CSS ────────────────────────────────────────────────────────────────
st.markdown(f"""
<style>
  /* Reset Streamlit chrome */
  #MainMenu, header, footer {{ visibility: hidden; }}
  .block-container {{ padding: 0 !important; max-width: 100% !important; }}
  section[data-testid="stSidebar"] {{ display: none; }}

  body, .stApp {{
    background: {BG_PAGE};
    font-family: {FONT_SANS};
    color: {TEXT_PRI};
  }}

  /* Outer wrapper */
  .ds-wrap {{
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 20px 80px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }}

  /* ── St.pills native widget styling tweak ── */
  [data-testid="stPillsGroup"] button {{
    border-radius: {RADIUS_SM} !important;
    font-family: {FONT_SANS} !important;
    font-size: 13px !important;
  }}

  /* ── Table ── */
  .token-table {{
    background: {BG_PRIMARY};
    border: 1px solid {BORDER};
    border-radius: {RADIUS_MD};
    overflow: hidden;
  }}
  .table-head {{
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: {BG_SUBTLER};
    border-bottom: 1px solid {BORDER};
    font-size: 11px;
    font-weight: 600;
    color: {TEXT_SEC};
    gap: 12px;
  }}
  .table-row {{
    display: flex;
    align-items: center;
    padding: 10px 16px;
    gap: 12px;
    border-bottom: 1px solid {BORDER};
    transition: background 0.1s;
  }}
  .table-row:last-child {{ border-bottom: none; }}
  .table-row.even {{ background: {t('color.background.surface.subtle','#f8fafc')}; }}
  .col-preview {{ width: 68px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }}
  .col-usage   {{ flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }}
  .col-value   {{ width: 180px; flex-shrink: 0; }}

  /* Preview widgets */
  .swatch  {{ width:52px; height:38px; border-radius:6px; border:0.5px solid {BORDER}; }}
  .sp-bar  {{ height:8px; background:{BRAND}; border-radius:2px; }}
  .st-line {{ width:44px; background:{BRAND}; border-radius:1px; }}
  .rd-box  {{ width:52px; height:38px; border:2px solid {BRAND}; }}
  .sh-box  {{ width:44px; height:34px; background:{BG_PRIMARY}; border-radius:6px; }}
  .aa-text {{ display:block; text-align:center; width:52px; line-height:1; }}

  /* Usage / value text */
  .usage-code {{
    font-family: monospace;
    font-size: 12px;
    color: {TEXT_PRI};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    background: none;
  }}
  .value-code {{
    font-family: monospace;
    font-size: 11px;
    color: {TEXT_SEC};
    background: none;
    word-break: break-all;
  }}

  /* Badge */
  .badge {{
    display: inline-block;
    padding: 2px 7px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    white-space: nowrap;
  }}

  /* ── Examples panel ── */
  .ex-wrap {{ display:flex; flex-direction:column; gap:16px; }}
  .ex-card {{
    background: {BG_PRIMARY};
    border: 1px solid {BORDER};
    border-radius: {RADIUS_MD};
    overflow: hidden;
  }}
  .ex-head {{
    padding: 10px 16px;
    border-bottom: 1px solid {BORDER};
    background: {t('color.background.surface.subtle','#f8fafc')};
    display: flex;
    align-items: center;
    gap: 8px;
  }}
  .ex-grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:16px; }}
  .ex-preview {{ padding:16px; display:flex; gap:16px; flex-wrap:wrap; }}
  pre.ex-code {{
    font-family: monospace;
    font-size: 12px;
    line-height: 1.8;
    background: #0f172a;
    color: #cbd5e1;
    padding: 18px 20px;
    margin: 0;
    overflow-x: auto;
    white-space: pre;
  }}
  .lang-badge {{
    font-size:11px; font-weight:700;
    padding:2px 8px; border-radius:9999px;
  }}
  .ex-desc {{ font-size:12px; color:{TEXT_SEC}; }}

  /* ── FAB ── */
  .fab {{
    position: fixed;
    bottom: 28px;
    right: 28px;
    width: 52px;
    height: 52px;
    border-radius: 9999px;
    border: none;
    background: {BRAND};
    color: white;
    font-size: 20px;
    cursor: pointer;
    box-shadow: {t('shadow.elevation.lg','0 10px 15px -3px rgba(0,0,0,0.1)')};
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
  }}
  .fab:hover {{ background: {BRAND_BOLD}; }}

  /* Hide Streamlit top padding */
  .stMainBlockContainer {{ padding-top: 0 !important; }}
  div[data-testid="stVerticalBlock"] > div {{ gap: 0 !important; }}
</style>
""", unsafe_allow_html=True)


# ── Token data table ───────────────────────────────────────────────────────────
TOKENS = [
    # ── Color: Surface / Background ──
    ("color", "color", "color.background.surface.raised",   "token('color.background.surface.raised')",   t("color.background.surface.raised"),   "Background"),
    ("color", "color", "color.background.surface.default",  "token('color.background.surface.default')",  t("color.background.surface.default"),  "Background"),
    ("color", "color", "color.background.surface.subtle",   "token('color.background.surface.subtle')",   t("color.background.surface.subtle"),   "Background"),
    ("color", "color", "color.background.neutral.default",  "token('color.background.neutral.default')",  t("color.background.neutral.default"),  "Background"),
    ("color", "color", "color.background.neutral.subtle",   "token('color.background.neutral.subtle')",   t("color.background.neutral.subtle"),   "Background"),
    ("color", "color", "color.background.neutral.bolder",   "token('color.background.neutral.bolder')",   t("color.background.neutral.bolder"),   "Background"),
    ("color", "color", "color.background.primary.subtle",   "token('color.background.primary.subtle')",   t("color.background.primary.subtle"),   "Background"),
    ("color", "color", "color.background.primary.default",  "token('color.background.primary.default')",  t("color.background.primary.default"),  "Background"),
    ("color", "color", "color.background.primary.bolder",   "token('color.background.primary.bolder')",   t("color.background.primary.bolder"),   "Background"),
    # ── Color: Text ──
    ("color", "color", "color.text.neutral.default",  "token('color.text.neutral.default')",  t("color.text.neutral.default"),  "Text"),
    ("color", "color", "color.text.neutral.subtle",   "token('color.text.neutral.subtle')",   t("color.text.neutral.subtle"),   "Text"),
    ("color", "color", "color.text.neutral.disabled", "token('color.text.neutral.disabled')", t("color.text.neutral.disabled"), "Text"),
    ("color", "color", "color.text.neutral.inverse",  "token('color.text.neutral.inverse')",  t("color.text.neutral.inverse"),  "Text"),
    ("color", "color", "color.text.danger.base",      "token('color.text.danger.base')",      t("color.text.danger.base"),      "Text"),
    ("color", "color", "color.text.success.base",     "token('color.text.success.base')",     t("color.text.success.base"),     "Text"),
    ("color", "color", "color.text.warning.base",     "token('color.text.warning.base')",     t("color.text.warning.base"),     "Text"),
    ("color", "color", "color.text.info.base",        "token('color.text.info.base')",        t("color.text.info.base"),        "Text"),
    # ── Color: Icon ──
    ("color", "color", "color.icon.neutral.default",  "token('color.icon.neutral.default')",  t("color.icon.neutral.default"),  "Icon"),
    ("color", "color", "color.icon.neutral.subtle",   "token('color.icon.neutral.subtle')",   t("color.icon.neutral.subtle"),   "Icon"),
    ("color", "color", "color.icon.neutral.inverse",  "token('color.icon.neutral.inverse')",  t("color.icon.neutral.inverse"),  "Icon"),
    ("color", "color", "color.icon.success.base",     "token('color.icon.success.base')",     t("color.icon.success.base"),     "Icon"),
    ("color", "color", "color.icon.danger.base",      "token('color.icon.danger.base')",      t("color.icon.danger.base"),      "Icon"),
    ("color", "color", "color.icon.warning.base",     "token('color.icon.warning.base')",     t("color.icon.warning.base"),     "Icon"),
    ("color", "color", "color.icon.info.base",        "token('color.icon.info.base')",        t("color.icon.info.base"),        "Icon"),
    # ── Color: Stroke / Border ──
    ("color", "color", "color.stroke.neutral.default",  "token('color.stroke.neutral.default')",  t("color.stroke.neutral.default"),  "Border"),
    ("color", "color", "color.stroke.neutral.strong",   "token('color.stroke.neutral.strong')",   t("color.stroke.neutral.strong"),   "Border"),
    ("color", "color", "color.stroke.neutral.subtle",   "token('color.stroke.neutral.subtle')",   t("color.stroke.neutral.subtle"),   "Border"),
    ("color", "color", "color.stroke.primary.default",  "token('color.stroke.primary.default')",  t("color.stroke.primary.default"),  "Border"),
    ("color", "color", "color.stroke.primary.bolder",   "token('color.stroke.primary.bolder')",   t("color.stroke.primary.bolder"),   "Border"),
    # ── Color: Brand (primary interactive) ──
    ("color", "color", "color.background.primary.subtle",   "token('color.background.primary.subtle')",   t("color.background.primary.subtle"),   "Brand"),
    ("color", "color", "color.background.primary.default",  "token('color.background.primary.default')",  t("color.background.primary.default"),  "Brand"),
    ("color", "color", "color.background.primary.hover",    "token('color.background.primary.hover')",    t("color.background.primary.hover"),    "Brand"),
    ("color", "color", "color.background.primary.bolder",   "token('color.background.primary.bolder')",   t("color.background.primary.bolder"),   "Brand"),
    ("color", "color", "color.background.secondary.subtle", "token('color.background.secondary.subtle')", t("color.background.secondary.subtle"), "Brand"),
    ("color", "color", "color.background.secondary.default","token('color.background.secondary.default')",t("color.background.secondary.default"),"Brand"),
    ("color", "color", "color.background.secondary.bolder", "token('color.background.secondary.bolder')", t("color.background.secondary.bolder"), "Brand"),
    # ── Color: Semantic states ──
    ("color", "color", "color.background.success.subtle",  "token('color.background.success.subtle')",  t("color.background.success.subtle"),  "Extended"),
    ("color", "color", "color.background.success.default", "token('color.background.success.default')", t("color.background.success.default"), "Extended"),
    ("color", "color", "color.background.success.bolder",  "token('color.background.success.bolder')",  t("color.background.success.bolder"),  "Extended"),
    ("color", "color", "color.background.info.subtle",     "token('color.background.info.subtle')",     t("color.background.info.subtle"),     "Extended"),
    ("color", "color", "color.background.info.default",    "token('color.background.info.default')",    t("color.background.info.default"),    "Extended"),
    ("color", "color", "color.background.info.bolder",     "token('color.background.info.bolder')",     t("color.background.info.bolder"),     "Extended"),
    ("color", "color", "color.background.warning.subtle",  "token('color.background.warning.subtle')",  t("color.background.warning.subtle"),  "Extended"),
    ("color", "color", "color.background.warning.default", "token('color.background.warning.default')", t("color.background.warning.default"), "Extended"),
    ("color", "color", "color.background.warning.bolder",  "token('color.background.warning.bolder')",  t("color.background.warning.bolder"),  "Extended"),
    ("color", "color", "color.background.danger.subtle",   "token('color.background.danger.subtle')",   t("color.background.danger.subtle"),   "Extended"),
    ("color", "color", "color.background.danger.default",  "token('color.background.danger.default')",  t("color.background.danger.default"),  "Extended"),
    ("color", "color", "color.background.danger.bolder",   "token('color.background.danger.bolder')",   t("color.background.danger.bolder"),   "Extended"),
    # ── Typography ──
    ("typography", "text", "display",    "token('typography.heading.display')", "40px / w700", "Heading",    40, 700),
    ("typography", "text", "h1",         "token('typography.heading.h1')",      "32px / w700", "Heading",    32, 700),
    ("typography", "text", "h2",         "token('typography.heading.h2')",      "28px / w700", "Heading",    28, 700),
    ("typography", "text", "h3",         "token('typography.heading.h3')",      "24px / w600", "Heading",    24, 600),
    ("typography", "text", "h4",         "token('typography.heading.h4')",      "20px / w600", "Heading",    20, 600),
    ("typography", "text", "h5",         "token('typography.subheading.h5')",   "18px / w600", "Subheading", 18, 600),
    ("typography", "text", "h6",         "token('typography.subheading.h6')",   "16px / w600", "Subheading", 16, 600),
    ("typography", "text", "h7",         "token('typography.subheading.h7')",   "14px / w600", "Subheading", 14, 600),
    ("typography", "text", "h8",         "token('typography.subheading.h8')",   "12px / w600", "Subheading", 12, 600),
    ("typography", "text", "large",      "token('typography.body.large')",      "16px / w400", "Body",       16, 400),
    ("typography", "text", "regular",    "token('typography.body.regular')",    "14px / w400", "Body",       14, 400),
    ("typography", "text", "small",      "token('typography.body.small')",      "12px / w400", "Body",       12, 400),
    ("typography", "text", "xtrasmall",  "token('typography.body.xtrasmall')",  "10px / w400", "Body",       10, 400),
    ("typography", "text", "micro",      "token('typography.body.micro')",      "8px / w400",  "Body",       8,  400),
    ("typography", "text", "largeB",     "token('typography.body.largeB')",     "16px / w700", "Body",       16, 700),
    ("typography", "text", "regularB",   "token('typography.body.regularB')",   "14px / w700", "Body",       14, 700),
    ("typography", "text", "smallB",     "token('typography.body.smallB')",     "12px / w700", "Body",       12, 700),
    ("typography", "text", "xtrasmallB", "token('typography.body.xtrasmallB')", "10px / w700", "Body",       10, 700),
    ("typography", "text", "microB",     "token('typography.body.microB')",     "8px / w700",  "Body",       8,  700),
    # ── Spacing ──
    ("spacing", "spacing", "spacing.2xs", "token('spacing.2xs')", t("spacing.2xs","2px"),  "Scale", 2),
    ("spacing", "spacing", "spacing.xs",  "token('spacing.xs')",  t("spacing.xs","4px"),   "Scale", 4),
    ("spacing", "spacing", "spacing.sm",  "token('spacing.sm')",  t("spacing.sm","8px"),   "Scale", 8),
    ("spacing", "spacing", "spacing.md",  "token('spacing.md')",  t("spacing.md","12px"),  "Scale", 12),
    ("spacing", "spacing", "spacing.lg",  "token('spacing.lg')",  t("spacing.lg","16px"),  "Scale", 16),
    ("spacing", "spacing", "spacing.xl",  "token('spacing.xl')",  t("spacing.xl","24px"),  "Scale", 24),
    ("spacing", "spacing", "spacing.2xl", "token('spacing.2xl')", t("spacing.2xl","32px"), "Scale", 32),
    ("spacing", "spacing", "spacing.3xl", "token('spacing.3xl')", t("spacing.3xl","48px"), "Scale", 48),
    # ── Stroke ──
    ("stroke", "stroke", "stroke.xs", "token('stroke.xs')", t("stroke.xs","1px"), "Scale", 1),
    ("stroke", "stroke", "stroke.sm", "token('stroke.sm')", t("stroke.sm","2px"), "Scale", 2),
    ("stroke", "stroke", "stroke.md", "token('stroke.md')", t("stroke.md","3px"), "Scale", 3),
    ("stroke", "stroke", "stroke.lg", "token('stroke.lg')", t("stroke.lg","4px"), "Scale", 4),
    ("stroke", "stroke", "stroke.xl", "token('stroke.xl')", t("stroke.xl","5px"), "Scale", 5),
    # ── Radius ──
    ("radius", "radius", "radius.2xs", "token('radius.2xs')", t("radius.2xs","2px"),    "Scale", 2),
    ("radius", "radius", "radius.xs",  "token('radius.xs')",  t("radius.xs","4px"),     "Scale", 4),
    ("radius", "radius", "radius.sm",  "token('radius.sm')",  t("radius.sm","8px"),     "Scale", 8),
    ("radius", "radius", "radius.md",  "token('radius.md')",  t("radius.md","12px"),    "Scale", 12),
    ("radius", "radius", "radius.lg",  "token('radius.lg')",  t("radius.lg","16px"),    "Scale", 16),
    ("radius", "radius", "radius.xl",  "token('radius.xl')",  t("radius.xl","24px"),    "Scale", 24),
    ("radius", "radius", "radius.2xl", "token('radius.2xl')", t("radius.2xl","32px"),   "Scale", 32),
    ("radius", "radius", "radius.rd",  "token('radius.rd')",  t("radius.rd","9999px"),  "Scale", 9999),
    # ── Shadow ──
    ("shadow", "shadow", "shadow.button.pressed", "token('shadow.button.pressed')", t("shadow.button.pressed"), "Button"),
    ("shadow", "shadow", "shadow.table.left",     "token('shadow.table.left')",     t("shadow.table.left"),     "Table"),
    ("shadow", "shadow", "shadow.table.right",    "token('shadow.table.right')",    t("shadow.table.right"),    "Table"),
    ("shadow", "shadow", "shadow.elevation.xs",   "token('shadow.elevation.xs')",   t("shadow.elevation.xs"),   "Elevation"),
    ("shadow", "shadow", "shadow.elevation.sm",   "token('shadow.elevation.sm')",   t("shadow.elevation.sm"),   "Elevation"),
    ("shadow", "shadow", "shadow.elevation.md",   "token('shadow.elevation.md')",   t("shadow.elevation.md"),   "Elevation"),
    ("shadow", "shadow", "shadow.elevation.lg",   "token('shadow.elevation.lg')",   t("shadow.elevation.lg"),   "Elevation"),
    ("shadow", "shadow", "shadow.elevation.xl",   "token('shadow.elevation.xl')",   t("shadow.elevation.xl"),   "Elevation"),
]


# ── Badge colors ───────────────────────────────────────────────────────────────
BADGE_MAP = {
    "Background": (t("color.background.info.subtle",     "#e0f2fe"), t("color.text.info.base",    "#0369a1")),
    "Text":       (t("color.background.success.subtle",  "#dcfce7"), t("color.text.success.base", "#15803d")),
    "Icon":       (t("color.background.success.subtle",  "#dcfce7"), t("color.text.success.base", "#15803d")),
    "Border":     (t("color.background.warning.subtle",  "#fef9c3"), t("color.text.warning.base", "#a16207")),
    "Brand":      (t("color.background.primary.subtle",  "#f0fdf4"), t("color.text.success.base", "#15803d")),
    "Extended":   (t("color.background.info.subtle",     "#eff6ff"), t("color.text.info.base",    "#0369a1")),
    "Heading":    (t("color.background.success.subtle",  "#dcfce7"), t("color.text.success.base", "#15803d")),
    "Subheading": (t("color.background.info.subtle",     "#e0f2fe"), t("color.text.info.base",    "#0369a1")),
    "Body":       (t("color.background.warning.subtle",  "#fef9c3"), t("color.text.warning.base", "#a16207")),
    "Scale":      (t("color.background.warning.subtle",  "#fef9c3"), t("color.text.warning.base", "#a16207")),
    "Button":     (t("color.background.danger.subtle",   "#fee2e2"), t("color.text.danger.base",  "#b91c1c")),
    "Table":      (t("color.background.danger.subtle",   "#fee2e2"), t("color.text.danger.base",  "#b91c1c")),
    "Elevation":  (t("color.background.danger.subtle",   "#fee2e2"), t("color.text.danger.base",  "#b91c1c")),
}


def badge_html(cat: str) -> str:
    bg, fg = BADGE_MAP.get(cat, (t("color.background.neutral.subtle","#f1f5f9"), TEXT_SEC))
    return f'<span class="badge" style="background:{bg};color:{fg}">{cat}</span>'


def preview_html(tab: str, kind: str, row: tuple) -> str:
    if kind == "color":
        color = row[4]
        return f'<div class="swatch" style="background:{color}"></div>'

    if kind == "text":
        fs, fw = row[6], row[7]
        fs_clamped = max(8, min(fs, 22))
        return (f'<span class="aa-text" style="font-size:{fs_clamped}px;'
                f'font-weight:{fw};color:{TEXT_PRI};font-family:{FONT_SANS}">Aa</span>')

    if kind == "spacing":
        px = min(row[6], 52)
        return f'<div style="width:52px;height:38px;display:flex;align-items:center;padding-left:2px"><div class="sp-bar" style="width:{px}px"></div></div>'

    if kind == "stroke":
        px = row[6]
        return f'<div style="width:52px;height:38px;display:flex;align-items:center;justify-content:center"><div class="st-line" style="width:44px;height:{px}px"></div></div>'

    if kind == "radius":
        r = min(row[6], 28)
        return f'<div class="rd-box" style="border-radius:{r}px"></div>'

    if kind == "shadow":
        shadow = row[4]
        return f'<div class="sh-box" style="box-shadow:{shadow}"></div>'

    return ""


def rows_html(filtered: list[tuple]) -> str:
    rows = []
    for i, row in enumerate(filtered):
        tab, kind, key, usage, value, cat = row[0], row[1], row[2], row[3], row[4], row[5]
        even_cls = "even" if i % 2 == 0 else ""
        preview  = preview_html(tab, kind, row)
        rows.append(f"""
        <div class="table-row {even_cls}">
          <div class="col-preview">{preview}</div>
          <div class="col-usage">
            <code class="usage-code">{usage}</code>
            {badge_html(cat)}
          </div>
          <div class="col-value"><code class="value-code">{value}</code></div>
        </div>""")
    return "".join(rows)


# ── Usage examples panel ───────────────────────────────────────────────────────
def examples_html() -> str:
    # Live preview card
    preview_card = f"""
    <div class="ex-card" style="margin-bottom:0">
      <div class="ex-head">
        <span class="ex-desc">Live preview — tokens resolved directly from sources/</span>
      </div>
      <div class="ex-preview">
        <div style="flex:1 1 260px;background:{BG_PRIMARY};border:1px solid {BORDER};
                    border-radius:{RADIUS_MD};padding:{SPACE_MD};
                    box-shadow:{t('shadow.elevation.md')};font-family:{FONT_SANS}">
          <p style="margin:0 0 8px;font-size:11px;color:{TEXT_TER};font-family:monospace">
            shadow.elevation.md · radius.md · spacing.md
          </p>
          <h3 style="margin:0 0 6px;font-size:16px;font-weight:600;color:{TEXT_PRI}">
            Styled with design tokens
          </h3>
          <p style="margin:0 0 16px;font-size:13px;color:{TEXT_SEC}">
            Resolved from JSON sources · dark mode via sidebar toggle
          </p>
          <div style="display:flex;gap:8px">
            <button style="padding:6px 14px;border:none;cursor:pointer;
                           background:{BRAND};color:white;border-radius:{RADIUS_SM};
                           font-size:13px;font-weight:600;font-family:{FONT_SANS}">Primary</button>
            <button style="padding:6px 14px;cursor:pointer;background:transparent;
                           color:{BRAND};border:1.5px solid {BRAND};border-radius:{RADIUS_SM};
                           font-size:13px;font-weight:600;font-family:{FONT_SANS}">Outline</button>
          </div>
        </div>
        <div style="flex:0 1 180px;background:{BG_SUBTLER};border:1px solid {BORDER};
                    border-radius:{RADIUS_MD};padding:{SPACE_MD};
                    display:flex;flex-direction:column;gap:8px">
          <p style="margin:0;font-size:11px;color:{TEXT_TER};font-family:monospace">
            color.background.* status states
          </p>
          {_status_badges()}
        </div>
      </div>
    </div>"""

    cm = lambda s: f'<span style="color:#94a3b8">{s}</span>'
    sc = lambda s: f'<span style="color:#86efac">{s}</span>'
    fn = lambda s: f'<span style="color:#7dd3fc">{s}</span>'
    kw = lambda s: f'<span style="color:#c084fc">{s}</span>'

    # Pre-resolve token values
    _bg    = t("color.background.surface.raised",  "#ffffff")
    _brand = t("color.background.primary.default", "#15803d")
    _sp    = t("spacing.md",                       "16px")
    _rad   = t("radius.md",                        "8px")

    # Live values from btech_tokens (or fallbacks)
    if _BT_AVAILABLE:
        _sp_int  = _btech.BTechSpacing.md
        _rad_int = _btech.BTechRadius.md
        _sp_lg   = _btech.BTechSpacing.lg
        _bg_val  = _btech.BTechColor.background.surface.raised
        _br_val  = _btech.BTechColor.background.primary.default
    else:
        _sp_int, _rad_int, _sp_lg = 16, 8, 24
        _bg_val, _br_val = "#ffffff", "#15803d"

    # ── Code block 1: btech_tokens package (dot-access) ─────────────────────
    bt_code = (
        cm("# pip install -e packages/tokens/platforms/python/") + "\n" +
        fn("from") + " btech_tokens " + fn("import") + " (\n" +
        "    token, BTechColor, BTechSpacing,\n" +
        "    BTechRadius, BTechShadow, BTechTypography\n" +
        ")\n\n" +
        cm("# ── Dot-access (type-safe, IDE autocomplete) ───────────────") + "\n" +
        "bg     = BTechColor.background.surface.raised   " + cm("# " + str(_bg_val))  + "\n" +
        "brand  = BTechColor.background.primary.default  " + cm("# " + str(_br_val))  + "\n" +
        "sp_md  = BTechSpacing.md                        " + cm("# " + str(_sp_int)  + " (int px)") + "\n" +
        "rad_md = BTechRadius.md                         " + cm("# " + str(_rad_int) + " (int px)") + "\n" +
        "shadow = BTechShadow.elevation.md               " + cm("# CSS box-shadow string") + "\n" +
        "font   = BTechTypography.family.sans            " + cm("# Inter, system-ui, ...") + "\n\n" +
        cm("# ── Path-based lookup ──────────────────────────────────────") + "\n" +
        "val = " + fn("token") + "(" + sc("'color.background.primary.default'") + ")  " + cm("# " + str(_br_val)) + "\n" +
        "sp  = " + fn("token") + "(" + sc("'spacing.md'") + ")                        " + cm("# " + str(_sp_int) + "px") + "\n"
    )

    # ── Code block 2: token_loader (dark + tenant support) ───────────────────
    loader_code = (
        cm("# No install needed — reads DTCG JSON sources directly") + "\n" +
        fn("from") + " token_loader " + fn("import") + " build_token_map\n\n" +
        "tokens = " + fn("build_token_map") + "(" + sc("tenant") + fn("=") + sc(repr(tenant)) +
        ", " + sc("dark") + fn("=") + sc("False") + ")\n\n" +
        cm("# Access resolved values") + "\n" +
        "bg    = tokens[" + sc("'color.background.surface.raised'")  + "]  " + cm("# " + str(_bg_val)) + "\n" +
        "brand = tokens[" + sc("'color.background.primary.default'") + "]  " + cm("# " + str(_br_val)) + "\n" +
        "sp_md = tokens[" + sc("'spacing.md'")                       + "]          " + cm("# " + str(_sp_int) + "px") + "\n\n" +
        cm("# ── Dark mode ──────────────────────────────────────────────") + "\n" +
        "dark  = " + fn("build_token_map") + "(" + sc("dark") + fn("=") + sc("True") + ")\n\n" +
        cm("# ── Tenant override ─────────────────────────────────────────") + "\n" +
        "bjb   = " + fn("build_token_map") + "(" + sc("tenant") + fn("=") + sc("'bjb'") + ")\n"
    )

    # ── Code block 3: Streamlit CSS injection ────────────────────────────────
    st_code = (
        fn("import") + " streamlit " + fn("as") + " st\n" +
        fn("from") + " btech_tokens " + fn("import") + " BTechColor, BTechSpacing, BTechRadius\n\n" +
        cm("# Inject CSS using live dot-access token values") + "\n" +
        "css = f\"\"\"\n" +
        "  &lt;style&gt;\n" +
        "    .card {{\n" +
        "      background:    {{BTechColor.background.surface.raised}};\n" +
        "      border-radius: {{BTechRadius.md}}px;\n" +
        "      padding:       {{BTechSpacing.lg}}px;\n" +
        "    }}\n" +
        "  &lt;/style&gt;\n" +
        "\"\"\"\n\n" +
        "st." + fn("markdown") + "(css, " + sc("unsafe_allow_html") + fn("=") + sc("True") + ")\n" +
        "st." + fn("markdown") + "(\n" +
        "  " + sc("'&lt;div class=\"card\"&gt;Themed!&lt;/div&gt;'") + ",\n" +
        "  " + sc("unsafe_allow_html") + fn("=") + sc("True") + "\n" +
        ")\n"
    )

    clr_info    = t('color.background.info.subtle','#e0f2fe')
    txt_info    = t('color.text.info.base','#0369a1')
    clr_success = t('color.background.success.subtle','#dcfce7')
    txt_success = t('color.text.success.base','#15803d')
    clr_warn    = t('color.background.warning.subtle','#fff7ed')
    txt_warn    = t('color.text.warning.base','#ea580c')

    return f"""
    <div class="ex-wrap">
      {preview_card}
      <div class="ex-grid" style="grid-template-columns:1fr 1fr 1fr">
        <div class="ex-card">
          <div class="ex-head">
            <span class="lang-badge" style="background:{clr_success};color:{txt_success}">btech_tokens</span>
            <span class="ex-desc">Generated package — dot-access + token()</span>
          </div>
          <pre class="ex-code"><code>{bt_code}</code></pre>
        </div>
        <div class="ex-card">
          <div class="ex-head">
            <span class="lang-badge" style="background:{clr_info};color:{txt_info}">token_loader</span>
            <span class="ex-desc">Direct JSON — dark mode &amp; tenant support</span>
          </div>
          <pre class="ex-code"><code>{loader_code}</code></pre>
        </div>
        <div class="ex-card">
          <div class="ex-head">
            <span class="lang-badge" style="background:{clr_warn};color:{txt_warn}">Streamlit</span>
            <span class="ex-desc">CSS injection with dot-access token values</span>
          </div>
          <pre class="ex-code"><code>{st_code}</code></pre>
        </div>
      </div>
    </div>"""


def _status_badges() -> str:
    pairs = [
        ("Success", t("color.background.success.subtle","#dcfce7"), t("color.text.success.base","#15803d")),
        ("Warning", t("color.background.warning.subtle","#fef9c3"), t("color.text.warning.base","#a16207")),
        ("Error",   t("color.background.danger.subtle", "#fee2e2"), t("color.text.danger.base", "#b91c1c")),
        ("Info",    t("color.background.info.subtle",   "#e0f2fe"), t("color.text.info.base",   "#0369a1")),
    ]
    return "".join(
        f'<span style="display:inline-block;padding:3px 10px;border-radius:9999px;'
        f'background:{bg};color:{fg};font-size:12px;font-weight:700">{lbl}</span>'
        for lbl, bg, fg in pairs
    )


# ── Render ────────────────────────────────────────────────────────────────────
tenants = available_tenants()

TABS = ["all", "color", "typography", "spacing", "stroke", "radius", "shadow", "examples"]
TAB_LABELS = {
    "all": "🔍 All", "color": "🎨 Color", "typography": "Aa Typography",
    "spacing": "↔ Spacing", "stroke": "〰 Stroke", "radius": "◜ Radius",
    "shadow": "🔳 Shadow", "examples": "⚡ Usage",
}

st.markdown('<div class="ds-wrap">', unsafe_allow_html=True)

# ── Header row: logo + package badge ─────────────────────────────────────────
_pkg_badge = (
    f'<span style="font-size:11px;padding:2px 10px;border-radius:20px;'
    f'background:{t("color.background.success.subtle","#dcfce7")};'
    f'color:{t("color.text.success.base","#15803d")};font-weight:600">'
    f'btech_tokens v{_btech.__version__} ✓</span>'
    if _BT_AVAILABLE else
    f'<span style="font-size:11px;padding:2px 10px;border-radius:20px;'
    f'background:{t("color.background.warning.subtle","#fff7ed")};'
    f'color:{t("color.text.warning.base","#ea580c")}">token_loader only</span>'
)
st.markdown(f"""
<div style="display:flex;align-items:center;justify-content:space-between;
            padding:12px 16px;background:{BG_PRIMARY};border:1px solid {BORDER};
            border-radius:{RADIUS_MD}">
  <div style="font-size:16px;font-weight:700;color:{TEXT_PRI}">
    🎨 BTech Design System
  </div>
  {_pkg_badge}
</div>
""", unsafe_allow_html=True)

# ── st.pills tab navigation ───────────────────────────────────────────────────
active_tab = st.pills(
    "Tabs",
    options=TABS,
    format_func=lambda x: TAB_LABELS[x],
    default="all",
    key="pills_tab",
    label_visibility="collapsed",
)
active_tab = active_tab or "all"

# ── Filter / search row ───────────────────────────────────────────────────────
filter_cols = st.columns([3, 2, 1])
with filter_cols[0]:
    search_val = st.text_input(
        "Search", value=st.session_state.search,
        placeholder="🔍 Search token name or value…",
        label_visibility="collapsed",
    )
with filter_cols[1]:
    tenant_choice = st.selectbox(
        "Tenant", tenants,
        index=tenants.index(tenant) if tenant in tenants else 0,
        label_visibility="collapsed",
    )
with filter_cols[2]:
    dark_toggle = st.toggle("🌙 Dark", value=dark)

# Persist search/tenant/dark changes
if (search_val    != st.session_state.search or
    tenant_choice != st.session_state.tenant or
    dark_toggle   != st.session_state.dark):
    st.session_state.search = search_val
    st.session_state.tenant = tenant_choice
    st.session_state.dark   = dark_toggle
    st.rerun()

# ── Filter tokens for table views ────────────────────────────────────────────
search = st.session_state.search.lower().strip()
filtered = []
for row in TOKENS:
    tab_key, kind, key, usage, value, cat = row[0], row[1], row[2], row[3], row[4], row[5]
    tab_ok = (active_tab == "all") or (tab_key == active_tab)
    q_ok   = not search or any(search in s.lower() for s in [key, usage, str(value), cat])
    if tab_ok and q_ok:
        filtered.append(row)

# ── Main content ──────────────────────────────────────────────────────────────
if active_tab == "examples":
    # ── Custom component: live token showcase ─────────────────────────────────
    st.markdown(
        f'<p style="font-size:12px;color:{TEXT_TER};margin-bottom:4px">'
        f'Custom Streamlit component rendering live token values via '
        f'<code>streamlit.components.v1.declare_component()</code></p>',
        unsafe_allow_html=True,
    )
    token_showcase(T, height=600, key="main_showcase")

    # ── Code examples ─────────────────────────────────────────────────────────
    st.markdown(
        f'<div style="margin-top:8px;font-size:13px;font-weight:600;color:{TEXT_PRI}">Code examples</div>',
        unsafe_allow_html=True,
    )
    st.markdown(examples_html(), unsafe_allow_html=True)

else:
    if not filtered:
        st.markdown(
            f'<div style="padding:40px;text-align:center;color:{TEXT_TER};'
            f'font-size:14px">No tokens found for <b>"{st.session_state.search}"</b></div>',
            unsafe_allow_html=True,
        )
    else:
        table_html = f"""
        <div class="token-table">
          <div class="table-head">
            <div style="width:68px;flex-shrink:0"></div>
            <div style="flex:1">Usage</div>
            <div style="width:180px;flex-shrink:0">Value</div>
          </div>
          {rows_html(filtered)}
        </div>"""
        st.markdown(table_html, unsafe_allow_html=True)

st.markdown('</div>', unsafe_allow_html=True)
