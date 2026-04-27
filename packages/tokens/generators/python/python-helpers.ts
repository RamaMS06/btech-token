// Generate helpers.py — same content for base + every tenant. The runtime
// helpers read from each package's local `_data` module, so the same code
// emits tenant-specific values when imported from a tenant package.
//
// Public surface:
//   to_css(mode='light', selector=':root') -> str
//
// Designed for raw CSS injection into Streamlit / Gradio / NiceGUI / Reflex /
// Solara. CSS variable names follow `--btech-{group}-{name}` with snake_case
// → kebab-case conversion. They are NOT identical to the web package's
// variable names (which apply some category renames such as stroke → border);
// document this explicitly in the package README.

import { writeFileSync } from 'fs';
import { PY_HEADER } from './python-utils.js';

const HELPERS_PY_BODY = [
  'from __future__ import annotations',
  'from typing import Literal',
  '',
  'from . import _data',
  '',
  '',
  'def to_css(mode: Literal[\'light\', \'dark\'] = \'light\', selector: str = \':root\') -> str:',
  '    """Render tokens as a CSS custom property block.',
  '',
  '    Examples:',
  '        Streamlit:',
  '            st.markdown(f"<style>{to_css()}</style>", unsafe_allow_html=True)',
  '        NiceGUI:',
  '            ui.add_css(to_css())',
  '        Gradio:',
  '            gr.HTML(f"<style>{to_css()}</style>")',
  '',
  '    Variable names follow ``--btech-{group}-{name}`` with snake_case keys',
  '    converted to kebab-case (e.g. ``color.background.primary_hover`` becomes',
  '    ``--btech-color-background-primary-hover``). These names are intentionally',
  '    simpler than the @btech/tokens CSS variables (which apply category renames',
  '    such as stroke -> border); use ``BTechColor.background.primary`` etc. for',
  '    cross-platform value parity.',
  '    """',
  '    if mode not in (\'light\', \'dark\'):',
  '        raise ValueError(f"mode must be \'light\' or \'dark\', got {mode!r}")',
  '',
  '    color_map = _data.COLOR_LIGHT if mode == \'light\' else _data.COLOR_DARK',
  '    lines: list[str] = [f"{selector} {{"]',
  '',
  '    for group, items in color_map.items():',
  '        group_kebab = group.replace(\'_\', \'-\')',
  '        for name, value in items.items():',
  '            name_kebab = name.replace(\'_\', \'-\')',
  '            lines.append(f"  --btech-color-{group_kebab}-{name_kebab}: {value};")',
  '',
  '    for name, value in _data.SPACING.items():',
  '        lines.append(f"  --btech-spacing-{name.replace(\'_\', \'-\')}: {value}px;")',
  '',
  '    for name, value in _data.RADIUS.items():',
  '        lines.append(f"  --btech-radius-{name.replace(\'_\', \'-\')}: {value}px;")',
  '',
  '    for name, value in _data.STROKE.items():',
  '        lines.append(f"  --btech-stroke-{name.replace(\'_\', \'-\')}: {value}px;")',
  '',
  '    for name, value in _data.FONT_FAMILIES.items():',
  '        lines.append(f"  --btech-font-family-{name.replace(\'_\', \'-\')}: {value};")',
  '',
  '    for name, value in _data.FONT_SIZES.items():',
  '        lines.append(f"  --btech-font-size-{name.replace(\'_\', \'-\')}: {value}px;")',
  '',
  '    for name, value in _data.FONT_WEIGHTS.items():',
  '        lines.append(f"  --btech-font-weight-{name.replace(\'_\', \'-\')}: {value};")',
  '',
  '    for name, value in _data.LINE_HEIGHTS.items():',
  '        lines.append(f"  --btech-line-height-{name.replace(\'_\', \'-\')}: {value};")',
  '',
  '    lines.append(\'}\')',
  '    return \'\\n\'.join(lines)',
  '',
].join('\n');

export function generatePythonHelpers(outDir: string): void {
  writeFileSync(`${outDir}/helpers.py`, PY_HEADER + HELPERS_PY_BODY);
}
