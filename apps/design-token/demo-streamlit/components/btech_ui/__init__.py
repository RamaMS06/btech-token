"""
components/btech_ui
===================
Reusable BTech Design System components for Streamlit.

All styling comes directly from btech_tokens — no hardcoded colors.

Available
---------
btech_button(label, variant, key)  → int  (click count via declare_component)
btech_badge(label, variant)        → None (inline display via st.html)
btech_alert(message, variant, title) → None
btech_card(title, body_html)       → None
btech_input(label, placeholder, variant, key) → str
"""
from __future__ import annotations
import os
import streamlit as st
import streamlit.components.v1 as components

# ── Interactive component (declare_component — returns value to Python) ────────
_FRONTEND = os.path.join(os.path.dirname(__file__), "frontend")
_interactive = components.declare_component("btech_ui_interactive", path=_FRONTEND)


def _get_token_dict() -> dict[str, str]:
    """Pull the current session's token map for passing to interactive components."""
    return st.session_state.get("_bt_tokens", {})


def btech_button(
    label: str,
    variant: str = "primary",
    *,
    disabled: bool = False,
    key: str | None = None,
) -> bool:
    """
    A styled BTech button. Returns True on the render cycle where it was clicked.

    Parameters
    ----------
    label   : str   — button text
    variant : str   — "primary" | "secondary" | "danger" | "ghost"
    disabled: bool  — whether the button is disabled
    key     : str   — stable key for Streamlit identity across reruns

    Usage
    -----
    if btech_button("Save", variant="primary", key="save"):
        st.success("Saved!")
    """
    click_count: int = _interactive(
        component="button",
        label=label,
        variant=variant,
        disabled=disabled,
        tokens=_get_token_dict(),
        key=key,
        default=0,
    )
    # Return True only on the exact rerun triggered by a new click
    prev_key = f"_bt_btn_prev_{key}"
    prev = st.session_state.get(prev_key, 0)
    clicked = isinstance(click_count, int) and click_count > prev
    if clicked:
        st.session_state[prev_key] = click_count
    return clicked


def btech_input(
    label: str,
    placeholder: str = "",
    variant: str = "default",
    *,
    key: str | None = None,
) -> str:
    """
    A styled BTech input field. Returns the current value as a string.

    variant : "default" | "error" | "success"
    """
    value: str = _interactive(
        component="input",
        label=label,
        placeholder=placeholder,
        variant=variant,
        tokens=_get_token_dict(),
        key=key,
        default="",
    )
    return value or ""


# ── Display-only helpers (st.html — no iframe overhead) ───────────────────────

def _load_tokens() -> tuple:
    """Return (BTechColor, BTechSpacing, BTechRadius) or None if not available."""
    try:
        from btech_tokens import BTechColor, BTechSpacing, BTechRadius  # noqa: PLC0415
        return BTechColor, BTechSpacing, BTechRadius
    except ImportError:
        return None, None, None


def btech_badge(label: str, variant: str = "success") -> None:
    """
    Inline badge pill.

    variant : "success" | "warning" | "danger" | "info" | "neutral"

    Usage
    -----
    btech_badge("Active",  "success")
    btech_badge("Pending", "warning")
    btech_badge("Failed",  "danger")
    """
    BTechColor, BTechSpacing, BTechRadius = _load_tokens()

    STYLES: dict[str, tuple[str, str]] = {
        "success": (
            getattr(getattr(getattr(BTechColor, "background", None), "success", None), "subtle", "#f0fdf4") if BTechColor else "#f0fdf4",
            getattr(getattr(BTechColor, "text", None), "success", type("x", (), {"base": "#16a34a"})()).base if BTechColor else "#16a34a",
        ),
        "warning": (
            getattr(getattr(getattr(BTechColor, "background", None), "warning", None), "subtle", "#fff7ed") if BTechColor else "#fff7ed",
            getattr(getattr(BTechColor, "text", None), "warning", type("x", (), {"base": "#ea580c"})()).base if BTechColor else "#ea580c",
        ),
        "danger": (
            getattr(getattr(getattr(BTechColor, "background", None), "danger", None), "subtle", "#fef2f2") if BTechColor else "#fef2f2",
            getattr(getattr(BTechColor, "text", None), "danger", type("x", (), {"base": "#dc2626"})()).base if BTechColor else "#dc2626",
        ),
        "info": (
            getattr(getattr(getattr(BTechColor, "background", None), "info", None), "subtle", "#eff6ff") if BTechColor else "#eff6ff",
            getattr(getattr(BTechColor, "text", None), "info", type("x", (), {"base": "#2563eb"})()).base if BTechColor else "#2563eb",
        ),
        "neutral": (
            getattr(getattr(getattr(BTechColor, "background", None), "neutral", None), "default", "#f3f4f6") if BTechColor else "#f3f4f6",
            getattr(getattr(BTechColor, "text", None), "neutral", type("x", (), {"subtle": "#6b7280"})()).subtle if BTechColor else "#6b7280",
        ),
    }

    bg, fg = STYLES.get(variant, STYLES["neutral"])
    rad = (str(BTechSpacing.xs) + "px") if BTechSpacing else "4px"

    st.html(
        f'<span style="'
        f'background:{bg};color:{fg};'
        f'padding:3px 12px;border-radius:9999px;'
        f'font-size:12px;font-weight:700;'
        f'display:inline-block;line-height:1.6;'
        f'font-family:Inter,system-ui,sans-serif'
        f'">{label}</span>'
    )


