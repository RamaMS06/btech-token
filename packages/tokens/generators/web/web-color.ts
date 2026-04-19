import { writeFileSync } from 'fs';
import { toPascalCase, dartSafeName } from '../utils.js';

/** Generate a semantic color group file for TypeScript. */
export function generateTsSemanticColorGroup(
  dir: string,
  groupName: string,
  categories: Record<string, Record<string, string>>,
  header: string,
): void {
  const groupPascal = toPascalCase(groupName);
  const L = [header];
  const groupClassName = `BTech${groupPascal}Color`;

  L.push(`export class ${groupClassName} {`);
  for (const [category, tokens] of Object.entries(categories)) {
    const entries = Object.entries(tokens);
    const defaultKey = entries.find(([k]) => k === 'default' || k === 'base')?.[0] ?? entries[0][0];
    for (const [name, hex] of entries) {
      if (name === defaultKey) {
        L.push(`  readonly ${dartSafeName(category)} = '${hex}' as const;`);
      } else {
        L.push(`  readonly ${dartSafeName(category)}${toPascalCase(name)} = '${hex}' as const;`);
      }
    }
  }
  L.push('}\n');

  writeFileSync(`${dir}/${groupName}.color.ts`, L.join('\n') + '\n');
}
