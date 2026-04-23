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

const semanticColor = loadJson('packages/tokens/sources/semantic/color.json') as TokenNode;

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
  const fg = getTokenValue(fgPath, semanticColor);
  const bg = getTokenValue(bgPath, semanticColor);

  if (!fg || !bg) {
    console.error(`  ❌  Could not resolve token paths for: ${label}`);
    hasFailures = true;
    continue;
  }

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