def btech_alert(
    message: str,
    variant: str = "info",
    title: str = "",
) -> None:
    """
    A styled alert / notification.

    variant : "success" | "warning" | "danger" | "info"

    Usage
    -----
    btech_alert("Payment received!", "success", title="Success")
    btech_alert("Session expires in 5 min", "warning")
    """
    BTechColor, BTechSpacing, _ = _load_tokens()

    ICONS = {"success": "✅", "warning": "⚠️", "danger": "❌", "info": "ℹ️"}
    STYLES: dict[str, tuple[str, str, str]] = {
        "success": (
            getattr(getattr(getattr(BTechColor, "background", None), "success", None), "subtle", "#f0fdf4") if BTechColor else "#f0fdf4",
            getattr(getattr(BTechColor, "text", None), "success", type("x", (), {"base": "#16a34a"})()).base if BTechColor else "#16a34a",
            getattr(getattr(getattr(BTechColor, "background", None), "success", None), "default", "#22c55e") if BTechColor else "#22c55e",
        ),
        "warning": (
            getattr(getattr(getattr(BTechColor, "background", None), "warning", None), "subtle", "#fff7ed") if BTechColor else "#fff7ed",
            getattr(getattr(BTechColor, "text", None), "warning", type("x", (), {"base": "#ea580c"})()).base if BTechColor else "#ea580c",
            getattr(getattr(getattr(BTechColor, "background", None), "warning", None), "default", "#fb923c") if BTechColor else "#fb923c",
        ),
        "danger": (
            getattr(getattr(getattr(BTechColor, "background", None), "danger", None), "subtle", "#fef2f2") if BTechColor else "#fef2f2",
            getattr(getattr(BTechColor, "text", None), "danger", type("x", (), {"base": "#dc2626"})()).base if BTechColor else "#dc2626",
            getattr(getattr(getattr(BTechColor, "background", None), "danger", None), "default", "#dc2626") if BTechColor else "#dc2626",
        ),
        "info": (
            getattr(getattr(getattr(BTechColor, "background", None), "info", None), "subtle", "#eff6ff") if BTechColor else "#eff6ff",
            getattr(getattr(BTechColor, "text", None), "info", type("x", (), {"base": "#2563eb"})()).base if BTechColor else "#2563eb",
            getattr(getattr(getattr(BTechColor, "background", None), "info", None), "default", "#2563eb") if BTechColor else "#2563eb",
        ),
    }

    bg, fg, border = STYLES.get(variant, STYLES["info"])
    icon  = ICONS.get(variant, "ℹ️")
    sp    = (str(BTechSpacing.sm) + "px") if BTechSpacing else "8px"
    title_html = f'<strong style="display:block;margin-bottom:2px">{title}</strong>' if title else ""

    st.html(
        f'<div style="'
        f'background:{bg};color:{fg};'
        f'border-left:4px solid {border};'
        f'border-radius:6px;'
        f'padding:{sp} 14px;'
        f'display:flex;gap:10px;align-items:flex-start;'
        f'font-size:13px;font-family:Inter,system-ui,sans-serif;'
        f'line-height:1.5;margin:2px 0'
        f'">'
        f'<span style="flex-shrink:0;font-size:16px">{icon}</span>'
        f'<div style="color:#111827">{title_html}{message}</div>'
        f'</div>'
    )


def btech_card(title: str, body_html: str, *, padding: int | None = None) -> None:
    """
    A styled card container. body_html is rendered inside the card.

    Usage
    -----
    btech_card("User profile", "<p>Name: Rama</p><p>Role: Admin</p>")
    """
    BTechColor, BTechSpacing, BTechRadius = _load_tokens()

    bg  = getattr(getattr(getattr(BTechColor, "background", None), "surface", None), "raised", "#ffffff") if BTechColor else "#ffffff"
    bdr = getattr(getattr(getattr(BTechColor, "stroke", None), "neutral", None), "default", "#e5e7eb") if BTechColor else "#e5e7eb"
    rad = (str(getattr(BTechRadius, "md", 8)) + "px") if BTechRadius else "8px"
    sp  = padding if padding is not None else (getattr(BTechSpacing, "lg", 24) if BTechSpacing else 24)
    hdr = getattr(getattr(getattr(BTechColor, "background", None), "neutral", None), "subtle", "#f9fafb") if BTechColor else "#f9fafb"
    txt = getattr(getattr(getattr(BTechColor, "text", None), "neutral", None), "default", "#111827") if BTechColor else "#111827"
    sub = getattr(getattr(getattr(BTechColor, "text", None), "neutral", None), "subtle", "#6b7280") if BTechColor else "#6b7280"

    st.html(
        f'<div style="background:{bg};border:1px solid {bdr};border-radius:{rad};'
        f'overflow:hidden;font-family:Inter,system-ui,sans-serif;margin:2px 0">'
        f'<div style="padding:10px {sp}px;background:{hdr};border-bottom:1px solid {bdr}">'
        f'<span style="font-size:13px;font-weight:600;color:{txt}">{title}</span>'
        f'</div>'
        f'<div style="padding:{sp}px;font-size:13px;color:{sub};line-height:1.6">{body_html}</div>'
        f'</div>'
    )
