// Python token generator.
//
// Writes a complete `btech_tokens` Python package layout into outDir:
//   _data.py        — pure dicts (COLOR_LIGHT/DARK, SPACING, RADIUS, STROKE, FONT_*)
//   color.py        — frozen dataclasses + LIGHT_COLOR / DARK_COLOR + BTechColor
//   spacing.py      — BTechSpacing frozen-dataclass instance
//   radius.py       — BTechRadius frozen-dataclass instance
//   stroke.py       — BTechStroke frozen-dataclass instance
//   typography.py   — BTechFontFamily / BTechFontSize / BTechFontWeight /
//                     BTechLineHeight / BTechFont
//   shadow.py       — BTechShadow namespace + ShadowLayer TypedDict
//   helpers.py      — to_css(mode, selector)
//   __init__.py     — public API surface, set_mode, LIGHT/DARK namespace constants
//   _state.py       — single mutable mode flag
//   py.typed        — PEP 561 marker
//
// Used for both the base package and each tenant package — the only difference
// between calls is the pre-resolved color maps passed in.

import { mkdirSync, writeFileSync } from 'fs';
import { ROOT } from '../utils.js';
import type { ResolvedTokenMap } from '../token-loader.js';
import {
  buildColorTree,
  buildDarkResolvedBaseMap,
} from '../flutter/flutter-theme-generator.js';
import { generatePythonColor } from './python-color.js';
import { generatePythonShadow } from './python-shadow.js';
import { generatePythonHelpers } from './python-helpers.js';
import {
  pySafeName,
  pyStr,
  pxToPyFloat,
  PY_HEADER,
} from './python-utils.js';

/** Convert a record with hyphenated keys to one with snake_case keys. */
export function snakeKeyed<T>(obj: Record<string, T>): Record<string, T> {
  const out: Record<string, T> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[pySafeName(k)] = v;
  }
  return out;
}

/** Build a nested {group: {fieldSnake: hex}} dark map from the flat dark map. */
function buildDarkColorMap(
  darkMap: Record<string, string>,
  lightColors: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  const tree = buildColorTree();
  const out: Record<string, Record<string, string>> = {};
  for (const [group, fields] of Object.entries(tree)) {
    out[group] = {};
    for (const field of fields) {
      const dotPath = `color.${group}.${field}`;
      const value = darkMap[dotPath] ?? lightColors[group]?.[pySafeName(field)] ?? '#000000';
      out[group][pySafeName(field)] = value;
    }
  }
  return out;
}

/** Write a Python dict literal of {snakeKey: stringValue} entries. */
function emitStrDict(L: string[], name: string, entries: Record<string, string>): void {
  L.push(`${name}: dict[str, str] = {`);
  for (const [k, v] of Object.entries(entries)) {
    L.push(`    ${pyStr(k)}: ${pyStr(v)},`);
  }
  L.push('}');
  L.push('');
}

/** Write a Python dict literal of {snakeKey: floatValue} entries (px-stripped). */
function emitFloatDict(L: string[], name: string, entries: Record<string, string>): void {
  L.push(`${name}: dict[str, float] = {`);
  for (const [k, v] of Object.entries(entries)) {
    L.push(`    ${pyStr(k)}: ${pxToPyFloat(v)},`);
  }
  L.push('}');
  L.push('');
}

/** Write a Python dict literal of {snakeKey: intValue} entries. */
function emitIntDict(L: string[], name: string, entries: Record<string, string>): void {
  L.push(`${name}: dict[str, int] = {`);
  for (const [k, v] of Object.entries(entries)) {
    L.push(`    ${pyStr(k)}: ${parseInt(String(v), 10)},`);
  }
  L.push('}');
  L.push('');
}

