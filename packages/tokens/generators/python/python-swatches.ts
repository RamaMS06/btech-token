// Generate swatches.py — primitive brand color ramps (50..900) for Python.
//
// Mirrors:
//   * Flutter:  `MaterialColor btechColorBrandPrimary/Secondary` in
//               flutter/token/lib/src/color/swatches.color.dart
//   * Web:      `btechColorBrandPrimary` / `btechColorBrandSecondary` objects
//               in web/token/src/color/swatches.color.ts
//
// Tenant-overridable: bspace re-targets primary→rose / secondary→teal at the
// same shade keys, so the resolved hex values differ between base and tenant
// packages but the API surface stays identical.
//
// Shape — dict[str, str] keyed by string shade ("50", "100", ..., "900"):
//
//   from btech_tokens import BTechColorBrandPrimary
//   BTechColorBrandPrimary['500']     # → '#0061a4' (base) or '#e11d48' (bspace)
//
// String keys (not int) keep the Python output a faithful 1:1 mirror of the
// underlying JSON ramp keys, which DTCG defines as strings.

import { writeFileSync } from 'fs';
import { toPascalCase } from '../utils.js';
import { pyStr, PY_HEADER } from './python-utils.js';

export function generatePythonSwatches(
  outDir: string,
  brandSwatches: Record<string, Record<string, string>>,
): void {
  const L: string[] = [PY_HEADER];
  L.push('"""Brand primitive color ramps (tenant-overridable)."""');
  L.push('from __future__ import annotations');
  L.push('from . import _data');
  L.push('');

  const exported: string[] = [];
  for (const brandName of Object.keys(brandSwatches).sort()) {
    const constName = `BTechColorBrand${toPascalCase(brandName)}`;
    L.push(`${constName}: dict[str, str] = _data.BRAND_SWATCHES[${pyStr(brandName)}]`);
    exported.push(constName);
  }
  L.push('');
  L.push('__all__ = [');
  for (const name of exported) L.push(`    ${pyStr(name)},`);
  L.push(']');
  L.push('');

  writeFileSync(`${outDir}/swatches.py`, L.join('\n'));
}
