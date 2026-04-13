import StyleDictionary from 'style-dictionary';
import type { Format, TransformedToken } from 'style-dictionary/types';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync } from 'fs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// =============================================================================
// Helpers
// =============================================================================

function hexToArgb(hex: string): string {
  const clean = hex.replace('#', '');
  const padded = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  return `0xFF${padded.toUpperCase()}`;
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

/**
 * Flatten a DTCG JSON token tree into a Record<dotPath, rawValue>.
 * e.g. { color: { blue: { "500": { $value: "#3b82f6" } } } }
 *   →  { "color.blue.500": "#3b82f6" }
 */
function flattenDTCG(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) continue;
    const val = obj[key] as Record<string, unknown>;
    const path = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && '$value' in val) {
      result[path] = String(val.$value);
    } else if (val && typeof val === 'object') {
      Object.assign(result, flattenDTCG(val as Record<string, unknown>, path));
    }
  }
  return result;
}

/**
 * Resolve a DTCG reference like "{color.blue.500}" against a base map.
 * Non-reference values are returned as-is.
 */
function resolveRef(value: string, baseMap: Record<string, string>): string {
  const m = value.match(/^\{(.+)\}$/);
  if (m) return baseMap[m[1]] ?? value;
  return value;
}

// =============================================================================
// Token → Dart tenant field map
// Lists every semantic token that BTechTenantTokens exposes, in order.
// =============================================================================
const TENANT_FIELD_MAP: Array<{
  path: string;
  field: string;
  type: 'Color' | 'double' | 'String';
}> = [
  { path: 'color.background.primary',           field: 'primaryBg',          type: 'Color'  },
  { path: 'color.background.primary-hover',     field: 'primaryBgHover',     type: 'Color'  },
  { path: 'color.text.on-primary',              field: 'primaryFg',          type: 'Color'  },
  { path: 'color.stroke.primary',               field: 'primaryBorder',      type: 'Color'  },
  { path: 'color.background.secondary',         field: 'secondaryBg',        type: 'Color'  },
  { path: 'color.background.secondary-hover',   field: 'secondaryBgHover',   type: 'Color'  },
  { path: 'color.text.on-secondary',            field: 'secondaryFg',        type: 'Color'  },
  { path: 'color.stroke.secondary',             field: 'secondaryBorder',    type: 'Color'  },
  { path: 'color.background.danger',            field: 'dangerBg',           type: 'Color'  },
  { path: 'color.text.on-danger',               field: 'dangerFg',           type: 'Color'  },
  { path: 'color.background.default',           field: 'surfaceDefault',     type: 'Color'  },
  { path: 'color.background.subtle',            field: 'surfaceSubtle',      type: 'Color'  },
  { path: 'color.background.raised',            field: 'surfaceRaised',      type: 'Color'  },
  { path: 'color.text.primary',                 field: 'textDefault',        type: 'Color'  },
  { path: 'color.text.secondary',               field: 'textSubtle',         type: 'Color'  },
  { path: 'color.text.disable',                 field: 'textDisabled',       type: 'Color'  },
  { path: 'color.text.inverse',                 field: 'textInverse',        type: 'Color'  },
  { path: 'color.stroke.default',               field: 'borderDefault',      type: 'Color'  },
  { path: 'color.stroke.strong',                field: 'borderStrong',       type: 'Color'  },
  { path: 'radius.interactive',                 field: 'radiusInteractive',  type: 'double' },
  { path: 'radius.card',                        field: 'radiusCard',         type: 'double' },
  { path: 'radius.badge',                       field: 'radiusBadge',        type: 'double' },
  { path: 'typography.fontFamily.sans',         field: 'fontFamilySans',     type: 'String' },
];

