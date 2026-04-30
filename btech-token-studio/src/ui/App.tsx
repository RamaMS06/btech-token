/**
 * App — top-level shell component
 * ---------------------------------
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │ Header   title              [tenant filter]  │  ← identity + filter
 *   ├──────────────────────────────────────────────┤
 *   │ Body     sidebar │ token list / tree view    │  ← actual work
 *   ├──────────────────────────────────────────────┤
 *   │ Bottom   ⚙ Pull  │ [ Push N changes → ]      │  ← terminal actions
 *   └──────────────────────────────────────────────┘
 *
 * Push (the headline action) lives at the bottom as a primary, designer-
 * friendly button so it cannot be confused with the lighter settings/filter
 * controls in the header. Pull and Settings sit beside it as secondary icons —
 * they are read-only / config actions and don't deserve top-level real estate.
 *
 * This component owns the window.onmessage listener that bridges from the
 * Figma main thread. On mount it sends 'init'; on 'init-done' it hydrates
 * both stores. All subsequent store changes are persisted via the debounced
 * postMessage in each store.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { TokenSetSidebar } from './components/TokenSetSidebar.js';
import { TokenList } from './components/TokenList.js';
import { ThemeSwitcher } from './components/ThemeSwitcher.js';
import { SyncPanel } from './components/SyncPanel.js';
import { SettingsPanel } from './components/Settings.js';
import { BottomActionBar } from './components/BottomActionBar.js';
import { ConfirmDialog } from './components/ConfirmDialog.js';
import { VersionLabel } from './components/VersionField.js';
import { BranchSwitcher } from './components/BranchSwitcher.js';
import { ImportStylesModal } from './components/ImportStylesModal.js';
import { ImportDiffModal } from './components/ImportDiffModal.js';
import { useTokenStore } from './store/tokens.js';
import type { TokenStore } from './store/tokens.js';
import { useSettingsStore } from './store/settings.js';
import { useRemoteVersionCheck } from './hooks/useRemoteVersionCheck.js';
import type { MainToUIMessage, TokenStorageState, Settings, TokenSet } from '../shared/types.js';

/**
 * Re-apply the activeSetId / activeTenant carried in a hydrated
 * `TokenStorageState`. We validate `activeSetId` against the freshly-loaded
 * sets map so a stale id (set that was removed from repo, or renamed)
 * doesn't leave the panel pointing at a non-existent target. `activeTenant`
 * is left as-is — the tenant resolver tolerates unknown ids by simply not
 * rendering any override badges.
 */
