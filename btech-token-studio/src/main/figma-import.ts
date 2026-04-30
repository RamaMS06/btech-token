/**
 * figma-import — main-thread executor for Import Styles
 * -------------------------------------------------------
 * Two entry points:
 *   - runFigmaImportScan()  → enumerate everything in the active file and
 *                             ship a `FigmaImportTree` to the UI for the
 *                             selection step.
 *   - runFigmaImportApply() → walk the user's selection, build DTCG leaves,
 *                             group into TokenSets, and ship back so the
 *                             ImportDiffModal can compare to main repo.
 *
 * Both run in the Figma sandbox — we use the *async* Variable APIs because
 * the synchronous ones are deprecated and not available in newer plugin
 * runtimes. Style APIs are synchronous in the current runtime; we wrap any
 * thrown errors in a try/catch so the UI gets a clean error message.
 */

import type {
  FigmaImportTree,
  ImportSelection,
  ImportOptions,
} from '../shared/figma-types.js';
import type { MainToUIMessage, DTCGToken, TokenSet } from '../shared/types.js';
import {
  figmaTypeToDtcgType,
  formatColorRgba,
  formatDimension,
  formatAlias,
  variableNameToPath,
  namespacePrefixForCollection,
  type FigmaResolvedType,
  type Rgba,
} from '../shared/dtcg-figma.js';
import { buildSetsFromLeaves, type ImportLeaf } from './figma-build-sets.js';

type Send = (msg: MainToUIMessage) => void;

// ── Scan ────────────────────────────────────────────────────────────────────

/**
 * Build the snapshot the selection tree renders from. We deliberately
 * include the *count* of variables per collection (same for every mode by
 * Figma's data model) so the leaf labels can show `Light (24)` without
 * forcing the UI to fetch the full variable list ahead of time.
 */
export async function runFigmaImportScan(send: Send): Promise<void> {
  const collections =
    await figma.variables.getLocalVariableCollectionsAsync();
  const variables = await figma.variables.getLocalVariablesAsync();

  // Index variables by collection id so the count lookup is O(1).
  const varsByCollection = new Map<string, number>();
  for (const v of variables) {
    varsByCollection.set(
      v.variableCollectionId,
      (varsByCollection.get(v.variableCollectionId) ?? 0) + 1,
    );
  }

  const [paintStyles, textStyles, effectStyles] = await Promise.all([
    figma.getLocalPaintStylesAsync(),
    figma.getLocalTextStylesAsync(),
    figma.getLocalEffectStylesAsync(),
  ]);

  const tree: FigmaImportTree = {
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      modes: c.modes.map((m) => ({
        modeId: m.modeId,
        name: m.name,
        variableCount: varsByCollection.get(c.id) ?? 0,
      })),
    })),
    paintStyles: paintStyles.map((s) => ({ id: s.id, name: s.name })),
    textStyles: textStyles.map((s) => ({ id: s.id, name: s.name })),
    effectStyles: effectStyles.map((s) => ({ id: s.id, name: s.name })),
  };

  send({ type: 'figma-import-scan-done', payload: tree });
}

// ── Apply ───────────────────────────────────────────────────────────────────

/**
 * Walk only the items the designer selected and produce a `Record<string,
 * TokenSet>` ready to feed into ImportDiffModal. Anything we don't know
 * how to convert (out-of-gamut color, alias to a non-imported variable,
 * unsupported style block) goes into `warnings` so the designer sees what
 * was skipped rather than discovering it later.
 */