// =============================================================================
// Format: custom/dart-tenants
// Generates packages/tokens-dart/lib/src/tenant.dart from:
//   - dictionary.allTokens  (resolved base/default values)
//   - tokens/tenants/*/overrides.json  (per-tenant raw overrides)
// =============================================================================
const dartTenantsFormat: Format = {
  name: 'custom/dart-tenants',
  format: ({ dictionary }) => {
    // ── Build base resolved map from the SD dictionary ────────────────────
    const baseMap: Record<string, string> = {};
    for (const t of dictionary.allTokens) {
      baseMap[t.path.join('.')] = String(t.value ?? t.$value);
    }

    // ── Discover tenants ──────────────────────────────────────────────────
    const tenantsDir = `${ROOT}/tokens/tenants`;
    const tenantIds = readdirSync(tenantsDir)
      .filter(d => existsSync(`${tenantsDir}/${d}/overrides.json`))
      .sort((a, b) => (a === 'default' ? -1 : b === 'default' ? 1 : a.localeCompare(b)));

    // ── Value resolvers ───────────────────────────────────────────────────
    function getResolved(tenantId: string, tokenPath: string): string {
      const raw = JSON.parse(
        readFileSync(`${tenantsDir}/${tenantId}/overrides.json`, 'utf-8')
      );
      const overrides = flattenDTCG(raw);
      const rawVal = overrides[tokenPath] ?? baseMap[tokenPath] ?? '#000000';
      return resolveRef(rawVal, baseMap);
    }

    function toColor(hex: string): string {
      return `const Color(0xFF${hex.replace('#', '').toUpperCase()})`;
    }
    function toDim(px: string): string {
      return String(parseFloat(String(px).replace('px', '')));
    }
    function toFont(s: string): string {
      return `'${String(s).split(',')[0].trim().replace(/'/g, '')}'`;
    }
    function toVarName(id: string): string {
      if (id === 'default') return 'defaultTokens';
      return id.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
    }
    function formatVal(val: string, type: 'Color' | 'double' | 'String'): string {
      if (type === 'Color')  return toColor(val);
      if (type === 'double') return toDim(val);
      return toFont(val);
    }

    // ── Generate Dart source ──────────────────────────────────────────────
    const L: string[] = [
      '// AUTO-GENERATED by @btech/design-tokens — do not edit manually.',
      '// Run `pnpm generate` to regenerate from tokens/tenants/**.',
      '',
      '// ignore_for_file: lines_longer_than_80_chars',
      '',
      "import 'package:flutter/material.dart';",
      '',
      '/// Resolved semantic token set for a specific tenant.',
      '/// Components read these via context.btechTokens — never use primitives directly.',
      'class BTechTenantTokens {',
    ];

    // Fields
    for (const f of TENANT_FIELD_MAP) {
      const dartType = f.type;
      L.push(`  final ${dartType} ${f.field};`);
    }
    L.push('');

    // Constructor
    L.push('  const BTechTenantTokens({');
    for (const f of TENANT_FIELD_MAP) L.push(`    required this.${f.field},`);
    L.push('  });');
    L.push('');

    // Per-tenant static consts
    for (const tenantId of tenantIds) {
      const varName = toVarName(tenantId);
      const label = tenantId === 'default' ? 'Default tenant.' : `Tenant: ${tenantId}.`;
      L.push(`  /// ${label} Auto-generated from tokens/tenants/${tenantId}/overrides.json`);
      L.push(`  static const BTechTenantTokens ${varName} = BTechTenantTokens(`);
      for (const f of TENANT_FIELD_MAP) {
        const val = getResolved(tenantId, f.path);
        L.push(`    ${f.field}: ${formatVal(val, f.type)},`);
      }
      L.push('  );');
      L.push('');
    }

    // Registry
    L.push('  /// Registry — add new tenants here after running `pnpm add-tenant`.');
    L.push('  static const Map<String, BTechTenantTokens> _registry = {');
    for (const id of tenantIds) L.push(`    '${id}': ${toVarName(id)},`);
    L.push('  };');
    L.push('');
    L.push('  /// Resolve tokens for [tenantId]. Falls back to [defaultTokens] if unknown.');
    L.push('  static BTechTenantTokens forTenant(String tenantId) =>');
    L.push('      _registry[tenantId] ?? defaultTokens;');
    L.push('}');

    return L.join('\n') + '\n';
  },
};

