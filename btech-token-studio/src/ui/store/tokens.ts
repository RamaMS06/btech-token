/**
 * Token store (Zustand)
 * ----------------------
 * Single source of truth for token state inside the plugin UI. The store
 * mirrors itself to the main thread (via postMessage) on every meaningful
 * change so that figma.clientStorage stays current without requiring manual
 * save buttons.
 *
 * Edit routing
 * ------------
 * `editToken` and `addToken` no longer take a `setId` parameter. The store
 * decides where the write lands:
 *   - When `activeTenant` is null         → write to `activeSetId` (base).
 *   - When `activeTenant` is set         → write to `tenants/<id>/overrides`,
 *     creating that set in memory if it doesn't exist yet.
 *
 * This routes designer edits to the right file automatically — the bug where
 * tenant edits silently went to base (and were hidden by override merge on
 * re-render) is no longer reachable from the editor.
 *
 * Why debounce instead of immediate save?
 *   A designer editing a token value fires many keystrokes in rapid succession.
 *   Debouncing at 500ms batches those into a single storage write, preventing
 *   storage churn while still feeling instant from the designer's perspective.
 */

import { create } from 'zustand';
import type {
  TokenSet,
  DTCGToken,
  DTCGGroup,
  ActiveBranch,
  BranchSnapshot,
} from '../../shared/types.js';
import { ensureTenantOverrideSet } from '../../shared/tenant-resolver.js';

// ── State shape ──────────────────────────────────────────────────────────────

interface TokenState {
  sets: Record<string, TokenSet>;
  activeSetId: string | null;
  /** Currently selected tenant filter (null = show all sets) */
  activeTenant: string | null;
  lastPullSha: string | null;
  lastPullAt: number | null;
  /** Currently published canonical platform version, fetched at pull. */
  baseVersion: string | null;
  /**
   * Latest version observed on the remote `main` branch — fetched silently
   * on plugin mount and after each push. When this differs from
   * `baseVersion`, the header surfaces a "new version available" badge so
   * the designer can pull before they keep editing on a stale baseline.
   *
   * Intentionally NOT persisted: the value is cheap to refetch and we want
   * a fresh check on every plugin open rather than risk showing a stale
   * "new" badge from an old session.
   */
  remoteVersion: string | null;
  /**
   * Per-branch frozen pull snapshots — populated by `commitBranchPull` and
   * read by `swapToBranch`. Lets the designer switch between `main` and
   * `dev` without re-pulling each time. Persisted alongside the rest of
   * the token state so the cache survives plugin reloads.
   *
   * Keys are `ActiveBranch` values; missing entry means "this branch has
   * never been pulled in the current installation".
   */
  branchSnapshots: Partial<Record<ActiveBranch, BranchSnapshot>>;
}

interface TokenActions {
  setSets: (sets: Record<string, TokenSet>) => void;
  setActiveSet: (id: string | null) => void;
  setActiveTenant: (id: string | null) => void;
  setLastPull: (sha: string, at: number) => void;

  /** Add a new token. When tenant active → writes to override file. */
  addToken: (path: string, token: DTCGToken) => void;
  /** Edit an existing token. When tenant active → writes to override file. */
  editToken: (path: string, updates: Partial<DTCGToken>) => void;

  markClean: (setId: string) => void;
  markCleanAll: () => void;
  dirtySets: () => TokenSet[];

  /** Revert every dirty set to its `originalTree`. */
  discardAll: () => void;
  /** Revert a single set. */
  discardSet: (setId: string) => void;

  setBaseVersion: (v: string | null) => void;
  /**
   * Record the latest version seen on remote `main`. Called by the
   * background check that fires on plugin mount and after each push.
   * Pass `null` to clear (e.g. when the check fails — never leave a
   * stale value lying around).
   */
  setRemoteVersion: (v: string | null) => void;

  /**
   * Reconcile in-memory state after a successful push: replace each set's
   * `originalTree` with its current `tree` and clear `dirty`. Designed to be
   * called by useSync once the PR is created so the next "Clear changes"
   * reverts to "what's in flight to repo" rather than "what we last pulled".
   */
  snapshotAfterPush: () => void;