/** Write a nested {group: {field: hex}} color dict literal. */
function emitColorDict(
  L: string[],
  name: string,
  colors: Record<string, Record<string, string>>,
): void {
  L.push(`${name}: dict[str, dict[str, str]] = {`);
  for (const [group, fields] of Object.entries(colors)) {
    L.push(`    ${pyStr(group)}: {`);
    for (const [field, hex] of Object.entries(fields)) {
      L.push(`        ${pyStr(field)}: ${pyStr(hex)},`);
    }
    L.push('    },');
  }
  L.push('}');
  L.push('');
}

/** _data.py — pure dicts only. */
function generateData(
  outDir: string,
  data: ResolvedTokenMap,
  lightColors: Record<string, Record<string, string>>,
  darkColors:  Record<string, Record<string, string>>,
): void {
  const L: string[] = [PY_HEADER];
  L.push('"""Pure data dicts. No logic. Imported by color.py / spacing.py / etc."""');
  L.push('from __future__ import annotations');
  L.push('');

  emitColorDict(L, 'COLOR_LIGHT', lightColors);
  emitColorDict(L, 'COLOR_DARK',  darkColors);

  emitFloatDict(L, 'SPACING', snakeKeyed(data.spacing));
  emitFloatDict(L, 'RADIUS',  snakeKeyed(data.radius));
  emitFloatDict(L, 'STROKE',  snakeKeyed(data.stroke));

  emitStrDict(L,   'FONT_FAMILIES', snakeKeyed(data.typography.fontFamilies));
  emitFloatDict(L, 'FONT_SIZES',    snakeKeyed(data.typography.fontSizes));
  emitIntDict(L,   'FONT_WEIGHTS',  snakeKeyed(data.typography.fontWeights));
  emitFloatDict(L, 'LINE_HEIGHTS',  snakeKeyed(data.typography.lineHeights));

  writeFileSync(`${outDir}/_data.py`, L.join('\n'));
}

/** spacing.py / radius.py / stroke.py — same shape (frozen dataclass of floats).
 *
 *  Generates a private dataclass `_PublicNameClass` and exposes a public
 *  instance with the same name to keep the consumer-facing API identical.
 */
function generateScalarCategory(
  outDir: string,
  fileName: string,
  publicName: string,
  dataKey: string,
  entries: Record<string, string>,
): void {
  const fields = Object.keys(snakeKeyed(entries));
  const L: string[] = [PY_HEADER];
  L.push('from __future__ import annotations');
  L.push('from dataclasses import dataclass');
  L.push('from . import _data');
  L.push('');
  L.push('@dataclass(frozen=True, slots=True)');
  L.push(`class _${publicName}Class:`);
  if (fields.length === 0) {
    L.push('    pass');
  } else {
    for (const f of fields) {
      L.push(`    ${f}: float`);
    }
  }
  L.push('');
  L.push(`${publicName}: _${publicName}Class = _${publicName}Class(**_data.${dataKey})`);
  L.push('');
  writeFileSync(`${outDir}/${fileName}`, L.join('\n'));
}

