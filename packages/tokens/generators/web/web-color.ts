import { writeFileSync } from 'fs';
import { toPascalCase, dartSafeName } from '../utils.js';

/** Generate a semantic color group file for TypeScript (flat model).
 *  Each group (text, icon, border, bg, brand, ext) maps to a TS class
 *  with one readonly field per token (dash-keys converted to camelCase). */
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
  for (const [name, hex] of Object.entries(tokens)) {
    // 'primary-subtle' → 'primarySubtle'
    const field = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    L.push(`  readonly ${field} = '${hex}' as const;`);
  }
  L.push('}\n');

  writeFileSync(`${dir}/${groupName}.color.ts`, L.join('\n') + '\n');
}
