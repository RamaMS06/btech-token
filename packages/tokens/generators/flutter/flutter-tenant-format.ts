// AUTO-GENERATED helpers for per-tenant Flutter token packages.
//
// This file generates, for each tenant in `sources/tenants/{id}/`:
//   packages/tokens/platforms/flutter/tenants/{id}/
//     ├── pubspec.yaml
//     └── lib/
//         └── btech_tokens_{id_underscored}.dart
//
// The generated Dart file exposes:
//   - const BTechColorTheme  btechColor         (light, public — Pattern B)
//   - const BTechColorTheme  _btechColorDark    (dark, private — used by btechTheme)
//   - const BTechRadiusTheme btechRadius
//   - const BTechFontTheme   btechFont
//   - ThemeData btechTheme({brightness, base})  — one-liner delegating to buildBtechTheme
//
// Field structure is entirely auto-derived from the source JSON — no hardcoded
// TENANT_FIELD_MAP. Unknown/missing variants fall back to the subcategory's
// default color.

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { ROOT, flattenDTCG, resolveRef, hexToArgb } from '../utils.js';
import {
  buildColorTree,
  buildRadiusFields,
  buildFontSans,
  type ColorTree,
} from './flutter-theme-generator.js';

// =============================================================================
// Constants — kept in sync with flutter-theme-generator.ts
// =============================================================================

const CATEGORIES = ['background', 'text', 'icon', 'stroke'] as const;
const VARIANT_FIELDS = [
  'hover', 'pressed', 'subtle', 'raised',
  'disable', 'bolder', 'inverse', 'strong', 'disabled',
] as const;

// =============================================================================
// Helpers
// =============================================================================

/** `tenant-bjb` → `tenant_bjb`, `default` → `default`. */
function toDartPackageName(tenantId: string): string {
  return tenantId.replace(/-/g, '_');
}

/** `'8px'` → `'8.0'`, `'9999px'` → `'9999.0'`. */
function pxToDouble(value: string): string {
  const n = parseFloat(String(value).replace('px', ''));
  if (Number.isNaN(n)) return '0.0';
  return Number.isInteger(n) ? `${n}.0` : String(n);
}

/** Given a resolved hex like `#3B82F6` return `0xFF3B82F6`; pass through `0x...` literals. */
function argbFromHex(hex: string | undefined, fallback: string): string {
  if (!hex) return fallback;
  if (hex.startsWith('0x')) return hex;
  if (hex.startsWith('#')) return hexToArgb(hex);
  return fallback;
}

/** `background` → `Background`. */
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// =============================================================================
// Tenant map construction
// =============================================================================

/** Load an optional overrides file, merge into base map (refs resolved against base). */
function buildTenantMap(
  tenantId: string,
  overrideFile: string,
  resolvedBaseMap: Record<string, string>,
): Record<string, string> {
  const overridesPath = `${ROOT}/sources/tenants/${tenantId}/${overrideFile}`;
  if (!existsSync(overridesPath)) return { ...resolvedBaseMap };

  const rawOverrides = flattenDTCG(
    JSON.parse(readFileSync(overridesPath, 'utf-8')) as Record<string, unknown>,
  );

  const resolvedOverrides: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawOverrides)) {
    resolvedOverrides[k] = resolveRef(v, resolvedBaseMap);
  }

  return { ...resolvedBaseMap, ...resolvedOverrides };
}

// =============================================================================
// Color theme literal emitter
// =============================================================================

/**
 * Emits the nested BTechColorTheme(...) const expression for a given resolved map.
 * Indented so it sits nicely under `const BTechColorTheme xxx = ` (3-space inner indent).
 */
