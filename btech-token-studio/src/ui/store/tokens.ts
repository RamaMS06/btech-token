/**
 * Token store (Zustand)
 * ----------------------
 * Single source of truth for token state inside the plugin UI. The store
 * mirrors itself to the main thread (via postMessage) on every meaningful
 * change so that figma.clientStorage stays current without requiring manual
 * save buttons.
 *
 * Why debounce instead of immediate save?
 *   A designer editing a token value fires many keystrokes in rapid succession.
 *   Debouncing at 500ms batches those into a single storage write, preventing
 *   storage churn while still feeling instant from the designer's perspective.
 */

import { create } from 'zustand';
import type { TokenSet, DTCGToken, DTCGGroup } from '../../shared/types.js';

// ── State shape ──────────────────────────────────────────────────────────────

interface TokenState {
  sets: Record<string, TokenSet>;
  activeSetId: string | null;
  /** Currently selected tenant filter (null = show all sets) */
  activeTenant: string | null;
  lastPullSha: string | null;
  lastPullAt: number | null;
}

interface TokenActions {
  setSets: (sets: Record<string, TokenSet>) => void;
  setActiveSet: (id: string | null) => void;
  setActiveTenant: (id: string | null) => void;
  setLastPull: (sha: string, at: number) => void;
  addToken: (setId: string, path: string, token: DTCGToken) => void;
  editToken: (setId: string, path: string, updates: Partial<DTCGToken>) => void;
  markClean: (setId: string) => void;
  markCleanAll: () => void;
  dirtySets: () => TokenSet[];
}

export type TokenStore = TokenState & TokenActions;

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Set a value at a dot-separated path inside a DTCG tree.
 * Returns a shallow-cloned tree with the leaf updated.
 */
function setAtPath(tree: DTCGGroup, path: string, value: DTCGToken): DTCGGroup {
  const segments = path.split('.');
  const clone = { ...tree };
  let node: DTCGGroup = clone;

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const child = node[seg];
    // Shallow clone each level we descend into
    const clonedChild: DTCGGroup = (typeof child === 'object' && child !== null && !('$value' in child))
      ? { ...(child as DTCGGroup) }
      : {};
    node[seg] = clonedChild;
    node = clonedChild;
  }

  node[segments[segments.length - 1]] = value;
  return clone;
}

// ── Debounced persist ────────────────────────────────────────────────────────

let persistTimer: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(state: TokenState): void {
  if (persistTimer !== null) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const payload = {
      sets: state.sets,
      lastPullSha: state.lastPullSha,
      lastPullAt: state.lastPullAt,
    };
    // postMessage to main thread — main thread writes to figma.clientStorage
    parent.postMessage({ pluginMessage: { type: 'save-tokens', payload } }, '*');
  }, 500);
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useTokenStore = create<TokenStore>((set, get) => ({
  // ── Initial state
  sets: {},
  activeSetId: null,
  activeTenant: null,
  lastPullSha: null,
  lastPullAt: null,

  // ── Actions
  setSets: (sets) =>
    set((state) => {
      const next = { ...state, sets };
      schedulePersist(next);
      return next;
    }),

  setActiveSet: (id) => set({ activeSetId: id }),

  setActiveTenant: (id) => set({ activeTenant: id }),

  setLastPull: (sha, at) =>
    set((state) => {
      const next = { ...state, lastPullSha: sha, lastPullAt: at };
      schedulePersist(next);
      return next;
    }),

  addToken: (setId, path, token) =>
    set((state) => {
      const existing = state.sets[setId];
      if (!existing) return state;

      const updatedTree = setAtPath(existing.tree, path, token);
      const updatedSet: TokenSet = { ...existing, tree: updatedTree, dirty: true };
      const next = { ...state, sets: { ...state.sets, [setId]: updatedSet } };
      schedulePersist(next);
      return next;
    }),

  editToken: (setId, path, updates) =>
    set((state) => {
      const existing = state.sets[setId];
      if (!existing) return state;

      // Locate the current token leaf by traversing the path
      const segments = path.split('.');
      let node: DTCGGroup | DTCGToken = existing.tree;
      for (const seg of segments) {
        if (typeof node !== 'object' || node === null) return state;
        node = (node as DTCGGroup)[seg] as DTCGGroup | DTCGToken;
      }
      if (!node || !('$value' in node)) return state;

      const updatedToken: DTCGToken = { ...(node as DTCGToken), ...updates };
      const updatedTree = setAtPath(existing.tree, path, updatedToken);
      const updatedSet: TokenSet = { ...existing, tree: updatedTree, dirty: true };
      const next = { ...state, sets: { ...state.sets, [setId]: updatedSet } };
      schedulePersist(next);
      return next;
    }),

  markClean: (setId) =>
    set((state) => {
      const existing = state.sets[setId];
      if (!existing) return state;
      return { sets: { ...state.sets, [setId]: { ...existing, dirty: false } } };
    }),

  markCleanAll: () =>
    set((state) => {
      const cleaned: Record<string, TokenSet> = {};
      for (const [id, s] of Object.entries(state.sets)) {
        cleaned[id] = { ...s, dirty: false };
      }
      return { sets: cleaned };
    }),

  dirtySets: () => Object.values(get().sets).filter((s) => s.dirty),
}));
