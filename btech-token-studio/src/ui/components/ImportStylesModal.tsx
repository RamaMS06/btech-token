/**
 * ImportStylesModal — pick which Figma Variables / Styles to import
 * -------------------------------------------------------------------
 * Step 1 of 2 in the import flow:
 *   1. Designer opens this modal → main thread scans the active Figma file
 *      → tree + style buckets render → designer ticks what they want.
 *   2. Click Import → main thread builds DTCG TokenSets → modal closes and
 *      hands the result up to App.tsx, which mounts ImportDiffModal.
 *
 * Diff-aware tree
 * ---------------
 * When `existingTokens` is supplied (always, from the Zustand store), the
 * modal compares every scanned Figma variable against the in-memory token
 * store and classifies each as:
 *   - 'new'     — path not found in any existing set       → show, green badge
 *   - 'changed' — path found but with a different value    → show, amber badge
 *   - 'same'    — path found with identical value          → HIDDEN
 *
 * Variables classified as 'same' are silently excluded from the checkbox
 * tree — they'd be a no-op import anyway. The parent node's count badge
 * shows only the new+changed count, not the raw Figma variable count.
 *
 * Single-mode flattening
 * ----------------------
 * When a collection has exactly one mode (e.g. "Mode 1"), the mode level
 * is removed from the tree. Instead of:
 *   Primitives → Mode 1 (132)
 * The tree shows:
 *   Primitives (N)
 *     color.primary.100 [new]
 *     ...
 * For multi-mode collections, modes remain as intermediate parent nodes.
 *
 * Selection granularity
 * ---------------------
 * Leaf nodes now encode a specific variable id, collection id, and mode id:
 *   `var::<variableId>::<collectionId>::<modeId>`
 * This lets `toSelection()` build a per-variable allowlist (`variableFilter`)
 * for the apply step — only the designer's cherry-picked variables are
 * imported, not the entire collection+mode.
 *
 * This component is intentionally NOT responsible for committing anything
 * to the store — it just collects intent and produces the incoming sets.
 * The diff/resolve modal handles the actual write.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ToggleSwitch } from './ToggleSwitch.js';
import { CheckboxTree } from './CheckboxTree.js';
import type { TreeNode } from './CheckboxTree.js';
import type {
  FigmaImportTree,
  FigmaVariableInfo,
  ImportSelection,
  ImportOptions,
} from '../../shared/figma-types.js';
import type { MainToUIMessage, TokenSet, DTCGToken, DTCGGroup } from '../../shared/types.js';
import {
  formatColorRgba,
  formatDimension,
} from '../../shared/dtcg-figma.js';

interface ImportStylesModalProps {
  onClose: () => void;
  /**
   * Called once the main thread returns a built sets map. Owner (App)
   * mounts the diff modal and tears this one down. Warnings are forwarded
   * so the diff modal (or a future toast) can surface them.
   */
  onImportComplete: (
    incoming: Record<string, TokenSet>,
    warnings: string[],
  ) => void;
  /**
   * Current in-memory token store, used to diff incoming Figma variables
   * against already-imported tokens. Pass `tokenStore.sets` from the
   * parent App component. When empty ({}), all variables are classified
   * as 'new'.
   */
  existingTokens?: Record<string, TokenSet>;
}

const DEFAULT_OPTIONS: ImportOptions = {
  numbersAsDimension: true,
  useRem: false,
};

// ── Tree-id conventions ────────────────────────────────────────────────────
//
// Variable collections use per-variable leaf ids so the apply step can
// receive an exact variable allowlist:
//
//   `var::<variableId>::<collectionId>::<modeId>`  (variable leaf)
//   `coll-group-<collectionId>`                    (collection parent)
//   `mode-group-<collectionId>-<modeId>`           (mode parent for multi-mode)
//
// Paint / text / effect style leaves keep the original prefix format
// (unchanged from before):
//
//   `paint::<styleId>`
//   `text::<styleId>`
//   `effect::<styleId>`

function leafVarId(variableId: string, collectionId: string, modeId: string): string {
  return `var::${variableId}::${collectionId}::${modeId}`;
}
function leafPaintId(id: string): string { return `paint::${id}`; }
function leafTextId(id: string): string  { return `text::${id}`;  }
function leafEffectId(id: string): string { return `effect::${id}`; }

// ── Diff utilities (pure — no Figma API calls) ─────────────────────────────

/**
 * Traverse a DTCG group tree following the given dot-separated path
 * segments and return the token leaf, or null if not found.
 */