/** typography.py — BTechFontFamily / Size / Weight / LineHeight + BTechFont root. */
function generateTypography(outDir: string, data: ResolvedTokenMap): void {
  const families    = snakeKeyed(data.typography.fontFamilies);
  const sizes       = snakeKeyed(data.typography.fontSizes);
  const weights     = snakeKeyed(data.typography.fontWeights);
  const lineHeights = snakeKeyed(data.typography.lineHeights);

  const L: string[] = [PY_HEADER];
  L.push('from __future__ import annotations');
  L.push('from dataclasses import dataclass');
  L.push('from . import _data');
  L.push('');

  // ── Per-attribute dataclasses ────────────────────────────────────────────
  L.push('@dataclass(frozen=True, slots=True)');
  L.push('class _BTechFontFamilyClass:');
  if (Object.keys(families).length === 0) L.push('    pass');
  for (const k of Object.keys(families)) L.push(`    ${k}: str`);
  L.push('');

  L.push('@dataclass(frozen=True, slots=True)');
  L.push('class _BTechFontSizeClass:');
  if (Object.keys(sizes).length === 0) L.push('    pass');
  for (const k of Object.keys(sizes)) L.push(`    ${k}: float`);
  L.push('');

  L.push('@dataclass(frozen=True, slots=True)');
  L.push('class _BTechFontWeightClass:');
  if (Object.keys(weights).length === 0) L.push('    pass');
  for (const k of Object.keys(weights)) L.push(`    ${k}: int`);
  L.push('');

  L.push('@dataclass(frozen=True, slots=True)');
  L.push('class _BTechLineHeightClass:');
  if (Object.keys(lineHeights).length === 0) L.push('    pass');
  for (const k of Object.keys(lineHeights)) L.push(`    ${k}: float`);
  L.push('');

  // ── Public instances ─────────────────────────────────────────────────────
  L.push('BTechFontFamily: _BTechFontFamilyClass = _BTechFontFamilyClass(**_data.FONT_FAMILIES)');
  L.push('BTechFontSize: _BTechFontSizeClass = _BTechFontSizeClass(**_data.FONT_SIZES)');
  L.push('BTechFontWeight: _BTechFontWeightClass = _BTechFontWeightClass(**_data.FONT_WEIGHTS)');
  L.push('BTechLineHeight: _BTechLineHeightClass = _BTechLineHeightClass(**_data.LINE_HEIGHTS)');
  L.push('');

  // ── Root namespace ───────────────────────────────────────────────────────
  L.push('@dataclass(frozen=True, slots=True)');
  L.push('class _BTechFontClass:');
  L.push('    family: _BTechFontFamilyClass');
  L.push('    size: _BTechFontSizeClass');
  L.push('    weight: _BTechFontWeightClass');
  L.push('    line_height: _BTechLineHeightClass');
  L.push('');
  L.push('BTechFont: _BTechFontClass = _BTechFontClass(');
  L.push('    family=BTechFontFamily,');
  L.push('    size=BTechFontSize,');
  L.push('    weight=BTechFontWeight,');
  L.push('    line_height=BTechLineHeight,');
  L.push(')');
  L.push('');

  writeFileSync(`${outDir}/typography.py`, L.join('\n'));
}

/** _state.py — single-line mode flag. */
function generateState(outDir: string): void {
  const body = [
    'from typing import Literal',
    '',
    '# Mutated by btech_tokens.set_mode(). Read by color.py accessor properties.',
    "_mode: Literal['light', 'dark'] = 'light'",
    '',
  ].join('\n');
  writeFileSync(`${outDir}/_state.py`, PY_HEADER + body);
}

