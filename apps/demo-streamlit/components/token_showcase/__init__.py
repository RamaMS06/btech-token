"""
token_showcase — Custom Streamlit component
Renders a live BTech Design System UI mockup using resolved token values.
"""
from __future__ import annotations
import os
import streamlit.components.v1 as components

_FRONTEND = os.path.join(os.path.dirname(__file__), "frontend")
_func = components.declare_component("token_showcase", path=_FRONTEND)


def token_showcase(
    tokens: dict[str, str],
    *,
    height: int = 580,
    key: str | None = None,
) -> None:
    """
    Render a live BTech Design System showcase card.

    Parameters
    ----------
    tokens : dict[str, str]
        Flat resolved token map (from build_token_map or btech_tokens.TOKENS).
    height : int
        Fixed iframe height in pixels.
    key : str | None
        Streamlit widget key for stable identity across reruns.
    """
    _func(tokens=tokens, height=height, key=key, default=None)
