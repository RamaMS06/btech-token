/**
 * DTCG ↔ Figma Variable converters
 * ----------------------------------
 * Pure functions only — no DOM, no figma.* — so the same module loads in
 * the UI iframe and the main thread.
 *
 * Why these live here:
 *   The plugin needs round-trip conversion in BOTH directions:
 *   - Import: Figma Variable / Style → DTCG token  (figma-import.ts)
 *   - Export: DTCG token → Figma Variable          (figma-export.ts)
 *   Centralising the format rules in one place means the two passes can
 *   never drift — a hex-with-alpha that encodes one way decodes back to
 *   the same RGBA on the other side.
 *
 * DTCG spec: https://tr.designtokens.org/format/
 * Figma Variables API: https://www.figma.com/plugin-docs/api/Variables/
 */

import type { DTCGType } from './types.js';
import type { ImportOptions } from './figma-types.js';

// ── Type mapping ────────────────────────────────────────────────────────────

/**
 * Figma's resolved variable types are a small superset of what DTCG calls
 * primitives. We use the exact strings the API returns so callers can pass
 * `Variable.resolvedType` straight through.
 */
export type FigmaResolvedType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

/**
 * Map a DTCG `$type` to the Figma Variable type it would land on. Returns
 * `null` for *composite* DTCG types (`shadow`, `gradient`, `border`, ...);
 * these can't be expressed as a single Figma Variable so the export path
 * skips them with a warning.
 */
export function dtcgTypeToFigmaType($type: DTCGType): FigmaResolvedType | null {
  switch ($type) {
    case 'color':
      return 'COLOR';
    case 'dimension':
    case 'number':
    case 'duration':
      return 'FLOAT';
    case 'fontWeight':
      // fontWeight in DTCG can be either numeric (`400`) or named (`bold`).
      // We pick STRING because Figma can hold either form there; numeric
      // strings still round-trip cleanly via parseFloat at the consumer.
      return 'STRING';
    case 'fontFamily':
    case 'strokeStyle':
      return 'STRING';
    // Composite types — no single Variable can hold these.
    case 'shadow':
    case 'gradient':
    case 'border':
    case 'transition':
    case 'cubicBezier':
    case 'typography':
      return null;
    default:
      return null;
  }
}

/**
 * Reverse mapping for import. The opts hint tells us what to do with FLOAT
 * variables (which are ambiguous in Figma — they could be a dimension, a
 * raw number, or a duration) so the resulting DTCG tree picks a sensible
 * `$type` rather than blindly defaulting.
 */
export function figmaTypeToDtcgType(
  resolvedType: FigmaResolvedType,
  opts: ImportOptions,
): DTCGType {
  switch (resolvedType) {
    case 'COLOR':
      return 'color';
    case 'FLOAT':
      return opts.numbersAsDimension ? 'dimension' : 'number';
    case 'STRING':
      return 'fontFamily';
    case 'BOOLEAN':
      // Not a DTCG primitive but Style Dictionary tolerates it as a value.
      // We tag it as `strokeStyle` (the closest single-key DTCG token type)
      // so the JSON validates; downstream consumers should treat it as a
      // raw boolean. This is a known compromise for Figma → DTCG round-trip.
      return 'strokeStyle';
  }
}

// ── Color parsing / formatting ──────────────────────────────────────────────

/** Normalised RGBA — every channel in [0, 1]. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function hexPair(n: number): string {
  const v = Math.round(clamp01(n) * 255);
  return v.toString(16).padStart(2, '0');
}

/** HSL → RGB (all channels 0..1). Reference: CSS Color Module Level 3. */
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  // Normalise hue to [0, 360)
  const hue = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hue < 60) { rp = c; gp = x; bp = 0; }
  else if (hue < 120) { rp = x; gp = c; bp = 0; }
  else if (hue < 180) { rp = 0; gp = c; bp = x; }
  else if (hue < 240) { rp = 0; gp = x; bp = c; }
  else if (hue < 300) { rp = x; gp = 0; bp = c; }
  else { rp = c; gp = 0; bp = x; }
  return { r: rp + m, g: gp + m, b: bp + m };
}

/**
 * Parse a CSS color string into 0–1 RGBA. Supports:
 *   - `#rgb`, `#rgba`
 *   - `#rrggbb`, `#rrggbbaa`
 *   - `rgb(r, g, b)`, `rgb(r g b / a)`, `rgba(...)`
 *   - `hsl(h, s%, l%)`, `hsla(...)`
 * Out-of-range channels are clamped to [0, 1]. Returns null on unparseable
 * input so the caller can warn rather than crash.
 */
