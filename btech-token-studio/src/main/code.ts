/**
 * Figma plugin main thread (code.ts)
 * ------------------------------------
 * This file runs in the Figma sandbox — not the browser. It has access to
 * the Figma plugin API (figma.*) but NOT to DOM, window, or browser APIs.
 *
 * Responsibilities:
 *   - Show the plugin UI on launch
 *   - Bridge figma.clientStorage ↔ UI (postMessage protocol)
 *   - Mirror token state into figma.root.setPluginData (per-file snapshot)
 *   - Relay errors to the canvas via figma.notify
 *
 * The UI does all the heavy lifting (API calls, state management, rendering).
 * This file stays lean — under 200 lines is the target.
 *
 * postMessage protocol: see src/shared/types.ts (UIToMainMessage / MainToUIMessage)
 */

import type { UIToMainMessage, MainToUIMessage, TokenStorageState, Settings } from '../shared/types.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY_TOKENS = 'btech.tokens';
const STORAGE_KEY_SETTINGS = 'btech.settings';
const SNAPSHOT_KEY = 'btech.snapshot';

/**
 * Figma limits plugin data to 100KB per key. We skip the snapshot silently
 * rather than crashing — the clientStorage copy is the real source of truth.
 */
const SNAPSHOT_SIZE_LIMIT = 100 * 1024; // 100KB in characters

// ── Launch ────────────────────────────────────────────────────────────────────

figma.showUI(__html__, {
  // Sized for the nested tree layout — the right panel needs enough horizontal
  // space to fit a full row of color swatches without wrapping (≈9–10 swatches
  // × 30 px + sidebar). Height stays compact so the plugin doesn't dominate
  // the Figma canvas; the body scrolls when content overflows.
  width: 580,
  height: 640,
  // themeColors: true makes the UI adopt the host app's dark/light theme.
  // Combined with our CSS var usage, this means the plugin looks native.
  themeColors: true,
});

// ── Message handlers ──────────────────────────────────────────────────────────

function send(msg: MainToUIMessage): void {
  figma.ui.postMessage(msg);
}

figma.ui.onmessage = async (rawMsg: unknown) => {
  // The postMessage payload arrives as `unknown` — narrow it safely.
  const msg = rawMsg as UIToMainMessage;
  if (!msg || typeof msg.type !== 'string') return;

  switch (msg.type) {
    case 'init': {
      // Load both stores from clientStorage in parallel — designers have
      // separate PATs and repo settings per Figma account.
      const [tokensRaw, settingsRaw] = await Promise.all([
        figma.clientStorage.getAsync(STORAGE_KEY_TOKENS),
        figma.clientStorage.getAsync(STORAGE_KEY_SETTINGS),
      ]);

      const tokens = (tokensRaw as TokenStorageState | undefined) ?? null;
      const settings = (settingsRaw as Settings | undefined) ?? null;

      send({ type: 'init-done', tokens, settings });
      break;
    }

    case 'load-tokens': {
      const raw = await figma.clientStorage.getAsync(STORAGE_KEY_TOKENS);
      const payload = (raw as TokenStorageState | undefined) ?? {
        sets: {},
        lastPullSha: null,
        lastPullAt: null,
        baseVersion: null,
        nextVersion: null,
      };
      send({ type: 'tokens-loaded', payload });
      break;
    }

    case 'save-tokens': {
      await figma.clientStorage.setAsync(STORAGE_KEY_TOKENS, msg.payload);

      // Mirror a snapshot into figma.root so other plugins or future
      // tooling can read the current token state without knowing the PAT.
      // If the serialized state exceeds the 100KB Figma data limit we log
      // a warning and skip — the clientStorage copy is still valid.
      try {
        const snapshot = JSON.stringify(msg.payload);
        if (snapshot.length <= SNAPSHOT_SIZE_LIMIT) {
          figma.root.setPluginData(SNAPSHOT_KEY, snapshot);
        } else {
          console.warn(
            `[BTech Token Studio] Token snapshot (${snapshot.length} chars) exceeds ` +
            `${SNAPSHOT_SIZE_LIMIT} char limit — skipping figma.root snapshot.`,
          );
        }
      } catch (err) {
        // setPluginData can throw if the document is in a read-only state.
        // Not fatal — just log it.
        console.warn('[BTech Token Studio] Failed to write snapshot:', err);
      }
      break;
    }

    case 'get-settings': {
      const raw = await figma.clientStorage.getAsync(STORAGE_KEY_SETTINGS);
      const payload = (raw as Settings | undefined) ?? null;
      send({ type: 'settings-loaded', payload });
      break;
    }

    case 'save-settings': {
      // Never log the PAT — Figma's clientStorage encrypts it per-user, but
      // we avoid leaking it into console output regardless.
      await figma.clientStorage.setAsync(STORAGE_KEY_SETTINGS, msg.payload);
      break;
    }

    case 'apply-snapshot': {
      // Phase 3 hook: writing a token subset to Figma Variables.
      // Not implemented in Phase 1 — acknowledged so the UI doesn't hang.
      figma.notify('Apply to Figma Variables is coming in Phase 3.', { timeout: 3000 });
      break;
    }

    case 'error': {
      // The UI delegates critical errors to the canvas notification so
      // designers get a visible alert even if the UI panel is small.
      figma.notify(`BTech Token Studio: ${msg.message}`, { error: true });
      break;
    }

    default: {
      // Exhaustive check — if we reach here, the protocol is out of sync
      // between UI and main thread.
      console.warn('[BTech Token Studio] Unhandled message type:', (msg as { type: string }).type);
    }
  }
};
