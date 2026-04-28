/**
 * ImportDiffModal — review and resolve Import vs. Main differences
 * ------------------------------------------------------------------
 * Step 2 of the import flow. Receives the freshly-built incoming sets
 * from ImportStylesModal, diffs them against the live token store, and
 * lets the designer pick a winner per row OR bulk-flip every row to one
 * side via the two header buttons (← Use all from Import / Use all from
 * Main →).
 *
 * Empty-diff fast-path:
 *   When there are no differences, the modal closes itself immediately
 *   on mount and shows a "Already in sync" notification. Avoids forcing
 *   the designer to click through a useless modal.
 *
 * Commit:
 *   On Apply we call `applyDiffResolution` to build the merged sets +
 *   touchedIds list, then pass the result to `mergeSets` (only ids in
 *   touchedIds are overwritten; everything else stays untouched).
 */

import React, { useMemo, useState } from 'react';
import { useTokenStore } from '../store/tokens.js';
import {
  diffSets,
  applyDiffResolution,
  defaultChoice,
} from '../../shared/diff-sets.js';
import type { DiffRow, DiffChoice } from '../../shared/diff-sets.js';
import type { TokenSet } from '../../shared/types.js';

interface ImportDiffModalProps {
  incoming: Record<string, TokenSet>;
  warnings?: string[];
  onClose: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Render a token value as a small swatch + label when it's a recognisable
 * color, or just the trimmed string form otherwise. We keep this defensive
 * rather than fancy — a value the diff renderer doesn't recognise becomes
 * its JSON stringification, never an error.
 */
function ValueDisplay({
  value,
  type,
}: {
  value: unknown;
  type?: string;
}) {
  // Color-typed leaves render with a swatch. We accept "color" $type or a
  // hex-shaped string regardless of type, since some imports may carry the
  // hex into a generic strokeStyle or fontFamily slot by accident.
  const isColorLike =
    type === 'color' ||
    (typeof value === 'string' && /^#[0-9a-f]{6,8}$/i.test(value.trim()));

  if (isColorLike && typeof value === 'string') {
    return (
      <span className="import-diff__value-inner">
        <span
          className="import-diff__swatch"
          style={{ background: value }}
          aria-hidden
        />
        <code>{value}</code>
      </span>
    );
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <code>{String(value)}</code>;
  }

  // Composite values get JSON form so the modal still shows *something*.
  // This is a fallback — the import path skips composites by default.
  return <code>{JSON.stringify(value)}</code>;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ImportDiffModal({
  incoming,
  warnings = [],
  onClose,
}: ImportDiffModalProps) {
  const { sets: currentSets, mergeSets } = useTokenStore();

  // Diff is a one-shot, computed from the props the modal mounts with.
  // We purposely don't recompute on every store change — that would
  // produce a moving target while the designer is making decisions.
  const rows = useMemo(
    () => diffSets(incoming, currentSets),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Per-row choice — initialised from the heuristic defaults (see
  // diff-sets.ts `defaultChoice`). The designer can flip any row, or
  // use the bulk-action buttons in the header.
  const [choices, setChoices] = useState<Map<string, DiffChoice>>(() => {
    const m = new Map<string, DiffChoice>();
    for (const r of rows) m.set(r.id, defaultChoice(r.kind));
    return m;
  });

  // Counters drive the header summary chip and the "no changes" fast-path.
  const counts = useMemo(() => {
    let add = 0;
    let change = 0;
    let remove = 0;
    for (const r of rows) {
      if (r.kind === 'add') add++;
      else if (r.kind === 'change') change++;
      else remove++;
    }
    return { add, change, remove, total: rows.length };
  }, [rows]);

  // Auto-close + notify on empty diff. Done in an effect so the parent's
  // state update on `onClose` doesn't fight with this component's render.
  React.useEffect(() => {
    if (counts.total === 0) {
      // Surface to canvas via main thread — we don't have a direct
      // toast channel in the UI, but the existing 'error' message type
      // is for ERROR notifications. Re-using would be misleading. So we
      // fall back to a plain console message; the modal closing is the
      // primary signal that nothing needed doing.
      onClose();
    }
  }, [counts.total, onClose]);

  function bulkSet(choice: DiffChoice) {
    const next = new Map(choices);
    for (const r of rows) {
      // For `add`, "from main" effectively means "skip" (there's nothing
      // on main yet). For `remove`, "from import" effectively means
      // "delete on our side". The applyDiffResolution function handles
      // the semantic mapping; here we just record the literal choice.
      next.set(r.id, choice);
    }
    setChoices(next);
  }

  function setChoice(id: string, choice: DiffChoice) {
    const next = new Map(choices);
    next.set(id, choice);
    setChoices(next);
  }

  function handleApply() {
    const { sets, touchedIds } = applyDiffResolution(
      incoming,
      currentSets,
      choices,
      rows,
    );
    if (touchedIds.length > 0) {
      mergeSets(sets, { overwriteIds: touchedIds });
    }
    onClose();
  }

  // While the empty-diff effect is racing toward onClose, keep the
  // modal visually empty rather than flashing the rows-less state.
  if (counts.total === 0) return null;

  // Group rows by setName so the list reads like a grouped diff rather
  // than 100 unrelated entries. Keeps the same insertion order as the
  // diffSets walk (which iterates Object.entries on incoming).
  const grouped = useMemo(() => {
    const groups = new Map<string, DiffRow[]>();
    for (const r of rows) {
      const arr = groups.get(r.setName);
      if (arr) arr.push(r);
      else groups.set(r.setName, [r]);
    }
    return groups;
  }, [rows]);

  // Per-group expansion state. With sets that contain hundreds of rows
  // the default-expanded layout buried the bulk-action buttons under a
  // wall of swatches — so groups start collapsed and the designer drills
  // into the ones they care about. The first group starts expanded so
  // the modal doesn't open as a featureless list of headers.
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const first = grouped.keys().next().value;
    return new Set(first ? [first] : []);
  });

  const allExpanded = expanded.size === grouped.size && grouped.size > 0;

  function toggleGroup(setName: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(setName)) next.delete(setName);
      else next.add(setName);
      return next;
    });
  }