export async function runFigmaImportApply(
  selection: ImportSelection,
  options: ImportOptions,
  send: Send,
): Promise<void> {
  const warnings: string[] = [];
  const leaves: ImportLeaf[] = [];

  // ── Variables ────────────────────────────────────────────────────────────
  if (Object.keys(selection.collections).length > 0) {
    const allCollections =
      await figma.variables.getLocalVariableCollectionsAsync();
    const allVariables = await figma.variables.getLocalVariablesAsync();

    // Index variables by id once — alias resolution needs target lookups.
    const variableById = new Map(allVariables.map((v) => [v.id, v]));
    // Same for collections: an alias target lives in some collection whose
    // namespace prefix we need (e.g. a Brand variable aliasing a Primitives
    // variable should serialise as `{color.green.500}`, not `{green.500}`).
    const collectionById = new Map(allCollections.map((c) => [c.id, c]));

    for (const coll of allCollections) {
      const wantedModeIds = selection.collections[coll.id];
      if (!wantedModeIds || wantedModeIds.length === 0) continue;

      const wantedModes = coll.modes.filter((m) =>
        wantedModeIds.includes(m.modeId),
      );

      // Walk each variable in this collection once per selected mode.
      const collectionVars = allVariables.filter(
        (v) => v.variableCollectionId === coll.id,
      );

      // Prefix that gets prepended to both the leaf path and any alias the
      // variable's target produces. Empty for non-color collections (Spacing
      // & Radius etc.) which already encode their top-level segment in the
      // variable name.
      const prefix = namespacePrefixForCollection(coll.name);

      for (const mode of wantedModes) {
        for (const variable of collectionVars) {
          const path = prefix + variableNameToPath(variable.name);
          const raw = variable.valuesByMode[mode.modeId];
          if (raw == null) {
            warnings.push(
              `Variable "${variable.name}" has no value in mode "${mode.name}".`,
            );
            continue;
          }

          const token = variableValueToToken(
            variable.resolvedType as FigmaResolvedType,
            raw,
            variableById,
            collectionById,
            options,
            warnings,
            variable.name,
          );
          if (!token) continue;

          leaves.push({
            bucket: {
              kind: 'variables',
              collectionName: coll.name,
              modeName: mode.name,
            },
            path,
            token,
          });
        }
      }
    }
  }

  // ── Paint styles → color tokens ──────────────────────────────────────────
  if (selection.paintStyles.length > 0) {
    const paints = await figma.getLocalPaintStylesAsync();
    for (const style of paints) {
      if (!selection.paintStyles.includes(style.id)) continue;
      const token = paintStyleToToken(style, warnings);
      if (!token) continue;
      leaves.push({
        bucket: { kind: 'paint' },
        path: variableNameToPath(style.name),
        token,
      });
    }
  }

  // ── Text styles → typography composite tokens ───────────────────────────
  if (selection.textStyles.length > 0) {
    const texts = await figma.getLocalTextStylesAsync();
    for (const style of texts) {
      if (!selection.textStyles.includes(style.id)) continue;
      const token = textStyleToToken(style, options);
      leaves.push({
        bucket: { kind: 'text' },
        path: variableNameToPath(style.name),
        token,
      });
    }
  }

  // ── Effect styles → shadow composite tokens ─────────────────────────────
  if (selection.effectStyles.length > 0) {
    const effects = await figma.getLocalEffectStylesAsync();
    for (const style of effects) {
      if (!selection.effectStyles.includes(style.id)) continue;
      const token = effectStyleToToken(style, warnings);
      if (!token) continue;
      leaves.push({
        bucket: { kind: 'effect' },
        path: variableNameToPath(style.name),
        token,
      });
    }
  }

  const sets: Record<string, TokenSet> = buildSetsFromLeaves(leaves);
  send({ type: 'figma-import-apply-done', sets, warnings });
}

// ── Variable value → DTCG token ─────────────────────────────────────────────

/**
 * Convert a single Variable value (which may be an alias) into a DTCG leaf.
 * Returns null when the value is unsupported and a warning has been pushed.
 */
function variableValueToToken(
  resolvedType: FigmaResolvedType,
  raw: VariableValue,
  variableById: Map<string, Variable>,
  collectionById: Map<string, VariableCollection>,
  options: ImportOptions,
  warnings: string[],
  variableName: string,
): DTCGToken | null {
  // ── Alias ─────────────────────────────────────────────────────────────
  // Figma represents alias values as `{ type: 'VARIABLE_ALIAS', id: '...' }`
  // — we encode them as DTCG `{path}` so the round-trip back to Figma
  // (export pass 2) can reattach the alias.
  if (
    typeof raw === 'object' &&
    raw !== null &&
    (raw as { type?: string }).type === 'VARIABLE_ALIAS'
  ) {
    const targetId = (raw as VariableAlias).id;
    const target = variableById.get(targetId);
    if (!target) {
      warnings.push(
        `Variable "${variableName}" references an unknown alias target.`,
      );
      return null;
    }
    // Look up the target's collection so we can apply the same namespace
    // prefix the import loop is using for that collection's leaves. Without
    // this the alias would point at e.g. `{green.500}` while the actual
    // imported leaf path is `color.green.500`, leaving every brand /
    // semantic alias unresolvable in the plugin preview.
    const targetCollection = collectionById.get(target.variableCollectionId);
    const targetPrefix = targetCollection
      ? namespacePrefixForCollection(targetCollection.name)
      : '';
    return {
      $value: formatAlias(targetPrefix + variableNameToPath(target.name)),
      $type: figmaTypeToDtcgType(resolvedType, options),
    };
  }

  switch (resolvedType) {
    case 'COLOR': {
      const c = raw as Rgba;
      return {
        $value: formatColorRgba({
          r: c.r,
          g: c.g,
          b: c.b,
          a: c.a ?? 1,
        }),
        $type: 'color',
      };
    }
    case 'FLOAT': {
      const n = raw as number;
      if (options.numbersAsDimension) {
        return { $value: formatDimension(n, options), $type: 'dimension' };
      }
      return { $value: n, $type: 'number' };
    }
    case 'STRING': {
      return {
        $value: String(raw),
        $type: figmaTypeToDtcgType('STRING', options),
      };
    }
    case 'BOOLEAN': {
      // DTCG has no first-class boolean; we tag it `strokeStyle` to keep
      // the tree schema-valid (see dtcg-figma.ts comment).
      return {
        $value: String(Boolean(raw)),
        $type: 'strokeStyle',
      };
    }
  }
}

