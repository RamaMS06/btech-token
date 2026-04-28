/**
 * figma-export — main-thread executor for Export to Figma
 * ---------------------------------------------------------
 * Walks the persisted token state in `figma.clientStorage`, picks an
 * appropriate Figma Variable collection per top-level set group, then
 * runs a 2-pass create/resolve cycle:
 *
 *   Pass 1: every leaf token whose `$type` maps onto a Figma Variable
 *           type and whose `$value` is a primitive (or a parseable color
 *           string) creates / updates a Variable at the corresponding
 *           name. Aliases are deferred.
 *
 *   Pass 2: re-walk and bind any leaf whose `$value` is a `{path}` alias
 *           to its already-created sibling via
 *           `figma.variables.createVariableAlias`. Targets that don't
 *           exist (because the user disabled the type, or the path
 *           doesn't resolve to a leaf) fall back to writing the resolved
 *           primitive + warning.
 *
 * Why two passes:
 *   Figma rejects an alias to a Variable that doesn't exist yet. By
 *   creating every primitive first, we guarantee that whichever order
 *   we walk aliases in, their target exists in the panel.
 */

import type {
  FigmaExportPayload,
  FigmaExportType,
} from '../shared/figma-types.js';
import type {
  MainToUIMessage,
  TokenStorageState,
  TokenSet,
  DTCGToken,
} from '../shared/types.js';
import { treeToFlatTokens } from '../shared/transform.js';
import {
  dtcgTypeToFigmaType,
  parseColorString,
  parseAlias,
  pathToVariableName,
  type FigmaResolvedType,
} from '../shared/dtcg-figma.js';

type Send = (msg: MainToUIMessage) => void;

const STORAGE_KEY_TOKENS = 'btech.tokens';

interface FlatLeaf {
  setId: string;
  path: string;
  token: DTCGToken;
  /** Collection name this leaf belongs to (e.g. `Core`, `Semantic`). */
  collectionName: string;
  /** Mode name within the collection (default `Value`). */
  modeName: string;
}

/**
 * Designer-facing entry point. Reads tokens, walks them, mutates Figma,
 * reports results. Throws are caught by the caller in `code.ts` and turned
 * into a `figma-export-error`.
 */