/** __init__.py — public API surface. */
function generateInit(outDir: string): void {
  const body = [
    '"""BTech design tokens for Python UI consumers (Streamlit, Gradio, NiceGUI, ...).',
    '',
    'Public surface:',
    '  * ``BTechColor``, ``BTechSpacing``, ``BTechRadius``, ``BTechStroke``,',
    '    ``BTechFont``, ``BTechShadow`` — token values.',
    "  * ``set_mode('light' | 'dark')`` — toggle ``BTechColor``’s mode-aware accessors.",
    '    Module-level state; safe for single-process UI apps and notebooks.',
    '  * ``LIGHT``, ``DARK`` — namespace constants for deterministic side-by-side',
    '    use (tests, settings preview, multi-user-deployed Streamlit dashboards).',
    '  * ``to_css(mode, selector)`` — CSS custom property block for raw injection.',
    '"""',
    'from __future__ import annotations',
    'from dataclasses import dataclass',
    'from typing import Literal',
    '',
    'from . import _state',
    'from .color import (',
    '    BTechColor,',
    '    LIGHT_COLOR,',
    '    DARK_COLOR,',
    '    _ColorRootStatic,',
    ')',
    'from .spacing import BTechSpacing',
    'from .radius import BTechRadius',
    'from .stroke import BTechStroke',
    'from .typography import (',
    '    BTechFont,',
    '    BTechFontFamily,',
    '    BTechFontSize,',
    '    BTechFontWeight,',
    '    BTechLineHeight,',
    ')',
    'from .shadow import BTechShadow',
    'from .helpers import to_css',
    '',
    '',
    '__all__ = [',
    "    'BTechColor',",
    "    'BTechSpacing',",
    "    'BTechRadius',",
    "    'BTechStroke',",
    "    'BTechFont',",
    "    'BTechFontFamily',",
    "    'BTechFontSize',",
    "    'BTechFontWeight',",
    "    'BTechLineHeight',",
    "    'BTechShadow',",
    "    'LIGHT',",
    "    'DARK',",
    "    'set_mode',",
    "    'to_css',",
    ']',
    '',
    '',
    "def set_mode(mode: Literal['light', 'dark']) -> None:",
    '    """Set the active mode for ``BTechColor`` accessors.',
    '',
    '    Module-level state. Fine for single-process UI apps (notebooks, local',
    '    Streamlit, desktop tools). For multi-user-deployed dashboards where each',
    '    user may want a different mode, use the ``LIGHT`` / ``DARK`` namespace',
    "    constants instead — they don’t read shared state.",
    '    """',
    "    if mode not in ('light', 'dark'):",
    '        raise ValueError(f"mode must be \'light\' or \'dark\', got {mode!r}")',
    '    _state._mode = mode',
    '',
    '',
    '@dataclass(frozen=True, slots=True)',
    'class _Namespace:',
    '    color: _ColorRootStatic',
    '',
    '',
    'LIGHT: _Namespace = _Namespace(color=LIGHT_COLOR)',
    'DARK: _Namespace = _Namespace(color=DARK_COLOR)',
    '',
  ].join('\n');
  writeFileSync(`${outDir}/__init__.py`, PY_HEADER + body);
}

/** Build the default light colors nested map from a `data: ResolvedTokenMap`.
 *  Used by the base generator; tenants override values before calling.
 */
export function buildLightColors(
  data: ResolvedTokenMap,
): Record<string, Record<string, string>> {
  const lightColors: Record<string, Record<string, string>> = {};
  for (const [group, fields] of Object.entries(data.semanticColors)) {
    lightColors[group] = snakeKeyed(fields);
  }
  return lightColors;
}

/** Build the default dark colors nested map from sources. Used by base. */
export function buildDarkColors(
  lightColors: Record<string, Record<string, string>>,
): Record<string, Record<string, string>> {
  return buildDarkColorMap(buildDarkResolvedBaseMap(), lightColors);
}

/** Main entry — generates all package files into one Python package directory.
 *
 *  Accepts pre-built `lightColors` and `darkColors` so tenants can pass
 *  override-merged maps without re-deriving from sources.
 */
export function generatePythonPackageContents(
  outDir: string,
  data: ResolvedTokenMap,
  lightColors: Record<string, Record<string, string>>,
  darkColors:  Record<string, Record<string, string>>,
): void {
  mkdirSync(outDir, { recursive: true });

  generateData(outDir, data, lightColors, darkColors);
  generatePythonColor(outDir, { light: lightColors, dark: darkColors });
  generateScalarCategory(outDir, 'spacing.py', 'BTechSpacing', 'SPACING', data.spacing);
  generateScalarCategory(outDir, 'radius.py',  'BTechRadius',  'RADIUS',  data.radius);
  generateScalarCategory(outDir, 'stroke.py',  'BTechStroke',  'STROKE',  data.stroke);
  generateTypography(outDir, data);
  generatePythonShadow(outDir, data.shadow);
  generatePythonHelpers(outDir);
  generateState(outDir);
  generateInit(outDir);

  writeFileSync(`${outDir}/py.typed`, '');
}

/** Convenience for the BASE package run from sd.config.ts. */
export function generatePythonFiles(data: ResolvedTokenMap): void {
  const outDir = `${ROOT}/platforms/python/token/btech_tokens`;
  const lightColors = buildLightColors(data);
  const darkColors  = buildDarkColors(lightColors);
  generatePythonPackageContents(outDir, data, lightColors, darkColors);
}
