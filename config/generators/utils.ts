import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function hexToArgb(hex: string): string {
  const clean = hex.replace('#', '');
  const padded = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  return `0xFF${padded.toUpperCase()}`;
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
// Atlassian-aligned CSS variable naming
// =============================================================================
// Rules (mirrors Atlassian's --ds-* pattern with --btech-* prefix):
//   color.background.*  → background-*        (drop 'color.' prefix)
//   color.text.*        → text-*              (drop 'color.' prefix)
//   color.icon.*        → icon-*              (drop 'color.' prefix)
//   color.stroke.*      → border-*            (stroke → border, drop 'color.')
//   color.{primitive}.* → color-{primitive}-* (primitives keep 'color-' prefix)
//   spacing.*           → space-*             (spacing → space)
//   typography.*        → drop 'typography.'  (font-family-sans, font-size-sm, …)
//   zIndex.*            → z-*                 (zIndex → z)
//   motion.*            → drop 'motion.'      (duration-fast, easing-ease, …)
//   radius.* / shadow.* → kept as-is
// =============================================================================

const PRIMITIVE_COLOR_KEYS = new Set([
  'blue', 'red', 'green', 'orange', 'neutral',
  'yellow', 'pink', 'purple', 'teal', 'slate',
]);

/**
 * Converts a token dot-path array to an Atlassian-aligned CSS variable stem
 * (no prefix, no leading `--`). camelCase segments are NOT yet kebab-cased here
 * — call `.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`)` on the result.
 *
 * @example
 * pathToCssVarStem(['color', 'background', 'primary'])  → 'background-primary'
 * pathToCssVarStem(['color', 'stroke', 'primary'])       → 'border-primary'
 * pathToCssVarStem(['color', 'blue', '500'])             → 'color-blue-500'
 * pathToCssVarStem(['spacing', 'md'])                    → 'space-md'
 * pathToCssVarStem(['typography', 'fontFamily', 'sans']) → 'fontFamily-sans'
 * pathToCssVarStem(['zIndex', 'modal'])                  → 'z-modal'
 * pathToCssVarStem(['motion', 'duration', 'fast'])       → 'duration-fast'
 */
export function pathToCssVarStem(path: string[]): string {
  const [cat, ...rest] = path;

  switch (cat) {
    case 'color': {
      const sub = rest[0];
      if (PRIMITIVE_COLOR_KEYS.has(sub)) return ['color', ...rest].join('-');
      if (sub === 'stroke')              return ['border', ...rest.slice(1)].join('-');
      return rest.join('-');
    }
    case 'spacing':
      return ['space', ...rest].join('-');
    case 'typography':
      return rest.join('-');
    case 'zIndex':
      return ['z', ...rest].join('-');
    case 'motion':
      return rest.join('-');
    default:
      return [cat, ...rest].join('-');
  }
}

/**
 * Full CSS variable name with `--btech-` prefix and kebab-case conversion.
 *
 * @example
 * pathToCssVar(['color', 'background', 'primary']) → '--btech-background-primary'
 * pathToCssVar(['spacing', 'md'])                  → '--btech-space-md'
 * pathToCssVar(['typography', 'fontFamily', 'sans'])→ '--btech-font-family-sans'
 */
export function pathToCssVar(path: string[], prefix = 'btech'): string {
  const stem = pathToCssVarStem(path)
    .replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
  return `--${prefix}-${stem}`;
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