export async function runFigmaExport(
  payload: FigmaExportPayload,
  send: Send,
): Promise<void> {
  const tokensRaw = await figma.clientStorage.getAsync(STORAGE_KEY_TOKENS);
  const state = (tokensRaw as TokenStorageState | undefined) ?? null;
  if (!state || Object.keys(state.sets).length === 0) {
    send({
      type: 'figma-export-error',
      message: 'No tokens loaded. Pull from the repo first, then export.',
    });
    return;
  }

  const warnings: string[] = [];
  let created = 0;
  let updated = 0;

  // ── Flatten every set to (collection, mode, path, token) leaves ──────
  const leaves = collectLeaves(state.sets, payload.enabledTypes, warnings);
  if (leaves.length === 0) {
    send({
      type: 'figma-export-done',
      created: 0,
      updated: 0,
      warnings: warnings.length
        ? warnings
        : ['Nothing to export with the current type filter.'],
    });
    return;
  }

  // ── Resolve / create destination collections + modes ─────────────────
  const collections =
    await figma.variables.getLocalVariableCollectionsAsync();
  const collectionByName = new Map(
    collections.map((c) => [c.name, c]),
  );

  // Group leaves by collection so we only mutate each one once for
  // mode-creation, then iterate per leaf for the actual variable writes.
  const byCollection = new Map<string, FlatLeaf[]>();
  for (const leaf of leaves) {
    const arr = byCollection.get(leaf.collectionName);
    if (arr) arr.push(leaf);
    else byCollection.set(leaf.collectionName, [leaf]);
  }

  // Index of every Variable we touch this run, keyed by `${collId}::${name}`,
  // so pass 2 can resolve `{path}` aliases without re-fetching.
  const variableIndex = new Map<string, Variable>();
  // Track which (collId, modeId) pair every leaf eventually wrote to so
  // pass 2 can call `setValueForMode` against the same mode.
  const leafModeIndex = new Map<FlatLeaf, { collection: VariableCollection; modeId: string }>();

  // ── PASS 1 — create primitives ───────────────────────────────────────
  const allVariables = await figma.variables.getLocalVariablesAsync();
  const existingByCollAndName = new Map<string, Variable>();
  for (const v of allVariables) {
    existingByCollAndName.set(`${v.variableCollectionId}::${v.name}`, v);
  }

  for (const [collectionName, collLeaves] of byCollection) {
    let collection = collectionByName.get(collectionName);
    if (!collection) {
      collection = figma.variables.createVariableCollection(collectionName);
      collectionByName.set(collectionName, collection);
    }

    // Ensure every required mode exists. The first mode of a freshly
    // created collection is named "Mode 1" — we rename it to the first
    // requested mode so the panel reads cleanly.
    const requestedModes = Array.from(
      new Set(collLeaves.map((l) => l.modeName)),
    );
    const modeIdByName = new Map<string, string>();
    let renamedFirst = false;
    for (const modeName of requestedModes) {
      const existing = collection.modes.find((m) => m.name === modeName);
      if (existing) {
        modeIdByName.set(modeName, existing.modeId);
        continue;
      }
      // Special-case: a freshly-created collection has exactly one mode
      // we want to repurpose rather than leave as "Mode 1".
      if (!renamedFirst && collection.modes.length === 1 && collection.modes[0].name === 'Mode 1') {
        collection.renameMode(collection.modes[0].modeId, modeName);
        modeIdByName.set(modeName, collection.modes[0].modeId);
        renamedFirst = true;
      } else {
        const newModeId = collection.addMode(modeName);
        modeIdByName.set(modeName, newModeId);
      }
    }

    for (const leaf of collLeaves) {
      const figmaType = dtcgTypeToFigmaType(leaf.token.$type);
      if (!figmaType) {
        warnings.push(
          `Skipped composite "${leaf.path}" (type ${leaf.token.$type}).`,
        );
        continue;
      }

      const variableName = pathToVariableName(leaf.path);
      const existing = existingByCollAndName.get(
        `${collection.id}::${variableName}`,
      );

      let variable: Variable;
      if (existing && existing.resolvedType === figmaType) {
        variable = existing;
        updated += 1;
      } else if (existing) {
        // Type mismatch — Figma forbids retyping in place, so we drop
        // the old one and create a new one. The collection-level rename
        // logic above guarantees the modes line up.
        existing.remove();
        variable = figma.variables.createVariable(
          variableName,
          collection,
          figmaType,
        );
        created += 1;
      } else {
        variable = figma.variables.createVariable(
          variableName,
          collection,
          figmaType,
        );
        created += 1;
      }

      variableIndex.set(`${collection.id}::${variableName}`, variable);
      const modeId = modeIdByName.get(leaf.modeName)!;
      leafModeIndex.set(leaf, { collection, modeId });

      // For aliases we leave the value blank in pass 1 — pass 2 will
      // bind the alias once every Variable exists.
      if (parseAlias(leaf.token.$value) !== null) continue;

      const resolved = resolvePrimitive(leaf.token, figmaType, warnings);
      if (resolved === undefined) continue;
      try {
        variable.setValueForMode(modeId, resolved);
      } catch (err) {
        warnings.push(
          `Failed to write "${leaf.path}" in mode "${leaf.modeName}": ${(err as Error).message}`,
        );
      }
    }
  }

  // ── PASS 2 — bind aliases ────────────────────────────────────────────
  for (const leaf of leaves) {
    const aliasPath = parseAlias(leaf.token.$value);
    if (aliasPath === null) continue;

    const slot = leafModeIndex.get(leaf);
    if (!slot) continue; // pass 1 skipped (e.g. composite type) — already warned
    const { collection, modeId } = slot;

    const targetName = pathToVariableName(aliasPath);
    // Look up the alias target in any collection. We prefer same-collection
    // matches so a `core/*` token aliases another `core/*` token rather than
    // accidentally jumping into Semantic.
    const sameCollKey = `${collection.id}::${targetName}`;
    let target = variableIndex.get(sameCollKey);
    if (!target) {
      // Fallback — pick the first match across collections.
      for (const [key, v] of variableIndex) {
        if (key.endsWith(`::${targetName}`)) {
          target = v;
          break;
        }
      }
    }

    const variable = variableIndex.get(
      `${collection.id}::${pathToVariableName(leaf.path)}`,
    );
    if (!variable) continue;

    if (!target) {
      // Target not exported — fall back to the resolved primitive.
      const figmaType = variable.resolvedType as FigmaResolvedType;
      const resolved = resolveAliasPrimitive(
        aliasPath,
        leaf.token,
        figmaType,
        leaf.setId,
        warnings,
      );
      if (resolved === undefined) {
        warnings.push(
          `Alias "${leaf.path}" → "${aliasPath}" could not be resolved (target not exported).`,
        );
        continue;
      }
      try {
        variable.setValueForMode(modeId, resolved);
      } catch (err) {
        warnings.push(
          `Failed to write fallback for "${leaf.path}": ${(err as Error).message}`,
        );
      }
      continue;
    }

    try {
      variable.setValueForMode(
        modeId,
        figma.variables.createVariableAlias(target),
      );
    } catch (err) {
      warnings.push(
        `Failed to bind alias "${leaf.path}" → "${aliasPath}": ${(err as Error).message}`,
      );
    }
  }

  send({ type: 'figma-export-done', created, updated, warnings });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Decide which Figma Variable Collection a set lives in.
 *
 *   core/*                              → `Core`           mode `Value`
 *   semantic/*                          → `Semantic`       mode `Value`
 *   components/*                        → `Components`     mode `Value`
 *   tenants/<id>/overrides              → `Tenant Overrides` mode `<id>`
 *   figma-import/<coll>/<mode>          → `<coll>`         mode `<mode>`
 *   anything else                       → first segment    mode `Value`
 */
function setIdToCollectionAndMode(setId: string): {
  collectionName: string;
  modeName: string;
} {
  const parts = setId.split('/');
  if (parts[0] === 'tenants' && parts.length >= 3) {
    return { collectionName: 'Tenant Overrides', modeName: parts[1] };
  }
  if (parts[0] === 'figma-import' && parts.length >= 3) {
    // figma-import/<coll>/<mode>
    return { collectionName: titleCase(parts[1]), modeName: titleCase(parts[2]) };
  }
  return { collectionName: titleCase(parts[0] ?? 'Tokens'), modeName: 'Value' };
}

function titleCase(s: string): string {
  return s
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function collectLeaves(
  sets: Record<string, TokenSet>,
  enabled: Record<FigmaExportType, boolean>,
  warnings: string[],
): FlatLeaf[] {
  const out: FlatLeaf[] = [];
  for (const [setId, set] of Object.entries(sets)) {
    const { collectionName, modeName } = setIdToCollectionAndMode(setId);
    for (const { path, token } of treeToFlatTokens(set.tree)) {
      const figmaType = dtcgTypeToFigmaType(token.$type);
      if (!figmaType) {
        warnings.push(
          `Skipped composite "${setId}/${path}" (type ${token.$type}).`,
        );
        continue;
      }
      // Filter against the user-selected types. Resolved Figma type
      // names are uppercase; the toggle keys are lowercase Variable
      // categories — map between them.
      if (!isTypeEnabled(figmaType, enabled)) continue;

      out.push({ setId, path, token, collectionName, modeName });
    }
  }
  return out;
}

function isTypeEnabled(
  figmaType: FigmaResolvedType,
  enabled: Record<FigmaExportType, boolean>,
): boolean {
  switch (figmaType) {
    case 'COLOR':
      return enabled.color;
    case 'STRING':
      return enabled.string;
    case 'FLOAT':
      return enabled.number;
    case 'BOOLEAN':
      return enabled.boolean;
  }
}

/**
 * Convert a primitive DTCG `$value` into the wire shape Figma's
 * `setValueForMode` accepts. Returns `undefined` to signal "skip this
 * leaf, warning was pushed" to the caller.
 */
function resolvePrimitive(
  token: DTCGToken,
  figmaType: FigmaResolvedType,
  warnings: string[],
): VariableValue | undefined {
  const v = token.$value;
  switch (figmaType) {
    case 'COLOR': {
      if (typeof v !== 'string') {
        warnings.push(`Color "${String(v)}" is not a string — skipped.`);
        return undefined;
      }
      const rgba = parseColorString(v);
      if (!rgba) {
        warnings.push(`Could not parse color "${v}".`);
        return undefined;
      }
      // Figma RGBA — the API ignores `a` on opaque types but the type
      // includes it, so we always pass the full quartet.
      return { r: rgba.r, g: rgba.g, b: rgba.b, a: rgba.a } as RGBA;
    }
    case 'FLOAT': {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        // Strip the unit (`16px`, `1rem`, `200ms`) and convert rem → px
        // because Figma stores Float variables as raw numbers.
        const m = v.match(/^(-?\d*\.?\d+)\s*(px|rem|ms|s)?$/);
        if (m) {
          let n = parseFloat(m[1]);
          if (m[2] === 'rem') n *= 16;
          if (m[2] === 's') n *= 1000;
          return n;
        }
        warnings.push(`Could not parse number "${v}".`);
        return undefined;
      }
      warnings.push(`Number "${String(v)}" is not numeric — skipped.`);
      return undefined;
    }
    case 'STRING': {
      return String(v);
    }
    case 'BOOLEAN': {
      if (typeof v === 'boolean') return v;
      if (v === 'true') return true;
      if (v === 'false') return false;
      warnings.push(`Boolean "${String(v)}" is not a literal — skipped.`);
      return undefined;
    }
  }
}

/**
 * Pass 2 fallback: when an alias's target wasn't exported, we reach for
 * any concrete value the alias *would* have resolved to and write that.
 * For now we just look at the literal `$value`; a future enhancement
 * could chase aliases through the source state.
 */
function resolveAliasPrimitive(
  _aliasPath: string,
  token: DTCGToken,
  figmaType: FigmaResolvedType,
  _setId: string,
  warnings: string[],
): VariableValue | undefined {
  // The alias literal is the `$value`; without a resolution table we
  // can't peer through it. Bail with a warning rather than guess.
  if (parseAlias(token.$value) !== null) {
    warnings.push(
      `Cannot resolve alias chain at write-time — token "${String(token.$value)}" left unset.`,
    );
    return undefined;
  }
  return resolvePrimitive(token, figmaType, warnings);
}
