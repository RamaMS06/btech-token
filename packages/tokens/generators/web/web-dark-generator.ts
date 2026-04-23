// Generates the [data-mode="dark"] CSS block and appends it to dist/styles.css.
// Reuses buildDarkResolvedBaseMap() + buildColorTree() from flutter-theme-generator
// so the dark values are always derived from semantic/color.dark.json — single source of truth.

import { appendFileSync } from 'fs';
import {
  buildDarkResolvedBaseMap,
  buildColorTree,
} from '../flutter/flutter-theme-generator.js';
import { pathToCssVar } from '../utils.js';

/**
 * Appends a `[data-mode="dark"] { ... }` CSS block to the given styles file.
 * The block overrides all semantic color CSS custom properties with their dark values.
 *
 * @example
 * // In sd.config.ts, after Style Dictionary writes dist/styles.css:
 * appendDarkModeCss(`${WEB_DIST}/styles.css`);
 */
export function appendDarkModeCss(stylesPath: string): void {
  const darkMap = buildDarkResolvedBaseMap();
  const tree = buildColorTree();

  const lines: string[] = ['', '/* ── Dark mode color overrides ──────────────────────────────────────────────────── */', '[data-mode="dark"] {'];

  for (const [category, fields] of Object.entries(tree)) {
    lines.push(`  /* ${category} */`);
    for (const field of fields) {
      const dotPath = `color.${category}.${field}`;
      const value = darkMap[dotPath];
      if (value) {
        const cssVar = pathToCssVar(['color', category, field]);
        lines.push(`  ${cssVar}: ${value};`);
      }
    }
  }

  lines.push('}', '');
  appendFileSync(stylesPath, lines.join('\n'));
  console.log('  Dark mode  — [data-mode="dark"] block appended to styles.css');
}
