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

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Flatten a DTCG JSON token tree into a Record<dotPath, rawValue>.
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
 */
function resolveRef(value: string, baseMap: Record<string, string>): string {
  const m = value.match(/^\{(.+)\}$/);
  if (m) return baseMap[m[1]] ?? value;
  return value;
}

/** Simple YAML serializer (avoids external dependency) */
function toYaml(obj: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map(item => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const entries = Object.entries(item);
        const first = entries[0];
        const rest = entries.slice(1);
        let line = `${pad}- ${first[0]}: ${toYaml(first[1], indent + 2).trim()}`;
        for (const [k, v] of rest) {
          line += `\n${pad}  ${k}: ${toYaml(v, indent + 2).trim()}`;
        }
        return line;
      }
      return `${pad}- ${toYaml(item, indent + 1).trim()}`;
    }).join('\n');
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries.map(([k, v]) => {
      const val = toYaml(v, indent + 1);
      if (typeof v === 'object' && v !== null) {
        return `${pad}${k}:\n${val}`;
      }
      return `${pad}${k}: ${val}`;
    }).join('\n');
  }
  return String(obj);
}

/** Dart reserved words that need a trailing underscore */
const DART_RESERVED = new Set(['default', 'switch', 'class', 'return', 'new', 'if', 'else', 'for', 'while', 'in', 'is', 'super', 'this']);

function dartSafeName(name: string): string {
  const camel = toCamelCase(name);
  return DART_RESERVED.has(camel) ? `${camel}_` : camel;
}

// =============================================================================
// Token source data — read once, used across all generators
// =============================================================================

interface ResolvedTokenMap {
  baseMap: Record<string, string>;          // all resolved core+semantic tokens
  coreColors: Record<string, Record<string, string>>;  // e.g. { blue: { '50': '#eff6ff', ... } }
  semanticColors: Record<string, Record<string, Record<string, string>>>; // { text: { neutral: { default: '#...' } } }
  spacing: Record<string, string>;          // { xs: '4px', ... }
  radius: { core: Record<string, string>; semantic: Record<string, string> };
  typography: {
    fontFamilies: Record<string, string>;
    fontSizes: Record<string, string>;
    fontWeights: Record<string, string>;
    lineHeights: Record<string, string>;
    semantic: Record<string, Record<string, string>>;   // { body: { fontFamily: ..., fontSize: ... }, heading: { ... } }
  };
}

