import { writeFileSync } from 'fs';
import type { ResolvedTokenMap } from '../token-loader.js';
import { pathToCssVarStem } from '../utils.js';

// =============================================================================
// Types
// =============================================================================

interface UtilityRule {
  className: string;
  declarations: Record<string, string>; // property → var(--btech-...)
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Convert a dot-path token string into an Atlassian-aligned CSS custom property reference.
 * Mirrors pathToCssVarStem() from utils.ts — category is dropped/remapped.
 *
 * 'color.background.primary'  → 'var(--btech-background-primary)'
 * 'color.stroke.neutral'      → 'var(--btech-border-neutral)'
 * 'spacing.md'                → 'var(--btech-space-md)'
 * 'typography.fontFamily.sans'→ 'var(--btech-font-family-sans)'
 * 'motion.duration.fast'      → 'var(--btech-duration-fast)'
 * 'zIndex.modal'              → 'var(--btech-z-modal)'
 */
function toVar(tokenPath: string): string {
  const clean = tokenPath.replace(/\.default$/, '').replace(/\.base$/, '');
  const stem = pathToCssVarStem(clean.split('.'))
    .replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
  return `var(--${stem})`;
}

/**
 * Convert a token path into a utility class name suffix.
 * Strips 'default' and 'base' variant suffixes for cleaner names.
 *
 * 'primary.default' → 'primary'
 * 'neutral.subtle'  → 'neutral-subtle'
 * 'on.primary'      → 'on-primary'
 */
function toSuffix(path: string): string {
  return path
    .replace(/\.default$/, '')
    .replace(/\.base$/, '')
    .replace(/\./g, '-');
}

// =============================================================================
// Spacing utilities
// Generates: m-*, mt-*, mr-*, mb-*, ml-*, mx-*, my-*
//            p-*, pt-*, pr-*, pb-*, pl-*, px-*, py-*
//            gap-*, gap-x-*, gap-y-*
//            w-*, h-*, size-*
// =============================================================================

const SPACING_MAP: Array<{ prefix: string; props: string[] }> = [
  // margin
  { prefix: 'm',     props: ['margin'] },
  { prefix: 'mt',    props: ['margin-top'] },
  { prefix: 'mr',    props: ['margin-right'] },
  { prefix: 'mb',    props: ['margin-bottom'] },
  { prefix: 'ml',    props: ['margin-left'] },
  { prefix: 'mx',    props: ['margin-left', 'margin-right'] },
  { prefix: 'my',    props: ['margin-top', 'margin-bottom'] },
  // padding
  { prefix: 'p',     props: ['padding'] },
  { prefix: 'pt',    props: ['padding-top'] },
  { prefix: 'pr',    props: ['padding-right'] },
  { prefix: 'pb',    props: ['padding-bottom'] },
  { prefix: 'pl',    props: ['padding-left'] },
  { prefix: 'px',    props: ['padding-left', 'padding-right'] },
  { prefix: 'py',    props: ['padding-top', 'padding-bottom'] },
  // gap
  { prefix: 'gap',   props: ['gap'] },
  { prefix: 'gap-x', props: ['column-gap'] },
  { prefix: 'gap-y', props: ['row-gap'] },
  // sizing
  { prefix: 'w',     props: ['width'] },
  { prefix: 'h',     props: ['height'] },
  { prefix: 'size',  props: ['width', 'height'] },
];

function buildSpacingRules(spacing: Record<string, string>): UtilityRule[] {
  const rules: UtilityRule[] = [];
  for (const name of Object.keys(spacing)) {
    const cssVar = toVar(`spacing.${name}`);
    for (const { prefix, props } of SPACING_MAP) {
      rules.push({
        className: `${prefix}-${name}`,
        declarations: Object.fromEntries(props.map(p => [p, cssVar])),
      });
    }
  }
  return rules;
}

// =============================================================================
// Color utilities
// Generates: bg-*, text-*, icon-*, border-*
// Each variant is a separate class: bg-primary, bg-primary-hover, bg-primary-pressed…
// =============================================================================

function buildColorRules(
  semanticColors: ResolvedTokenMap['semanticColors'],
): UtilityRule[] {
  const rules: UtilityRule[] = [];

  // background → bg-*
  for (const [category, variants] of Object.entries(semanticColors.background ?? {})) {
    for (const variant of Object.keys(variants)) {
      const path   = `color.background.${category}.${variant}`;
      const suffix = toSuffix(`${category}.${variant}`);
      rules.push({
        className: `bg-${suffix}`,
        declarations: { background: toVar(path) },
      });
    }
  }

  // text → text-*
  for (const [category, variants] of Object.entries(semanticColors.text ?? {})) {
    for (const variant of Object.keys(variants)) {
      const path   = `color.text.${category}.${variant}`;
      const suffix = toSuffix(`${category}.${variant}`);
      rules.push({
        className: `text-${suffix}`,
        declarations: { color: toVar(path) },
      });
    }
  }

  // icon → icon-*  (sets `color` — works for SVG currentColor and CSS icon fonts)
  for (const [category, variants] of Object.entries(semanticColors.icon ?? {})) {
    for (const variant of Object.keys(variants)) {
      const path   = `color.icon.${category}.${variant}`;
      const suffix = toSuffix(`${category}.${variant}`);
      rules.push({
        className: `icon-${suffix}`,
        declarations: { color: toVar(path) },
      });
    }
  }

  // stroke → border-*  (sets border-color only; width/style set by component)
  for (const [category, variants] of Object.entries(semanticColors.stroke ?? {})) {
    for (const variant of Object.keys(variants)) {
      const path   = `color.stroke.${category}.${variant}`;
      const suffix = toSuffix(`${category}.${variant}`);
      rules.push({
        className: `border-${suffix}`,
        declarations: { 'border-color': toVar(path) },
      });
    }
  }

  return rules;
}

// =============================================================================
// Radius utilities
// Generates: rounded-*
// =============================================================================

function buildRadiusRules(
  radius: ResolvedTokenMap['radius'],
): UtilityRule[] {
  const rules: UtilityRule[] = [];
  for (const name of Object.keys(radius)) {
    rules.push({
      className: `rounded-${name}`,
      declarations: { 'border-radius': toVar(`radius.${name}`) },
    });
  }
  return rules;
}

// =============================================================================
// Typography utilities
// Generates: font-sans, font-mono, text-xs, text-sm… leading-tight…
// =============================================================================

function buildTypographyRules(
  typography: ResolvedTokenMap['typography'],
): UtilityRule[] {
  const rules: UtilityRule[] = [];

  // font-family → font-*
  for (const name of Object.keys(typography.fontFamilies)) {
    rules.push({
      className: `font-${name}`,
      declarations: { 'font-family': toVar(`typography.fontFamily.${name}`) },
    });
  }

  // font-size → text-*
  for (const name of Object.keys(typography.fontSizes)) {
    const safeName = /^[0-9]/.test(name) ? `s${name}` : name;
    rules.push({
      className: `text-${safeName}`,
      declarations: { 'font-size': toVar(`typography.fontSize.${name}`) },
    });
  }

  // font-weight → font-{name}  (matches Tailwind: font-bold, font-semibold, font-medium, font-normal)
  // "regular" token maps to "normal" class name to match CSS/Tailwind convention
  for (const name of Object.keys(typography.fontWeights)) {
    const className = name === 'regular' ? 'font-normal' : `font-${name}`;
    rules.push({
      className,
      declarations: { 'font-weight': toVar(`typography.fontWeight.${name}`) },
    });
  }

  // line-height → leading-*
  for (const name of Object.keys(typography.lineHeights)) {
    rules.push({
      className: `leading-${name}`,
      declarations: { 'line-height': toVar(`typography.lineHeight.${name}`) },
    });
  }

  return rules;
}

// =============================================================================
// Render
// =============================================================================

function renderRule(rule: UtilityRule): string {
  const decls = Object.entries(rule.declarations)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join('\n');
  return `.${rule.className} {\n${decls}\n}`;
}

// =============================================================================
// Main export
// =============================================================================

const HEADER = `/* AUTO-GENERATED by @btech/design-system — do not edit manually.   */
/* Run \`pnpm generate\` to regenerate from tokens/.                       */
/*                                                                        */
/* Every class references a CSS custom property — same as token() in JS. */
/* Tenant switching via [data-tenant="*"] works automatically.           */
/*                                                                        */
/* Usage:                                                                 */
/*   <div class="bg-primary text-on-primary rounded-interactive px-md">  */
/*   <div data-tenant="tenant-bjb" class="bg-primary">  ← BJB colors    */
/*                                                                        */
/* Class categories:                                                      */
/*   bg-*           background colors                                     */
/*   text-*         text colors  (also font-size scale)                   */
/*   icon-*         icon / SVG colors                                     */
/*   border-*       stroke / border colors                                */
/*   rounded-*      border-radius                                         */
/*   m-* mt-* mx-*  margin                                                */
/*   p-* pt-* px-*  padding                                               */
/*   gap-* gap-x-*  gap                                                   */
/*   w-* h-* size-* sizing                                                */
/*   font-*         font-family (font-sans, font-mono)                    */
/*   font-bold      font-semibold  font-medium  font-normal  (weight)     */
/*   leading-*      line-height                                           */
/* ======================================================================*/\n`;

export function generateUtilitiesCss(
  outPath: string,
  data: ResolvedTokenMap,
): void {
  const sections: string[] = [HEADER];

  // ── Spacing ──────────────────────────────────────────────────────────────
  const spacingRules = buildSpacingRules(data.spacing);
  sections.push('/* ── Spacing ─────────────────────────────────────────────────────────── */');
  sections.push(spacingRules.map(renderRule).join('\n'));

  // ── Color — background ────────────────────────────────────────────────────
  const bgRules = buildColorRules(data.semanticColors).filter(r => r.className.startsWith('bg-'));
  sections.push('\n/* ── Background ──────────────────────────────────────────────────────── */');
  sections.push(bgRules.map(renderRule).join('\n'));

  // ── Color — text ──────────────────────────────────────────────────────────
  const textRules = buildColorRules(data.semanticColors).filter(r => r.className.startsWith('text-') && !r.declarations['font-size']);
  sections.push('\n/* ── Text color ──────────────────────────────────────────────────────── */');
  sections.push(textRules.map(renderRule).join('\n'));

  // ── Color — icon ──────────────────────────────────────────────────────────
  const iconRules = buildColorRules(data.semanticColors).filter(r => r.className.startsWith('icon-'));
  sections.push('\n/* ── Icon color ──────────────────────────────────────────────────────── */');
  sections.push(iconRules.map(renderRule).join('\n'));

  // ── Color — stroke ────────────────────────────────────────────────────────
  const borderRules = buildColorRules(data.semanticColors).filter(r => r.className.startsWith('border-'));
  sections.push('\n/* ── Border / Stroke color ───────────────────────────────────────────── */');
  sections.push(borderRules.map(renderRule).join('\n'));

  // ── Radius ────────────────────────────────────────────────────────────────
  const radiusRules = buildRadiusRules(data.radius);
  sections.push('\n/* ── Radius ──────────────────────────────────────────────────────────── */');
  sections.push(radiusRules.map(renderRule).join('\n'));

  // ── Typography ────────────────────────────────────────────────────────────
  const typoRules = buildTypographyRules(data.typography);
  sections.push('\n/* ── Typography ──────────────────────────────────────────────────────── */');
  sections.push(typoRules.map(renderRule).join('\n'));

  writeFileSync(outPath, sections.join('\n') + '\n');

  const total = spacingRules.length + bgRules.length + textRules.length
    + iconRules.length + borderRules.length + radiusRules.length + typoRules.length;
  console.log(`  Utilities    — ${total} classes → ${outPath.split('/').slice(-3).join('/')}`);
}