  /**
   * Merge an incoming sets map into the store. Used by ImportDiffModal
   * after the designer has resolved which rows to import — only ids
   * listed in `overwriteIds` get replaced, the rest are left alone.
   * Resulting sets are marked dirty so the next push surfaces them.
   */
  mergeSets: (
    incoming: Record<string, TokenSet>,
    opts?: { overwriteIds?: string[] },
  ) => void;

  /**
   * Record a fresh pull for `branch`. Always writes the snapshot into
   * `branchSnapshots[branch]`. When `branch === activeBranch`, also
   * mirrors the snapshot into the top-level fields so the UI sees the
   * pull immediately. Use this from `useSync.pull` for both single-branch
   * and `target='all'` flows — call it once per branch that was fetched.
   */
  commitBranchPull: (
    branch: ActiveBranch,
    snapshot: BranchSnapshot,
    activeBranch: ActiveBranch,
  ) => void;

  /**
   * Replace the entire `branchSnapshots` cache. Used at hydration time
   * (App.tsx → init-done / tokens-loaded) to restore what was persisted
   * to figma.clientStorage in the previous session.
   */
  hydrateBranchSnapshots: (
    snapshots: Partial<Record<ActiveBranch, BranchSnapshot>>,
  ) => void;

  /**
   * Swap the active view to `target`'s cached snapshot without re-pulling.
   * Saves the current top-level state into `branchSnapshots[currentBranch]`
   * first so any in-progress (clean) state on the old branch is retained.
   * Then loads `branchSnapshots[target]` if present, otherwise clears
   * top-level fields back to "never pulled" defaults.
   */
  swapToBranch: (currentBranch: ActiveBranch, target: ActiveBranch) => void;
}

export type TokenStore = TokenState & TokenActions;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Deep clone a DTCG tree. JSON round-trip is safe — trees are pure JSON. */
function cloneTree(tree: DTCGGroup | undefined | null): DTCGGroup {
  // Guard against legacy persisted sets that pre-date the originalTree
  // field — `JSON.stringify(undefined)` returns `undefined` which then
  // crashes `JSON.parse`. Fall back to an empty group so callers always
  // receive a valid object.
  if (!tree) return {};
  return JSON.parse(JSON.stringify(tree)) as DTCGGroup;
}

/**
 * Normalise a sets map loaded from persistence so it conforms to the
 * current TokenSet shape. Older snapshots in clientStorage may lack the
 * `originalTree` field — without this fix `discardAll` would throw the
 * first time a designer with a pre-fix snapshot tries to clear changes.
 *
 * Strategy: when `originalTree` is missing, treat the current `tree` as
 * the baseline. The first "Clear changes" after the upgrade will be a
 * no-op (revert to "what's currently in memory") which is the safest
 * fallback — we'd rather skip a revert than corrupt a designer's state.
 */
function normaliseSets(sets: Record<string, TokenSet>): Record<string, TokenSet> {
  const out: Record<string, TokenSet> = {};
  for (const [id, s] of Object.entries(sets)) {
    out[id] = {
      ...s,
      originalTree: s.originalTree ?? cloneTree(s.tree),
      // `dirty` is required; older snapshots may have it as undefined.
      dirty: Boolean(s.dirty),
    };
  }
  return out;
}

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

/**
 * Look up a leaf token by dot path within a tree. Returns null if any segment
 * is missing or the terminal node isn't a leaf. Used by the edit router to
 * read the original `$type` from the base set when an edit lands on a tenant
 * override (override files are value-only — `$type` always comes from base).
 */
