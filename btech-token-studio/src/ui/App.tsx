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
import { VersionField } from './components/VersionField.js';
import { useTokenStore } from './store/tokens.js';
import { useSettingsStore } from './store/settings.js';
import type { MainToUIMessage, TokenStorageState, Settings } from '../shared/types.js';

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
            // Restore version state so the VersionField rehydrates without
            // requiring an immediate pull. nextVersion may differ from
            // baseVersion if the designer was mid-edit when they reloaded.
            if (msg.tokens.baseVersion) {
              tokenStore.setBaseVersion(msg.tokens.baseVersion);
            }
            if (msg.tokens.nextVersion && msg.tokens.nextVersion !== msg.tokens.baseVersion) {
              tokenStore.setNextVersion(msg.tokens.nextVersion);
            }
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
          if (payload.nextVersion && payload.nextVersion !== payload.baseVersion) {
            tokenStore.setNextVersion(payload.nextVersion);
          }
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
      {/* ── Header: editable next-version on the left, tenant filter right
              The version field replaces the static "BTech Token Studio"
              title — it's the single most important piece of metadata
              attached to a push, so it lives where the eye lands first. */}
      <header className="app-header">
        <VersionField />
        <div className="app-header__controls">
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
      />

      {/* ── Modals ── */}
      {showSync && (
        <SyncPanel
          initialMode={showSync}
          onClose={() => setShowSync(null)}
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
    </div>
  );
}
