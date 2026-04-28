/**
 * BranchSwitcher — git branch dropdown in the top toolbar
 * --------------------------------------------------------
 * Picks which branch the plugin pulls from and pushes against. The choice
 * also drives the CI bump verb:
 *   - `main` → patch  → tags `v<x>` / `<tenant>-v<x>`         → dist-tag `latest`
 *   - `dev`  → rc     → tags `v<x>-rc.<n>` / `<tenant>-v<x>-rc.<n>` → dist-tag `rc`
 *
 * Mirrors `<ThemeSwitcher>` visually and behaviourally — same label-and-select
 * pattern, same dirty-state confirmation. Designers should perceive branch as
 * a peer of tenant: a filter that retargets their work without changing what
 * tokens exist.
 *
 * Switching while dirty
 * ---------------------
 * Branch switch retargets pull / push to a different repo line. Dirty work
 * was pulled from the previous branch, so keeping it across a branch switch
 * would mix baselines. We discard dirty sets (with a confirm) on switch —
 * same rule as tenant switch. Designer pulls from the new branch to pick up
 * the fresh state.
 */

import React, { useMemo, useState } from 'react';
import { useSettingsStore } from '../store/settings.js';
import { useTokens } from '../hooks/useTokens.js';
import { useTokenStore } from '../store/tokens.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import type { ActiveBranch } from '../../shared/types.js';

const BRANCH_OPTIONS: Array<{ value: ActiveBranch; label: string }> = [
  { value: 'main', label: 'Main (release)' },
  { value: 'dev', label: 'Dev (rc)' },
];

export function BranchSwitcher() {
  const activeBranch = useSettingsStore((s) => s.settings.activeBranch);
  const setBranch = useSettingsStore((s) => s.setBranch);
  const { sets, discardAll, setRemoteVersion } = useTokens();
  // Reach directly into the token store for `swapToBranch` — `useTokens`
  // exposes a curated subset and adding the swap action there would force
  // every consumer to re-render on cache writes. The header is the only
  // place that swaps, so a direct reference keeps things contained.
  const swapToBranch = useTokenStore((s) => s.swapToBranch);

  const dirtyCount = useMemo(
    () => Object.values(sets).filter((s) => s.dirty).length,
    [sets],
  );

  // Pending branch captured from the dropdown when we need to confirm first.
  // `null` means "no switch in flight". Using `null` (not `undefined`) here
  // because every option has a valid string value — there's no "Default"
  // empty-string slot like the tenant switcher.
  const [pendingBranch, setPendingBranch] = useState<ActiveBranch | null>(null);

  /**
   * Swap the live view to the target branch's cached snapshot (if any),
   * then flip `settings.activeBranch` so subsequent pull/push target the
   * new branch. `remoteVersion` is intentionally cleared — the silent
   * poll re-fires on `activeBranch` change and refills it from the new
   * branch's `package.json`, so we'd rather show no badge briefly than
   * a stale one against the previous branch.
   *
   * If the designer has already pulled the target branch in this
   * session (or a previous one — `branchSnapshots` is persisted), the
   * swap is instantaneous: sets, baseVersion, and lastPullSha all
   * restore from cache and the header renders the target branch's
   * version immediately. Otherwise the top-level fields fall back to
   * "never pulled" and the designer pulls from the new branch as
   * normal.
   */
  function applySwitch(target: ActiveBranch) {
    swapToBranch(activeBranch, target);
    setRemoteVersion(null);
    setBranch(target);
  }

  function handleChange(value: string) {
    if (value !== 'main' && value !== 'dev') return;
    if (value === activeBranch) return;

    if (dirtyCount > 0) {
      setPendingBranch(value);
      return;
    }
    applySwitch(value);
  }

  function confirmSwitch() {
    if (!pendingBranch) return;
    discardAll();
    applySwitch(pendingBranch);
    setPendingBranch(null);
  }

  return (
    <div className="branch-switcher">
      <span className="branch-switcher__label">Branch</span>
      <select
        className="branch-switcher__select"
        value={activeBranch}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Active branch"
      >
        {BRANCH_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {pendingBranch !== null && (
        <ConfirmDialog
          title="Switch branch?"
          body={
            <>
              You have <strong>{dirtyCount}</strong> unsaved {dirtyCount === 1 ? 'change' : 'changes'} pulled
              from <code>{activeBranch}</code>. Switching to <code>{pendingBranch}</code> will discard
              {dirtyCount === 1 ? ' it' : ' them'} — pull from the new branch afterwards to refresh.
            </>
          }
          confirmLabel="Discard & switch"
          cancelLabel="Stay here"
          onConfirm={confirmSwitch}
          onClose={() => setPendingBranch(null)}
        />
      )}
    </div>
  );
}