function getAtPath(tree: DTCGGroup, path: string): DTCGToken | null {
  const segments = path.split('.');
  let node: unknown = tree;
  for (const seg of segments) {
    if (typeof node !== 'object' || node === null) return null;
    node = (node as Record<string, unknown>)[seg];
  }
  if (typeof node === 'object' && node !== null && '$value' in node && '$type' in node) {
    return node as DTCGToken;
  }
  return null;
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
      baseVersion: state.baseVersion,
      // Per-branch cache: persist so designers don't lose the cross-branch
      // state when the plugin window closes.
      branchSnapshots: state.branchSnapshots,
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
  baseVersion: null,
  remoteVersion: null,
  branchSnapshots: {},

  // ── Actions
  setSets: (sets) =>
    set((state) => {
      // Always run incoming sets through normaliseSets so pre-upgrade
      // snapshots (missing `originalTree`) don't break discardAll later.
      const next = { ...state, sets: normaliseSets(sets) };
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

  // ── Edit routing ─────────────────────────────────────────────────────────
  // The active tenant decides whether an edit lands on the base set or on
  // the tenant override file. This is the fix for "edits don't reflect" —
  // before, edits while a tenant was active wrote to base but the UI was
  // showing the merged view (override wins) so changes appeared invisible.

  addToken: (path, token) =>
    set((state) => {
      // Route to the override file when a tenant is active, else to the
      // currently focused base set.
      const targetSet = state.activeTenant
        ? ensureTenantOverrideSet(state.sets, state.activeTenant)
        : state.activeSetId
          ? state.sets[state.activeSetId]
          : null;

      if (!targetSet) return state;

      const updatedTree = setAtPath(targetSet.tree, path, token);
      const updatedSet: TokenSet = { ...targetSet, tree: updatedTree, dirty: true };
      const next = {
        ...state,
        sets: { ...state.sets, [updatedSet.id]: updatedSet },
      };
      schedulePersist(next);
      return next;
    }),

  editToken: (path, updates) =>
    set((state) => {
      const tenant = state.activeTenant;
      const baseSet = state.activeSetId ? state.sets[state.activeSetId] : null;
      if (!baseSet) return state;

      // The token's $type always comes from the base set — override files
      // are value-only. Look up the existing leaf so we keep $type/$description
      // consistent if the override hasn't carried them yet.
      const baseLeaf = getAtPath(baseSet.tree, path);
      if (!baseLeaf) return state;

      if (!tenant) {
        // No tenant active — straightforward base edit.
        const merged: DTCGToken = { ...baseLeaf, ...updates };
        const updatedTree = setAtPath(baseSet.tree, path, merged);
        const updatedSet: TokenSet = { ...baseSet, tree: updatedTree, dirty: true };
        const next = {
          ...state,
          sets: { ...state.sets, [baseSet.id]: updatedSet },
        };
        schedulePersist(next);
        return next;
      }

      // Tenant active — write to the override file. Existing override leaf
      // (if any) provides current $value/$description; base provides $type.
      const overrideSet = ensureTenantOverrideSet(state.sets, tenant);
      const overrideLeaf = getAtPath(overrideSet.tree, path);
      const merged: DTCGToken = {
        // Inherit $type from base (overrides are value-only by convention)
        $type: baseLeaf.$type,
        // Carry forward whichever description is freshest
        ...(overrideLeaf?.$description ? { $description: overrideLeaf.$description } : {}),
        // Start from the override's current value if present, otherwise base's
        $value: overrideLeaf?.$value ?? baseLeaf.$value,
        // Apply the actual edit last
        ...updates,
      };

      const updatedTree = setAtPath(overrideSet.tree, path, merged);
      const updatedOverride: TokenSet = { ...overrideSet, tree: updatedTree, dirty: true };
      const next = {
        ...state,
        sets: { ...state.sets, [updatedOverride.id]: updatedOverride },
      };
      schedulePersist(next);
      return next;
    }),

  // ── Dirty management ─────────────────────────────────────────────────────

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

  // ── Discard ──────────────────────────────────────────────────────────────

  discardAll: () =>
    set((state) => {
      const reverted: Record<string, TokenSet> = {};
      for (const [id, s] of Object.entries(state.sets)) {
        // Defensive: pre-upgrade snapshots may have `originalTree` undefined.
        // `normaliseSets` repairs them on load, but a new code path could
        // still slip an unnormalised set in — fall back to the current tree.
        const baseline = s.originalTree ?? s.tree ?? {};

        // A set with an empty `originalTree` was created locally — either
        // a tenant override file fabricated on first edit, or a set
        // materialised by a Figma import. It doesn't exist server-side,
        // so reverting to baseline means dropping it entirely. Otherwise
        // the sidebar would keep an empty placeholder set after Clear /
        // tenant switch even though there is genuinely nothing to revert
        // to.
        if (Object.keys(baseline).length === 0) {
          continue;
        }
        reverted[id] = {
          ...s,
          tree: cloneTree(baseline),
          originalTree: cloneTree(baseline),
          dirty: false,
        };
      }

      // If the active set was one of the dropped locally-created sets,
      // null it out so the right pane doesn't render against a phantom
      // id. Same for activeTenant when its override file gets dropped.
      const activeSetId =
        state.activeSetId && reverted[state.activeSetId]
          ? state.activeSetId
          : null;
      const activeTenant =
        state.activeTenant && reverted[`tenants/${state.activeTenant}/overrides`]
          ? state.activeTenant
          : null;

      const next = {
        ...state,
        sets: reverted,
        activeSetId,
        activeTenant,
      };
      schedulePersist(next);
      return next;
    }),

  discardSet: (setId) =>
    set((state) => {
      const existing = state.sets[setId];
      if (!existing) return state;

      const baseline = existing.originalTree ?? existing.tree ?? {};

      // Same locally-created rule as discardAll — drop any set whose
      // baseline is empty regardless of id prefix (covers tenant
      // overrides AND figma-imported sets).
      if (Object.keys(baseline).length === 0) {
        const remaining = { ...state.sets };
        delete remaining[setId];
        const next: Partial<typeof state> = { sets: remaining };
        if (state.activeSetId === setId) next.activeSetId = null;
        const merged = { ...state, ...next };
        schedulePersist(merged);
        return merged;
      }

      const reverted: TokenSet = {
        ...existing,
        tree: cloneTree(baseline),
        originalTree: cloneTree(baseline),
        dirty: false,
      };
      const next = { ...state, sets: { ...state.sets, [setId]: reverted } };
      schedulePersist(next);
      return next;
    }),

  // ── Version field ────────────────────────────────────────────────────────

  setBaseVersion: (v) =>
    set((state) => {
      // Pull just landed — record the published version so the header
      // VersionLabel renders it. The number is read-only in the UI; bumps
      // are derived from the active branch by CI.
      const next = {
        ...state,
        baseVersion: v,
      };
      schedulePersist(next);
      return next;
    }),

  // remoteVersion is intentionally NOT persisted — schedulePersist isn't
  // called here. A stale "new version available" badge from a previous
  // session would be more confusing than a brief moment of no badge while
  // the background check completes on next mount.
  setRemoteVersion: (v) => set({ remoteVersion: v }),

  // ── Post-push reconciliation ─────────────────────────────────────────────

  snapshotAfterPush: () =>
    set((state) => {
      const reconciled: Record<string, TokenSet> = {};
      for (const [id, s] of Object.entries(state.sets)) {
        reconciled[id] = {
          ...s,
          originalTree: cloneTree(s.tree),
          dirty: false,
        };
      }
      const next = { ...state, sets: reconciled };
      schedulePersist(next);
      return next;
    }),

  mergeSets: (incoming, opts) =>
    set((state) => {
      const overwrite = new Set(opts?.overwriteIds ?? []);
      const merged: Record<string, TokenSet> = { ...state.sets };

      for (const [id, incomingSet] of Object.entries(incoming)) {
        const existing = merged[id];
        if (existing && !overwrite.has(id)) {
          // Caller didn't ask for an overwrite — leave the existing set
          // alone. This protects against accidental data loss from a
          // half-built incoming map.
          continue;
        }
        merged[id] = { ...incomingSet, dirty: true };
      }

      const next = { ...state, sets: merged };
      schedulePersist(next);
      return next;
    }),

  // ── Per-branch cache ─────────────────────────────────────────────────────
  //
  // The plugin caches a frozen "what was last pulled" snapshot per branch so
  // that `<BranchSwitcher>` can swap between `main` / `dev` without forcing
  // a network round-trip. The active branch's snapshot is mirrored into the
  // top-level fields for the rest of the UI to read; the inactive branch
  // sits dormant until the designer flips back.

  hydrateBranchSnapshots: (snapshots) =>
    set((state) => {
      // Defensive normalisation — older persisted snapshots may have sets
      // without the new `originalTree` field. Use the same `normaliseSets`
      // path we use for top-level state so swap semantics match.
      const out: Partial<Record<ActiveBranch, BranchSnapshot>> = {};
      for (const [branch, snap] of Object.entries(snapshots)) {
        if (!snap) continue;
        out[branch as ActiveBranch] = {
          sets: normaliseSets(snap.sets),
          baseVersion: snap.baseVersion,
          lastPullSha: snap.lastPullSha,
          lastPullAt: snap.lastPullAt,
        };
      }
      return { ...state, branchSnapshots: out };
    }),

  commitBranchPull: (branch, snapshot, activeBranch) =>
    set((state) => {
      // Deep-clone the sets map on the way in so subsequent edits to the
      // top-level state can't mutate the cached snapshot by reference.
      const frozenSets: Record<string, TokenSet> = {};
      for (const [id, s] of Object.entries(snapshot.sets)) {
        frozenSets[id] = {
          ...s,
          tree: cloneTree(s.tree),
          originalTree: cloneTree(s.originalTree ?? s.tree),
        };
      }

      const branchSnapshots = {
        ...state.branchSnapshots,
        [branch]: { ...snapshot, sets: frozenSets },
      };

      // If we just pulled the branch the designer is currently looking at,
      // mirror the snapshot into the live top-level fields so the UI
      // reflects the pull immediately. For the OTHER branch (e.g. pulled
      // as part of `target='all'`) we just stash it in the cache and let
      // `swapToBranch` pick it up when needed.
      if (branch === activeBranch) {
        const next = {
          ...state,
          sets: normaliseSets(snapshot.sets),
          baseVersion: snapshot.baseVersion,
          lastPullSha: snapshot.lastPullSha,
          lastPullAt: snapshot.lastPullAt,
          branchSnapshots,
        };
        schedulePersist(next);
        return next;
      }

      const next = { ...state, branchSnapshots };
      schedulePersist(next);
      return next;
    }),

  swapToBranch: (currentBranch, target) =>
    set((state) => {
      if (currentBranch === target) return state;

      // Snapshot the current top-level state under the OLD branch so any
      // post-pull tweaks survive a round trip. We stash whatever's live
      // (including dirty flags) — discardAll is the caller's job before
      // calling this if a clean swap is desired.
      const currentFrozen: BranchSnapshot = {
        sets: state.sets,
        baseVersion: state.baseVersion,
        lastPullSha: state.lastPullSha,
        lastPullAt: state.lastPullAt,
      };

      const branchSnapshots = {
        ...state.branchSnapshots,
        [currentBranch]: currentFrozen,
      };

      // Load the target branch's cached snapshot if we have one. If the
      // designer never pulled the target branch, fall back to "empty"
      // top-level state — the silent remote-version poll will refill the
      // header placeholder and the designer can pull when ready.
      const cached = branchSnapshots[target];

      const next = cached
        ? {
            ...state,
            sets: normaliseSets(cached.sets),
            baseVersion: cached.baseVersion,
            lastPullSha: cached.lastPullSha,
            lastPullAt: cached.lastPullAt,
            branchSnapshots,
          }
        : {
            ...state,
            sets: {},
            baseVersion: null,
            lastPullSha: null,
            lastPullAt: null,
            branchSnapshots,
          };

      schedulePersist(next);
      return next;
    }),
}));
