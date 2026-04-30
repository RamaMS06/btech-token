// AUTO-GENERATED helpers for per-tenant Flutter token packages.
//
// This file generates, for each tenant in `sources/tenants/{id}/`:
//   packages/tokens/platforms/flutter/{id}/
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
import { execSync } from 'child_process';
import { ROOT, flattenDTCG, resolveRef, hexToArgb } from '../utils.js';
import {
  buildColorTree,
  buildRadiusFields,
  buildFontSans,
  buildDarkResolvedBaseMap,
  dashToCamel,
  rgbaToArgb,
  type ColorTree,
} from './flutter-theme-generator.js';

// =============================================================================
// Helpers
// =============================================================================

/** `my-tenant` → `my_tenant`, `bspace` → `bspace`. */
function toDartPackageName(tenantId: string): string {
  return tenantId.replace(/-/g, '_');
}

/** `'8px'` → `'8.0'`, `'9999px'` → `'9999.0'`. */
function pxToDouble(value: string): string {
  const n = parseFloat(String(value).replace('px', ''));
  if (Number.isNaN(n)) return '0.0';
  return Number.isInteger(n) ? `${n}.0` : String(n);
}

/** Resolve a color value (hex, rgba, or 0x literal) to a Dart ARGB literal. */
function resolveArgb(val: string | undefined, fallback: string): string {
  if (!val) return fallback;
  if (val.startsWith('0x')) return val;
  if (val.startsWith('rgba(') || val.startsWith('rgba (')) return rgbaToArgb(val);
  if (val.startsWith('#')) return hexToArgb(val);
  return fallback;
}

/** `background` → `Background`. */
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// =============================================================================
// Tenant map construction
// =============================================================================

/** Load source raw maps + apply tenant overrides at the RAW level, then resolve.
 *  This is critical for the brand-layer override pattern: tenants alias the brand
 *  rungs (color.brand.primary.500 → {color.blue.500}), and semantic tokens alias
 *  the brand rungs (color.brand.primary-default → {color.brand.primary.500}). The
 *  override must be applied BEFORE resolution so the chain re-resolves correctly.
 *  The legacy "merge already-resolved values" approach silently dropped tenant
 *  changes from propagating up through the alias chain. */
function buildTenantMap(
  tenantId: string,
  overrideFile: string,
  resolvedBaseMap: Record<string, string>,
): Record<string, string> {
  const isDarkOverride = overrideFile.includes('.dark.');

  // Re-load raw sources from scratch so tenant overrides apply BEFORE resolution.
  // Order matters: load LIGHT files first, then DARK files (so dark refs override
  // light at the raw level for dark-mode builds).
  const rawMap: Record<string, string> = {};
  const sourceDirs = [
    `${ROOT}/sources/primitives`,
    `${ROOT}/sources/brand`,
    `${ROOT}/sources/semantic-color`,
    `${ROOT}/sources/spacing-and-radius`,
    `${ROOT}/sources/typography`,
    `${ROOT}/sources/shadow`,
    `${ROOT}/sources/stroke`,
  ];
  for (const dir of sourceDirs) {
    if (!existsSync(dir)) continue;
    const all = readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'font-registry.json');
    const lightFiles = all.filter(f => !f.includes('.dark.'));
    const darkFiles  = all.filter(f =>  f.includes('.dark.'));
    // Always load light files (the base layer).
    for (const f of lightFiles) {
      Object.assign(rawMap, flattenDTCG(JSON.parse(readFileSync(`${dir}/${f}`, 'utf-8'))));
    }
    // Layer dark files on top only when building a dark map.
    if (isDarkOverride) {
      for (const f of darkFiles) {
        Object.assign(rawMap, flattenDTCG(JSON.parse(readFileSync(`${dir}/${f}`, 'utf-8'))));
      }
    }
  }

  // Brand-layer overrides come from the tenant's LIGHT overrides.json — they
  // define the tenant's brand identity (which primitive ramps the brand layer
  // aliases) and apply to BOTH light and dark modes. Apply them first.
  const lightOverridesPath = `${ROOT}/sources/tenants/${tenantId}/overrides.json`;
  if (existsSync(lightOverridesPath)) {
    Object.assign(rawMap, flattenDTCG(
      JSON.parse(readFileSync(lightOverridesPath, 'utf-8')) as Record<string, unknown>,
    ));
  }

  // Mode-specific overrides — for dark mode, layer overrides.dark.json on top
  // of the brand identity. For light mode this is the same file as above and
  // has already been applied; the second assign is a no-op.
  const overridesPath = `${ROOT}/sources/tenants/${tenantId}/${overrideFile}`;
  if (existsSync(overridesPath) && overridesPath !== lightOverridesPath) {
    Object.assign(rawMap, flattenDTCG(
      JSON.parse(readFileSync(overridesPath, 'utf-8')) as Record<string, unknown>,
    ));
  }

  // If neither file exists for this tenant, fall back to the pre-resolved base.
  if (!existsSync(lightOverridesPath) && !existsSync(overridesPath)) {
    return { ...resolvedBaseMap };
  }

  // Three-pass resolution to handle chained references:
  //   semantic alias → brand-layer alias → primitive-rung alias → hex.
  const resolved: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawMap)) resolved[k] = resolveRef(v, rawMap);
  for (const [k, v] of Object.entries(resolved)) resolved[k] = resolveRef(v, resolved);
  for (const [k, v] of Object.entries(resolved)) resolved[k] = resolveRef(v, resolved);

  // Strip `-default` disambiguator suffix so consumer-facing keys stay clean.
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolved)) {
    const cleanKey = k.replace(/-default(\.|$)/, '$1');
    out[cleanKey] = v;
  }
  return out;
}