  function toggleAll() {
    if (allExpanded) {
      setExpanded(new Set());
    } else {
      setExpanded(new Set(grouped.keys()));
    }
  }

  // Per-group counts for the collapsed header summary, so the designer
  // can see "12 add · 3 change" without expanding the body.
  function groupCounts(setRows: DiffRow[]) {
    let add = 0, change = 0, remove = 0;
    for (const r of setRows) {
      if (r.kind === 'add') add++;
      else if (r.kind === 'change') change++;
      else remove++;
    }
    return { add, change, remove };
  }

  // Derive the "currently active" bulk mode from per-row choices so the
  // two header buttons can highlight the active side. We only flag a
  // bulk button as active when EVERY relevant row matches it — once the
  // designer makes a single per-row exception we fall back to no-active
  // (mixed state) so the UI doesn't lie about the resolution.
  //
  // Note: `add` rows can hold 'import' | 'skip' (their "main" radio is
  // the skip option), `change` rows hold 'import' | 'main', and `remove`
  // rows hold 'main' | 'skip'. We map both buttons to the same intent:
  //   • Import button = "all from import" (add→import, change→import,
  //     remove→import meaning accept the deletion).
  //   • Main button = "all from main" (add→skip, change→main,
  //     remove→main meaning keep current).
  const bulkState: 'import' | 'main' | 'mixed' = useMemo(() => {
    if (rows.length === 0) return 'mixed';
    let allImport = true;
    let allMain = true;
    for (const r of rows) {
      const c = choices.get(r.id) ?? defaultChoice(r.kind);
      if (c !== 'import') allImport = false;
      if (c !== 'main') allMain = false;
      if (!allImport && !allMain) break;
    }
    if (allImport) return 'import';
    if (allMain) return 'main';
    return 'mixed';
  }, [rows, choices]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal modal--wide"
        role="dialog"
        aria-modal
        aria-label="Review Import Changes"
      >
        <div className="modal__header">
          <h2 className="modal__title">Review Import Changes</h2>
          <button className="modal__close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Sticky sub-header with counts + bulk buttons */}
        <div className="import-diff__counter">
          <span><strong>{counts.add}</strong> additions</span>
          <span aria-hidden>·</span>
          <span><strong>{counts.change}</strong> modifications</span>
          <span aria-hidden>·</span>
          <span><strong>{counts.remove}</strong> removals</span>
        </div>
        <div className="import-diff__bulk" role="group" aria-label="Bulk resolution">
          <button
            type="button"
            className={
              'import-diff__bulk-btn import-diff__bulk-btn--import' +
              (bulkState === 'import' ? ' import-diff__bulk-btn--active' : '')
            }
            onClick={() => bulkSet('import')}
            aria-pressed={bulkState === 'import'}
            title="Set every row to use the imported value"
          >
            ← Use all from Import
          </button>
          <button
            type="button"
            className={
              'import-diff__bulk-btn import-diff__bulk-btn--main' +
              (bulkState === 'main' ? ' import-diff__bulk-btn--active' : '')
            }
            onClick={() => bulkSet('main')}
            aria-pressed={bulkState === 'main'}
            title="Set every row to keep the current main value"
          >
            Use all from Main →
          </button>
        </div>

        {grouped.size > 1 && (
          <div className="import-diff__expand-row">
            <button
              type="button"
              className="import-diff__expand-all"
              onClick={toggleAll}
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
        )}

        <div className="modal__body import-diff__list">
          {Array.from(grouped.entries()).map(([setName, setRows]) => {
            const isOpen = expanded.has(setName);
            const gc = groupCounts(setRows);
            return (
              <div
                key={setName}
                className={`import-diff__group ${isOpen ? 'import-diff__group--open' : 'import-diff__group--closed'}`}
              >
                <button
                  type="button"
                  className="import-diff__group-header"
                  onClick={() => toggleGroup(setName)}
                  aria-expanded={isOpen}
                >
                  <svg
                    className={`import-diff__group-caret ${isOpen ? 'import-diff__group-caret--open' : ''}`}
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    aria-hidden
                  >
                    <path
                      d="M3 2l4 3-4 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="import-diff__group-name">{setName}</span>
                  <span className="import-diff__group-meta">
                    {gc.add > 0 && (
                      <span className="import-diff__group-stat import-diff__group-stat--add">
                        +{gc.add}
                      </span>
                    )}
                    {gc.change > 0 && (
                      <span className="import-diff__group-stat import-diff__group-stat--change">
                        ~{gc.change}
                      </span>
                    )}
                    {gc.remove > 0 && (
                      <span className="import-diff__group-stat import-diff__group-stat--remove">
                        −{gc.remove}
                      </span>
                    )}
                  </span>
                </button>
                {isOpen &&
                  setRows.map((row) => (
                    <DiffRowView
                      key={row.id}
                      row={row}
                      choice={choices.get(row.id) ?? defaultChoice(row.kind)}
                      onChoice={(c) => setChoice(row.id, c)}
                    />
                  ))}
              </div>
            );
          })}

          {warnings.length > 0 && (
            <details className="modal__warnings">
              <summary>{warnings.length} import warning{warnings.length === 1 ? '' : 's'}</summary>
              <ul>
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </details>
          )}
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Row component ─────────────────────────────────────────────────────────

interface DiffRowViewProps {
  row: DiffRow;
  choice: DiffChoice;
  onChoice: (c: DiffChoice) => void;
}

function DiffRowView({ row, choice, onChoice }: DiffRowViewProps) {
  const badge =
    row.kind === 'add' ? '+' : row.kind === 'remove' ? '−' : '~';
  const rowMod = `import-diff__row--${row.kind}`;

  return (
    <div className={`import-diff__row ${rowMod}`}>
      <div className="import-diff__row-head">
        <span className={`import-diff__badge import-diff__badge--${row.kind}`}>
          {badge}
        </span>
        <code className="import-diff__path">{row.tokenPath}</code>
        {row.importType && (
          <span className="import-diff__type">{row.importType}</span>
        )}
      </div>

      <div className="import-diff__values">
        {(row.kind === 'add' || row.kind === 'change') && (
          <label className="import-diff__value import-diff__value--import">
            <input
              type="radio"
              className="import-diff__radio"
              name={`row-${row.id}`}
              checked={choice === 'import'}
              onChange={() => onChoice('import')}
            />
            <span className="import-diff__value-label">From Import</span>
            <ValueDisplay value={row.importValue} type={row.importType} />
          </label>
        )}

        {(row.kind === 'change' || row.kind === 'remove') && (
          <label className="import-diff__value import-diff__value--main">
            <input
              type="radio"
              className="import-diff__radio"
              name={`row-${row.id}`}
              checked={choice === 'main'}
              onChange={() => onChoice('main')}
            />
            <span className="import-diff__value-label">From Main</span>
            <ValueDisplay value={row.mainValue} type={row.mainType} />
          </label>
        )}

        {/* For `add` and `remove` we also expose a "skip" option so the
            designer can ignore the row entirely. For `change` rows the two
            radios are mutually exclusive — skip would just mirror "main",
            so we omit it to reduce visual clutter. */}
        {(row.kind === 'add' || row.kind === 'remove') && (
          <label className="import-diff__value import-diff__value--skip">
            <input
              type="radio"
              className="import-diff__radio"
              name={`row-${row.id}`}
              checked={choice === 'skip' || (row.kind === 'add' && choice === 'main') || (row.kind === 'remove' && choice === 'main' && false)}
              onChange={() => onChoice('skip')}
            />
            <span className="import-diff__value-label">
              {row.kind === 'add' ? 'Skip (don\u2019t add)' : 'Keep (don\u2019t remove)'}
            </span>
          </label>
        )}
      </div>
    </div>
  );
}