export function parseColorString(input: string): Rgba | null {
  if (typeof input !== 'string') return null;
  const value = input.trim();

  // ── Hex ───────────────────────────────────────────────────────────────────
  if (value.startsWith('#')) {
    const hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      // Expand short form
      const r = parseInt(hex[0] + hex[0], 16) / 255;
      const g = parseInt(hex[1] + hex[1], 16) / 255;
      const b = parseInt(hex[2] + hex[2], 16) / 255;
      const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
      if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
      return { r: clamp01(r), g: clamp01(g), b: clamp01(b), a: clamp01(a) };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
      return { r: clamp01(r), g: clamp01(g), b: clamp01(b), a: clamp01(a) };
    }
    return null;
  }

  // ── rgb()/rgba() ──────────────────────────────────────────────────────────
  const rgbMatch = value.match(/^rgba?\s*\(([^)]+)\)$/i);
  if (rgbMatch) {
    // Accept both comma- and slash-separated forms.
    const parts = rgbMatch[1].split(/[,/]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3 || parts.length > 4) return null;
    const r = parsePart(parts[0], 255);
    const g = parsePart(parts[1], 255);
    const b = parsePart(parts[2], 255);
    const a = parts[3] != null ? parsePart(parts[3], 1) : 1;
    if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
    return { r: clamp01(r), g: clamp01(g), b: clamp01(b), a: clamp01(a) };
  }

  // ── hsl()/hsla() ──────────────────────────────────────────────────────────
  const hslMatch = value.match(/^hsla?\s*\(([^)]+)\)$/i);
  if (hslMatch) {
    const parts = hslMatch[1].split(/[,/]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length < 3 || parts.length > 4) return null;
    const h = parseFloat(parts[0]);
    const s = parsePart(parts[1], 1); // already %, parsePart turns "20%" → 0.2
    const l = parsePart(parts[2], 1);
    const a = parts[3] != null ? parsePart(parts[3], 1) : 1;
    if ([h, s, l, a].some((n) => Number.isNaN(n))) return null;
    const { r, g, b } = hslToRgb(h, clamp01(s), clamp01(l));
    return { r: clamp01(r), g: clamp01(g), b: clamp01(b), a: clamp01(a) };
  }

  return null;
}

/**
 * Parse a single rgb()/rgba()/hsl() component. `255` for r/g/b channels,
 * `1` for the alpha channel — pass the appropriate denominator.
 *
 * `20%`  → 0.20
 * `0.5`  → 0.5  (alpha) or 0.5/255 (channel? no — bare numbers in rgb()
 *          are 0..255 by spec; bare numbers in hsl()'s s/l aren't legal
 *          but we tolerate them by treating as a fraction).
 * `127`  → 127/255
 */
function parsePart(raw: string, denom: number): number {
  if (raw.endsWith('%')) {
    return parseFloat(raw.slice(0, -1)) / 100;
  }
  const n = parseFloat(raw);
  if (denom === 1) return n; // alpha — already 0..1
  return n / denom;
}

/**
 * Format an RGBA back to `#rrggbb` or `#rrggbbaa`. Alpha channel is dropped
 * when fully opaque (a ≥ 0.999) so the string round-trips cleanly through
 * tools that don't understand 8-digit hex.
 *
 * Tiny alpha values (< 0.001) are coerced to fully transparent — Figma
 * sometimes returns 1e-7 due to float math which would otherwise produce
 * meaningless `#xx00` suffixes.
 */
export function formatColorRgba(c: Rgba): string {
  const a = c.a < 0.001 ? 0 : c.a;
  if (a >= 0.999) {
    return '#' + hexPair(c.r) + hexPair(c.g) + hexPair(c.b);
  }
  return '#' + hexPair(c.r) + hexPair(c.g) + hexPair(c.b) + hexPair(a);
}

// ── Dimension formatting ────────────────────────────────────────────────────

/**
 * Format a numeric value as a DTCG dimension string. Default unit is `px`;
 * when `useRem` is true we divide by 16 to produce a `Xrem` value (matches
 * the convention used elsewhere in the BTech codebase — see `BTechRadius`).
 */
export function formatDimension(value: number, opts: ImportOptions): string {
  if (opts.useRem) {
    return `${value / 16}rem`;
  }
  return `${value}px`;
}

// ── Path ↔ Figma variable name ──────────────────────────────────────────────

/**
 * DTCG paths use dots; Figma's Variables panel uses slashes for grouping.
 * `color.brand.primary` ↔ `color/brand/primary`. Round-trip is lossless
 * unless a key contains a literal `.` or `/`, which neither side allows.
 */
export function pathToVariableName(path: string): string {
  return path.replace(/\./g, '/');
}

export function variableNameToPath(name: string): string {
  return name.replace(/\//g, '.');
}

/**
 * Infer the DTCG namespace prefix that should sit ABOVE a variable's name
 * when it crosses into our source repo. Figma's variable name only encodes
 * groups within the collection (e.g. `green/500`, `brand/primary/500`,
 * `bg/primary`), so without a prefix every imported leaf would land at the
 * top level of its set and wouldn't match the existing repo paths
 * (`color.green.500`, `color.brand.primary.500`, `color.bg.primary`).
 *
 * Heuristic — the standard BTech setup has three color-shaped collections
 * (Primitives, Brand, Semantic Color) and they all funnel into the
 * `color.*` namespace. Any other collection (Spacing & Radius, etc.)
 * already encodes its own top-level segment in the variable name and
 * doesn't need an extra prefix.
 *
 * Returns the prefix WITH a trailing dot (`'color.'`) so callers can do
 * straight string concatenation, or empty string when no prefix applies.
 */
export function namespacePrefixForCollection(collectionName: string): string {
  const lower = collectionName.toLowerCase();
  if (
    lower === 'primitives' ||
    lower === 'brand' ||
    lower.includes('color')
  ) {
    return 'color.';
  }
  return '';
}

// ── Alias parsing / formatting ──────────────────────────────────────────────

/**
 * Detect whether a DTCG `$value` is an alias and return the inner path.
 * Aliases are the literal string form `{path.to.token}` per the DTCG spec.
 * Returns null when the input isn't an alias so callers can fall through
 * to literal value handling.
 */
export function parseAlias(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const m = value.match(/^\{(.+)\}$/);
  return m ? m[1] : null;
}

export function formatAlias(path: string): string {
  return `{${path}}`;
}