// =============================================================================
// Format: custom/dart (primitives + semantic statics — generated.dart)
// =============================================================================
const dartFormat: Format = {
  name: 'custom/dart',
  format: ({ dictionary }) => {
    const tokens = dictionary.allTokens;

    const isPrimitive = (t: TransformedToken) => t.filePath.includes('/core/');

    const primColors:       TransformedToken[] = [];
    const semColors:        TransformedToken[] = [];
    const spacingTokens:    TransformedToken[] = [];
    const primRadius:       TransformedToken[] = [];
    const semRadius:        TransformedToken[] = [];
    const fontWeights:      TransformedToken[] = [];
    const fontFamilies:     TransformedToken[] = [];
    const fontSizes:        TransformedToken[] = [];
    const semFontFamilies:  TransformedToken[] = [];
    const semFontSizes:     TransformedToken[] = [];
    const buttonColors:     TransformedToken[] = [];
    const buttonDims:       TransformedToken[] = [];
    const lineHeights:      TransformedToken[] = [];

    for (const t of tokens) {
      const type  = t.$type || t.type;
      const path0 = t.path[0];

      if (path0 === 'button') {
        (type === 'color' ? buttonColors : buttonDims).push(t); continue;
      }
      if (path0 === 'shadow' || path0 === 'motion' || path0 === 'zIndex') continue;

      if (path0 === 'color') {
        (isPrimitive(t) ? primColors : semColors).push(t); continue;
      }
      if (path0 === 'spacing') { spacingTokens.push(t); continue; }
      if (path0 === 'radius') {
        (isPrimitive(t) ? primRadius : semRadius).push(t); continue;
      }
      if (path0 === 'typography') {
        if (type === 'fontWeight')  { if (isPrimitive(t)) fontWeights.push(t); continue; }
        if (type === 'fontFamily')  { (isPrimitive(t) ? fontFamilies : semFontFamilies).push(t); continue; }
        if (type === 'dimension')   {
          if (t.path[1] === 'letterSpacing') continue;
          (isPrimitive(t) ? fontSizes : semFontSizes).push(t); continue;
        }
        if (type === 'number')      { if (isPrimitive(t)) lineHeights.push(t); continue; }
      }
    }

    // Palette groups
    const primColorGroups: Record<string, TransformedToken[]> = {};
    for (const t of primColors) {
      const g = t.path[1];
      (primColorGroups[g] ??= []).push(t);
    }

    // Semantic color groups
    const semColorGroups: Record<string, TransformedToken[]> = {};
    for (const t of semColors) {
      const g = t.path[1];
      (semColorGroups[g] ??= []).push(t);
    }

    const reserved = new Set(['default', 'switch', 'class', 'return', 'new', 'if', 'else', 'for', 'while']);
    const semGroupClass: Record<string, string> = {
      text: '_BTechColorText',
      background: '_BTechColorBackground',
      stroke: '_BTechColorStroke',
    };

    const L: string[] = [
      '// AUTO-GENERATED by @btech/design-tokens — do not edit manually.',
      '// Run `pnpm generate` to regenerate from tokens/.',
      '',
      '// ignore_for_file: lines_longer_than_80_chars',
      '',
      "import 'package:flutter/material.dart';",
      '',
    ];

    // ── Primitive color palette ─────────────────────────────────────────
    L.push('// ── Primitive color palette ──────────────────────────────────────────────────');
    const groupNames: string[] = [];
    for (const [g, gt] of Object.entries(primColorGroups)) {
      const cn = `_BTechPrimColor${g.charAt(0).toUpperCase() + g.slice(1)}`;
      groupNames.push(g);
      L.push(`class ${cn} {`);
      L.push(`  const ${cn}();`);
      for (const t of gt) {
        const shade = t.path[2];
        L.push(`  final Color s${shade} = const Color(${hexToArgb(String(t.value ?? t.$value))});`);
      }
      L.push('}'); L.push('');
    }
    L.push('abstract class BTechPrimitiveColor {');
    for (const g of groupNames) {
      const cn = `_BTechPrimColor${g.charAt(0).toUpperCase() + g.slice(1)}`;
      L.push(`  static const ${g} = ${cn}();`);
    }
    L.push('}'); L.push('');

    // ── Primitive spacing ───────────────────────────────────────────────
    L.push('// ── Primitive spacing ────────────────────────────────────────────────────────');
    L.push('abstract class BTechSpacing {');
    for (const t of spacingTokens) {
      const n = t.path[t.path.length - 1];
      L.push(`  static const double ${n} = ${parseFloat(String(t.value ?? t.$value).replace('px', ''))};`);
    }
    L.push('}'); L.push('');

    // ── Primitive radius ────────────────────────────────────────────────
    L.push('// ── Primitive radius ─────────────────────────────────────────────────────────');
    L.push('abstract class BTechRadius {');
    for (const t of primRadius) {
      const n = t.path[t.path.length - 1];
      L.push(`  static const double ${n} = ${parseFloat(String(t.value ?? t.$value).replace('px', ''))};`);
    }
    L.push('}'); L.push('');

    // ── Primitive font weights ──────────────────────────────────────────
    L.push('// ── Primitive font weights ───────────────────────────────────────────────────');
    L.push('abstract class BTechFontWeight {');
    for (const t of fontWeights) {
      const n = t.path[t.path.length - 1];
      L.push(`  static const FontWeight ${n} = FontWeight.w${Number(t.value ?? t.$value)};`);
    }
    L.push('}'); L.push('');

    // ── Primitive font families ─────────────────────────────────────────
    L.push('// ── Primitive font families ──────────────────────────────────────────────────');
    L.push('abstract class BTechFontFamily {');
    for (const t of fontFamilies) {
      const n = t.path[t.path.length - 1];
      const fam = String(t.value ?? t.$value).split(',')[0].trim().replace(/'/g, '');
      L.push(`  static const String ${n} = '${fam}';`);
    }
    L.push('}'); L.push('');

    // ── Primitive font sizes ────────────────────────────────────────────
    L.push('// ── Primitive font sizes ─────────────────────────────────────────────────────');
    L.push('abstract class BTechFontSize {');
    for (const t of fontSizes) {
      const raw = t.path[t.path.length - 1];
      const n = /^[0-9]/.test(raw) ? `s${raw}` : raw;
      L.push(`  static const double ${n} = ${parseFloat(String(t.value ?? t.$value).replace('px', ''))};`);
    }
    L.push('}'); L.push('');

    // ── Primitive line heights ──────────────────────────────────────────
    if (lineHeights.length > 0) {
      L.push('// ── Primitive line heights ────────────────────────────────────────────────────');
      L.push('abstract class BTechLineHeight {');
      for (const t of lineHeights) {
        const n = t.path[t.path.length - 1];
        L.push(`  static const double ${n} = ${Number(t.value ?? t.$value)};`);
      }
      L.push('}'); L.push('');
    }

    // ── Semantic color groups ───────────────────────────────────────────
    for (const [g, gt] of Object.entries(semColorGroups)) {
      const cn = semGroupClass[g] ?? `_BTechColor${g.charAt(0).toUpperCase() + g.slice(1)}`;
      const suffix = g === 'background' ? 'Bg' : g === 'stroke' ? 'Stroke' : '';
      L.push(`// ── Semantic color — ${g} group ──────────────────────────────────────────────`);
      L.push(`class ${cn} {`);
      L.push(`  const ${cn}();`);
      for (const t of gt) {
        const raw = t.path[t.path.length - 1];
        let name = toCamelCase(raw);
        if (reserved.has(name)) name += suffix;
        L.push(`  final Color ${name} = const Color(${hexToArgb(String(t.value ?? t.$value))});`);
      }
      L.push('}'); L.push('');
    }

    L.push('/// Semantic color tokens — use context.btechColor for tenant-aware access.');
    L.push('/// BTechColor.background.primary is always the DEFAULT tenant value.');
    L.push('abstract class BTechColor {');
    for (const g of Object.keys(semColorGroups)) {
      const cn = semGroupClass[g] ?? `_BTechColor${g.charAt(0).toUpperCase() + g.slice(1)}`;
      L.push(`  static const ${g} = ${cn}();`);
    }
    L.push('}'); L.push('');

    // ── Semantic radius ─────────────────────────────────────────────────
    if (semRadius.length > 0) {
      L.push('// ── Semantic radius ──────────────────────────────────────────────────────────');
      L.push('abstract class BTechSemanticRadius {');
      for (const t of semRadius) {
        const n = t.path[t.path.length - 1];
        L.push(`  static const double ${n} = ${parseFloat(String(t.value ?? t.$value).replace('px', ''))};`);
      }
      L.push('}'); L.push('');
    }

    // ── Semantic font families ──────────────────────────────────────────
    if (semFontFamilies.length > 0) {
      L.push('// ── Semantic font families ────────────────────────────────────────────────────');
      L.push('abstract class BTechSemanticFontFamily {');
      for (const t of semFontFamilies) {
        const scope = t.path[1];
        const fam = String(t.value ?? t.$value).split(',')[0].trim().replace(/'/g, '');
        L.push(`  static const String ${scope} = '${fam}';`);
      }
      L.push('}'); L.push('');
    }

    // ── Semantic font sizes ─────────────────────────────────────────────
    if (semFontSizes.length > 0) {
      L.push('// ── Semantic font sizes ───────────────────────────────────────────────────────');
      L.push('abstract class BTechSemanticFontSize {');
      for (const t of semFontSizes) {
        L.push(`  static const double ${t.path[1]} = ${parseFloat(String(t.value ?? t.$value).replace('px', ''))};`);
      }
      L.push('}'); L.push('');
    }

    // ── Button tokens ───────────────────────────────────────────────────
    if (buttonColors.length > 0 || buttonDims.length > 0) {
      L.push('// ── Button component tokens ──────────────────────────────────────────────────');
      if (buttonColors.length > 0) {
        L.push('abstract class BTechButtonColors {');
        for (const t of buttonColors) {
          const n = toCamelCase(t.path.slice(1).map((p, i) => i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)).join(''));
          L.push(`  static const ${n} = Color(${hexToArgb(String(t.value ?? t.$value))});`);
        }
        L.push('}'); L.push('');
      }
      if (buttonDims.length > 0) {
        L.push('abstract class BTechButtonDimensions {');
        for (const t of buttonDims) {
          const n = toCamelCase(t.path.slice(1).map((p, i) => i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)).join(''));
          L.push(`  static const double ${n} = ${parseFloat(String(t.value ?? t.$value).replace('px', ''))};`);
        }
        L.push('}'); L.push('');
      }
    }

    return L.join('\n') + '\n';
  },
};