function restoreUiSelection(payload: TokenStorageState, store: TokenStore): void {
  if (payload.activeSetId !== undefined) {
    const id = payload.activeSetId;
    if (id === null || (id && store.sets[id])) {
      store.setActiveSet(id);
    } else {
      // Persisted id no longer resolves — fall back to the empty state so
      // the designer picks a valid set rather than seeing a phantom
      // selection that produces no content.
      store.setActiveSet(null);
    }
  }
  if (payload.activeTenant !== undefined) {
    store.setActiveTenant(payload.activeTenant);
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function App() {
  const tokenStore = useTokenStore();
  const settingsStore = useSettingsStore();

  const [showSync, setShowSync] = useState<'pull' | 'push' | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  // Confirm modal for the destructive "Clear changes" flow. Owned at the
  // top level so the modal renders above everything else and the action
  // can't be lost mid-render of the bottom bar.
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  // Figma Variables import — modal flag + post-import diff payload.
  // Diff payload is set once ImportStylesModal returns the freshly built
  // incoming sets; ImportDiffModal owns the resolution UI.
  const [showImport, setShowImport] = useState(false);
  const [pendingDiff, setPendingDiff] = useState<{
    incoming: Record<string, TokenSet>;
    warnings: string[];
  } | null>(null);

  // Silently poll the remote `main` for a newer root version. The hook
  // fires on mount (once settings hydrate) and exposes `check()` so we can
  // re-poll after a push lands. The result populates `tokenStore.remoteVersion`
  // which `VersionField` reads to decide whether to render the "new" badge.
  const { check: checkRemoteVersion } = useRemoteVersionCheck();

  // Dirty-set count for the confirm-discard message body. Computed here so
  // the dialog can show "Discard 3 unsaved changes?" with the live total.
  const dirtyCount = useMemo(
    () => Object.values(tokenStore.sets).filter((s) => s.dirty).length,
    [tokenStore.sets],
  );

  // ── Init: send 'init' to main thread on mount ─────────────────────────────
  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: 'init' } }, '*');
  }, []);

  // ── Listen for messages from the Figma main thread ────────────────────────
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Figma wraps postMessage in a pluginMessage envelope
      const msg = (event.data?.pluginMessage ?? event.data) as MainToUIMessage | undefined;
      if (!msg || typeof msg.type !== 'string') return;

      switch (msg.type) {
        case 'init-done': {
          if (msg.tokens) {
            tokenStore.setSets(msg.tokens.sets);
            if (msg.tokens.lastPullSha && msg.tokens.lastPullAt) {
              tokenStore.setLastPull(msg.tokens.lastPullSha, msg.tokens.lastPullAt);
            }
            // Restore the read-only base version so the header VersionLabel
            // renders without waiting for a pull. There's no longer a
            // designer-editable nextVersion to rehydrate — bumps are derived
            // from the active branch by CI.
            if (msg.tokens.baseVersion) {
              tokenStore.setBaseVersion(msg.tokens.baseVersion);
            }
            // Restore per-branch pull cache so a designer who pulled both
            // branches in the previous session can flip between them
            // without re-pulling.
            if (msg.tokens.branchSnapshots) {
              tokenStore.hydrateBranchSnapshots(msg.tokens.branchSnapshots);
            }
            // Restore the last-viewed set + tenant filter. Validate the set
            // id still resolves to one of the freshly-hydrated sets — pulls
            // can rename / drop sets between sessions and we don't want a
            // dangling activeSetId stuck pointing at something that no
            // longer exists. `activeTenant` doesn't need a similar check
            // because it's just a free-form id; the override resolver
            // tolerates an unknown tenant by rendering no badges.
            restoreUiSelection(msg.tokens, tokenStore);
          }
          if (msg.settings) {
            settingsStore.markLoaded(msg.settings as Settings);
          } else {
            settingsStore.markLoaded(settingsStore.settings);
          }
          break;
        }

        case 'tokens-loaded': {
          const payload = msg.payload as TokenStorageState;
          tokenStore.setSets(payload.sets);
          if (payload.lastPullSha && payload.lastPullAt) {
            tokenStore.setLastPull(payload.lastPullSha, payload.lastPullAt);
          }
          if (payload.baseVersion) {
            tokenStore.setBaseVersion(payload.baseVersion);
          }
          if (payload.branchSnapshots) {
            tokenStore.hydrateBranchSnapshots(payload.branchSnapshots);
          }
          restoreUiSelection(payload, tokenStore);
          break;
        }

        case 'settings-loaded': {
          settingsStore.markLoaded(msg.payload as Settings);
          break;
        }

        case 'error': {
          // Error relayed from main thread — already shown via figma.notify,
          // but we could also surface inline. For Phase 1, we log only.
          console.error('[BTech Token Studio]', msg.message);
          break;
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="app">
      {/* ── Header: read-only platform version on the left, branch + tenant
              filters on the right. The version label sits where the eye
              lands first — it's the single most important piece of state
              the designer needs to confirm before they push. Branch and
              Tenant are peer filters: branch retargets the repo line,
              tenant retargets the override layer. */}
      <header className="app-header">
        <VersionLabel onPullRequest={() => setShowSync('pull')} />
        <div className="app-header__controls">
          <BranchSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="app-body">
        <TokenSetSidebar />
        <TokenList />
      </div>

      {/* ── Bottom action bar: Pull, Settings, Clear, Push (primary) ──── */}
      <BottomActionBar
        onShowPull={() => setShowSync('pull')}
        onShowPush={() => setShowSync('push')}
        onShowSettings={() => setShowSettings(true)}
        onShowDiscard={() => setShowConfirmDiscard(true)}
        onShowImport={() => setShowImport(true)}
      />

      {/* ── Modals ── */}
      {showSync && (
        <SyncPanel
          initialMode={showSync}
          onClose={() => {
            setShowSync(null);
            // Refresh the "new version available" indicator after any sync.
            // After a pull → baseVersion now matches remote, badge clears.
            // After a push → main may have advanced (CI bumped + merged in
            // a parallel PR); re-checking keeps the badge honest.
            void checkRemoteVersion();
          }}
          onSwitchToPush={() => setShowSync('push')}
        />
      )}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
      {showConfirmDiscard && (
        <ConfirmDialog
          title="Clear changes?"
          body={
            <>
              This reverts <strong>{dirtyCount}</strong> unsaved {dirtyCount === 1 ? 'change' : 'changes'} back to
              the last pulled state, including the proposed next version.
              This action cannot be undone.
            </>
          }
          confirmLabel="Clear changes"
          cancelLabel="Keep changes"
          onConfirm={() => {
            tokenStore.discardAll();
            setShowConfirmDiscard(false);
          }}
          onClose={() => setShowConfirmDiscard(false)}
        />
      )}

      {/* ── Figma Variables import modal ──────────────────────────────
          ImportStylesModal closes itself before handing the payload off,
          so ImportDiffModal mounts against a clean single-modal layer. */}
      {showImport && (
        <ImportStylesModal
          onClose={() => setShowImport(false)}
          onImportComplete={(incoming, warnings) => {
            setShowImport(false);
            setPendingDiff({ incoming, warnings });
          }}
          existingTokens={tokenStore.sets}
        />
      )}
      {pendingDiff && (
        <ImportDiffModal
          incoming={pendingDiff.incoming}
          warnings={pendingDiff.warnings}
          onClose={() => setPendingDiff(null)}
        />
      )}
    </div>
  );
}
