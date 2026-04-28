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
import type { ActiveBranch, Settings } from '../../shared/types.js';

// ── State shape ──────────────────────────────────────────────────────────────

interface SettingsState {
  settings: Settings;
  isLoaded: boolean;
}

interface SettingsActions {
  setSettings: (settings: Settings) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  /**
   * Switch the active git branch. Header `<BranchSwitcher>` is the only
   * UI surface that calls this — Settings panel no longer exposes branch
   * selection because the channel filter is the single source of truth.
   */
  setBranch: (branch: ActiveBranch) => void;
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

/**
 * Coerce a persisted settings blob into the current shape.
 *
 * Migration concerns:
 * - Old versions carried a free-form `baseBranch: string`. Drop it and
 *   default `activeBranch` to `'main'` unless the persisted value happens
 *   to already be one of the two known channel names.
 * - Anything else outside the allowed enum is replaced by `'main'` —
 *   safer than honouring an unknown branch the new pipeline can't bump.
 */
function normaliseSettings(raw: Settings): Settings {
  // The persisted blob may contain legacy fields that aren't on the type
  // anymore. Read them through a permissive cast rather than declaring
  // them on Settings — they're only relevant inside this migration.
  const legacy = raw as Settings & { baseBranch?: unknown };
  const candidate: unknown = raw.activeBranch ?? legacy.baseBranch;
  const activeBranch: ActiveBranch =
    candidate === 'main' || candidate === 'dev' ? candidate : 'main';

  return {
    orgUrl: raw.orgUrl ?? DEFAULT_SETTINGS.orgUrl,
    project: raw.project ?? DEFAULT_SETTINGS.project,
    repo: raw.repo ?? DEFAULT_SETTINGS.repo,
    pat: raw.pat ?? '',
    activeBranch,
    // Older snapshots predate the export feature — seed the default so
    // ExportFigmaModal doesn't render with all toggles undefined.
    exportTypes: raw.exportTypes ?? DEFAULT_SETTINGS.exportTypes,
  };
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

  setBranch: (branch) => {
    set((state) => {
      const next: Settings = { ...state.settings, activeBranch: branch };
      schedulePersist(next);
      return { settings: next };
    });
  },

  // Called once on init-done to hydrate from clientStorage without triggering
  // an immediate re-save (the data is already persisted). Runs the loaded
  // blob through `normaliseSettings` so legacy `baseBranch` values are
  // coerced into the new `activeBranch` enum without breaking the plugin.
  markLoaded: (settings) => set({ settings: normaliseSettings(settings), isLoaded: true }),
}));