// =============================================================================
// Post-build: append [data-tenant="*"] CSS blocks to styles.css
// =============================================================================
function appendTenantCSS(baseMap: Record<string, string>): void {
  const tenantsDir = `${ROOT}/tokens/tenants`;
  const tenantIds  = readdirSync(tenantsDir)
    .filter(d => d !== 'default' && existsSync(`${tenantsDir}/${d}/overrides.json`))
    .sort();

  const cssOutPath = `${ROOT}/packages/tokens-web/dist/styles.css`;

  const blocks: string[] = [
    '',
    '/* ── Tenant overrides — auto-generated from tokens/tenants/*/overrides.json ── */',
  ];

  for (const tenantId of tenantIds) {
    const raw      = JSON.parse(readFileSync(`${tenantsDir}/${tenantId}/overrides.json`, 'utf-8'));
    const overrides = flattenDTCG(raw);
    if (Object.keys(overrides).length === 0) continue;

    blocks.push('');
    blocks.push(`[data-tenant="${tenantId}"] {`);

    for (const [tokenPath, rawVal] of Object.entries(overrides)) {
      const resolved = resolveRef(rawVal, baseMap);
      // Map token path to CSS var name: color.background.primary → --btech-color-background-primary
      const cssVar   = `--btech-${tokenPath.replace(/\./g, '-')}`;
      blocks.push(`  ${cssVar}: ${resolved};`);
    }

    blocks.push('}');
  }

  appendFileSync(cssOutPath, blocks.join('\n') + '\n');
  console.log(`✅ Appended ${tenantIds.length} tenant CSS override blocks to styles.css`);
}

