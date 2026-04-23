import { writeFileSync } from 'fs';
import { toPascalCase, dartSafeName, pathToCssVar } from '../utils.js';

/** Generate a semantic color group file for TypeScript (flat model).
 *  Each group (text, icon, border, bg, brand, ext) maps to a TS class
 *  with one readonly field per token returning a CSS var string.
 *
 *  Example: BTechBgColor.primary === 'var(--btech-bg-primary)'
 *
 *  This mirrors Flutter's Pattern A (BTechColor.bg.primary returns an
 *  actionable value). On web, CSS vars are the actionable value — they
 *  cascade through data-tenant / data-mode attributes automatically. */
export function generateTsSemanticColorGroup(
  dir: string,
  groupName: string,
  tokens: Record<string, string>,
  header: string,
): void {
  const groupPascal = toPascalCase(groupName);
  const L = [header];
  const groupClassName = `BTech${groupPascal}Color`;

  L.push(`export class ${groupClassName} {`);
  for (const [name] of Object.entries(tokens)) {
    // 'primary-subtle' → 'primarySubtle' (TypeScript field name)
    const field = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    // ['color', 'bg', 'primary'] → '--btech-bg-primary'
    const cssVar = pathToCssVar(['color', groupName, name]);
    L.push(`  readonly ${field} = 'var(${cssVar})' as const;`);
  }
  L.push('}\n');

  writeFileSync(`${dir}/${groupName}.color.ts`, L.join('\n') + '\n');
}