function findTokenAtPath(tree: DTCGGroup, segments: string[]): DTCGToken | null {
  let node: unknown = tree;
  for (const seg of segments) {
    if (
      !node ||
      typeof node !== 'object' ||
      '$value' in (node as object)
    ) {
      return null;
    }
    node = (node as Record<string, unknown>)[seg];
  }
  if (
    node &&
    typeof node === 'object' &&
    '$value' in (node as object)
  ) {
    return node as DTCGToken;
  }
  return null;
}

/**
 * Convert a raw Figma VariableValue to the serialised DTCG `$value` string
 * that `figma-import.ts` would produce, given the current ImportOptions.
 * Returns `null` for alias values (can't compare without resolving the
 * alias chain, so we treat them as "changed" by convention).
 */
function convertRawValue(
  raw: unknown,
  resolvedType: string,
  options: ImportOptions,
): string | number | null {
  // Alias — represented as { type: 'VARIABLE_ALIAS', id: '...' }
  if (
    typeof raw === 'object' &&
    raw !== null &&
    (raw as { type?: string }).type === 'VARIABLE_ALIAS'
  ) {
    return null;
  }

  switch (resolvedType) {
    case 'COLOR': {
      const c = raw as { r: number; g: number; b: number; a?: number };
      return formatColorRgba({ r: c.r, g: c.g, b: c.b, a: c.a ?? 1 });
    }
    case 'FLOAT': {
      const n = raw as number;
      return options.numbersAsDimension ? formatDimension(n, options) : n;
    }
    case 'STRING': return String(raw);
    case 'BOOLEAN': return String(Boolean(raw));
    default: return String(raw);
  }
}

type VarStatus = 'new' | 'changed' | 'same';

/**
 * Classify a single Figma variable against the existing token store.
 *
 *   'new'     — the DTCG path doesn't exist in any stored set
 *   'changed' — found in the store, but the converted value differs
 *               (or the value is an alias — treat as potentially changed)
 *   'same'    — found with exactly the same converted value → hide from tree
 */
function classifyVariable(
  variable: FigmaVariableInfo,
  modeId: string,
  options: ImportOptions,
  existingTokens: Record<string, TokenSet>,
): VarStatus {
  const segments = variable.path.split('.');
  const rawValue = variable.valuesByMode[modeId];

  for (const tokenSet of Object.values(existingTokens)) {
    const existing = findTokenAtPath(tokenSet.tree, segments);
    if (existing) {
      // Path found — compare values.
      const converted = convertRawValue(rawValue, variable.resolvedType, options);
      if (converted === null) {
        // Alias: can't do a clean value compare → treat as changed
        return 'changed';
      }
      return String(existing.$value) === String(converted) ? 'same' : 'changed';
    }
  }

  return 'new';
}

// ── Build CheckboxTree nodes from scan + diff result ───────────────────────

/**
 * Build the tree that the CheckboxTree component renders.
 *
 * Structure for single-mode collections (singleMode === true):
 *   Variable Collections
 *     Primitives (N)
 *       color.primary.100 [new]
 *       color.semantic.brand [changed]
 *
 * Structure for multi-mode collections:
 *   Variable Collections
 *     Semantic Colors (N total)
 *       Light (N)
 *         color.semantic.brand [changed]
 *       Dark (M)
 *         color.semantic.brand [new]
 *
 * Paint / text / effect styles are appended after variable collections
 * using the original flat style (no per-item diff for now).
 */