// =============================================================================
// Register formats
// =============================================================================
StyleDictionary.registerFormat(dartFormat);
StyleDictionary.registerFormat(dartTenantsFormat);

// =============================================================================
// Ensure output dirs
// =============================================================================
const DART_OUT  = `${ROOT}/packages/tokens-dart/lib/src/`;
const WEB_OUT   = `${ROOT}/packages/tokens-web/dist/`;
const REACT_OUT = `${ROOT}/packages/tokens-react/src/`;
const VUE_OUT   = `${ROOT}/packages/tokens-vue/src/`;
mkdirSync(DART_OUT,  { recursive: true });
mkdirSync(WEB_OUT,   { recursive: true });
mkdirSync(REACT_OUT, { recursive: true });
mkdirSync(VUE_OUT,   { recursive: true });

// =============================================================================
// Style Dictionary — single build covers all platforms
// =============================================================================
const BASE_SOURCE = [
  `${ROOT}/tokens/core/**/*.json`,
  `${ROOT}/tokens/semantic/**/*.json`,
  `${ROOT}/tokens/components/**/*.json`,
];

const sd = new StyleDictionary({
  source: BASE_SOURCE,

  platforms: {
    // CSS custom properties → tokens-web (:root block only)
    css: {
      transformGroup: 'css',
      prefix: 'btech',
      buildPath: WEB_OUT,
      files: [{
        destination: 'styles.css',
        format: 'css/variables',
        options: { outputReferences: true, selector: ':root' },
      }],
    },

    // TypeScript → tokens-react
    'ts-react': {
      transformGroup: 'js',
      buildPath: REACT_OUT,
      files: [{
        destination: 'generated.ts',
        format: 'javascript/es6',
        options: { outputReferences: false },
      }],
    },

    // TypeScript → tokens-vue
    'ts-vue': {
      transformGroup: 'js',
      buildPath: VUE_OUT,
      files: [{
        destination: 'generated.ts',
        format: 'javascript/es6',
        options: { outputReferences: false },
      }],
    },

    // Dart → tokens-dart
    dart: {
      transformGroup: 'css',  // resolves refs before format runs
      buildPath: DART_OUT,
      files: [
        {
          // generated.dart — primitive + semantic static classes
          destination: 'generated.dart',
          format: 'custom/dart',
        },
        {
          // tenant.dart — BTechTenantTokens with per-tenant consts (FULLY GENERATED)
          destination: 'tenant.dart',
          format: 'custom/dart-tenants',
        },
      ],
    },
  },
});

