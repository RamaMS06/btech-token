import { readFileSync, readdirSync } from 'fs';
import { ROOT, flattenDTCG, resolveRef } from './utils.js';

export interface TypeScaleEntry {
  fontSize: number;
  fontWeight: number;
  lineHeightPx: number;
  withTextColor?: boolean;
  fontStyle?: string;       // 'italic'
  textDecoration?: string;  // 'underline'
}

export interface ResolvedTokenMap {
  baseMap: Record<string, string>;
  coreColors: Record<string, Record<string, string>>;
  semanticColors: Record<string, Record<string, Record<string, string>>>;
  spacing: Record<string, string>;
  radius: { core: Record<string, string>; semantic: Record<string, string> };
  typography: {
    fontFamilies: Record<string, string>;
    fontSizes: Record<string, string>;
    fontWeights: Record<string, string>;
    lineHeights: Record<string, string>;
    semantic: Record<string, Record<string, string>>;
    typeScale: {
      heading: Record<string, TypeScaleEntry>;
      subheading: Record<string, TypeScaleEntry>;
      body: Record<string, TypeScaleEntry>;
    };
  };
}

export function loadTokenData(): ResolvedTokenMap {
  const coreDir = `${ROOT}/sources/core`;
  const semanticDir = `${ROOT}/sources/semantic`;

  // Build + resolve base map (two passes for chained refs)
  const rawBaseMap: Record<string, string> = {};
  for (const dir of [coreDir, semanticDir]) {
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
      Object.assign(rawBaseMap, flattenDTCG(JSON.parse(readFileSync(`${dir}/${f}`, 'utf-8'))));
    }
  }
  const resolvedBaseMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawBaseMap)) resolvedBaseMap[k] = resolveRef(v, rawBaseMap);
  for (const [k, v] of Object.entries(resolvedBaseMap)) resolvedBaseMap[k] = resolveRef(v, resolvedBaseMap);

  // Core color palette
  const corePrimitive = JSON.parse(readFileSync(`${coreDir}/color.primitive.json`, 'utf-8'));
  const coreColors: Record<string, Record<string, string>> = {};
  for (const [group, shades] of Object.entries(corePrimitive.color as Record<string, Record<string, unknown>>)) {
    coreColors[group] = {};
    for (const [shade, token] of Object.entries(shades)) {
      if (shade.startsWith('$')) continue;
      coreColors[group][shade] = (token as any).$value;
    }
  }

  // Semantic colors (3-level: group → category → variant)
  const semanticColorJson = JSON.parse(readFileSync(`${semanticDir}/color.json`, 'utf-8'));
  const semanticColors: Record<string, Record<string, Record<string, string>>> = {};
  for (const [group, categories] of Object.entries(semanticColorJson.color as Record<string, unknown>)) {
    semanticColors[group] = {};
    for (const [category, tokens] of Object.entries(categories as Record<string, unknown>)) {
      if (category.startsWith('$')) continue;
      semanticColors[group][category] = {};
      for (const [tokenName, tokenDef] of Object.entries(tokens as Record<string, unknown>)) {
        if (tokenName.startsWith('$')) continue;
        semanticColors[group][category][tokenName] = resolveRef((tokenDef as any).$value, resolvedBaseMap);
      }
    }
  }

  // Spacing
  const sizePrimitive = JSON.parse(readFileSync(`${coreDir}/size.primitive.json`, 'utf-8'));
  const spacing: Record<string, string> = {};
  for (const [k, v] of Object.entries(sizePrimitive.spacing as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    spacing[k] = (v as any).$value;
  }

  // Radius
  const coreRadius: Record<string, string> = {};
  const radiusPrimitive = JSON.parse(readFileSync(`${coreDir}/radius.primitive.json`, 'utf-8'));
  for (const [k, v] of Object.entries(radiusPrimitive.radius as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    coreRadius[k] = (v as any).$value;
  }
  const semRadius: Record<string, string> = {};
  const radiusSemantic = JSON.parse(readFileSync(`${semanticDir}/radius.json`, 'utf-8'));
  for (const [k, v] of Object.entries(radiusSemantic.radius as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    semRadius[k] = resolveRef((v as any).$value, resolvedBaseMap);
  }

  // Typography primitives
  const fontPrimitive = JSON.parse(readFileSync(`${coreDir}/font.primitive.json`, 'utf-8'));
  const fontFamilies: Record<string, string> = {};
  const fontSizes: Record<string, string> = {};
  const fontWeights: Record<string, string> = {};
  const lineHeights: Record<string, string> = {};
  for (const [k, v] of Object.entries(fontPrimitive.typography.fontFamily as Record<string, unknown>)) {
    if (!k.startsWith('$')) fontFamilies[k] = (v as any).$value;
  }
  for (const [k, v] of Object.entries(fontPrimitive.typography.fontSize as Record<string, unknown>)) {
    if (!k.startsWith('$')) fontSizes[k] = (v as any).$value;
  }
  for (const [k, v] of Object.entries(fontPrimitive.typography.fontWeight as Record<string, unknown>)) {
    if (!k.startsWith('$')) fontWeights[k] = String((v as any).$value);
  }
  for (const [k, v] of Object.entries(fontPrimitive.typography.lineHeight as Record<string, unknown>)) {
    if (!k.startsWith('$')) lineHeights[k] = String((v as any).$value);
  }

  // Semantic typography groups (flat: body, heading, label, code)
  const typoJson = JSON.parse(readFileSync(`${semanticDir}/typography.json`, 'utf-8'));
  const semanticTypo: Record<string, Record<string, string>> = {};
  for (const [group, props] of Object.entries(typoJson.typography as Record<string, unknown>)) {
    if (group.startsWith('$') || group === 'typeScale') continue;
    semanticTypo[group] = {};
    for (const [prop, tokenDef] of Object.entries(props as Record<string, unknown>)) {
      if (!prop.startsWith('$')) {
        semanticTypo[group][prop] = resolveRef((tokenDef as any).$value, resolvedBaseMap);
      }
    }
  }

  // Type scale (heading h1-h4, subheading h5-h7, body variants)
  const rawTypeScale = typoJson?.typography?.typeScale ?? {};
  const typeScale: ResolvedTokenMap['typography']['typeScale'] = { heading: {}, subheading: {}, body: {} };
  for (const group of ['heading', 'subheading', 'body'] as const) {
    for (const [name, tokenDef] of Object.entries((rawTypeScale[group] ?? {}) as Record<string, Record<string, any>>)) {
      const entry: TypeScaleEntry = {
        fontSize:     parseFloat(String(tokenDef.fontSize?.$value     ?? '12').replace('px', '')),
        fontWeight:   Number(tokenDef.fontWeight?.$value   ?? 400),
        lineHeightPx: parseFloat(String(tokenDef.lineHeightPx?.$value ?? '16').replace('px', '')),
      };
      if (tokenDef.withTextColor?.$value)  entry.withTextColor  = true;
      if (tokenDef.fontStyle?.$value)      entry.fontStyle      = String(tokenDef.fontStyle.$value);
      if (tokenDef.textDecoration?.$value) entry.textDecoration = String(tokenDef.textDecoration.$value);
      typeScale[group][name] = entry;
    }
  }

  return {
    baseMap: resolvedBaseMap,
    coreColors,
    semanticColors,
    spacing,
    radius: { core: coreRadius, semantic: semRadius },
    typography: { fontFamilies, fontSizes, fontWeights, lineHeights, semantic: semanticTypo, typeScale },
  };
}