function emitColorThemeLiteral(
  tree: ColorTree,
  resolvedMap: Record<string, string>,
): string {
  const L: string[] = [];
  L.push('BTechColorTheme(');
  for (const category of CATEGORIES) {
    const className = `BTechColor${cap(category)}`;
    L.push(`  ${category}: ${className}(`);
    for (const sub of tree[category]) {
      const basePath = `color.${category}.${sub.name}.${sub.defaultKey}`;
      const baseArgb = argbFromHex(resolvedMap[basePath], '0xFF000000');
      L.push(`    ${sub.name}: BTechColorVariants(${baseArgb},`);
      for (const field of VARIANT_FIELDS) {
        let argb = baseArgb;
        if (sub.variants.includes(field)) {
          argb = argbFromHex(resolvedMap[`color.${category}.${sub.name}.${field}`], baseArgb);
        }
        L.push(`      ${field}: Color(${argb}),`);
      }
      L.push('    ),');
    }
    L.push('  ),');
  }
  L.push(')');
  return L.join('\n');
}

// =============================================================================
// Dart file emitter
// =============================================================================

function emitTenantDart(
  tenantId: string,
  tree: ColorTree,
  lightMap: Record<string, string>,
  darkMap: Record<string, string>,
): string {
  const pkgName = toDartPackageName(tenantId);

  const radiusFields = buildRadiusFields(lightMap);
  const fontSans = buildFontSans(lightMap);

  const L: string[] = [];
  L.push('// AUTO-GENERATED by @btech/design-system — do not edit manually.');
  L.push(`// Source: packages/tokens/sources/tenants/${tenantId}/overrides.json`);
  L.push('// Run `pnpm generate` to regenerate.');
  L.push('// ignore_for_file: lines_longer_than_80_chars');
  L.push('');
  L.push(`library btech_tokens_${pkgName};`);
  L.push('');
  L.push("import 'package:flutter/material.dart';");
  L.push("import 'package:btech_tokens/btech_tokens.dart';");
  L.push('');
  // Hide names the tenant redefines — prevents ambiguous_export for consumers.
  L.push("export 'package:btech_tokens/btech_tokens.dart' hide btechColor, btechRadius, btechFont, btechTheme;");
  L.push('');

  // ── Light theme (public — Pattern B) ────────────────────────────────────
  L.push('// ── Light (public — Pattern B) ────────────────────────────────────────────');
  L.push('');
  L.push(`/// Light-mode BTech color tokens for the ${tenantId} tenant.`);
  L.push(`const BTechColorTheme btechColor = ${emitColorThemeLiteral(tree, lightMap)};`);
  L.push('');

  // ── Dark theme (private) ────────────────────────────────────────────────
  L.push('// ── Dark (private — used only by btechTheme(), not exported) ─────────────');
  L.push('// Falls back to light values when no dark overrides exist.');
  L.push('');
  L.push(`const BTechColorTheme _btechColorDark = ${emitColorThemeLiteral(tree, darkMap)};`);
  L.push('');

  // ── Radius ──────────────────────────────────────────────────────────────
  L.push('// ── Radius (mode-agnostic) ────────────────────────────────────────────────');
  L.push('');
  L.push('const BTechRadiusTheme btechRadius = BTechRadiusTheme(');
  for (const f of radiusFields) {
    L.push(`  ${f.name}: ${pxToDouble(f.value)},`);
  }
  L.push(');');
  L.push('');

  // ── Font ────────────────────────────────────────────────────────────────
  L.push('// ── Font (mode-agnostic) ──────────────────────────────────────────────────');
  L.push('');
  L.push('const BTechFontTheme btechFont = BTechFontTheme(');
  L.push(`  family: BTechFontFamily(sans: '${fontSans.replace(/'/g, "\\'")}'),`);
  L.push(');');
  L.push('');

  // ── Theme builder ───────────────────────────────────────────────────────
  L.push('// ── Theme builder — one line, logic lives in base ─────────────────────────');
  L.push('');
  L.push('/// Apply BTech tokens to [MaterialApp].');
  L.push('///');
  L.push('/// ```dart');
  L.push('/// MaterialApp(');
  L.push('///   theme:     btechTheme(),');
  L.push('///   darkTheme: btechTheme(brightness: Brightness.dark),');
  L.push('///   themeMode: ThemeMode.system,');
  L.push('/// )');
  L.push('/// ```');
  L.push('ThemeData btechTheme({Brightness brightness = Brightness.light, ThemeData? base}) =>');
  L.push('    buildBtechTheme(btechColor, _btechColorDark, btechRadius, btechFont,');
  L.push('                    brightness: brightness, base: base);');
  L.push('');

  return L.join('\n');
}

