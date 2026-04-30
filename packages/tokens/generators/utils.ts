import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function hexToArgb(hex: string): string {
  const clean = hex.replace('#', '');
  // Expand 3-digit shorthand → 6 digits
  const expanded = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  // CSS hex with alpha: #RRGGBBAA (8 chars) → Flutter 0xAARRGGBB
  if (expanded.length === 8) {
    const rr = expanded.slice(0, 2);
    const gg = expanded.slice(2, 4);
    const bb = expanded.slice(4, 6);
    const aa = expanded.slice(6, 8);
    return `0x${(aa + rr + gg + bb).toUpperCase()}`;
  }
  // Standard 6-digit hex: prepend full opacity FF
  return `0xFF${expanded.toUpperCase()}`;
}

export function toCamelCase(str: string): string {
  return str.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/** Flatten a DTCG JSON token tree into a Record<dotPath, rawValue>. */
export function flattenDTCG(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
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

/** Resolve a DTCG reference like "{color.blue.500}" against a base map. */
export function resolveRef(value: string, baseMap: Record<string, string>): string {
  const m = value.match(/^\{(.+)\}$/);
  if (m) return baseMap[m[1]] ?? value;
  return value;
}

/** Simple YAML serializer (avoids external dependency). */
export function toYaml(obj: unknown, indent = 0): string {
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

// =============================================================================
// CSS variable naming
// =============================================================================
// Rules:
//   color.background.*  → background-*        (drop 'color.' prefix)
//   color.text.*        → text-*              (drop 'color.' prefix)
//   color.icon.*        → icon-*              (drop 'color.' prefix)
//   color.stroke.*      → border-*            (stroke → border, drop 'color.')
//   color.{primitive}.* → color-{primitive}-* (primitives keep 'color-' prefix)
//   spacing.*           → space-*             (spacing → space)
//   typography.*        → typography-*        (keep 'typography.' prefix)
//   zIndex.*            → z-*                 (zIndex → z)
//   motion.*            → drop 'motion.'      (duration-fast, easing-ease, …)
//   radius.* / shadow.* → kept as-is
// =============================================================================

/**
 * Semantic color groups whose `color.` prefix is dropped to avoid redundancy
 * (these names already convey "color" by their property semantics).
 *
 *   color.bg.primary          → bg-primary
 *   color.text.subtle         → text-subtle
 *   color.icon.danger         → icon-danger
 *   color.border.neutral      → border-neutral
 *   color.stroke.neutral      → border-neutral   (legacy alias: stroke → border)
 *
 * Everything else under `color.*` keeps the `color-` prefix:
 *   color.blue.500            → color-blue-500
 *   color.brand.primary.50    → color-brand-primary-50
 *   color.amber.500           → color-amber-500
 *   color.ext.success         → color-ext-success
 */
const COLOR_SEMANTIC_GROUPS = new Set(['bg', 'text', 'icon', 'border']);

/**
 * Converts a token dot-path array to an Atlassian-aligned CSS variable stem
 * (no prefix, no leading `--`). camelCase segments are NOT yet kebab-cased here
 * — call `.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`)` on the result.
 *
 * @example
 * pathToCssVarStem(['color', 'bg', 'primary'])             → 'bg-primary'
 * pathToCssVarStem(['color', 'border', 'primary'])         → 'border-primary'
 * pathToCssVarStem(['color', 'stroke', 'primary'])         → 'border-primary'
 * pathToCssVarStem(['color', 'blue', '500'])               → 'color-blue-500'
 * pathToCssVarStem(['color', 'brand', 'primary', '50'])    → 'color-brand-primary-50'
 * pathToCssVarStem(['color', 'amber', '500'])              → 'color-amber-500'
 * pathToCssVarStem(['spacing', 'md'])                      → 'space-md'
 * pathToCssVarStem(['typography', 'fontFamily', 'sans'])   → 'typography-fontFamily-sans'
 * pathToCssVarStem(['zIndex', 'modal'])                    → 'z-modal'
 * pathToCssVarStem(['motion', 'duration', 'fast'])         → 'duration-fast'
 */
export function pathToCssVarStem(path: string[]): string {
  const [cat, ...rest] = path;

  switch (cat) {
    case 'color': {
      const sub = rest[0];
      if (sub === 'stroke')                    return ['border', ...rest.slice(1)].join('-');
      if (COLOR_SEMANTIC_GROUPS.has(sub))      return rest.join('-');
      // Primitives (blue, amber, neutral…) and brand swatches keep `color-` prefix
      return ['color', ...rest].join('-');
    }
    case 'spacing':
      return ['space', ...rest].join('-');
    case 'typography':
      return [cat, ...rest].join('-');
    case 'zIndex':
      return ['z', ...rest].join('-');
    case 'motion':
      return rest.join('-');
    default:
      return [cat, ...rest].join('-');
  }
}

/**
 * Full CSS variable name with optional prefix and kebab-case conversion.
 *
 * @example
 * pathToCssVar(['color', 'background', 'primary']) → '--background-primary'
 * pathToCssVar(['spacing', 'md'])                  → '--space-md'
 * pathToCssVar(['typography', 'fontFamily', 'sans'])→ '--typography-font-family-sans'
 */
export function pathToCssVar(path: string[], prefix = ''): string {
  const stem = pathToCssVarStem(path)
    .replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
  return prefix ? `--${prefix}-${stem}` : `--${stem}`;
}

/** Dart reserved words that need a trailing underscore. */
const DART_RESERVED = new Set([
  'default', 'switch', 'class', 'return', 'new', 'if', 'else',
  'for', 'while', 'in', 'is', 'super', 'this',
]);

export function dartSafeName(name: string): string {
  const camel = toCamelCase(name);
  return DART_RESERVED.has(camel) ? `${camel}_` : camel;
}
