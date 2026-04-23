import { appendFileSync, readFileSync } from 'fs';
import { ROOT } from '../utils.js';

/**
 * Appends composite typography CSS custom properties and utility classes to styles.css.
 *
 * Each typeScale entry in typography.json becomes:
 *   --typography-heading-h1: 700 32px/1.25 var(--typography-font-family-sans);
 *
 * Usage in CSS/HTML:
 *   font: var(--typography-heading-h1);          /* CSS *\/
 *   <h1 class="typography-heading-h1">…</h1>    /* HTML utility class *\/
 *   token('typography.heading.h1')               /* JS/TS *\/
 */
export function appendTypographyCompositesCss(stylesPath: string): void {
  const typoJson = JSON.parse(
    readFileSync(`${ROOT}/sources/semantic/typography.json`, 'utf-8')
  ) as {
    typography?: {
      typeScale?: Record<string, Record<string, {
        fontSize?: { $value: string };
        fontWeight?: { $value: number };
        lineHeightPx?: { $value: string };
      }>>;
    };
  };

  const typeScale = typoJson.typography?.typeScale ?? {};

  const rootLines: string[] = [
    '',
    '/* ── Typography composite tokens (font shorthand) ─────────────────────────────── */',
    ':root {',
  ];

  const utilityLines: string[] = [
    '',
    '/* ── Typography utility classes ────────────────────────────────────────────────── */',
  ];

  for (const [category, entries] of Object.entries(typeScale)) {
    rootLines.push(`  /* typography.${category} */`);

    for (const [name, props] of Object.entries(entries)) {
      const fontSizePx = parseFloat(String(props.fontSize?.$value ?? '14px').replace('px', ''));
      const lineHeightPx = parseFloat(String(props.lineHeightPx?.$value ?? '20px').replace('px', ''));
      const fontWeight = props.fontWeight?.$value ?? 400;

      // Compute line-height ratio (unitless, 2 decimal places)
      const lineHeight = (lineHeightPx / fontSizePx).toFixed(2).replace(/\.?0+$/, '');

      // Kebab-case the name for CSS (e.g. "largeB" → "large-b")
      const cssName = name.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);

      const varName = `--typography-${category}-${cssName}`;
      const value = `${fontWeight} ${fontSizePx}px/${lineHeight} var(--typography-font-family-sans)`;

      rootLines.push(`  ${varName}: ${value};`);
      utilityLines.push(`.typography-${category}-${cssName} { font: var(${varName}); }`);
    }
  }

  rootLines.push('}');

  const block = [...rootLines, '', ...utilityLines, ''].join('\n');
  appendFileSync(stylesPath, block);
  console.log('  Typography composites — composite vars + utility classes appended to styles.css');
}
