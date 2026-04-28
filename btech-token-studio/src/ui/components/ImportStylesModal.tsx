/**
 * ImportStylesModal — pick which Figma Variables / Styles to import
 * -------------------------------------------------------------------
 * Step 1 of 2 in the import flow:
 *   1. Designer opens this modal → main thread scans the active Figma file
 *      → tree + style buckets render → designer ticks what they want.
 *   2. Click Import → main thread builds DTCG TokenSets → modal closes and
 *      hands the result up to App.tsx, which mounts ImportDiffModal.
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
  ImportSelection,
  ImportOptions,
} from '../../shared/figma-types.js';
import type { MainToUIMessage, TokenSet } from '../../shared/types.js';

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
}

const DEFAULT_OPTIONS: ImportOptions = {
  numbersAsDimension: true,
  useRem: false,
};

// ── Tree-id conventions ────────────────────────────────────────────────────
//
// We encode the leaf id with a prefix per source family so the resolution
// logic doesn't have to track which bucket a given id came from. Format:
//
//   `coll::<collectionId>::<modeId>`
//   `paint::<styleId>`
//   `text::<styleId>`
//   `effect::<styleId>`
//
// Parents (collections, root buckets) get plain `coll-root-<id>` so their
// ids never collide with leaves.

function leafCollectionId(collectionId: string, modeId: string): string {
  return `coll::${collectionId}::${modeId}`;
}

function leafPaintId(id: string): string {
  return `paint::${id}`;
}
function leafTextId(id: string): string {
  return `text::${id}`;
}
function leafEffectId(id: string): string {
  return `effect::${id}`;
}

// ── Build CheckboxTree input from FigmaImportTree ──────────────────────────

function buildNodes(tree: FigmaImportTree): TreeNode[] {
  const out: TreeNode[] = [];

  // Variable Collections — only render the bucket when it actually has
  // contents, otherwise the tree gets cluttered with empty headers.
  if (tree.collections.length > 0) {
    out.push({
      id: 'coll-root',
      label: 'Variable Collections',
      children: tree.collections.map((c) => ({
        id: `coll-root-${c.id}`,
        label: c.name,
        children: c.modes.map((m) => ({
          id: leafCollectionId(c.id, m.modeId),
          label: m.name,
          count: m.variableCount,
        })),
      })),
    });
  }

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
  const paintStyles: string[] = [];
  const textStyles: string[] = [];
  const effectStyles: string[] = [];

  for (const id of checked) {
    if (id.startsWith('coll::')) {
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

  return { collections, paintStyles, textStyles, effectStyles };
}

// ── Component ──────────────────────────────────────────────────────────────

export function ImportStylesModal({
  onClose,
  onImportComplete,
}: ImportStylesModalProps) {
  const [scan, setScan] = useState<FigmaImportTree | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<ImportOptions>(DEFAULT_OPTIONS);
  const [busy, setBusy] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  // Kick the scan on mount. We don't gate this behind a button — the
  // scan is read-only and finishes in milliseconds, so the loading
  // state is barely perceptible in practice.
  useEffect(() => {
    parent.postMessage(
      { pluginMessage: { type: 'figma-import-scan' } },
      '*',
    );
  }, []);

  // Listen for both the scan response AND the apply response on the same
  // listener to keep ordering simple.
  useEffect(() => {
    function handle(event: MessageEvent) {
      const msg = (event.data?.pluginMessage ?? event.data) as
        | MainToUIMessage
        | undefined;
      if (!msg || typeof msg.type !== 'string') return;

      if (msg.type === 'figma-import-scan-done') {
        setScan(msg.payload);
      } else if (msg.type === 'figma-import-apply-done') {
        setBusy(false);
        onImportComplete(msg.sets, msg.warnings);
      } else if (msg.type === 'figma-import-error') {
        setBusy(false);
        if (!scan) {
          // Error during scan — surface in body so the modal isn't a
          // useless empty shell.
          setScanError(msg.message);
        } else {
          setApplyError(msg.message);
        }
      }
    }
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
    // intentionally re-attach when `scan` flips so the error router has
    // up-to-date context for which phase failed.
  }, [scan, onImportComplete]);

  const nodes = useMemo<TreeNode[]>(() => (scan ? buildNodes(scan) : []), [scan]);

  // The Import button needs at least one ticked LEAF — counting non-leaf
  // descendants would give false positives because partial ticks should
  // also be importable (the tree handles cascading).
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

  // Empty state — Figma file has nothing to import. The blurb explains
  // what to do; the Import button stays disabled.
  const emptyFile =
    scan !== null &&
    scan.collections.length === 0 &&
    scan.paintStyles.length === 0 &&
    scan.textStyles.length === 0 &&
    scan.effectStyles.length === 0;

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
          <button className="modal__close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal__body">
          <p className="modal__blurb">
            Select which variable collections, modes, and styles to import.
            A separate token set is created for each selected mode — review
            and resolve differences against main in the next step.
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
