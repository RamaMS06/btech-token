"""
BTech Design System — Streamlit Token Demo
Mirrors the React / Vue demo apps: same tabs, same token categories,
same visual previews. Reads token sources directly — no published
package needed.

Run:
    streamlit run apps/demo-streamlit/app.py
"""
import streamlit as st
from token_loader import build_token_map, available_tenants

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="BTech Design System — Token Demo",
    page_icon="🎨",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ── Session state defaults ────────────────────────────────────────────────────
if "dark"   not in st.session_state: st.session_state.dark   = False
if "tab"    not in st.session_state: st.session_state.tab    = "all"
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

  /* ── Topbar ── */
  .topbar {{
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    background: {BG_PRIMARY};
    border: 1px solid {BORDER};
    border-radius: {RADIUS_MD};
    padding: 10px 16px;
  }}
  .tabs {{ display: flex; gap: 4px; flex-wrap: wrap; }}
  .tab-btn {{
    padding: 5px 14px;
    border-radius: {RADIUS_SM};
    border: 1.5px solid transparent;
    background: transparent;
    color: {TEXT_SEC};
    font-size: 13px;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.15s;
    font-family: {FONT_SANS};
    text-decoration: none;
  }}
  .tab-btn:hover {{ background: {BG_SUBTLER}; color: {TEXT_PRI}; }}
  .tab-btn.active {{
    background: {t('color.background.success.subtle','#dcfce7')};
    color: {t('color.text.success.base','#15803d')};
    border-color: {t('color.background.primary.subtle','#f0fdf4')};
    font-weight: 600;
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
        fs, fw = row[7], row[8]
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
    st_color = lambda s: f'<span style="color:#86efac">{s}</span>'
    fn = lambda s: f'<span style="color:#7dd3fc">{s}</span>'

    # Pre-resolve values outside f-strings to avoid nested quote escaping issues
    _bg    = t("color.background.surface.raised",  "#ffffff")
    _brand = t("color.background.primary.default", "#15803d")
    _sp    = t("spacing.md",               "12px")
    _rad   = t("radius.md",                "12px")

    py_code = (
        cm("# Install (once btech-tokens is published to PyPI)") + "\n" +
        cm("# pip install btech-tokens") + "\n\n" +
        cm("# ── Until then: read directly from sources ──────────────────") + "\n" +
        fn("from") + " token_loader " + fn("import") + " build_token_map\n\n" +
        "tokens = " + fn("build_token_map") + "(" + st_color("tenant") + fn("=") + st_color(repr(tenant)) +
        ", " + st_color("dark") + fn("=") + st_color("False") + ")\n\n" +
        cm("# Access resolved values") + "\n" +
        "bg       = tokens[" + st_color("'color.background.surface.raised'")  + "]  " + cm("# " + _bg)    + "\n" +
        "brand    = tokens[" + st_color("'color.background.primary.default'") + "]  " + cm("# " + _brand) + "\n" +
        "sp_md    = tokens[" + st_color("'spacing.md'")              + "]         " + cm("# " + _sp) + "\n" +
        "radius   = tokens[" + st_color("'radius.md'")               + "]          " + cm("# " + _rad) + "\n" +
        "shadow   = tokens[" + st_color("'shadow.elevation.md'")     + "]  " + cm("# CSS box-shadow string") + "\n\n" +
        cm("# Dark mode — just pass dark=True") + "\n" +
        "dark_tokens = " + fn("build_token_map") + "(" + st_color("dark") + fn("=") + st_color("True") + ")\n\n" +
        cm("# Tenant variant") + "\n" +
        "bspace = " + fn("build_token_map") + "(" + st_color("tenant") + fn("=") + st_color("'bspace'") + ")\n"
    )

    streamlit_code = (
        f"{fn('import')} streamlit {fn('as')} st\n"
        f"{fn('from')} token_loader {fn('import')} build_token_map\n\n"
        f"T = {fn('build_token_map')}({st_color('tenant')}{fn('=')}{st_color(repr(tenant))})\n\n"
        f"{cm('# Inject CSS variables for consistent theming')}\n"
        f"st.{fn('markdown')}(f\"\"\"\n"
        f"  &lt;style&gt;\n"
        f"    .my-card {{\n"
        f"      background: {{T[{st_color(repr('color.background.surface.raised'))}]}};\n"
        f"      border-radius: {{T[{st_color(repr('radius.md'))}]}};\n"
        f"      padding: {{T[{st_color(repr('spacing.md'))}]}};\n"
        f"      box-shadow: {{T[{st_color(repr('shadow.elevation.md'))}]}};\n"
        f"    }}\n"
        f"  &lt;/style&gt;\n"
        f"\"\"\", {st_color('unsafe_allow_html')}{fn('=')}{st_color('True')})\n\n"
        f"{cm('# Render a themed component')}\n"
        f"st.{fn('markdown')}(\n"
        f"  f'&lt;div class=\"my-card\"&gt;Themed content&lt;/div&gt;',\n"
        f"  {st_color('unsafe_allow_html')}{fn('=')}{st_color('True')}\n"
        f")\n"
    )

    return f"""
    <div class="ex-wrap">
      {preview_card}
      <div class="ex-grid">
        <div class="ex-card">
          <div class="ex-head">
            <span class="lang-badge" style="background:{t('color.background.info.subtle','#e0f2fe')};
                  color:{t('color.text.info.base','#0369a1')}">Python</span>
            <span class="ex-desc">token_loader — direct JSON access, no package install</span>
          </div>
          <pre class="ex-code"><code>{py_code}</code></pre>
        </div>
        <div class="ex-card">
          <div class="ex-head">
            <span class="lang-badge" style="background:{t('color.background.success.subtle','#dcfce7')};
                  color:{t('color.text.success.base','#15803d')}">Streamlit</span>
            <span class="ex-desc">Inject token values as CSS in your components</span>
          </div>
          <pre class="ex-code"><code>{streamlit_code}</code></pre>
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
tenants  = available_tenants()
TABS     = ["all", "color", "typography", "spacing", "stroke", "radius", "shadow", "examples"]
TAB_LABELS = {"all":"All","color":"Color","typography":"Typography",
               "spacing":"Spacing","stroke":"Stroke","radius":"Radius",
               "shadow":"Shadow","examples":"Usage"}

active_tab = st.session_state.tab

# Filter tokens
search = st.session_state.search.lower().strip()
filtered = []
for row in TOKENS:
    tab_key, kind, key, usage, value, cat = row[0], row[1], row[2], row[3], row[4], row[5]
    tab_ok = (active_tab == "all") or (tab_key == active_tab)
    q_ok   = not search or any(search in s.lower() for s in [key, usage, str(value), cat])
    if tab_ok and q_ok:
        filtered.append(row)

# ── Tab buttons HTML ──
tab_btns = "".join(
    f'<span class="tab-btn{"  active" if active_tab == tid else ""}">{TAB_LABELS[tid]}</span>'
    for tid in TABS
)

st.markdown(f'<div class="ds-wrap">', unsafe_allow_html=True)

# Topbar (static display only — interaction via st widgets below)
st.markdown(f"""
<div class="topbar">
  <div class="tabs">{tab_btns}</div>
</div>
""", unsafe_allow_html=True)

# ── Controls row (Streamlit native — for interactivity) ───────────────────────
ctrl_cols = st.columns([6, 2, 1.2, 1.2])
with ctrl_cols[0]:
    tab_choice = st.selectbox(
        "Tab", TABS, index=TABS.index(active_tab),
        format_func=lambda x: TAB_LABELS[x], label_visibility="collapsed"
    )
with ctrl_cols[1]:
    search_val = st.text_input("Search", value=st.session_state.search,
                               placeholder="🔍 Search token…", label_visibility="collapsed")
with ctrl_cols[2]:
    tenant_choice = st.selectbox("Tenant", tenants,
                                 index=tenants.index(tenant) if tenant in tenants else 0,
                                 label_visibility="collapsed")
with ctrl_cols[3]:
    dark_toggle = st.toggle("🌙 Dark", value=dark)

# Apply changes and rerun if needed
if (tab_choice    != st.session_state.tab    or
    search_val    != st.session_state.search or
    tenant_choice != st.session_state.tenant or
    dark_toggle   != st.session_state.dark):
    st.session_state.tab    = tab_choice
    st.session_state.search = search_val
    st.session_state.tenant = tenant_choice
    st.session_state.dark   = dark_toggle
    st.rerun()

# ── Main content ──────────────────────────────────────────────────────────────
if active_tab == "examples":
    st.markdown(examples_html(), unsafe_allow_html=True)
else:
    if not filtered:
        st.markdown(
            f'<div style="padding:40px;text-align:center;color:{TEXT_TER};'
            f'font-size:14px">No tokens found</div>',
            unsafe_allow_html=True
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
