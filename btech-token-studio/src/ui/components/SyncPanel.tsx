/**
 * SyncPanel — modal handling pull and push operations
 * -----------------------------------------------------
 * Two modes controlled by the `initialMode` prop:
 *
 * Pull mode:
 *   - Shows last pull time + SHA
 *   - If any set is dirty: warning panel → "Push first" | "Discard & pull"
 *   - On confirm: delegates to useSync().pull()
 *
 * Push mode:
 *   - Shows count of dirty sets + list of changed paths
 *   - Pre-push Ajv validation; blocks on failure
 *   - On confirm: delegates to useSync().push() → creates branch + PR
 *   - Success: shows PR URL (clickable)
 */

import React, { useState } from 'react';
import { useTokens } from '../hooks/useTokens.js';
import { useSync, type PullTarget } from '../hooks/useSync.js';
import { useSettingsStore } from '../store/settings.js';

// ── Props ────────────────────────────────────────────────────────────────────

interface SyncPanelProps {
  initialMode: 'pull' | 'push';
  onClose: () => void;
  /** If pull mode encounters dirty sets, this lets the parent switch to push */
  onSwitchToPush?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: number | null): string {
  if (!ts) return 'Never';
  return new Date(ts).toLocaleString();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SyncPanel({ initialMode, onClose, onSwitchToPush }: SyncPanelProps) {
  const { sets, lastPullSha, lastPullAt, dirtySets } = useTokens();
  const { syncState, pull, push } = useSync();
  const activeBranch = useSettingsStore((s) => s.settings.activeBranch);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  /**
   * Designer-selected pull target. Default `'active'` keeps the legacy
   * one-click behaviour. `'all'` warms both branch caches so subsequent
   * branch swaps are instantaneous — the headline win of this feature.
   */
  const [pullTarget, setPullTarget] = useState<PullTarget>('active');

  const dirty = dirtySets();
  const hasDirty = dirty.length > 0;

  // ── Pull flow ──────────────────────────────────────────────────────────────

  async function handlePull() {
    await pull(pullTarget);
  }

  function handlePullRequest() {
    if (hasDirty && !confirmDiscard) {
      // Show the warning — designer must choose Push first or Discard
      setConfirmDiscard(true);
      return;
    }
    void handlePull();
  }

  // ── Push flow ──────────────────────────────────────────────────────────────

  const [validationFailures, setValidationFailures] = useState<
    { setId: string; setName: string; errors: string[] }[]
  >([]);

  async function handlePush() {
    setValidationFailures([]);
    const failures = await push();
    if (failures.length > 0) {
      setValidationFailures(failures);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isPulling = syncState.status === 'pulling';
  const isPushing = syncState.status === 'pushing';
  const isSuccess = syncState.status === 'success';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal>
        <div className="modal__header">
          <h2 className="modal__title">
            {initialMode === 'pull' ? 'Pull from Azure DevOps' : 'Push to Azure DevOps'}
          </h2>
          <button className="modal__close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__body">
          {/* ── PULL MODE ── */}
          {initialMode === 'pull' && (
            <>
              <div className="sync-info">
                <span className="sync-info__label">Last pull:</span>
                <span className="sync-info__value">{formatDate(lastPullAt)}</span>
                {lastPullSha && (
                  <>
                    <span className="sync-info__label">Commit SHA:</span>
                    <span className="sync-info__value sync-info__value--mono">
                      {lastPullSha.slice(0, 8)}
                    </span>
                  </>
                )}
              </div>

              {/*
                Pull-target picker. Designers can pre-warm the inactive
                branch (or both) so subsequent branch swaps are instant.
                Defaults to "active branch" to keep the legacy one-click
                experience for the common case.
              */}
              <label className="sync-target">
                <span className="sync-target__label">Pull target</span>
                <select
                  className="sync-target__select"
                  value={pullTarget}
                  onChange={(e) => setPullTarget(e.target.value as PullTarget)}
                  disabled={isPulling}
                  aria-label="Branch to pull"
                >
                  <option value="active">
                    Active branch ({activeBranch})
                  </option>
                  <option value="main">Main only</option>
                  <option value="dev">Dev only</option>
                  <option value="all">All branches (main + dev)</option>
                </select>
              </label>

              {hasDirty && confirmDiscard && (
                <div className="sync-warning">
                  <p className="sync-warning__text">
                    You have unsaved edits in <strong>{dirty.length}</strong> set(s).
                    Pulling will discard all local changes. Choose:
                  </p>
                  <div className="sync-warning__actions">
                    <button
                      className="btn btn--secondary"
                      onClick={() => {
                        setConfirmDiscard(false);
                        onSwitchToPush?.();
                      }}
                    >
                      Push first
                    </button>
                    <button
                      className="btn btn--danger"
                      onClick={() => void handlePull()}
                    >
                      Discard local &amp; pull
                    </button>
                  </div>
                </div>
              )}

              {hasDirty && !confirmDiscard && (
                <div className="sync-notice">
                  <strong>{dirty.length}</strong> set(s) have unsaved local edits.
                  Pulling will replace them. You will be prompted to confirm.
                </div>
              )}
            </>
          )}

          {/* ── PUSH MODE ── */}
          {initialMode === 'push' && (
            <>
              {dirty.length === 0 ? (
                <p className="sync-empty">No local changes to push.</p>
              ) : (
                <>
                  <p className="sync-info__label">
                    <strong>{dirty.length}</strong> set(s) will be committed:
                  </p>
                  <ul className="sync-changed-list">
                    {dirty.map((s) => (
                      <li key={s.id} className="sync-changed-list__item">
                        {s.path}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Validation failures */}
              {validationFailures.length > 0 && (
                <div className="sync-validation-errors">
                  <p className="sync-validation-errors__heading">
                    Schema validation failed — fix errors before pushing:
                  </p>
                  {validationFailures.map((f) => (
                    <div key={f.setId} className="sync-validation-errors__group">
                      <strong>{f.setName}</strong>
                      <ul>
                        {f.errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Status messages ── */}
          {syncState.status === 'error' && (
            <div className="sync-error">{syncState.message}</div>
          )}

          {isSuccess && (
            <div className="sync-success">
              <p>{syncState.message}</p>
              {syncState.prUrl && (
                <a
                  href={syncState.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sync-success__pr-link"
                >
                  Open pull request
                </a>
              )}
            </div>
          )}

          {(isPulling || isPushing) && (
            <div className="sync-progress">{syncState.message}</div>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            {isSuccess ? 'Done' : 'Cancel'}
          </button>

          {!isSuccess && (
            <button
              className="btn btn--primary"
              onClick={initialMode === 'pull' ? handlePullRequest : () => void handlePush()}
              disabled={
                isPulling ||
                isPushing ||
                (initialMode === 'push' && dirty.length === 0)
              }
            >
              {initialMode === 'pull'
                ? isPulling
                  ? 'Pulling…'
                  : pullTarget === 'all'
                    ? 'Pull all branches'
                    : pullTarget === 'active'
                      ? `Pull ${activeBranch}`
                      : `Pull ${pullTarget}`
                : isPushing
                  ? 'Pushing…'
                  : 'Push & create PR'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
