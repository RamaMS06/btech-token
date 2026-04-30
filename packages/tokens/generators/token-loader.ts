import { readFileSync, readdirSync } from 'fs';
import { ROOT, flattenDTCG, resolveRef } from './utils.js';

export interface ShadowLayer {
  color: string;    // e.g. "rgba(0,0,0,0.25)"
  offsetX: number;  // px as number
  offsetY: number;
  blur: number;
  spread: number;
  inset: boolean;
}

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
  /** Brand primitive swatches — 2-level: brand-name (primary/secondary) → shade (50..900) → resolved hex.
   *  Loaded from sources/brand/color.json. Aliases to primitive ramps are resolved here so
   *  output generators get final hex values. Tenant overrides re-target the aliases at the same
   *  shade level (color.brand.primary.500 → {color.rose.500} etc.).
   *
   *  Why a separate field instead of merging into coreColors?
   *  - Lifecycle: primitive ramps (coreColors) are immutable across tenants; brand swatches
   *    are tenant-overridable. Keeping them separate makes the override surface explicit.
   *  - Naming: emitted as `btechColorBrandPrimary`/`btechColorBrandSecondary` (not as if they
   *    were yet-another base ramp like green/blue), per design-system convention. */
  brandSwatches: Record<string, Record<string, string>>;
  /** Flat 2-level: group (text/icon/border/bg/brand/ext) → field-name → resolved hex */
  semanticColors: Record<string, Record<string, string>>;
  spacing: Record<string, string>;
  stroke: Record<string, string>;
  radius: Record<string, string>;
  /** 2-level map: group → variant → ordered array of shadow layers.
   *  Mirrors the Figma "/" separator: button/pressed → shadow.button.pressed */
  shadow: Record<string, Record<string, ShadowLayer[]>>;
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
  // Build + resolve base map (two passes for chained refs)
  const rawBaseMap: Record<string, string> = {};
  const sourceDirs = [
    `${ROOT}/sources/primitives`,
    `${ROOT}/sources/brand`,
    `${ROOT}/sources/semantic-color`,
    `${ROOT}/sources/spacing-and-radius`,
    `${ROOT}/sources/typography`,
    `${ROOT}/sources/shadow`,
    `${ROOT}/sources/stroke`,
  ];
  for (const dir of sourceDirs) {
    for (const f of readdirSync(dir).filter((f: string) => f.endsWith('.json') && !f.startsWith('font-registry'))) {
      Object.assign(rawBaseMap, flattenDTCG(JSON.parse(readFileSync(`${dir}/${f}`, 'utf-8'))));
    }
  }
  const resolvedBaseMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawBaseMap)) resolvedBaseMap[k] = resolveRef(v, rawBaseMap);
  for (const [k, v] of Object.entries(resolvedBaseMap)) resolvedBaseMap[k] = resolveRef(v, resolvedBaseMap);

  // Core color palette
  const corePrimitive = JSON.parse(readFileSync(`${ROOT}/sources/primitives/color.json`, 'utf-8'));
  const coreColors: Record<string, Record<string, string>> = {};
  for (const [group, shades] of Object.entries(corePrimitive.color as Record<string, Record<string, unknown>>)) {
    coreColors[group] = {};
    for (const [shade, token] of Object.entries(shades)) {
      if (shade.startsWith('$')) continue;
      coreColors[group][shade] = (token as any).$value;
    }
  }

  // Brand primitive swatches — sources/brand/color.json.
  // Each rung references a primitive ramp (e.g. brand.primary.500 → {color.blue.500}).
  // Resolved against resolvedBaseMap so output generators get final hex values.
  // Convention: 50,100,200,300,400,500,600,700,800,900 — Tailwind v3 / DTCG standard.
  const brandPrimitive = JSON.parse(readFileSync(`${ROOT}/sources/brand/color.json`, 'utf-8'));
  const brandSwatches: Record<string, Record<string, string>> = {};
  const brandRoot = (brandPrimitive.brand ?? {}) as Record<string, Record<string, unknown>>;
  for (const [brandName, shades] of Object.entries(brandRoot)) {
    if (brandName.startsWith('$')) continue;
    brandSwatches[brandName] = {};
    for (const [shade, tokenDef] of Object.entries(shades as Record<string, unknown>)) {
      if (shade.startsWith('$')) continue;
      const ref = (tokenDef as { $value?: string }).$value ?? '';
      brandSwatches[brandName][shade] = resolveRef(ref, resolvedBaseMap);
    }
  }

  // Semantic colors — flat 2-level: group → field-name → hex
  // The `-default` suffix is an internal disambiguator (added in source files
  // where a flat semantic leaf would collide with a primitive group of the same
  // name — e.g. `brand.primary` collides with `brand.primary.{50..900}`).
  // We strip `-default` here so consumer-facing names stay clean across all
  // generators (Flutter, Web, Python). CSS variables get the same treatment via
  // the post-build regex in sd.config.ts.
  const semanticColorJson = JSON.parse(readFileSync(`${ROOT}/sources/semantic-color/light.json`, 'utf-8'));
  const semanticColors: Record<string, Record<string, string>> = {};
  for (const [group, fields] of Object.entries(semanticColorJson.color as Record<string, unknown>)) {
    semanticColors[group] = {};
    for (const [fieldName, tokenDef] of Object.entries(fields as Record<string, unknown>)) {
      if (fieldName.startsWith('$')) continue;
      const consumerField = fieldName.replace(/-default$/, '');
      semanticColors[group][consumerField] = resolveRef((tokenDef as any).$value, resolvedBaseMap);
    }
  }

  // Spacing + Radius — both now live in the merged spacing-and-radius.json
  const spacingRadiusJson = JSON.parse(readFileSync(`${ROOT}/sources/spacing-and-radius/spacing-and-radius.json`, 'utf-8'));
  const spacing: Record<string, string> = {};
  for (const [k, v] of Object.entries(spacingRadiusJson.spacing as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    spacing[k] = (v as any).$value;
  }

  // Stroke
  const strokePrimitive = JSON.parse(readFileSync(`${ROOT}/sources/stroke/stroke.json`, 'utf-8'));
  const stroke: Record<string, string> = {};
  for (const [k, v] of Object.entries(strokePrimitive.stroke as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    stroke[k] = (v as any).$value;
  }

  // Radius — core primitives only (semantic aliases removed)
  const radius: Record<string, string> = {};
  for (const [k, v] of Object.entries(spacingRadiusJson.radius as Record<string, unknown>)) {
    if (k.startsWith('$')) continue;
    radius[k] = (v as any).$value;
  }

  // Shadow — parse DTCG shadow objects into 2-level group→variant map.
  // Preserves the Figma "/" separator hierarchy: button/pressed → shadow.button.pressed.
  const shadow: Record<string, Record<string, ShadowLayer[]>> = {};
  const shadowPrimitive = JSON.parse(readFileSync(`${ROOT}/sources/shadow/shadow.json`, 'utf-8'));

  function parsePx(v: string | number): number {
    return parseFloat(String(v).replace('px', '')) || 0;
  }
  function parseShadowObj(obj: Record<string, unknown>): ShadowLayer {
    return {
      color:   String(obj.color ?? 'rgba(0,0,0,0)'),
      offsetX: parsePx(obj.offsetX as string),
      offsetY: parsePx(obj.offsetY as string),
      blur:    parsePx(obj.blur as string),
      spread:  parsePx(obj.spread as string),
      inset:   Boolean(obj.inset),
    };
  }
  for (const [group, variants] of Object.entries(shadowPrimitive.shadow as Record<string, unknown>)) {
    if (group.startsWith('$')) continue;
    shadow[group] = {};
    for (const [variant, tokenDef] of Object.entries(variants as Record<string, unknown>)) {
      if (variant.startsWith('$')) continue;
      const raw = (tokenDef as any).$value;
      shadow[group][variant] = Array.isArray(raw)
        ? (raw as Record<string, unknown>[]).map(parseShadowObj)
        : [parseShadowObj(raw as Record<string, unknown>)];
    }
  }

  // Typography primitives
  const fontPrimitive = JSON.parse(readFileSync(`${ROOT}/sources/typography/font.json`, 'utf-8'));
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
  const typoJson = JSON.parse(readFileSync(`${ROOT}/sources/typography/scale.json`, 'utf-8'));
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
    brandSwatches,
    semanticColors,
    spacing,
    stroke,
    radius,
    shadow,
    typography: { fontFamilies, fontSizes, fontWeights, lineHeights, semantic: semanticTypo, typeScale },
  };
}