function loadTokenData(): ResolvedTokenMap {
  // Load all core files
  const coreDir = `${ROOT}/tokens/core`;
  const semanticDir = `${ROOT}/tokens/semantic`;

  const rawBaseMap: Record<string, string> = {};
  for (const dir of [coreDir, semanticDir]) {
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
      const content = JSON.parse(readFileSync(`${dir}/${f}`, 'utf-8'));
      Object.assign(rawBaseMap, flattenDTCG(content));
    }
  }

  // Resolve refs (two passes for chained refs)
  const resolvedBaseMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawBaseMap)) resolvedBaseMap[k] = resolveRef(v, rawBaseMap);
  for (const [k, v] of Object.entries(resolvedBaseMap)) resolvedBaseMap[k] = resolveRef(v, resolvedBaseMap);

  // Parse core colors
  const corePrimitive = JSON.parse(readFileSync(`${coreDir}/color.primitive.json`, 'utf-8'));
  const coreColors: Record<string, Record<string, string>> = {};
  for (const [group, shades] of Object.entries(corePrimitive.color as Record<string, Record<string, unknown>>)) {
    coreColors[group] = {};
    for (const [shade, token] of Object.entries(shades)) {
      if (shade.startsWith('$')) continue;
      coreColors[group][shade] = (token as any).$value;
    }
  }

  // Parse semantic colors (3-level)
  const semanticColorJson = JSON.parse(readFileSync(`${semanticDir}/color.json`, 'utf-8'));
  const semanticColors: Record<string, Record<string, Record<string, string>>> = {};
  for (const [group, categories] of Object.entries(semanticColorJson.color as Record<string, unknown>)) {
    semanticColors[group] = {};
    for (const [category, tokens] of Object.entries(categories as Record<string, unknown>)) {
      if (category.startsWith('$')) continue;
      semanticColors[group][category] = {};
      for (const [tokenName, tokenDef] of Object.entries(tokens as Record<string, unknown>)) {
        if (tokenName.startsWith('$')) continue;
        const rawVal = (tokenDef as any).$value as string;
        semanticColors[group][category][tokenName] = resolveRef(rawVal, resolvedBaseMap);
      }
    }
  }

  // Parse spacing
  const sizePrimitive = JSON.parse(readFileSync(`${coreDir}/size.primitive.json`, 'utf-8'));
  const spacing: Record<string, string> = {};
  for (const [k, v] of Object.entries(sizePrimitive.spacing as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    spacing[k] = (v as any).$value;
  }

  // Parse radius
  const radiusPrimitive = JSON.parse(readFileSync(`${coreDir}/radius.primitive.json`, 'utf-8'));
  const coreRadius: Record<string, string> = {};
  for (const [k, v] of Object.entries(radiusPrimitive.radius as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    coreRadius[k] = (v as any).$value;
  }
  const radiusSemantic = JSON.parse(readFileSync(`${semanticDir}/radius.json`, 'utf-8'));
  const semRadius: Record<string, string> = {};
  for (const [k, v] of Object.entries(radiusSemantic.radius as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    semRadius[k] = resolveRef((v as any).$value, resolvedBaseMap);
  }

  // Parse typography
  const fontPrimitive = JSON.parse(readFileSync(`${coreDir}/font.primitive.json`, 'utf-8'));
  const fontFamilies: Record<string, string> = {};
  const fontSizes: Record<string, string> = {};
  const fontWeights: Record<string, string> = {};
  const lineHeights: Record<string, string> = {};
  for (const [k, v] of Object.entries(fontPrimitive.typography.fontFamily as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    fontFamilies[k] = (v as any).$value;
  }
  for (const [k, v] of Object.entries(fontPrimitive.typography.fontSize as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    fontSizes[k] = (v as any).$value;
  }
  for (const [k, v] of Object.entries(fontPrimitive.typography.fontWeight as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    fontWeights[k] = String((v as any).$value);
  }
  for (const [k, v] of Object.entries(fontPrimitive.typography.lineHeight as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    lineHeights[k] = String((v as any).$value);
  }

  // Semantic typography groups
  const typoSemantic = JSON.parse(readFileSync(`${semanticDir}/typography.json`, 'utf-8'));
  const semanticTypo: Record<string, Record<string, string>> = {};
  for (const [group, props] of Object.entries(typoSemantic.typography as Record<string, unknown>)) {
    if (group.startsWith('$')) continue;
    semanticTypo[group] = {};
    for (const [prop, tokenDef] of Object.entries(props as Record<string, unknown>)) {
      if (prop.startsWith('$')) continue;
      semanticTypo[group][prop] = resolveRef((tokenDef as any).$value, resolvedBaseMap);
    }
  }

  return {
    baseMap: resolvedBaseMap,
    coreColors,
    semanticColors,
    spacing,
    radius: { core: coreRadius, semantic: semRadius },
    typography: { fontFamilies, fontSizes, fontWeights, lineHeights, semantic: semanticTypo },
  };
}

// =============================================================================
// DART GENERATORS — multi-file output
// =============================================================================

function generateDartFiles(data: ResolvedTokenMap): void {
  const DART_SRC = `${ROOT}/packages/tokens-dart/lib/src`;
  const DART_LIB = `${ROOT}/packages/tokens-dart/lib`;
  const HEADER = '// AUTO-GENERATED by @ramaMS06/design-tokens — do not edit manually.\n// Run `pnpm generate` to regenerate from tokens/.\n\n// ignore_for_file: lines_longer_than_80_chars\n';

  // ── src/color/ ────────────────────────────────────────────────────────────
  const colorDir = `${DART_SRC}/color`;
  mkdirSync(colorDir, { recursive: true });

  // 1. shades.color.dart — BTechShadesColor (primitive palette access)
  {
    const L = [HEADER, "import 'package:flutter/material.dart';\n"];

    // Per-group shade classes
    const groupNames: string[] = [];
    for (const [group, shades] of Object.entries(data.coreColors)) {
      const className = `BTechShades${toPascalCase(group)}Color`;
      groupNames.push(group);

      const entries = Object.entries(shades).sort((a, b) => Number(a[0]) - Number(b[0]));
      L.push(`class ${className} {`);
      L.push(`  const ${className}()`);
      const initLines = entries.map(([shade, hex], i) =>
        `    ${i === 0 ? ': ' : '  '}s${shade} = const Color(${hexToArgb(hex)})`
      );
      L.push(initLines.join(',\n') + ';');
      for (const [shade] of entries) {
        L.push(`  final Color s${shade};`);
      }
      L.push('}\n');
    }

    // Namespace class
    L.push('/// Primitive color palette. Access: BTechShadesColor.blue.s500');
    L.push('class BTechShadesColor {');
    L.push('  const BTechShadesColor();');
    for (const group of groupNames) {
      const className = `BTechShades${toPascalCase(group)}Color`;
      L.push(`  final ${className} ${group} = const ${className}();`);
    }
    L.push('}\n');

    writeFileSync(`${colorDir}/shades.color.dart`, L.join('\n') + '\n');
  }

  // 2. text.color.dart — BTechTextColor with nested variant classes
  generateDartSemanticColorGroup(colorDir, 'text', data.semanticColors.text, HEADER);

  // 3. background.color.dart
  generateDartSemanticColorGroup(colorDir, 'background', data.semanticColors.background, HEADER);

  // 4. stroke.color.dart
  generateDartSemanticColorGroup(colorDir, 'stroke', data.semanticColors.stroke, HEADER);

  // 5. color.token.dart — BTechColor namespace
  {
    const L = [HEADER];
    L.push("import 'text.color.dart';");
    L.push("import 'background.color.dart';");
    L.push("import 'stroke.color.dart';");
    L.push("import 'shades.color.dart';\n");
    L.push('/// Semantic color tokens — use context.btechColor for tenant-aware access.');
    L.push('/// BTechColor.text.danger.bolder returns the DEFAULT tenant value.');
    L.push('abstract class BTechColor {');
    L.push('  static const BTechTextColor text = BTechTextColor();');
    L.push('  static const BTechBackgroundColor background = BTechBackgroundColor();');
    L.push('  static const BTechStrokeColor stroke = BTechStrokeColor();');
    L.push('  static const BTechShadesColor shades = BTechShadesColor();');
    L.push('}\n');
    writeFileSync(`${colorDir}/color.token.dart`, L.join('\n') + '\n');
  }

  // 6. color.dart — barrel
  {
    const L = [
      "export 'shades.color.dart';",
      "export 'text.color.dart';",
      "export 'background.color.dart';",
      "export 'stroke.color.dart';",
      "export 'color.token.dart';",
      '',
    ];
    writeFileSync(`${colorDir}/color.dart`, L.join('\n'));
  }

  // 7. tokens.meta.yaml — auto-generated metadata
  generateTokensMeta(colorDir, 'color', data.semanticColors);

  // ── src/spacing/ ──────────────────────────────────────────────────────────
  const spacingDir = `${DART_SRC}/spacing`;
  mkdirSync(spacingDir, { recursive: true });

  // 8. spacing.token.dart
  {
    const L = [HEADER];
    L.push('/// Spacing tokens. Access: BTechSpacing.md');
    L.push('abstract class BTechSpacing {');
    for (const [name, value] of Object.entries(data.spacing)) {
      L.push(`  static const double ${name} = ${parseFloat(String(value).replace('px', ''))};`);
    }
    L.push('}\n');
    writeFileSync(`${spacingDir}/spacing.token.dart`, L.join('\n') + '\n');
  }

  // 9. spacing.dart — barrel
  writeFileSync(`${spacingDir}/spacing.dart`, "export 'spacing.token.dart';\n");

  // 10. tokens.meta.yaml
  {
    const meta = {
      category: 'spacing',
      figma: {
        collection: 'BTech/Spacing',
        tokens: Object.keys(data.spacing).map(name => ({
          path: `spacing.${name}`,
          figmaVariable: `Spacing/${toPascalCase(name)}`,
        })),
      },
    };
    writeFileSync(`${spacingDir}/tokens.meta.yaml`, toYaml(meta) + '\n');
  }

  // ── src/radius/ ───────────────────────────────────────────────────────────
  const radiusDir = `${DART_SRC}/radius`;
  mkdirSync(radiusDir, { recursive: true });

  // 11. radius.token.dart — combines primitive + semantic radius
  {
    const L = [HEADER];
    L.push('/// Radius tokens. Access: BTechRadius.interactive');
    L.push('abstract class BTechRadius {');
    // Primitive radius
    for (const [name, value] of Object.entries(data.radius.core)) {
      L.push(`  static const double ${name} = ${parseFloat(String(value).replace('px', ''))};`);
    }
    L.push('');
    L.push('  // Semantic radius aliases');
    for (const [name, value] of Object.entries(data.radius.semantic)) {
      L.push(`  static const double ${name} = ${parseFloat(String(value).replace('px', ''))};`);
    }
    L.push('}\n');
    writeFileSync(`${radiusDir}/radius.token.dart`, L.join('\n') + '\n');
  }

  // 12. radius.dart — barrel
  writeFileSync(`${radiusDir}/radius.dart`, "export 'radius.token.dart';\n");

  // 13. tokens.meta.yaml
  {
    const allKeys = [...Object.keys(data.radius.core), ...Object.keys(data.radius.semantic)];
    const meta = {
      category: 'radius',
      figma: {
        collection: 'BTech/Radius',
        tokens: allKeys.map(name => ({
          path: `radius.${name}`,
          figmaVariable: `Radius/${toPascalCase(name)}`,
        })),
      },
    };
    writeFileSync(`${radiusDir}/tokens.meta.yaml`, toYaml(meta) + '\n');
  }

  // ── src/typography/ ───────────────────────────────────────────────────────
  const typoDir = `${DART_SRC}/typography`;
  mkdirSync(typoDir, { recursive: true });

  // 14. heading.dart — BTechHeadingFont
  {
    const heading = data.typography.semantic.heading;
    const L = [HEADER, "import 'package:flutter/material.dart';\n"];
    L.push('/// Heading typography tokens.');
    L.push('class BTechHeadingFont {');
    L.push('  const BTechHeadingFont();');
    L.push(`  final String fontFamily = '${String(heading?.fontFamily ?? data.typography.fontFamilies.sans).split(',')[0].trim().replace(/'/g, '')}';`);
    L.push(`  final FontWeight fontWeight = FontWeight.w${heading?.fontWeight ?? '700'};`);
    L.push(`  final double lineHeight = ${heading?.lineHeight ?? '1.25'};`);
    L.push('}\n');
    writeFileSync(`${typoDir}/heading.dart`, L.join('\n') + '\n');
  }

  // 15. body.dart — BTechBodyFont
  {
    const body = data.typography.semantic.body;
    const L = [HEADER, "import 'package:flutter/material.dart';\n"];
    L.push('/// Body typography tokens.');
    L.push('class BTechBodyFont {');
    L.push('  const BTechBodyFont();');
    L.push(`  final String fontFamily = '${String(body?.fontFamily ?? data.typography.fontFamilies.sans).split(',')[0].trim().replace(/'/g, '')}';`);
    L.push(`  final double fontSize = ${parseFloat(String(body?.fontSize ?? '16').replace('px', ''))};`);
    L.push(`  final FontWeight fontWeight = FontWeight.w${body?.fontWeight ?? '400'};`);
    L.push(`  final double lineHeight = ${body?.lineHeight ?? '1.5'};`);
    L.push('}\n');
    writeFileSync(`${typoDir}/body.dart`, L.join('\n') + '\n');
  }

  // 16. font.token.dart — BTechFont namespace + primitives
  {
    const L = [HEADER, "import 'package:flutter/material.dart';"];
    L.push("import 'heading.dart';");
    L.push("import 'body.dart';\n");

    // Primitive font families
    L.push('/// Primitive font family tokens.');
    L.push('abstract class BTechFontFamily {');
    for (const [name, value] of Object.entries(data.typography.fontFamilies)) {
      const fam = String(value).split(',')[0].trim().replace(/'/g, '');
      L.push(`  static const String ${name} = '${fam}';`);
    }
    L.push('}\n');

    // Primitive font sizes
    L.push('/// Primitive font size tokens.');
    L.push('abstract class BTechFontSize {');
    for (const [name, value] of Object.entries(data.typography.fontSizes)) {
      const safeName = /^[0-9]/.test(name) ? `s${name}` : name;
      L.push(`  static const double ${safeName} = ${parseFloat(String(value).replace('px', ''))};`);
    }
    L.push('}\n');

    // Primitive font weights
    L.push('/// Primitive font weight tokens.');
    L.push('abstract class BTechFontWeight {');
    for (const [name, value] of Object.entries(data.typography.fontWeights)) {
      L.push(`  static const FontWeight ${name} = FontWeight.w${Number(value)};`);
    }
    L.push('}\n');

    // Primitive line heights
    L.push('/// Primitive line height tokens.');
    L.push('abstract class BTechLineHeight {');
    for (const [name, value] of Object.entries(data.typography.lineHeights)) {
      L.push(`  static const double ${name} = ${Number(value)};`);
    }
    L.push('}\n');

    // BTechFont namespace
    L.push('/// Typography namespace. Access: BTechFont.heading.fontFamily');
    L.push('abstract class BTechFont {');
    L.push('  static const BTechHeadingFont heading = BTechHeadingFont();');
    L.push('  static const BTechBodyFont body = BTechBodyFont();');
    L.push('}\n');

    writeFileSync(`${typoDir}/font.token.dart`, L.join('\n') + '\n');
  }

  // 17. typography.dart — barrel
  {
    const L = [
      "export 'heading.dart';",
      "export 'body.dart';",
      "export 'font.token.dart';",
      '',
    ];
    writeFileSync(`${typoDir}/typography.dart`, L.join('\n'));
  }

  // 18. tokens.meta.yaml
  {
    const tokens: Array<{ path: string; figmaVariable: string }> = [];
    for (const [group, props] of Object.entries(data.typography.semantic)) {
      for (const prop of Object.keys(props)) {
        tokens.push({
          path: `typography.${group}.${prop}`,
          figmaVariable: `Typography/${toPascalCase(group)}/${toPascalCase(prop)}`,
        });
      }
    }
    const meta = {
      category: 'typography',
      figma: { collection: 'BTech/Typography', tokens },
    };
    writeFileSync(`${typoDir}/tokens.meta.yaml`, toYaml(meta) + '\n');
  }

  // 19. btech_tokens.dart — root barrel
  {
    const L = [
      "/// btech_tokens — Multi-tenant design tokens for Flutter (BTech Design System).",
      '///',
      '/// Usage:',
      '/// ```dart',
      "/// MaterialApp(",
      "///   theme: BTechTheme.forTenant('tenant-a', Brightness.light),",
      '///   home: MyApp(),',
      '/// )',
      '/// ```',
      'library btech_tokens;',
      '',
      "export 'src/color/color.dart';",
      "export 'src/spacing/spacing.dart';",
      "export 'src/radius/radius.dart';",
      "export 'src/typography/typography.dart';",
      "export 'src/theme.dart';",
      "export 'src/tenant.dart';",
      "export 'src/context.dart';",
      '',
    ];
    writeFileSync(`${DART_LIB}/btech_tokens.dart`, L.join('\n'));
  }
}

/**
 * Generate a semantic color group file using the `extends Color` pattern.
 *
 * Each leaf class IS a Color (the default/base value) via `extends Color`.
 * Variant keys (hover, subtle, bolder, …) become final fields on the same class.
 *
 * This means:
 *   BTechColor.background.primary          → Color directly (no .default_ suffix)
 *   BTechColor.background.primary.hover    → Color (hover variant)
 *   BTechColor.text.neutral                → Color directly
 *   BTechColor.text.neutral.subtle         → Color
 *
 * Rules:
 *   - Key named "default" or "base" → becomes super() (the Color value itself)
 *   - If neither exists → first key becomes super()
 *   - All other keys → final Color fields
 *   - super() MUST be last in Dart initializer list
 */
function generateDartSemanticColorGroup(
  dir: string,
  groupName: string,
  categories: Record<string, Record<string, string>>,
  header: string,
): void {
  const groupPascal = toPascalCase(groupName);
  const L = [header, "import 'package:flutter/material.dart';\n"];

  for (const [category, tokens] of Object.entries(categories)) {
    const className = `BTech${groupPascal}${toPascalCase(category)}Color`;
    const entries = Object.entries(tokens);

    // Identify which key is the "default" → becomes super() value
    const defaultKey =
      entries.find(([k]) => k === 'default' || k === 'base')?.[0] ?? entries[0][0];
    const defaultHex = tokens[defaultKey];
    const variantEntries = entries.filter(([k]) => k !== defaultKey);

    L.push(`class ${className} extends Color {`);

    if (variantEntries.length === 0) {
      // Single default value — simple one-liner constructor
      L.push(`  const ${className}() : super(${hexToArgb(defaultHex)});`);
    } else {
      // Has variants — initializer list; super() MUST be last per Dart spec
      L.push(`  const ${className}()`);
      const initLines = variantEntries.map(([name, hex], i) =>
        `    ${i === 0 ? ': ' : '  '}${dartSafeName(name)} = const Color(${hexToArgb(hex)})`
      );
      initLines.push(`      super(${hexToArgb(defaultHex)})`);
      L.push(initLines.join(',\n') + ';');
      for (const [name] of variantEntries) {
        L.push(`  final Color ${dartSafeName(name)};`);
      }
    }
    L.push('}\n');
  }

  // Group class — unchanged, holds one const instance per category
  const groupClassName = `BTech${groupPascal}Color`;
  const catEntries = Object.entries(categories);
  L.push(`/// Semantic ${groupName} color tokens.`);
  L.push(`/// Each property IS a [Color] directly; variants are sub-fields.`);
  L.push(`/// Example: BTech${groupPascal}Color.${dartSafeName(catEntries[0]?.[0] ?? 'item')} → Color`);
  L.push(`class ${groupClassName} {`);
  L.push(`  const ${groupClassName}()`);
  const initLines = catEntries.map(([category], i) => {
    const catClassName = `BTech${groupPascal}${toPascalCase(category)}Color`;
    return `    ${i === 0 ? ': ' : '  '}${dartSafeName(category)} = const ${catClassName}()`;
  });
  L.push(initLines.join(',\n') + ';');
  for (const [category] of catEntries) {
    const catClassName = `BTech${groupPascal}${toPascalCase(category)}Color`;
    L.push(`  final ${catClassName} ${dartSafeName(category)};`);
  }
  L.push('}\n');

  writeFileSync(`${dir}/${groupName}.color.dart`, L.join('\n') + '\n');
}

/** Generate tokens.meta.yaml for a semantic color group */
function generateTokensMeta(
  dir: string,
  category: string,
  semanticColors: Record<string, Record<string, Record<string, string>>>,
): void {
  const tokens: Array<{ path: string; figmaVariable: string }> = [];
  for (const [group, categories] of Object.entries(semanticColors)) {
    for (const [cat, toks] of Object.entries(categories)) {
      for (const name of Object.keys(toks)) {
        tokens.push({
          path: `color.${group}.${cat}.${name}`,
          figmaVariable: `${toPascalCase(group)}/${toPascalCase(cat)}/${toPascalCase(name)}`,
        });
      }
    }
  }
  const meta = { category, figma: { collection: `BTech/${toPascalCase(category)}`, tokens } };
  writeFileSync(`${dir}/tokens.meta.yaml`, toYaml(meta) + '\n');
}

// =============================================================================
// TypeScript GENERATORS — multi-file output
// =============================================================================

function generateTsFiles(data: ResolvedTokenMap, outDir: string): void {
  const HEADER = '// AUTO-GENERATED by @ramaMS06/design-tokens — do not edit manually.\n// Run `pnpm generate` to regenerate from tokens/.\n';

  // ── color/ ────────────────────────────────────────────────────────────────
  const colorDir = `${outDir}/color`;
  mkdirSync(colorDir, { recursive: true });

  // shades.color.ts
  {
    const L = [HEADER];
    for (const [group, shades] of Object.entries(data.coreColors)) {
      const className = `BTechShades${toPascalCase(group)}Color`;
      const entries = Object.entries(shades).sort((a, b) => Number(a[0]) - Number(b[0]));
      L.push(`export class ${className} {`);
      for (const [shade, hex] of entries) {
        L.push(`  readonly s${shade} = '${hex}' as const;`);
      }
      L.push('}\n');
    }
    L.push('export class BTechShadesColor {');
    for (const group of Object.keys(data.coreColors)) {
      const className = `BTechShades${toPascalCase(group)}Color`;
      L.push(`  readonly ${group} = new ${className}();`);
    }
    L.push('}\n');
    writeFileSync(`${colorDir}/shades.color.ts`, L.join('\n') + '\n');
  }

  // text.color.ts, background.color.ts, stroke.color.ts
  for (const groupName of ['text', 'background', 'stroke'] as const) {
    generateTsSemanticColorGroup(colorDir, groupName, data.semanticColors[groupName], HEADER);
  }

  // color.token.ts
  {
    const L = [HEADER];
    L.push("import { BTechTextColor } from './text.color';");
    L.push("import { BTechBackgroundColor } from './background.color';");
    L.push("import { BTechStrokeColor } from './stroke.color';");
    L.push("import { BTechShadesColor } from './shades.color';\n");
    L.push('export const BTechColor = {');
    L.push('  text: new BTechTextColor(),');
    L.push('  background: new BTechBackgroundColor(),');
    L.push('  stroke: new BTechStrokeColor(),');
    L.push('  shades: new BTechShadesColor(),');
    L.push('} as const;\n');
    writeFileSync(`${colorDir}/color.token.ts`, L.join('\n') + '\n');
  }

  // index.ts (barrel)
  {
    const L = [
      "export * from './shades.color';",
      "export * from './text.color';",
      "export * from './background.color';",
      "export * from './stroke.color';",
      "export { BTechColor } from './color.token';",
      '',
    ];
    writeFileSync(`${colorDir}/index.ts`, L.join('\n'));
  }

  // tokens.meta.yaml
  generateTokensMeta(colorDir, 'color', data.semanticColors);

  // ── spacing/ ──────────────────────────────────────────────────────────────
  const spacingDir = `${outDir}/spacing`;
  mkdirSync(spacingDir, { recursive: true });

  {
    const L = [HEADER];
    L.push('export const BTechSpacing = {');
    for (const [name, value] of Object.entries(data.spacing)) {
      L.push(`  ${name}: ${parseFloat(String(value).replace('px', ''))},`);
    }
    L.push('} as const;\n');
    writeFileSync(`${spacingDir}/spacing.token.ts`, L.join('\n') + '\n');
  }
  writeFileSync(`${spacingDir}/index.ts`, "export { BTechSpacing } from './spacing.token';\n");
  {
    const meta = {
      category: 'spacing',
      figma: {
        collection: 'BTech/Spacing',
        tokens: Object.keys(data.spacing).map(name => ({
          path: `spacing.${name}`,
          figmaVariable: `Spacing/${toPascalCase(name)}`,
        })),
      },
    };
    writeFileSync(`${spacingDir}/tokens.meta.yaml`, toYaml(meta) + '\n');
  }

  // ── radius/ ───────────────────────────────────────────────────────────────
  const radiusDir = `${outDir}/radius`;
  mkdirSync(radiusDir, { recursive: true });

  {
    const L = [HEADER];
    L.push('export const BTechRadius = {');
    for (const [name, value] of Object.entries(data.radius.core)) {
      L.push(`  ${name}: ${parseFloat(String(value).replace('px', ''))},`);
    }
    for (const [name, value] of Object.entries(data.radius.semantic)) {
      L.push(`  ${name}: ${parseFloat(String(value).replace('px', ''))},`);
    }
    L.push('} as const;\n');
    writeFileSync(`${radiusDir}/radius.token.ts`, L.join('\n') + '\n');
  }
  writeFileSync(`${radiusDir}/index.ts`, "export { BTechRadius } from './radius.token';\n");
  {
    const allKeys = [...Object.keys(data.radius.core), ...Object.keys(data.radius.semantic)];
    const meta = {
      category: 'radius',
      figma: {
        collection: 'BTech/Radius',
        tokens: allKeys.map(name => ({
          path: `radius.${name}`,
          figmaVariable: `Radius/${toPascalCase(name)}`,
        })),
      },
    };
    writeFileSync(`${radiusDir}/tokens.meta.yaml`, toYaml(meta) + '\n');
  }

  // ── typography/ ───────────────────────────────────────────────────────────
  const typoDir = `${outDir}/typography`;
  mkdirSync(typoDir, { recursive: true });

  {
    const L = [HEADER];
    // Primitive font data
    L.push('export const BTechFontFamily = {');
    for (const [name, value] of Object.entries(data.typography.fontFamilies)) {
      const fam = String(value).split(',')[0].trim().replace(/'/g, '');
      L.push(`  ${name}: '${fam}',`);
    }
    L.push('} as const;\n');

    L.push('export const BTechFontSize = {');
    for (const [name, value] of Object.entries(data.typography.fontSizes)) {
      const safeName = /^[0-9]/.test(name) ? `s${name}` : name;
      L.push(`  ${safeName}: ${parseFloat(String(value).replace('px', ''))},`);
    }
    L.push('} as const;\n');

    L.push('export const BTechFontWeight = {');
    for (const [name, value] of Object.entries(data.typography.fontWeights)) {
      L.push(`  ${name}: ${Number(value)},`);
    }
    L.push('} as const;\n');

    L.push('export const BTechLineHeight = {');
    for (const [name, value] of Object.entries(data.typography.lineHeights)) {
      L.push(`  ${name}: ${Number(value)},`);
    }
    L.push('} as const;\n');

    // BTechFont namespace
    L.push('export const BTechFont = {');
    L.push('  heading: {');
    const heading = data.typography.semantic.heading;
    if (heading) {
      if (heading.fontFamily) L.push(`    fontFamily: '${String(heading.fontFamily).split(',')[0].trim().replace(/'/g, '')}',`);
      if (heading.fontWeight) L.push(`    fontWeight: ${Number(heading.fontWeight)},`);
      if (heading.lineHeight) L.push(`    lineHeight: ${Number(heading.lineHeight)},`);
    }
    L.push('  },');
    L.push('  body: {');
    const body = data.typography.semantic.body;
    if (body) {
      if (body.fontFamily) L.push(`    fontFamily: '${String(body.fontFamily).split(',')[0].trim().replace(/'/g, '')}',`);
      if (body.fontSize) L.push(`    fontSize: ${parseFloat(String(body.fontSize).replace('px', ''))},`);
      if (body.fontWeight) L.push(`    fontWeight: ${Number(body.fontWeight)},`);
      if (body.lineHeight) L.push(`    lineHeight: ${Number(body.lineHeight)},`);
    }
    L.push('  },');
    L.push('} as const;\n');

    writeFileSync(`${typoDir}/font.token.ts`, L.join('\n') + '\n');
  }
  writeFileSync(`${typoDir}/index.ts`, "export * from './font.token';\n");
  {
    const tokens: Array<{ path: string; figmaVariable: string }> = [];
    for (const [group, props] of Object.entries(data.typography.semantic)) {
      for (const prop of Object.keys(props)) {
        tokens.push({
          path: `typography.${group}.${prop}`,
          figmaVariable: `Typography/${toPascalCase(group)}/${toPascalCase(prop)}`,
        });
      }
    }
    const meta = {
      category: 'typography',
      figma: { collection: 'BTech/Typography', tokens },
    };
    writeFileSync(`${typoDir}/tokens.meta.yaml`, toYaml(meta) + '\n');
  }

  // ── Root index.ts — barrel ────────────────────────────────────────────────
  // Preserve existing index.ts (TokenProvider/tokenPlugin) and append exports
  const existingIndex = existsSync(`${outDir}/index.ts`)
    ? readFileSync(`${outDir}/index.ts`, 'utf-8')
    : '';

  // Only append if not already there
  const newExports = [
    "export * from './color/index';",
    "export * from './spacing/index';",
    "export * from './radius/index';",
    "export * from './typography/index';",
  ];

  const missingExports = newExports.filter(e => !existingIndex.includes(e));
  if (missingExports.length > 0) {
    const updatedIndex = existingIndex.trimEnd() + '\n\n// Token exports (auto-generated)\n' + missingExports.join('\n') + '\n';
    writeFileSync(`${outDir}/index.ts`, updatedIndex);
  }
}

/**
 * Generate a semantic color group file for TypeScript.
 *
 * The "default" / "base" key is flattened to the parent group class directly
 * so that BTechColor.background.primary returns the hex string with no suffix.
 * Variant keys (hover, subtle, bolder, …) are appended with PascalCase suffix.
 *
 * Example output:
 *   BTechColor.background.primary       // '#15803D'
 *   BTechColor.background.primaryHover  // '#166534'
 *   BTechColor.text.neutral             // '#111827'
 *   BTechColor.text.neutralSubtle       // '#6B7280'
 */
function generateTsSemanticColorGroup(
  dir: string,
  groupName: string,
  categories: Record<string, Record<string, string>>,
  header: string,
): void {
  const groupPascal = toPascalCase(groupName);
  const L = [header];

  const groupClassName = `BTech${groupPascal}Color`;
  L.push(`export class ${groupClassName} {`);

  for (const [category, tokens] of Object.entries(categories)) {
    const entries = Object.entries(tokens);
    const defaultKey =
      entries.find(([k]) => k === 'default' || k === 'base')?.[0] ?? entries[0][0];

    for (const [name, hex] of entries) {
      if (name === defaultKey) {
        // Default → property named after the category (no suffix)
        L.push(`  readonly ${dartSafeName(category)} = '${hex}' as const;`);
      } else {
        // Variant → category + PascalCase variant name
        L.push(`  readonly ${dartSafeName(category)}${toPascalCase(name)} = '${hex}' as const;`);
      }
    }
  }

  L.push('}\n');

  writeFileSync(`${dir}/${groupName}.color.ts`, L.join('\n') + '\n');
}

// =============================================================================
// Token → Dart tenant field map (UPDATED for 3-level paths)
// =============================================================================
const TENANT_FIELD_MAP: Array<{
  path: string;
  field: string;
  type: 'Color' | 'double' | 'String';
}> = [
  // color.background
  { path: 'color.background.primary.default',    field: 'colorBackgroundPrimary',         type: 'Color'  },
  { path: 'color.background.primary.hover',      field: 'colorBackgroundPrimaryHover',    type: 'Color'  },
  { path: 'color.background.secondary.default',  field: 'colorBackgroundSecondary',       type: 'Color'  },
  { path: 'color.background.secondary.hover',    field: 'colorBackgroundSecondaryHover',  type: 'Color'  },
  { path: 'color.background.danger.default',     field: 'colorBackgroundDanger',          type: 'Color'  },
  { path: 'color.background.surface.default',    field: 'colorBackgroundSurface',         type: 'Color'  },
  { path: 'color.background.surface.subtle',     field: 'colorBackgroundSurfaceSubtle',   type: 'Color'  },
  { path: 'color.background.surface.raised',     field: 'colorBackgroundSurfaceRaised',   type: 'Color'  },
  // color.text
  { path: 'color.text.neutral.default',          field: 'colorTextNeutral',               type: 'Color'  },
  { path: 'color.text.neutral.subtle',           field: 'colorTextNeutralSubtle',         type: 'Color'  },
  { path: 'color.text.neutral.disabled',         field: 'colorTextNeutralDisabled',       type: 'Color'  },
  { path: 'color.text.neutral.inverse',          field: 'colorTextNeutralInverse',        type: 'Color'  },
  { path: 'color.text.on.primary',               field: 'colorTextOnPrimary',             type: 'Color'  },
  { path: 'color.text.on.secondary',             field: 'colorTextOnSecondary',           type: 'Color'  },
  { path: 'color.text.on.danger',                field: 'colorTextOnDanger',              type: 'Color'  },
  // color.stroke
  { path: 'color.stroke.primary.default',        field: 'colorStrokePrimary',             type: 'Color'  },
  { path: 'color.stroke.neutral.default',        field: 'colorStrokeNeutral',             type: 'Color'  },
  { path: 'color.stroke.neutral.strong',         field: 'colorStrokeNeutralStrong',       type: 'Color'  },
  // radius
  { path: 'radius.interactive',                  field: 'radiusInteractive',              type: 'double' },
  { path: 'radius.card',                         field: 'radiusCard',                     type: 'double' },
  { path: 'radius.badge',                        field: 'radiusBadge',                    type: 'double' },
  // typography
  { path: 'typography.fontFamily.sans',          field: 'typographyFontFamilySans',       type: 'String' },
];

// =============================================================================
// Format: custom/dart-tenants
// =============================================================================
const dartTenantsFormat: Format = {
  name: 'custom/dart-tenants',
  format: ({ dictionary }) => {
    const baseMap: Record<string, string> = {};
    for (const t of dictionary.allTokens) {
      baseMap[t.path.join('.')] = String(t.value ?? t.$value);
    }

    const tenantsDir = `${ROOT}/tokens/tenants`;
    const tenantIds = readdirSync(tenantsDir)
      .filter(d => existsSync(`${tenantsDir}/${d}/overrides.json`))
      .sort((a, b) => (a === 'default' ? -1 : b === 'default' ? 1 : a.localeCompare(b)));

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

    const L: string[] = [
      '// AUTO-GENERATED by @ramaMS06/design-tokens — do not edit manually.',
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

    for (const f of TENANT_FIELD_MAP) {
      L.push(`  final ${f.type} ${f.field};`);
    }
    L.push('');

    L.push('  const BTechTenantTokens({');
    for (const f of TENANT_FIELD_MAP) L.push(`    required this.${f.field},`);
    L.push('  });');
    L.push('');

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
      // Strip `.default` suffix — `color.background.primary.default` → `--btech-color-background-primary`
      const cleanPath = tokenPath.replace(/\.default$/, '');
      const cssVar   = `--btech-${cleanPath.replace(/\./g, '-').replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)}`;
      blocks.push(`  ${cssVar}: ${resolved};`);
    }

    blocks.push('}');
  }

  appendFileSync(cssOutPath, blocks.join('\n') + '\n');
  console.log(`  Appended ${tenantIds.length} tenant CSS override blocks to styles.css`);
}

// =============================================================================
// Token type generator — produces packages/tokens-web/src/token.ts
// =============================================================================

/**
 * Scans all DTCG source files (core + semantic + components),
 * flattens to dot-notation paths, strips `.default` suffix, deduplicates,
 * and writes the typed token() helper to tokens-web/src/token.ts.
 *
 * Called automatically as part of `pnpm generate`.
 */
function generateTokenTypes(webSrcPath: string): void {
  const dirs = [
    `${ROOT}/tokens/core`,
    `${ROOT}/tokens/semantic`,
    `${ROOT}/tokens/components`,
  ];

  const allPaths = new Set<string>();

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const content = JSON.parse(readFileSync(`${dir}/${file}`, 'utf-8'));
      const flat = flattenDTCG(content);
      for (const rawPath of Object.keys(flat)) {
        // Strip `.default` suffix — matches CSS var stripping behaviour
        const cleanPath = rawPath.replace(/\.default$/, '');
        allPaths.add(cleanPath);
      }
    }
  }

  const sorted = [...allPaths].sort();
  const unionLines = sorted.map(p => `  | '${p}'`).join('\n');

  const out = [
    `// AUTO-GENERATED by @ramaMS06/design-tokens — do not edit manually.`,
    `// Run \`pnpm generate\` to regenerate from tokens/.`,
    ``,
    `/**`,
    ` * All valid BTech design token paths.`,
    ` * Mirrors Atlassian's token naming approach — semantic, predictable, autocomplete-friendly.`,
    ` *`,
    ` * Grammar: [category].[property].[role].[emphasis].[state]`,
    ` *`,
    ` * @example`,
    ` * 'color.background.primary'        — primary brand background`,
    ` * 'color.text.neutral.subtle'       — secondary text color`,
    ` * 'color.stroke.neutral'            — default border/stroke`,
    ` * 'spacing.md'                      — medium spacing (16px)`,
    ` * 'radius.interactive'              — button/input border radius`,
    ` */`,
    `export type TokenPath =`,
    unionLines,
    ``,
    `/**`,
    ` * Returns the CSS custom property reference for a design token.`,
    ` * Type-safe wrapper — analogous to Atlassian's \`token()\` from \`@atlaskit/tokens\`.`,
    ` *`,
    ` * @example`,
    ` * import { token } from '@ramaMS06/tokens-web'`,
    ` *`,
    ` * // CSS-in-JS / inline style / Vue :style`,
    ` * const styles = {`,
    ` *   background:   token('color.background.primary'),`,
    ` *   color:        token('color.text.on.primary'),`,
    ` *   padding:      token('spacing.md'),`,
    ` *   borderRadius: token('radius.interactive'),`,
    ` * }`,
    ` *`,
    ` * // With CSS fallback`,
    ` * token('color.background.primary', '#15803d')`,
    ` * // → "var(--btech-color-background-primary, #15803d)"`,
    ` *`,
    ` * @param path     - A valid BTech token path (fully type-checked, autocomplete available)`,
    ` * @param fallback - Optional CSS fallback value if the variable is not defined`,
    ` * @returns CSS var() string ready for use in style objects or CSS-in-JS`,
    ` */`,
    `export function token(path: TokenPath, fallback?: string): string {`,
    `  const cssVar = \`--btech-\${path.replace(/\\./g, '-').replace(/([A-Z])/g, (m) => \`-\${m.toLowerCase()}\`)}\`;`,
    `  return fallback ? \`var(\${cssVar}, \${fallback})\` : \`var(\${cssVar})\`;`,
    `}`,
    ``,
    `/**`,
    ` * Returns the raw CSS variable name for a token (without var() wrapper).`,
    ` * Useful when composing CSS manually, in SCSS \`#{}\` interpolation,`,
    ` * or passing to third-party libraries that expect a variable name.`,
    ` *`,
    ` * @example`,
    ` * cssVar('color.background.primary')`,
    ` * // → '--btech-color-background-primary'`,
    ` *`,
    ` * @param path - A valid BTech token path`,
    ` */`,
    `export function cssVar(path: TokenPath): string {`,
    `  return \`--btech-\${path.replace(/\\./g, '-').replace(/([A-Z])/g, (m) => \`-\${m.toLowerCase()}\`)}\`;`,
    `}`,
    ``,
  ].join('\n');

  writeFileSync(`${webSrcPath}token.ts`, out, 'utf-8');
}

// =============================================================================
// Register formats
// =============================================================================
StyleDictionary.registerFormat(dartTenantsFormat);

// =============================================================================
// Ensure output dirs
// =============================================================================
const DART_OUT  = `${ROOT}/packages/tokens-dart/lib/src/`;
const WEB_OUT   = `${ROOT}/packages/tokens-web/dist/`;
// Framework-agnostic TS tokens live in tokens-web/src — React/Vue import from @ramaMS06/tokens-web
const WEB_SRC   = `${ROOT}/packages/tokens-web/src/`;
mkdirSync(DART_OUT, { recursive: true });
mkdirSync(WEB_OUT,  { recursive: true });
mkdirSync(WEB_SRC,  { recursive: true });

// =============================================================================
// Style Dictionary — CSS + tenant.dart only (multi-file generators handle rest)
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

    // Dart tenant.dart only — category files generated by our multi-file generator
    dart: {
      transformGroup: 'css',
      buildPath: DART_OUT,
      files: [
        {
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
  // Load token data once for multi-file generators
  const data = loadTokenData();

  // Generate multi-file Dart output
  generateDartFiles(data);
  console.log('  Flutter — multi-file token output generated');

  // Generate multi-file TypeScript output — framework-agnostic, lives in tokens-web/src/
  // React and Vue consume these via `import { BTechColor } from '@ramaMS06/tokens-web'`
  generateTsFiles(data, WEB_SRC);
  console.log('  Web (shared) — multi-file token output generated');

  // Generate typed token() helper + TokenPath union type
  generateTokenTypes(WEB_SRC);
  console.log('  Token types  — token.ts + TokenPath generated');

  // Build SD platforms (CSS + tenant.dart)
  await sd.buildAllPlatforms();

  // Post-build: strip `-default` suffix from all CSS variable names and references.
  // SD converts token path `color.background.primary.default` → `--btech-...-default`
  // but we want clean names: `--btech-color-background-primary`.
  const cssPath = `${WEB_OUT}styles.css`;
  const rawCss = readFileSync(cssPath, 'utf8');
  const cleanedCss = rawCss
    .replace(/--btech-([a-z0-9-]+)-default([\s:);,])/g, '--btech-$1$2')
    .replace(/--btech-([a-z0-9-]+)-default([\s:);,])/g, '--btech-$1$2'); // run twice for chained refs
  writeFileSync(cssPath, cleanedCss, 'utf8');

  // Post-build: append tenant CSS overrides
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

  const resolvedBaseMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawBaseMap)) resolvedBaseMap[k] = resolveRef(v, rawBaseMap);
  for (const [k, v] of Object.entries(resolvedBaseMap)) resolvedBaseMap[k] = resolveRef(v, resolvedBaseMap);

  appendTenantCSS(resolvedBaseMap);

  console.log('\n✅  pnpm generate complete\n');
  console.log('  📱 Flutter   → packages/tokens-dart/lib/src/{color,spacing,radius,typography}/');
  console.log('                 packages/tokens-dart/lib/src/tenant.dart');
  console.log('  🌐 Web       → packages/tokens-web/src/{color,spacing,radius,typography}/');
  console.log('                 packages/tokens-web/src/token.ts (TokenPath + token())');
  console.log('                 packages/tokens-web/dist/styles.css');
  console.log('  ⚛️  React     → re-exports from @ramaMS06/tokens-web (no separate generation)');
  console.log('  💚 Vue       → re-exports from @ramaMS06/tokens-web (no separate generation)');
  console.log('');
})();