// =============================================================================
// pubspec.yaml emitter
// =============================================================================

function emitPubspec(tenantId: string): string {
  const pkgName = toDartPackageName(tenantId);
  return [
    `name: btech_tokens_${pkgName}`,
    `description: BTech design tokens for ${tenantId} tenant — generated by pnpm generate`,
    'version: 1.0.0',
    '',
    'environment:',
    "  sdk: '>=3.0.0 <4.0.0'",
    "  flutter: '>=3.10.0'",
    '',
    'dependencies:',
    '  flutter:',
    '    sdk: flutter',
    '  btech_tokens:',
    '    path: ../../',
    '',
  ].join('\n');
}

// =============================================================================
// Main entry
// =============================================================================

/**
 * Generate a Flutter token package for every tenant found in `sources/tenants/`.
 *
 * Output layout per tenant:
 *   packages/tokens/platforms/flutter/tenants/{id}/
 *     ├── pubspec.yaml
 *     └── lib/btech_tokens_{id_underscored}.dart
 */
export function generateFlutterTenantPackages(resolvedBaseMap: Record<string, string>): void {
  const tenantsSrcDir = `${ROOT}/sources/tenants`;
  const tenantsOutDir = `${ROOT}/platforms/flutter/tenants`;

  if (!existsSync(tenantsSrcDir)) {
    console.warn(`[flutter-tenant-format] No tenants directory at ${tenantsSrcDir}`);
    return;
  }

  const tenantIds = readdirSync(tenantsSrcDir).filter((d) =>
    existsSync(`${tenantsSrcDir}/${d}/overrides.json`),
  );

  const tree = buildColorTree();

  for (const tenantId of tenantIds) {
    const lightMap = buildTenantMap(tenantId, 'overrides.json', resolvedBaseMap);
    // If no dark overrides file exists, dark = light (matches spec).
    const darkMap = buildTenantMap(tenantId, 'overrides.dark.json', lightMap);

    const pkgName = toDartPackageName(tenantId);
    const pkgDir = `${tenantsOutDir}/${tenantId}`;
    const libDir = `${pkgDir}/lib`;
    mkdirSync(libDir, { recursive: true });

    const dartPath = `${libDir}/btech_tokens_${pkgName}.dart`;
    const pubspecPath = `${pkgDir}/pubspec.yaml`;

    writeFileSync(dartPath, emitTenantDart(tenantId, tree, lightMap, darkMap), 'utf-8');
    writeFileSync(pubspecPath, emitPubspec(tenantId), 'utf-8');

    console.log(
      `  Flutter tenant pkg — platforms/flutter/tenants/${tenantId}/ (btech_tokens_${pkgName})`,
    );
  }

  // Generate defaults.dart into the BASE package so btech_tokens works standalone.
  generateBaseDefaults(resolvedBaseMap);
  console.log('  Flutter defaults  — platforms/flutter/lib/src/defaults.dart');
}

// =============================================================================
// Base-package defaults generator
// Writes platforms/flutter/lib/src/defaults.dart with the default (no-tenant)
// btechColor, btechRadius, btechFont, and btechTheme() so that btech_tokens
// can be used standalone without any tenant package.
// =============================================================================

