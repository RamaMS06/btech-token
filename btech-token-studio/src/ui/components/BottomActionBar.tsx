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

import React from 'react';
import { useTokens } from '../hooks/useTokens.js';

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
}

export function BottomActionBar({
  onShowPull,
  onShowPush,
  onShowSettings,
  onShowDiscard,
}: BottomActionBarProps) {
  const { sets } = useTokens();
  // Recompute dirty count from the live sets map; using `dirtySets()` from
  // the store would also work but a derived count keeps this component a
  // pure render of state without invoking the action selector.
  const dirtyCount = Object.values(sets).filter((s) => s.dirty).length;
  const hasChanges = dirtyCount > 0;

  const pushLabel = hasChanges
    ? `Push ${dirtyCount} ${dirtyCount === 1 ? 'change' : 'changes'} to Azure DevOps`
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
          {/* Cog — kept simple, single-stroke for crispness at 14px */}
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <circle cx="7" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M7 1.5v1.4M7 11.1v1.4M1.5 7h1.4M11.1 7h1.4M3.1 3.1l1 1M9.9 9.9l1 1M3.1 10.9l1-1M9.9 4.1l1-1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
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
            ? `Revert ${dirtyCount} ${dirtyCount === 1 ? 'change' : 'changes'} to last pulled state`
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
