import { writeFileSync } from 'fs';
import { hexToArgb, toPascalCase, dartSafeName, toYaml } from '../utils.js';

/** Generate a semantic color group file using the `extends Color` pattern. */
export function generateDartSemanticColorGroup(
  dir: string,
  groupName: string,
  categories: Record<string, Record<string, string>>,
  header: string,
): void {
  const groupPascal = toPascalCase(groupName);
  const L = [header, "import 'package:flutter/material.dart';\n"];

  for (const [category, tokens] of Object.entries(categories)) {
    const className = `BTech${groupPascal}${toPascalCase(category)}Color`;
    const entries = Object.entries(tokens);
    const defaultKey = entries.find(([k]) => k === 'default' || k === 'base')?.[0] ?? entries[0][0];
    const defaultHex = tokens[defaultKey];
    const variantEntries = entries.filter(([k]) => k !== defaultKey);

    L.push(`class ${className} extends Color {`);
    if (variantEntries.length === 0) {
      L.push(`  const ${className}() : super(${hexToArgb(defaultHex)});`);
    } else {
      L.push(`  const ${className}()`);
      const initLines = variantEntries.map(([name, hex], i) =>
        `    ${i === 0 ? ': ' : '  '}${dartSafeName(name)} = const Color(${hexToArgb(hex)})`
      );
      initLines.push(`      super(${hexToArgb(defaultHex)})`);
      L.push(initLines.join(',\n') + ';');
      for (const [name] of variantEntries) {
        L.push(`  final Color ${dartSafeName(name)};`);
      }
    }
    L.push('}\n');
  }

  const groupClassName = `BTech${groupPascal}Color`;
  const catEntries = Object.entries(categories);
  L.push(`/// Semantic ${groupName} color tokens.`);
  L.push(`/// Each property IS a [Color] directly; variants are sub-fields.`);
  L.push(`/// Example: BTech${groupPascal}Color.${dartSafeName(catEntries[0]?.[0] ?? 'item')} → Color`);
  L.push(`class ${groupClassName} {`);
  L.push(`  const ${groupClassName}()`);
  const initLines = catEntries.map(([category], i) => {
    const catClassName = `BTech${groupPascal}${toPascalCase(category)}Color`;
    return `    ${i === 0 ? ': ' : '  '}${dartSafeName(category)} = const ${catClassName}()`;
  });
  L.push(initLines.join(',\n') + ';');
  for (const [category] of catEntries) {
    const catClassName = `BTech${groupPascal}${toPascalCase(category)}Color`;
    L.push(`  final ${catClassName} ${dartSafeName(category)};`);
  }
  L.push('}\n');

  writeFileSync(`${dir}/${groupName}.color.dart`, L.join('\n') + '\n');
}

/** Generate tokens.meta.yaml sidecar for a semantic color group. */
export function generateTokensMeta(
  dir: string,
  category: string,
  semanticColors: Record<string, Record<string, Record<string, string>>>,
): void {
  const tokens: Array<{ path: string; figmaVariable: string }> = [];
  for (const [group, categories] of Object.entries(semanticColors)) {
    for (const [cat, toks] of Object.entries(categories)) {
      for (const name of Object.keys(toks)) {
        tokens.push({
          path: `color.${group}.${cat}.${name}`,
          figmaVariable: `${toPascalCase(group)}/${toPascalCase(cat)}/${toPascalCase(name)}`,
        });
      }
    }
  }
  const meta = { category, figma: { collection: `BTech/${toPascalCase(category)}`, tokens } };
  writeFileSync(`${dir}/tokens.meta.yaml`, toYaml(meta) + '\n');
}
