/**
 * WCAG AA/AAA contrast ratio validator
 * Checks all foreground/background token pairs in semantic/color.json
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(linearize);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface TokenNode {
  $value?: string;
  $type?: string;
  [key: string]: TokenNode | string | undefined;
}

function loadJson(path: string): TokenNode {
  return JSON.parse(readFileSync(resolve(ROOT, path), 'utf-8'));
}

/** Recursively flatten a DTCG tree into a "dot.path" -> "$value" map. */
function flatten(node: TokenNode, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (node && typeof node === 'object' && '$value' in node && typeof node.$value === 'string') {
    out[prefix] = node.$value;
    return out;
  }
  for (const [k, v] of Object.entries(node ?? {})) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object') {
      Object.assign(out, flatten(v as TokenNode, prefix ? `${prefix}.${k}` : k));
    }
  }
  return out;
}

/** Resolve {alias} references in a flat map. Multiple passes for chained refs. */
function resolveMap(raw: Record<string, string>): Record<string, string> {
  const resolveOne = (val: string, map: Record<string, string>): string => {
    const m = val.match(/^\{(.+)\}$/);
    return m ? (map[m[1]] ?? val) : val;
  };
  let out: Record<string, string> = { ...raw };
  for (let i = 0; i < 5; i++) {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(out)) next[k] = resolveOne(v, out);
    out = next;
  }
  return out;
}

const semanticColor = loadJson('packages/tokens/sources/semantic/color.json') as TokenNode;

// Build a resolved hex map from core + semantic so semantic aliases like
// `{color.neutral.800}` resolve to actual hex values.
const rawTokenMap: Record<string, string> = {};
for (const path of [
  'packages/tokens/sources/core/color.primitive.json',
  'packages/tokens/sources/core/color.brand.json',
  'packages/tokens/sources/semantic/color.json',
]) {
  Object.assign(rawTokenMap, flatten(loadJson(path)));
}
const resolvedTokenMap = resolveMap(rawTokenMap);

// Pairs to check: [fg token path, bg token path, context]
// Paths must match the actual DTCG structure in sources/semantic/color.json
const pairs: Array<[string[], string[], string]> = [
  [['color', 'text', 'primary'],   ['color', 'bg', 'primary'],  'body text on surface'],
  [['color', 'text', 'secondary'], ['color', 'bg', 'primary'],  'subtle text on surface'],
  [['color', 'text', 'inverse'],   ['color', 'bg', 'tertiary'], 'inverse text on dark surface'],
  [['color', 'text', 'error'],     ['color', 'bg', 'primary'],  'error text on surface'],
  [['color', 'text', 'link'],      ['color', 'bg', 'primary'],  'link text on surface'],
];

function getTokenValue(path: string[], tokens: TokenNode): string | null {
  let node: TokenNode | string | undefined = tokens;
  for (const key of path) {
    if (typeof node !== 'object' || node === null) return null;
    node = (node as TokenNode)[key];
  }
  if (typeof node === 'object' && node !== null && typeof node.$value === 'string') {
    return node.$value;
  }
  return null;
}

let hasFailures = false;

console.log('\n🔍 WCAG contrast validation\n');

for (const [fgPath, bgPath, label] of pairs) {
  const fgRaw = getTokenValue(fgPath, semanticColor);
  const bgRaw = getTokenValue(bgPath, semanticColor);

  if (!fgRaw || !bgRaw) {
    console.error(`  ❌  Could not resolve token paths for: ${label}`);
    hasFailures = true;
    continue;
  }

  // Follow alias chain to a concrete hex (semantic aliases primitive ramps).
  const resolveValue = (val: string): string => {
    const m = val.match(/^\{(.+)\}$/);
    return m ? (resolvedTokenMap[m[1]] ?? val) : val;
  };
  const fg = resolveValue(fgRaw);
  const bg = resolveValue(bgRaw);

  const ratio = contrastRatio(fg, bg);
  const passAA  = ratio >= 4.5;
  const passAAA = ratio >= 7;
  const icon = passAA ? (passAAA ? '✅ AAA' : '✅ AA ') : '❌ FAIL';

  console.log(`  ${icon}  ${ratio.toFixed(2)}:1  — ${label} (${fg} on ${bg})`);

  if (!passAA) {
    hasFailures = true;
  }
}

console.log('');

if (hasFailures) {
  console.error('❌ Contrast validation failed — fix the tokens above.\n');
  process.exit(1);
} else {
  console.log('✅ All contrast checks passed.\n');
}
