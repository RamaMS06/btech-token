// Generate color.py — frozen dataclass per semantic color group, plus light
// and dark constant instances and a mode-aware singleton accessor.
//
// Inputs:
//   lightColors: group → fieldName → hex   (from data.semanticColors / loadTokenData)
//   darkColors:  group → fieldName → hex   (extracted from buildDarkResolvedBaseMap)
//
// Both share the same group/field structure — buildColorTree() decides the
// shape; values just differ between modes.

import { writeFileSync } from 'fs';
import { toPascalCase } from '../utils.js';
import { pySafeName, pyStr, PY_HEADER } from './python-utils.js';

export interface ColorMaps {
  light: Record<string, Record<string, string>>;
  dark:  Record<string, Record<string, string>>;
}

export function generatePythonColor(outDir: string, colors: ColorMaps): void {
  const groups = Object.keys(colors.light).sort();

  const L: string[] = [PY_HEADER];
  L.push('from __future__ import annotations');
  L.push('from dataclasses import dataclass');
  L.push('from . import _data, _state');
  L.push('');

  // ── Per-group dataclasses ───────────────────────────────────────────────
  for (const group of groups) {
    const className = `BTechColor${toPascalCase(group)}`;
    const fields = Object.keys(colors.light[group]).sort();
    L.push('@dataclass(frozen=True, slots=True)');
    L.push(`class ${className}:`);
    if (fields.length === 0) {
      L.push('    pass');
    } else {
      for (const field of fields) {
        L.push(`    ${pySafeName(field)}: str`);
      }
    }
    L.push('');
  }

  // ── Light + Dark instance constants per group ───────────────────────────
  for (const group of groups) {
    const className = `BTechColor${toPascalCase(group)}`;
    const fields = Object.keys(colors.light[group]).sort();
    for (const mode of ['LIGHT', 'DARK'] as const) {
      const map = mode === 'LIGHT' ? colors.light : colors.dark;
      L.push(`_${mode}_${group.toUpperCase()} = ${className}(`);
      for (const field of fields) {
        const value = map[group]?.[field] ?? colors.light[group][field];
        L.push(`    ${pySafeName(field)}=${pyStr(value)},`);
      }
      L.push(')');
    }
    L.push('');
  }

  // ── Static color root (used by LIGHT / DARK namespace constants) ────────
  L.push('@dataclass(frozen=True, slots=True)');
  L.push('class _ColorRootStatic:');
  for (const group of groups) {
    L.push(`    ${pySafeName(group)}: BTechColor${toPascalCase(group)}`);
  }
  L.push('');

  for (const mode of ['LIGHT', 'DARK'] as const) {
    L.push(`${mode}_COLOR = _ColorRootStatic(`);
    for (const group of groups) {
      L.push(`    ${pySafeName(group)}=_${mode}_${group.toUpperCase()},`);
    }
    L.push(')');
  }
  L.push('');

  // ── Mode-aware accessor singleton ───────────────────────────────────────
  L.push('class _ColorAccessor:');
  L.push('    """Mode-aware singleton: reads `_state._mode` at attribute access time.');
  L.push('');
  L.push('    Use `BTechColor.background.primary` for ergonomic access that follows');
  L.push('    `set_mode()`. For deterministic / no-global-state access (tests, side-by-');
  L.push('    side previews, multi-user-deployed Streamlit), use the `LIGHT` / `DARK`');
  L.push('    namespace constants exported from the package root instead.');
  L.push('    """');
  L.push('    __slots__ = ()');
  L.push('');
  for (const group of groups) {
    const className = `BTechColor${toPascalCase(group)}`;
    const upper = group.toUpperCase();
    L.push('    @property');
    L.push(`    def ${pySafeName(group)}(self) -> ${className}:`);
    L.push(`        return _LIGHT_${upper} if _state._mode == 'light' else _DARK_${upper}`);
    L.push('');
  }
  L.push('BTechColor: _ColorAccessor = _ColorAccessor()');
  L.push('');

  writeFileSync(`${outDir}/color.py`, L.join('\n'));
}