function buildDiffNodes(
  tree: FigmaImportTree,
  existingTokens: Record<string, TokenSet>,
  options: ImportOptions,
): TreeNode[] {
  const out: TreeNode[] = [];

  // ── Variable Collections ──────────────────────────────────────────────
  if (tree.collections.length > 0) {
    const collNodes: TreeNode[] = [];

    for (const coll of tree.collections) {
      if (coll.singleMode) {
        // ── Single-mode: variables are direct children of the collection ──
        const mode = coll.modes[0];
        const leaves: TreeNode[] = [];

        for (const variable of coll.variables) {
          const status = classifyVariable(variable, mode.modeId, options, existingTokens);
          if (status === 'same') continue;
          leaves.push({
            id: leafVarId(variable.id, coll.id, mode.modeId),
            label: variable.path,
            status,
          });
        }

        if (leaves.length === 0) continue; // no new/changed — hide collection

        collNodes.push({
          id: `coll-group-${coll.id}`,
          label: coll.name,
          count: leaves.length,
          children: leaves,
        });
      } else {
        // ── Multi-mode: modes are intermediate parents ──────────────────
        const modeNodes: TreeNode[] = [];
        let totalCount = 0;

        for (const mode of coll.modes) {
          const leaves: TreeNode[] = [];

          for (const variable of coll.variables) {
            const status = classifyVariable(variable, mode.modeId, options, existingTokens);
            if (status === 'same') continue;
            leaves.push({
              id: leafVarId(variable.id, coll.id, mode.modeId),
              label: variable.path,
              status,
            });
          }

          if (leaves.length === 0) continue; // mode has no new/changed vars

          modeNodes.push({
            id: `mode-group-${coll.id}-${mode.modeId}`,
            label: mode.name,
            count: leaves.length,
            children: leaves,
          });
          totalCount += leaves.length;
        }

        if (modeNodes.length === 0) continue; // whole collection is unchanged

        collNodes.push({
          id: `coll-group-${coll.id}`,
          label: coll.name,
          count: totalCount,
          children: modeNodes,
        });
      }
    }

    if (collNodes.length > 0) {
      out.push({
        id: 'coll-root',
        label: 'Variable Collections',
        children: collNodes,
      });
    }
  }

  // ── Paint / text / effect styles (no value diff — show all) ──────────
  if (tree.paintStyles.length > 0) {
    out.push({
      id: 'paint-root',
      label: 'Color Styles',
      children: tree.paintStyles.map((s) => ({
        id: leafPaintId(s.id),
        label: s.name,
      })),
    });
  }

  if (tree.textStyles.length > 0) {
    out.push({
      id: 'text-root',
      label: 'Text Styles',
      children: tree.textStyles.map((s) => ({
        id: leafTextId(s.id),
        label: s.name,
      })),
    });
  }

  if (tree.effectStyles.length > 0) {
    out.push({
      id: 'effect-root',
      label: 'Effect Styles',
      children: tree.effectStyles.map((s) => ({
        id: leafEffectId(s.id),
        label: s.name,
      })),
    });
  }

  return out;
}

// ── Convert checked-leaf set → ImportSelection wire shape ──────────────────

function toSelection(checked: Set<string>): ImportSelection {
  const collections: Record<string, string[]> = {};
  const variableIds = new Set<string>();
  const paintStyles: string[] = [];
  const textStyles: string[] = [];
  const effectStyles: string[] = [];

  for (const id of checked) {
    if (id.startsWith('var::')) {
      // var::<variableId>::<collectionId>::<modeId>
      const parts = id.split('::');
      const varId  = parts[1];
      const collId = parts[2];
      const modeId = parts[3];
      if (!collections[collId]) collections[collId] = [];
      if (!collections[collId].includes(modeId)) {
        collections[collId].push(modeId);
      }
      variableIds.add(varId);
    } else if (id.startsWith('coll::')) {
      // Legacy format (kept in case fallback path is used)
      const [, collId, modeId] = id.split('::');
      if (!collections[collId]) collections[collId] = [];
      collections[collId].push(modeId);
    } else if (id.startsWith('paint::')) {
      paintStyles.push(id.slice('paint::'.length));
    } else if (id.startsWith('text::')) {
      textStyles.push(id.slice('text::'.length));
    } else if (id.startsWith('effect::')) {
      effectStyles.push(id.slice('effect::'.length));
    }
  }

  return {
    collections,
    // Only pass variableFilter when the diff-tree is in use (var:: ids).
    // If the set only has style ids, we skip the filter so the apply step
    // imports everything as before.
    variableFilter: variableIds.size > 0 ? [...variableIds] : undefined,
    paintStyles,
    textStyles,
    effectStyles,
  };
}

// ── Component ──────────────────────────────────────────────────────────────