// ── Paint style → color token ──────────────────────────────────────────────

function paintStyleToToken(
  style: PaintStyle,
  warnings: string[],
): DTCGToken | null {
  const first = style.paints[0];
  if (!first) {
    warnings.push(`Paint style "${style.name}" has no fills.`);
    return null;
  }
  if (first.type !== 'SOLID') {
    // Gradients/images don't fit into a single DTCG color leaf — we leave
    // them out and let the designer keep the style as-is in Figma.
    warnings.push(
      `Paint style "${style.name}" is ${first.type.toLowerCase()} — only solid fills are imported.`,
    );
    return null;
  }
  const solid = first as SolidPaint;
  const a = solid.opacity != null ? solid.opacity : 1;
  return {
    $value: formatColorRgba({ ...solid.color, a }),
    $type: 'color',
  };
}

// ── Text style → typography composite ─────────────────────────────────────

function textStyleToToken(
  style: TextStyle,
  options: ImportOptions,
): DTCGToken {
  return {
    $value: {
      fontFamily: style.fontName.family,
      fontWeight: style.fontName.style,
      fontSize: formatDimension(style.fontSize, options),
      // Figma exposes lineHeight either as PIXELS / PERCENT / AUTO. We
      // serialise PIXELS as a dimension and PERCENT as a unitless number
      // so it's still useful downstream; AUTO falls back to "normal" per
      // CSS convention.
      lineHeight:
        style.lineHeight.unit === 'PIXELS'
          ? formatDimension(style.lineHeight.value, options)
          : style.lineHeight.unit === 'PERCENT'
            ? style.lineHeight.value / 100
            : 'normal',
      letterSpacing:
        style.letterSpacing.unit === 'PIXELS'
          ? formatDimension(style.letterSpacing.value, options)
          : `${style.letterSpacing.value}%`,
    },
    $type: 'typography',
  };
}

// ── Effect style → shadow composite ───────────────────────────────────────

function effectStyleToToken(
  style: EffectStyle,
  warnings: string[],
): DTCGToken | null {
  // The first DROP/INNER shadow becomes the token value. Multiple shadows
  // would need an array form — DTCG supports that, but Style Dictionary's
  // default formatters do not, and our schema only allows the single-shadow
  // shape today, so we take the first effect and warn about the rest.
  const shadows = style.effects.filter(
    (e): e is DropShadowEffect | InnerShadowEffect =>
      e.type === 'DROP_SHADOW' || e.type === 'INNER_SHADOW',
  );
  if (shadows.length === 0) {
    warnings.push(
      `Effect style "${style.name}" has no shadow effects — skipped.`,
    );
    return null;
  }
  if (shadows.length > 1) {
    warnings.push(
      `Effect style "${style.name}" has ${shadows.length} shadows — only the first was imported.`,
    );
  }
  const s = shadows[0];
  return {
    $value: {
      color: formatColorRgba({ ...s.color, a: s.color.a }),
      offsetX: `${s.offset.x}px`,
      offsetY: `${s.offset.y}px`,
      blur: `${s.radius}px`,
      spread: `${'spread' in s ? s.spread : 0}px`,
      // Inset is non-standard in DTCG core but `style-dictionary` and the
      // BTech generators recognise it on shadow tokens. Including it keeps
      // round-trip parity with Figma.
      inset: s.type === 'INNER_SHADOW',
    },
    $type: 'shadow',
  };
}
