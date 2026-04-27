/**
 * App — top-level shell component
 * ---------------------------------
 * Layout: header (title + tenant switcher + sync buttons) / body (sidebar + main).
 * Modals are rendered conditionally via state flags — SyncPanel, Settings.
 *
 * This component owns the window.onmessage listener that bridges from the
 * Figma main thread. On mount it sends 'init'; on 'init-done' it hydrates
 * both stores. All subsequent store changes are persisted via the debounced
 * postMessage in each store.
 */

import React, { useEffect, useState } from 'react';
import { TokenSetSidebar } from './components/TokenSetSidebar.js';
import { TokenList } from './components/TokenList.js';
import { ThemeSwitcher } from './components/ThemeSwitcher.js';
import { SyncPanel } from './components/SyncPanel.js';
import { SettingsPanel } from './components/Settings.js';
import { useTokenStore } from './store/tokens.js';
import { useSettingsStore } from './store/settings.js';
import type { MainToUIMessage, TokenStorageState, Settings } from '../shared/types.js';

// ── Component ─────────────────────────────────────────────────────────────────

export function App() {
  const tokenStore = useTokenStore();
  const settingsStore = useSettingsStore();

  const [showSync, setShowSync] = useState<'pull' | 'push' | null>(null);
  const [showSettings, setShowSettings] = useState(false);

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
      {/* ── Header ── */}
      <header className="app-header">
        <span className="app-header__title">BTech Token Studio</span>
        <div className="app-header__controls">
          <ThemeSwitcher />
          <button
            className="btn btn--icon"
            title="Pull from Azure DevOps"
            onClick={() => setShowSync('pull')}
          >
            ⤓ Pull
          </button>
          <button
            className="btn btn--icon"
            title="Push to Azure DevOps"
            onClick={() => setShowSync('push')}
          >
            ⤒ Push
          </button>
          <button
            className="btn btn--icon"
            title="Settings"
            onClick={() => setShowSettings(true)}
          >
            ⚙ Settings
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="app-body">
        <TokenSetSidebar />
        <TokenList />
      </div>

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
    </div>
  );
}