// =============================================================================
// Run
// =============================================================================
(async () => {
  await sd.buildAllPlatforms();

  // ── Post-build: append [data-tenant="*"] blocks to styles.css ──────────
  // We need the resolved base token values — build a map from the dictionary.
  // Re-use the same source to get resolved values without a second full build.
  const baseMap: Record<string, string> = {};
  // SD doesn't expose dictionary outside formats; reconstruct from the CSS output.
  // Simpler: re-read tokens directly using flattenDTCG + manual ref resolution.
  const coreFiles   = BASE_SOURCE.flatMap(() => []);  // placeholder
  // Build base map from the generated CSS var values (reliable source of resolved values)
  const cssContent  = readFileSync(`${WEB_OUT}styles.css`, 'utf-8');
  const cssVarRe    = /--btech-([\w-]+):\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = cssVarRe.exec(cssContent)) !== null) {
    // Convert --btech-color-background-primary → color.background.primary
    const dotPath = m[1].replace(/-([a-z0-9])/g, (_, c, i, s) => {
      // Heuristic: restore dots at category boundaries
      return '_' + c;  // temp placeholder
    });
    // Simpler: just store the CSS var value keyed by CSS var name for ref resolution
    baseMap[m[1].replace(/-/g, '.')] = m[2].trim();
  }

  // Actually, rebuild baseMap properly from token source files
  const coreTokenFiles = [
    ...readdirSync(`${ROOT}/tokens/core`).map(f => `${ROOT}/tokens/core/${f}`),
    ...readdirSync(`${ROOT}/tokens/semantic`).map(f => `${ROOT}/tokens/semantic/${f}`),
  ];

  const rawBaseMap: Record<string, string> = {};
  for (const file of coreTokenFiles) {
    if (!file.endsWith('.json')) continue;
    const content = JSON.parse(readFileSync(file, 'utf-8'));
    Object.assign(rawBaseMap, flattenDTCG(content));
  }

  // Resolve all refs in rawBaseMap (two passes handles one level of indirection)
  const resolvedBaseMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawBaseMap)) {
    resolvedBaseMap[k] = resolveRef(v, rawBaseMap);
  }
  // Second pass for chained refs
  for (const [k, v] of Object.entries(resolvedBaseMap)) {
    resolvedBaseMap[k] = resolveRef(v, resolvedBaseMap);
  }

  appendTenantCSS(resolvedBaseMap);

  console.log('\n✅ Style Dictionary build complete.\n');
  console.log('   tokens/  →  packages/tokens-web/dist/styles.css  (CSS + tenant overrides)');
  console.log('   tokens/  →  packages/tokens-react/src/generated.ts');
  console.log('   tokens/  →  packages/tokens-vue/src/generated.ts');
  console.log('   tokens/  →  packages/tokens-dart/lib/src/generated.dart');
  console.log('   tokens/tenants/  →  packages/tokens-dart/lib/src/tenant.dart  ✨ auto-generated\n');
})();