// =============================================================================
// Color theme literal emitter
// =============================================================================

/**
 * Emits the nested BTechColorTheme(...) const expression for a given resolved map.
 * Flat model: each field in a category is a plain Color (no sub-variants).
 */
function emitColorThemeLiteral(
  tree: ColorTree,
  resolvedMap: Record<string, string>,
): string {
  const L: string[] = [];
  L.push('BTechColorTheme(');
  for (const [category, fields] of Object.entries(tree)) {
    const className = `BTechColor${cap(category)}`;
    L.push(`  ${category}: ${className}(`);
    for (const f of fields) {
      const argb = resolveArgb(resolvedMap[`color.${category}.${f}`], '0xFF000000');
      L.push(`    ${dashToCamel(f)}: Color(${argb}),`);
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
  fullFontFamily: string,
  brandNames: string[],
): string {
  const pkgName = toDartPackageName(tenantId);

  const radiusFields = buildRadiusFields(lightMap);

  // Tenant-specific brand swatches — resolved against the tenant lightMap so
  // bspace's brand.primary.500 yields rose, secondary.500 yields teal, etc.
  // Names mirror the base package (btechColorBrandPrimary/Secondary), and are
  // added to the `hide` list of the re-export so consumers always see the
  // tenant version (no ambiguous_export).
  const brandSwatchNames = brandNames.map(b => `btechColorBrand${cap(b)}`);

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
  const hideList = ['btechColor', 'btechRadius', 'btechTheme', ...brandSwatchNames].join(', ');
  L.push(`export 'package:btech_tokens/btech_tokens.dart' hide ${hideList};`);
  L.push('');

  // ── Brand swatches (tenant-overridable primitive ramps) ────────────────────
  if (brandNames.length > 0) {
    L.push('// ── Brand swatches (tenant-overridable primitive ramps) ─────────────────');
    L.push('');
    for (const brand of brandNames) {
      const constName = `btechColorBrand${cap(brand)}`;
      L.push(`/// Brand ${brand} color swatch (${tenantId}) — ${constName}[500]`);
      L.push(`const MaterialColor ${constName} = MaterialColor(`);
      const primaryHex = lightMap[`color.brand.${brand}.500`] ?? '#000000';
      L.push(`  ${resolveArgb(primaryHex, '0xFF000000')},`);
      L.push('  <int, Color>{');
      const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
      for (const shade of shades) {
        const hex = lightMap[`color.brand.${brand}.${shade}`];
        if (!hex) continue;
        L.push(`    ${shade}: Color(${resolveArgb(hex, '0xFF000000')}),`);
      }
      L.push('  },');
      L.push(');');
      L.push('');
    }
  }

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
  L.push(`    buildBtechTheme(btechColor, _btechColorDark, btechRadius, '${fullFontFamily.replace(/'/g, "\\'")}',`);
  L.push('                    brightness: brightness, base: base);');
  L.push('');

  return L.join('\n');
}

// =============================================================================
// Font asset helpers
// =============================================================================

/**
 * Normalises a font family name to CamelCase with no spaces — used for folder
 * names and file names to match Google Fonts' own naming convention.
 *
 *   "Rubik Storm"  → "RubikStorm"
 *   "Open Sans"    → "OpenSans"
 *   "Geist"        → "Geist"   (no-op for single-word names)
 *
 * The original spaced name is kept for the pubspec `family:` declaration and
 * the Dart `fontFamily` string — Flutter needs it to match the family key.
 */
function toFontKey(fontFamily: string): string {
  return fontFamily
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/**
 * Attempts to auto-download a Google Fonts typeface (4 weights) from the
 * google/fonts GitHub repository into `destDir`.
 *
 * Tries both `ofl/` and `apache/` directories — covers the vast majority of
 * Google Fonts. Returns true if at least one weight was downloaded.
 *
 * Fonts NOT hosted on Google Fonts (e.g. Geist, custom brand fonts) will
 * return false; add the TTF files manually to the destination directory.
 *
 * File naming follows Google Fonts convention: CamelCase with no spaces.
 *   "Rubik Storm" → RubikStorm-Regular.ttf, RubikStorm-Medium.ttf, …
 *   "Open Sans"   → OpenSans-Regular.ttf, OpenSans-Medium.ttf, …
 */
function tryDownloadGoogleFont(fontFamily: string, destDir: string): boolean {
  // Google Fonts GitHub uses lowercase, no spaces for the directory slug.
  const familySlug = fontFamily.toLowerCase().replace(/\s+/g, '');
  // File names use CamelCase (no spaces): "Rubik Storm" → "RubikStorm-Regular.ttf"
  const familyKey  = toFontKey(fontFamily);

  const weights: string[] = [
    `${familyKey}-Regular.ttf`,
    `${familyKey}-Medium.ttf`,
    `${familyKey}-SemiBold.ttf`,
    `${familyKey}-Bold.ttf`,
  ];

  // Try both licence directories in order
  const bases = [
    `https://github.com/google/fonts/raw/main/ofl/${familySlug}`,
    `https://github.com/google/fonts/raw/main/apache/${familySlug}`,
  ];

  mkdirSync(destDir, { recursive: true });
  let downloaded = 0;

  for (const file of weights) {
    let ok = false;
    for (const base of bases) {
      try {
        execSync(`curl -fsSL -o "${destDir}/${file}" "${base}/${file}"`, {
          stdio: 'pipe',
          timeout: 30_000,
        });
        ok = true;
        break;
      } catch {
        // Try next base URL
      }
    }
    if (ok) downloaded++;
  }

  return downloaded > 0;
}

/**
 * Ensures TTF font files for `fontFamily` exist at `{destFontsDir}/{FamilyKey}/`
 * and returns the pubspec asset lines.
 *
 * Folder and file names use CamelCase (no spaces) to match Google Fonts convention:
 *   "Rubik Storm" → fonts/RubikStorm/RubikStorm-Regular.ttf
 *
 * The pubspec `family:` and Dart fontFamily string keep the original spaced name
 * so Flutter can match the family key correctly.
 *
 * If the fonts are already present (committed in git), they are used as-is.
 * If missing, attempts an auto-download from the Google Fonts GitHub repository.
 *
 * Returns [] if fonts cannot be found or downloaded.
 */
function copyFontsForPackage(fontFamily: string, destFontsDir: string): string[] {
  // Folder and file prefix: CamelCase, no spaces ("Rubik Storm" → "RubikStorm")
  const familyKey = toFontKey(fontFamily);
  const dest = `${destFontsDir}/${familyKey}`;

  // If fonts already exist at the destination (committed in git), use them directly.
  const alreadyPresent =
    existsSync(dest) &&
    readdirSync(dest).some((f) => f.endsWith('.ttf'));

  if (!alreadyPresent) {
    console.log(`  [fonts] '${fontFamily}' not found at destination — attempting Google Fonts download...`);
    const ok = tryDownloadGoogleFont(fontFamily, dest);
    if (!ok) {
      console.warn(
        `  [fonts] Could not auto-download '${fontFamily}'. ` +
        `Place TTF files manually in ${destFontsDir}/${familyKey}/ ` +
        `(naming: ${familyKey}-Regular.ttf, -Medium.ttf, -SemiBold.ttf, -Bold.ttf).`,
      );
      return [];
    }
    console.log(`  [fonts] Downloaded '${fontFamily}' → ${destFontsDir}/${familyKey}/`);
  }

  const weightDefs: [string, number | undefined][] = [
    [`${familyKey}-Regular.ttf`,  undefined],
    [`${familyKey}-Medium.ttf`,   500],
    [`${familyKey}-SemiBold.ttf`, 600],
    [`${familyKey}-Bold.ttf`,     700],
  ];

  const found = weightDefs.filter(([f]) => existsSync(`${dest}/${f}`));
  if (found.length === 0) return [];

  return found.map(([f, w]) =>
    w === undefined
      ? `        - asset: fonts/${familyKey}/${f}`
      : `        - asset: fonts/${familyKey}/${f}\n          weight: ${w}`,
  );
}

// =============================================================================
// pubspec.yaml emitter
// =============================================================================

function emitPubspec(tenantId: string, fontFamily: string, fontLines: string[], version: string): string {
  const pkgName = toDartPackageName(tenantId);
  const flutterSection = fontLines.length > 0
    ? [
        '',
        'flutter:',
        '  fonts:',
        `    - family: ${fontFamily}`,
        '      fonts:',
        ...fontLines,
      ].join('\n')
    : '';

  return [
    `name: btech_tokens_${pkgName}`,
    `description: BTech design tokens for ${tenantId} tenant — generated by pnpm generate`,
    `version: ${version}`,
    // Not published to pub.dev — consumed via git path dependency.
    'publish_to: none',
    '',
    'environment:',
    "  sdk: '>=3.0.0 <4.0.0'",
    "  flutter: '>=3.10.0'",
    '',
    'dependencies:',
    '  flutter:',
    '    sdk: flutter',
    '  btech_tokens:',
    '    path: ../token/',
    flutterSection,
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
 *   packages/tokens/platforms/flutter/{id}/
 *     ├── pubspec.yaml
 *     └── lib/btech_tokens_{id_underscored}.dart
 */
export function generateFlutterTenantPackages(resolvedBaseMap: Record<string, string>): void {
  const tenantsSrcDir = `${ROOT}/sources/tenants`;
  const tenantsOutDir = `${ROOT}/platforms/flutter`;

  if (!existsSync(tenantsSrcDir)) {
    console.warn(`[flutter-tenant-format] No tenants directory at ${tenantsSrcDir}`);
    return;
  }

  const tenantIds = readdirSync(tenantsSrcDir).filter((d) =>
    existsSync(`${tenantsSrcDir}/${d}/overrides.json`),
  );

  const tree = buildColorTree();

  // Discover brand names from the brand primitive source (color.brand.json).
  // Each top-level key under `color.brand` (excluding $-meta) becomes a tenant-
  // overridable swatch name (primary, secondary, …).
  const brandNames = discoverBrandNames();

  // Build the semantic dark base once — reused for every tenant.
  const darkBaseMap = buildDarkResolvedBaseMap();

  // Resolve the default (base) font — used to skip bundling when a tenant inherits it.
  const defaultFontSans = buildFontSans(resolvedBaseMap);

  for (const tenantId of tenantIds) {
    const lightMap = buildTenantMap(tenantId, 'overrides.json', resolvedBaseMap);
    // Dark map = semantic dark base + optional per-tenant dark overrides.
    const darkMap = buildTenantMap(tenantId, 'overrides.dark.json', darkBaseMap);

    const fontSans = buildFontSans(lightMap);

    const pkgName = toDartPackageName(tenantId);
    const pkgDir = `${tenantsOutDir}/${tenantId}`;
    const libDir = `${pkgDir}/lib`;
    mkdirSync(libDir, { recursive: true });

    // Copy font TTF files only when this tenant's font differs from the default.
    // (Geist is already bundled in the base btech_tokens package.)
    const fontLines = fontSans !== defaultFontSans
      ? copyFontsForPackage(fontSans, `${pkgDir}/fonts`)
      : [];

    // Flutter registers package fonts as 'packages/{pkg}/{family}' — use the full name
    // so TextStyle(fontFamily: ...) actually finds the bundled font.
    const fontPkg = fontLines.length > 0 ? `btech_tokens_${pkgName}` : 'btech_tokens';
    const fullFontFamily = `packages/${fontPkg}/${fontSans}`;

    const dartPath = `${libDir}/btech_tokens_${pkgName}.dart`;
    const pubspecPath = `${pkgDir}/pubspec.yaml`;

    // Hybrid versioning contract (mirrors web tenant generator):
    //   * Preserve the existing pubspec version across regenerations — tenant
    //     packages only bump when their own source changes (or via explicit
    //     scope=all bump).
    //   * Seed from the repo-root package.json on first generation so we don't
    //     hardcode '1.0.0' (which violates version-consistency with prerelease
    //     root versions).
    const rootPkgPath = `${ROOT}/../../package.json`;
    const seedVersion: string = existsSync(rootPkgPath)
      ? JSON.parse(readFileSync(rootPkgPath, 'utf-8')).version ?? '1.0.0'
      : '1.0.0';
    let pubspecVersion = seedVersion;
    if (existsSync(pubspecPath)) {
      const m = readFileSync(pubspecPath, 'utf-8').match(/^version:\s*(\S+)/m);
      if (m) pubspecVersion = m[1];
    }

    writeFileSync(dartPath, emitTenantDart(tenantId, tree, lightMap, darkMap, fullFontFamily, brandNames), 'utf-8');
    writeFileSync(pubspecPath, emitPubspec(tenantId, fontSans, fontLines, pubspecVersion), 'utf-8');

    console.log(
      `  Flutter tenant pkg — platforms/flutter/${tenantId}/ (btech_tokens_${pkgName})`,
    );
  }

  // Generate defaults.dart into the BASE package so btech_tokens works standalone.
  generateBaseDefaults(resolvedBaseMap);
  console.log('  Flutter defaults  — platforms/flutter/token/lib/src/defaults.dart');
}

/** Read brand names from sources/brand/color.json. Returns sorted top-level
 *  keys under `color.brand`, excluding DTCG meta keys (those starting with `$`). */
function discoverBrandNames(): string[] {
  const brandPath = `${ROOT}/sources/brand/color.json`;
  if (!existsSync(brandPath)) return [];
  const json = JSON.parse(readFileSync(brandPath, 'utf-8'));
  const root = (json?.color?.brand ?? {}) as Record<string, unknown>;
  return Object.keys(root).filter(k => !k.startsWith('$')).sort();
}

// =============================================================================
// Base-package defaults generator
// Writes platforms/flutter/token/lib/src/defaults.dart with the default (no-tenant)
// btechColor, btechRadius, btechFont, and btechTheme() so that btech_tokens
// can be used standalone without any tenant package.
// =============================================================================

function generateBaseDefaults(resolvedBaseMap: Record<string, string>): void {
  const dartLibDir = `${ROOT}/platforms/flutter/token/lib/src`;
  const basePkgDir  = `${ROOT}/platforms/flutter/token`;
  const tree = buildColorTree();

  // Default package has no tenant overrides — lightMap equals resolvedBaseMap.
  const lightMap = buildTenantMap('default', 'overrides.json', resolvedBaseMap);
  // Dark = semantic dark base (color.dark.json applied on top of light values).
  const darkMap = buildDarkResolvedBaseMap();

  const radiusFields = buildRadiusFields(lightMap);
  const fontSans = buildFontSans(lightMap);

  // ── Copy base font (Geist) and patch pubspec.yaml ────────────────────────────
  const baseFontLines = copyFontsForPackage(fontSans, `${basePkgDir}/fonts`);
  if (baseFontLines.length > 0) {
    const pubspecPath = `${basePkgDir}/pubspec.yaml`;
    let pubspec = readFileSync(pubspecPath, 'utf-8');
    // Remove any existing flutter: section before re-emitting (idempotent).
    pubspec = pubspec.replace(/\nflutter:[\s\S]*$/, '').trimEnd();
    const flutterSection = [
      '',
      '',
      'flutter:',
      '  fonts:',
      `    - family: ${fontSans}`,
      '      fonts:',
      ...baseFontLines,
      '',
    ].join('\n');
    writeFileSync(pubspecPath, pubspec + flutterSection, 'utf-8');
  }

  const L: string[] = [];
  L.push('// AUTO-GENERATED by @btech/design-system — do not edit manually.');
  L.push('// Run `pnpm generate` to regenerate.');
  L.push('// ignore_for_file: lines_longer_than_80_chars');
  L.push('');
  L.push("import 'package:flutter/material.dart';");
  L.push("import 'color/color.theme.dart';");
  L.push("import 'radius/radius.theme.dart';");
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
  // Flutter registers package fonts as 'packages/{pkg}/{family}' — use the full name.
  const fullFontFamily = `packages/btech_tokens/${fontSans}`;
  L.push('ThemeData btechTheme({Brightness brightness = Brightness.light, ThemeData? base}) =>');
  L.push(`    buildBtechTheme(btechColor, _btechColorDark, btechRadius, '${fullFontFamily.replace(/'/g, "\\'")}',`);
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
  const cliSourceDirs = [
    `${ROOT}/sources/primitives`,
    `${ROOT}/sources/brand`,
    `${ROOT}/sources/semantic-color`,
    `${ROOT}/sources/spacing-and-radius`,
    `${ROOT}/sources/typography`,
    `${ROOT}/sources/shadow`,
    `${ROOT}/sources/stroke`,
  ];
  for (const dir of cliSourceDirs) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.json') && x !== 'font-registry.json')) {
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