export function ImportStylesModal({
  onClose,
  onImportComplete,
  existingTokens = {},
}: ImportStylesModalProps) {
  const [scan, setScan] = useState<FigmaImportTree | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<ImportOptions>(DEFAULT_OPTIONS);
  const [busy, setBusy] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  // True while a re-scan triggered by a Figma document change is in flight.
  // Shows a subtle "Refreshing…" badge next to the tree header so the
  // designer knows the list is being updated without losing their selections.
  const [rescanning, setRescanning] = useState(false);

  // ── Scan trigger ──────────────────────────────────────────────────────────
  function requestScan() {
    parent.postMessage(
      { pluginMessage: { type: 'figma-import-scan' } },
      '*',
    );
  }

  // Kick the scan on mount. The scan is read-only and fast — no gate needed.
  useEffect(() => {
    requestScan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for scan responses, apply responses, and real-time variable-change
  // notifications from the main thread.
  useEffect(() => {
    function handle(event: MessageEvent) {
      const msg = (event.data?.pluginMessage ?? event.data) as
        | MainToUIMessage
        | undefined;
      if (!msg || typeof msg.type !== 'string') return;

      if (msg.type === 'figma-import-scan-done') {
        setScan(msg.payload);
        setRescanning(false);
      } else if (msg.type === 'figma-import-apply-done') {
        setBusy(false);
        onImportComplete(msg.sets, msg.warnings);
      } else if (msg.type === 'figma-import-error') {
        setBusy(false);
        setRescanning(false);
        if (!scan) {
          setScanError(msg.message);
        } else {
          setApplyError(msg.message);
        }
      } else if (msg.type === 'figma-variables-changed') {
        // Silent re-scan on document change. Preserve existing selections.
        if (!busy) {
          setRescanning(true);
          requestScan();
        }
      }
    }
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan, busy, onImportComplete]);

  /**
   * Build the diff-filtered tree. Recomputed whenever the scan, options,
   * or the existing token store changes — options affect value conversion
   * (e.g. px vs rem) which can flip a 'same' into 'changed'.
   */
  const nodes = useMemo<TreeNode[]>(
    () => (scan ? buildDiffNodes(scan, existingTokens, options) : []),
    [scan, existingTokens, options],
  );

  /**
   * True when the diff finds at least one new or changed variable (or any
   * style). An "all same" result renders an empty tree with a dedicated
   * empty-state message instead of the regular "no variables" message.
   */
  const allSame =
    scan !== null &&
    nodes.length === 0 &&
    (scan.collections.length > 0 ||
      scan.paintStyles.length > 0 ||
      scan.textStyles.length > 0 ||
      scan.effectStyles.length > 0);

  const emptyFile =
    scan !== null &&
    scan.collections.length === 0 &&
    scan.paintStyles.length === 0 &&
    scan.textStyles.length === 0 &&
    scan.effectStyles.length === 0;

  const hasSelection = checked.size > 0;

  function handleImport() {
    if (!scan) return;
    setApplyError(null);
    setBusy(true);
    parent.postMessage(
      {
        pluginMessage: {
          type: 'figma-import-apply',
          selection: toSelection(checked),
          options,
        },
      },
      '*',
    );
  }

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal modal--wide"
        role="dialog"
        aria-modal
        aria-label="Import Styles"
      >
        <div className="modal__header">
          <h2 className="modal__title">Import Styles</h2>
          <div className="modal__header-actions">
            {rescanning && (
              <span className="modal__rescan-badge" aria-live="polite">
                Refreshing…
              </span>
            )}
            {!rescanning && scan !== null && !busy && (
              <button
                type="button"
                className="modal__refresh-btn"
                onClick={() => { setRescanning(true); requestScan(); }}
                title="Refresh variable list"
                aria-label="Refresh variable list"
              >
                ↻
              </button>
            )}
            <button className="modal__close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="modal__body">
          <p className="modal__blurb">
            Select which variable collections, modes, and styles to import.
            Only new or value-changed tokens are shown — identical tokens are
            automatically hidden. A separate token set is created for each
            selected mode.
          </p>

          <div className="import-styles__options">
            <ToggleSwitch
              checked={options.numbersAsDimension}
              onChange={(next) =>
                setOptions((o) => ({ ...o, numbersAsDimension: next }))
              }
              label="Convert numbers to dimensions"
              description="Treat Figma FLOAT variables as `dimension` tokens (px/rem)."
              disabled={busy}
            />
            <ToggleSwitch
              checked={options.useRem}
              onChange={(next) => setOptions((o) => ({ ...o, useRem: next }))}
              label="Use rem for dimension values"
              description="Express dimensions as `rem` (1rem = 16px) instead of `px`."
              disabled={busy || !options.numbersAsDimension}
            />
          </div>

          {scanError ? (
            <div className="modal__error" role="alert">
              {scanError}
            </div>
          ) : scan === null ? (
            <div className="modal__loading">Scanning Figma file…</div>
          ) : emptyFile ? (
            <div className="checkbox-tree__empty">
              No variables or styles in this Figma file.
            </div>
          ) : allSame ? (
            <div className="import-styles__all-same">
              <span className="import-styles__all-same-icon">✓</span>
              All variables are already up to date in your token store.
              Nothing new to import.
            </div>
          ) : (
            <CheckboxTree nodes={nodes} value={checked} onChange={setChecked} />
          )}

          {applyError && (
            <div className="modal__error" role="alert">
              {applyError}
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleImport}
            disabled={busy || !scan || emptyFile || !hasSelection}
          >
            {busy ? 'Importing…' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
