/**
 * Settings store (Zustand)
 * -------------------------
 * Persists PAT + repo configuration to figma.clientStorage via the main thread.
 * The PAT is encrypted by Figma's clientStorage layer — we never log it.
 *
 * The same debounce-and-postMessage pattern as the tokens store is used here
 * for consistency. Settings changes are less frequent, but the 500ms debounce
 * prevents rapid re-saves during typing in the PAT field.
 */

import { create } from 'zustand';
import { DEFAULT_SETTINGS } from '../../shared/types.js';
import type { Settings } from '../../shared/types.js';

// ── State shape ──────────────────────────────────────────────────────────────

interface SettingsState {
  settings: Settings;
  isLoaded: boolean;
}

interface SettingsActions {
  setSettings: (settings: Settings) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  markLoaded: (settings: Settings) => void;
}

export type SettingsStore = SettingsState & SettingsActions;

// ── Debounced persist ────────────────────────────────────────────────────────

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(settings: Settings): void {
  if (persistTimer !== null) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    parent.postMessage({ pluginMessage: { type: 'save-settings', payload: settings } }, '*');
  }, 500);
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  setSettings: (settings) => {
    schedulePersist(settings);
    set({ settings });
  },

  patchSettings: (patch) => {
    set((state) => {
      const next = { ...state.settings, ...patch };
      schedulePersist(next);
      return { settings: next };
    });
  },

  // Called once on init-done to hydrate from clientStorage without triggering
  // an immediate re-save (the data is already persisted).
  markLoaded: (settings) => set({ settings, isLoaded: true }),
}));