function generateBaseDefaults(resolvedBaseMap: Record<string, string>): void {
  const dartLibDir = `${ROOT}/platforms/flutter/lib/src`;
  const tree = buildColorTree();

  // Default tenant has no overrides — lightMap equals resolvedBaseMap.
  const lightMap = buildTenantMap('default', 'overrides.json', resolvedBaseMap);
  // Dark = same as light until a dark overrides file is added.
  const darkMap = buildTenantMap('default', 'overrides.dark.json', lightMap);

  const radiusFields = buildRadiusFields(lightMap);
  const fontSans = buildFontSans(lightMap);

  const L: string[] = [];
  L.push('// AUTO-GENERATED by @btech/design-system — do not edit manually.');
  L.push('// Run `pnpm generate` to regenerate.');
  L.push('// ignore_for_file: lines_longer_than_80_chars');
  L.push('');
  L.push("import 'package:flutter/material.dart';");
  L.push("import 'color/color.theme.dart';");
  L.push("import 'radius/radius.theme.dart';");
  L.push("import 'font/font.theme.dart';");
  L.push("import 'theme_builder.dart';");
  L.push('');
  L.push('// ── Light (public — Pattern B) ─────────────────────────────────────────────');
  L.push('');
  L.push('/// Default light-mode color tokens. Used when no tenant package is active.');
  L.push(`const BTechColorTheme btechColor = ${emitColorThemeLiteral(tree, lightMap)};`);
  L.push('');
  L.push('// ── Dark (private) ─────────────────────────────────────────────────────────');
  L.push('');
  L.push(`const BTechColorTheme _btechColorDark = ${emitColorThemeLiteral(tree, darkMap)};`);
  L.push('');
  L.push('// ── Radius ──────────────────────────────────────────────────────────────────');
  L.push('');
  L.push('/// Default radius tokens.');
  L.push('const BTechRadiusTheme btechRadius = BTechRadiusTheme(');
  for (const f of radiusFields) L.push(`  ${f.name}: ${pxToDouble(f.value)},`);
  L.push(');');
  L.push('');
  L.push('// ── Font ────────────────────────────────────────────────────────────────────');
  L.push('');
  L.push('/// Default font tokens.');
  L.push('const BTechFontTheme btechFont = BTechFontTheme(');
  L.push(`  family: BTechFontFamily(sans: '${fontSans.replace(/'/g, "\\'")}'),`);
  L.push(');');
  L.push('');
  L.push('// ── Theme builder ───────────────────────────────────────────────────────────');
  L.push('');
  L.push('/// Build a default BTech [ThemeData]. Use when no tenant package is needed.');
  L.push('///');
  L.push('/// ```dart');
  L.push('/// MaterialApp(');
  L.push('///   theme:     btechTheme(),');
  L.push('///   darkTheme: btechTheme(brightness: Brightness.dark),');
  L.push('///   themeMode: ThemeMode.system,');
  L.push('/// )');
  L.push('/// ```');
  L.push('ThemeData btechTheme({Brightness brightness = Brightness.light, ThemeData? base}) =>');
  L.push('    buildBtechTheme(btechColor, _btechColorDark, btechRadius, btechFont,');
  L.push('                    brightness: brightness, base: base);');
  L.push('');

  writeFileSync(`${dartLibDir}/defaults.dart`, L.join('\n'), 'utf-8');
}

// =============================================================================
// Standalone CLI entry
// Usage: pnpm exec tsx packages/tokens/generators/flutter/flutter-tenant-format.ts
// =============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  // Build a resolved base map the same way sd.config.ts does, so this file is
  // independently runnable for smoke testing without touching base platforms.
  const rawMap: Record<string, string> = {};
  for (const dir of [`${ROOT}/sources/core`, `${ROOT}/sources/semantic`]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
      Object.assign(
        rawMap,
        flattenDTCG(JSON.parse(readFileSync(`${dir}/${f}`, 'utf-8'))),
      );
    }
  }
  const resolved: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawMap)) resolved[k] = resolveRef(v, rawMap);
  for (const [k, v] of Object.entries(resolved)) resolved[k] = resolveRef(v, resolved);

  generateFlutterTenantPackages(resolved);
  // eslint-disable-next-line no-console
  console.log('[flutter-tenant-format] Done.');
}
