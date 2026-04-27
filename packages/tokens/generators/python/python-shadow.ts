// Generate shadow.py — exposes shadow tokens as list[dict] so consumers can
// format per UI lib (CSS string for Streamlit/Gradio/NiceGUI, matplotlib
// BboxPatch params, Pillow draw params, etc.).

import { writeFileSync } from 'fs';
import type { ShadowLayer } from '../token-loader.js';
import { toPascalCase } from '../utils.js';
import { pySafeName, pyStr, PY_HEADER } from './python-utils.js';

export function generatePythonShadow(
  outDir: string,
  shadow: Record<string, Record<string, ShadowLayer[]>>,
): void {
  const L: string[] = [PY_HEADER];
  L.push('from __future__ import annotations');
  L.push('from dataclasses import dataclass');
  L.push('from typing import TypedDict');
  L.push('');

  L.push('class ShadowLayer(TypedDict):');
  L.push("    \"\"\"One layer of a shadow definition.");
  L.push('');
  L.push('    Compose into a CSS box-shadow string with:');
  L.push("        ' '.join(...) per layer, ', '.join(layers).");
  L.push('    """');
  L.push('    color: str');
  L.push('    offset_x: float');
  L.push('    offset_y: float');
  L.push('    blur: float');
  L.push('    spread: float');
  L.push('    inset: bool');
  L.push('');

  // ── Per-group dataclasses ────────────────────────────────────────────────
  const groups = Object.keys(shadow).sort();
  for (const group of groups) {
    const className = `BTechShadow${toPascalCase(group)}`;
    const variants = Object.keys(shadow[group]).sort();
    L.push('@dataclass(frozen=True, slots=True)');
    L.push(`class ${className}:`);
    if (variants.length === 0) {
      L.push('    pass');
    } else {
      for (const variant of variants) {
        L.push(`    ${pySafeName(variant)}: list[ShadowLayer]`);
      }
    }
    L.push('');
  }

  // ── Per-group instance constants ─────────────────────────────────────────
  for (const group of groups) {
    const className = `BTechShadow${toPascalCase(group)}`;
    const variants = Object.keys(shadow[group]).sort();
    L.push(`_${group.toUpperCase()} = ${className}(`);
    for (const variant of variants) {
      const layers = shadow[group][variant];
      L.push(`    ${pySafeName(variant)}=[`);
      for (const layer of layers) {
        L.push('        {');
        L.push(`            'color': ${pyStr(layer.color)},`);
        L.push(`            'offset_x': ${layer.offsetX},`);
        L.push(`            'offset_y': ${layer.offsetY},`);
        L.push(`            'blur': ${layer.blur},`);
        L.push(`            'spread': ${layer.spread},`);
        L.push(`            'inset': ${layer.inset ? 'True' : 'False'},`);
        L.push('        },');
      }
      L.push('    ],');
    }
    L.push(')');
    L.push('');
  }

  // ── Root namespace ────────────────────────────────────────────────────────
  L.push('@dataclass(frozen=True, slots=True)');
  L.push('class _ShadowRoot:');
  for (const group of groups) {
    L.push(`    ${pySafeName(group)}: BTechShadow${toPascalCase(group)}`);
  }
  L.push('');

  L.push('BTechShadow = _ShadowRoot(');
  for (const group of groups) {
    L.push(`    ${pySafeName(group)}=_${group.toUpperCase()},`);
  }
  L.push(')');
  L.push('');

  writeFileSync(`${outDir}/shadow.py`, L.join('\n'));
}
