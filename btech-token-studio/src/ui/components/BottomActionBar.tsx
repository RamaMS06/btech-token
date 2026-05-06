/**
 * BottomActionBar — primary action bar pinned to the bottom of the plugin
 * --------------------------------------------------------------------------
 * Push is the headline action a designer ever takes in this plugin: it ships
 * their work to Azure DevOps and opens a PR. Hiding it inside a small `⤒ Push`
 * icon button in the top toolbar made it feel secondary to "Pull" and
 * "Settings", and the copy gave no hint of what would happen.
 *
 * Layout:
 *   [ ⚙  ⤓ Pull ]               [ Push N changes to Azure DevOps  → ]
 *
 *   - Settings + Pull are *secondary* — they live on the left as quiet icons.
 *   - The push button is full-height, brand-coloured, right-aligned, and uses
 *     plain English ("Push 3 changes to Azure DevOps") so non-technical
 *     designers know exactly what they are about to do.
 *   - When nothing is dirty the button is disabled with the copy collapsed to
 *     "No changes to push" so the bar still communicates state.
 *
 * The component is a pure controlled view — counting dirty sets and routing
 * clicks back up to the App via callbacks.
 */

import React, { useMemo } from 'react';
import { useTokens } from '../hooks/useTokens.js';
import { countLeafChanges } from '../../shared/transform.js';

interface BottomActionBarProps {
  onShowPull: () => void;
  onShowPush: () => void;
  onShowSettings: () => void;
  /**
   * Raised when the designer clicks "Clear changes". The owner (App.tsx)
   * mounts a ConfirmDialog and calls `discardAll()` on confirmation. We
   * don't dispatch directly here so the destructive action stays gated.
   */
  onShowDiscard: () => void;
  /**
   * Raised when the designer clicks the Import Styles button.
   * Owner (App) mounts ImportStylesModal.
   */
  onShowImport: () => void;
}

export function BottomActionBar({
  onShowPull,
  onShowPush,
  onShowSettings,
  onShowDiscard,
  onShowImport,
}: BottomActionBarProps) {
  const { sets } = useTokens();
  // We count two things:
  //   - dirtySetCount  → "this set has unsaved edits" (drives button enabled state)
  //   - changeCount    → number of *leaf-level* edits across every dirty set
  //                       (drives the user-visible label)
  // Earlier the label used dirtySetCount, which made "edited 17 tokens in one
  // file" show up as "Push 1 change …" — confusing because the sidebar shows
  // tenant-override counts in the same `@N` shape, so designers expected the
  // push button to talk in tokens too. We compute changes per-set and only
  // sum the dirty ones (an unedited set has tree === originalTree by
  // contract, so it would always score 0 anyway, but skipping is cheaper for
  // large repos).
  const { dirtySetCount, changeCount } = useMemo(() => {
    let dirtySets = 0;
    let changes = 0;
    for (const s of Object.values(sets)) {
      if (!s.dirty) continue;
      dirtySets++;
      changes += countLeafChanges(s.tree, s.originalTree ?? s.tree);
    }
    return { dirtySetCount: dirtySets, changeCount: changes };
  }, [sets]);
  const hasChanges = dirtySetCount > 0;
  // If the dirty flag flipped but no leaf actually differs (rare — happens
  // when an edit is reverted by hand without the editor flipping `dirty`
  // back to false), fall back to the set count so we never display "Push 0".
  const displayCount = changeCount > 0 ? changeCount : dirtySetCount;

  const pushLabel = hasChanges
    ? `Push ${displayCount} ${displayCount === 1 ? 'change' : 'changes'} to Azure DevOps`
    : 'No changes to push';

  return (
    <footer className="bottom-action-bar" role="contentinfo">
      {/* ── Secondary controls ─────────────────────────────────────────── */}
      <div className="bottom-action-bar__secondary">
        <button
          type="button"
          className="bottom-action-bar__icon-btn"
          onClick={onShowSettings}
          title="Settings"
          aria-label="Settings"
        >
          {/* Gear cog — 6-tooth polygon + hub circle. Tooth tips at r≈5.5,
              rim at r≈3.5, hub at r=2. All coordinates relative to (7,7). */}
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M6.09 3.62L5.58 1.69L8.42 1.69L7.91 3.62L8.75 3.97L9.47 4.53L10.89 3.11L12.31 5.58L10.38 6.09L10.5 7L10.38 7.91L12.31 8.42L10.89 10.89L9.47 9.47L8.75 10.03L7.91 10.38L8.42 12.31L5.58 12.31L6.09 10.38L5.25 10.03L4.53 9.47L3.11 10.89L1.69 8.42L3.62 7.91L3.5 7L3.62 6.09L1.69 5.58L3.11 3.11L4.53 4.53L5.25 3.97Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
            <circle cx="7" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </button>

        {/* Import Styles — adjacent to Settings, same icon-button weight.
            Down-arrow-into-frame = "pull from Figma" metaphor. */}
        <button
          type="button"
          className="bottom-action-bar__icon-btn"
          onClick={onShowImport}
          title="Import Styles from Figma"
          aria-label="Import Styles from Figma"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path
              d="M7 2v7M4 6.5l3 3 3-3M2 11.5h10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          className="bottom-action-bar__pull-btn"
          onClick={onShowPull}
          title="Pull from Azure DevOps"
        >
          {/* Down arrow into a tray = pull */}
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
            <path
              d="M6 1.5v6.5M3 5l3 3 3-3M2 10.5h8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Pull</span>
        </button>
      </div>

      {/* ── Discard ──────────────────────────────────────────────────────
          Sits between secondary icons and the primary push so it's visually
          adjacent to the action it counter-balances. Disabled when nothing
          is dirty — there's no work to revert. */}
      <button
        type="button"
        className="bottom-action-bar__discard-btn"
        onClick={onShowDiscard}
        disabled={!hasChanges}
        aria-disabled={!hasChanges}
        title={
          hasChanges
            ? `Revert ${displayCount} ${displayCount === 1 ? 'change' : 'changes'} to last pulled state`
            : 'Edit a token to enable Clear'
        }
      >
        Clear changes
      </button>

      {/* ── Primary push action ─────────────────────────────────────────── */}
      <button
        type="button"
        className="bottom-action-bar__push-btn"
        onClick={onShowPush}
        disabled={!hasChanges}
        aria-disabled={!hasChanges}
        title={hasChanges ? pushLabel : 'Edit a token to enable push'}
      >
        <span className="bottom-action-bar__push-label">{pushLabel}</span>
        {hasChanges && (
          <svg
            className="bottom-action-bar__push-icon"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden
          >
            <path
              d="M2.5 6h7M6 2.5l3.5 3.5L6 9.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </footer>
  );
}
