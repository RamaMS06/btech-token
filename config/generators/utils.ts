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

/** Dart reserved words that need a trailing underscore. */
const DART_RESERVED = new Set([
  'default', 'switch', 'class', 'return', 'new', 'if', 'else',
  'for', 'while', 'in', 'is', 'super', 'this',
]);

export function dartSafeName(name: string): string {
  const camel = toCamelCase(name);
  return DART_RESERVED.has(camel) ? `${camel}_` : camel;
}
