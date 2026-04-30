/**
 * Shared type definitions — DTCG token model + plugin postMessage protocol
 * -------------------------------------------------------------------------
 * These types are imported by both the UI (iframe) and the main thread
 * (code.ts). They must remain free of browser-only or Figma-only APIs so
 * that tests can import them without a DOM shim.
 *
 * DTCG spec: https://tr.designtokens.org/format/
 * Our schema: packages/tokens/schema/token.schema.json
 */

// ── DTCG token types ────────────────────────────────────────────────────────

/** All legal $type values from token.schema.json */
export type DTCGType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'shadow'
  | 'strokeStyle'
  | 'border'
  | 'transition'
  | 'gradient'
  | 'typography';

/** Runtime array of all DTCG type values — for dropdowns and iteration */
export const DTCG_TYPES: DTCGType[] = [
  'color', 'dimension', 'fontFamily', 'fontWeight', 'duration',
  'cubicBezier', 'number', 'shadow', 'strokeStyle', 'border',
  'transition', 'gradient', 'typography',
];

/** A leaf token node. Must carry $value + $type; other $ fields are optional. */
export interface DTCGToken {
  $value: string | number | boolean | Record<string, unknown> | unknown[];
  $type: DTCGType;
  $description?: string;
  $deprecated?: boolean;
  $deprecatedSince?: string;
  $replacement?: string;
  $removalTarget?: string;
}

/**
 * A group node — contains child tokens or nested groups. The $description
 * key and the $schema key are metadata; all other keys are children.
 * We use unknown here and narrow at runtime to distinguish token vs. group.
 */
export interface DTCGGroup {
  $description?: string;
  $schema?: string;
  [key: string]: DTCGToken | DTCGGroup | string | undefined;
}

// ── Plugin token set model ──────────────────────────────────────────────────

/**
 * Currently active git branch — pulls and pushes target this. Declared up
 * here (above the storage types) so `BranchSnapshot` / `TokenStorageState`
 * can reference it without a forward dependency.
 */
export type ActiveBranch = 'main' | 'dev';

/**
 * A TokenSet maps 1:1 to a JSON file in packages/tokens/sources/**
 * The `id` is derived from the relative path: e.g.
 *   "packages/tokens/sources/core/color.primitive.json" → "core/color.primitive"
 * The `path` is the full repo-relative path used for API calls.
 */
export interface TokenSet {
  id: string;
  /** Repo-relative path, e.g. "packages/tokens/sources/semantic/color.json" */
  path: string;
  /** Display name, e.g. "semantic/color" */
  name: string;
  tree: DTCGGroup;
  /**
   * Deep-clone of `tree` taken at last successful pull (or push). Acts as the
   * revert source for the "Clear changes" action — set tree = originalTree to
   * undo every local edit. Persisted alongside `tree` so a designer who
   * reloads the plugin can still revert.
   *
   * For sets created locally (e.g. a tenant override file that didn't exist
   * in the repo yet), `originalTree` is the empty group. Reverting in that
   * case wipes the entries the designer just added — which is the correct
   * "back to last pulled state" semantics.
   */
  originalTree: DTCGGroup;
  /**
   * True when local state differs from the last pulled SHA.
   * Cleared on successful push or pull.
   */
  dirty: boolean;
}

/**
 * Per-branch frozen snapshot of "what was last pulled". The plugin caches
 * one of these per branch so that switching branches via `<BranchSwitcher>`
 * doesn't need a fresh network round-trip every time — the designer sees
 * the same state they'd see immediately after a pull.
 *
 * Sets are stored INCLUDING their dirty flags + originalTree, so a designer
 * who edits on `dev`, switches to `main`, then comes back to `dev` finds
 * their unsaved work intact.
 */
export interface BranchSnapshot {
  sets: Record<string, TokenSet>;
  baseVersion: string | null;
  lastPullSha: string | null;
  lastPullAt: number | null;
}

/** Serialisable slice persisted to figma.clientStorage under 'btech.tokens' */
export interface TokenStorageState {
  /** Mirror of `branchSnapshots[activeBranch].sets` — the in-view set map. */
  sets: Record<string, TokenSet>;
  lastPullSha: string | null;
  lastPullAt: number | null;
  /**
   * Currently published canonical platform version (root `package.json`),
   * fetched on pull from the active branch. Read-only in the UI — versioning
   * is now driven by the active branch (main → patch, dev → rc) rather than
   * by a manually-entered field. Null when the plugin has never pulled.
   */
  baseVersion: string | null;
  /**
   * Per-branch cached pull snapshots. Populated by `useSync.pull(target)`
   * — `target='active'` writes one entry, `target='all'` writes both.
   * `<BranchSwitcher>` reads from here to swap branches without re-pulling.
   *
   * Optional on the type so older persisted blobs (pre-feature) still
   * deserialise; the store seeds `{}` on load.
   */
  branchSnapshots?: Partial<Record<ActiveBranch, BranchSnapshot>>;
  /**
   * Last selected set id ("core/color.brand" etc.) so reopening the plugin
   * lands the designer back on the panel they were editing instead of the
   * "Select a token set from the sidebar" empty state. Optional for
   * backward compat with pre-feature persisted blobs.
   */
  activeSetId?: string | null;
  /**
   * Last selected tenant filter (e.g. "bspace") so override badges (`@N`
   * in the sidebar) and the override-merged tree view survive a modal
   * close/reopen. `null` = "Default" (no tenant filter). Optional for
   * backward compat.
   */
  activeTenant?: string | null;
}

// ── Settings model ──────────────────────────────────────────────────────────

/**
 * Designer-configurable connection settings stored in figma.clientStorage
 * under 'btech.settings'. PAT is encrypted by Figma's clientStorage layer.
 *
 * Branch selection moved out of Settings — designers pick the active branch
 * via the header `<BranchSwitcher>`, mapped to one of the fixed channel
 * values below. We still persist it under the same Settings blob (to share
 * the existing debounced postMessage path) but the UI no longer exposes it.
 *
 * (`ActiveBranch` itself is declared above near the storage types — keep
 * this comment so `git blame` still tells the story.)
 */

export interface Settings {
  orgUrl: string;
  project: string;
  repo: string;
  pat: string;
  /** Currently active git branch — pulls and pushes target this. */
  activeBranch: ActiveBranch;
  /**
   * Per-type export filter for the "Export to Figma" modal. Maps each
   * resolved Figma Variable type → include/exclude. Persisted so the
   * designer's last selection survives plugin reloads. Optional on the
   * type so older snapshots remain assignable; default is all `true`.
   */
  exportTypes?: {
    color: boolean;
    string: boolean;
    number: boolean;
    boolean: boolean;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  orgUrl: 'https://dev.azure.com/buma',
  project: 'BUMA - Bspace Design System',
  repo: 'btech-ds',
  pat: '',
  activeBranch: 'main',
  exportTypes: { color: true, string: true, number: true, boolean: true },
};

// ── postMessage protocol ────────────────────────────────────────────────────
//
// The Figma plugin sandbox communicates through a strict postMessage channel.
// Using a discriminated union means both sides can exhaustively switch on
// `type` without any runtime magic — the same pattern used by Figma's own
// plugin examples.

/** Messages sent FROM the UI iframe TO the Figma main thread (code.ts) */
export type UIToMainMessage =
  | { type: 'init' }
  | { type: 'save-tokens'; payload: TokenStorageState }
  | { type: 'load-tokens' }
  | { type: 'get-settings' }
  | { type: 'save-settings'; payload: Settings }
  | { type: 'apply-snapshot' }
  // Figma import/export — see src/shared/figma-types.ts for payload shapes.
  | { type: 'figma-import-scan' }
  | {
      type: 'figma-import-apply';
      selection: import('./figma-types.js').ImportSelection;
      options: import('./figma-types.js').ImportOptions;
    }
  | {
      type: 'figma-export';
      payload: import('./figma-types.js').FigmaExportPayload;
    }
  /**
   * Ask the main thread to relay an error notification to the Figma canvas
   * via figma.notify — used when the iframe needs a visible canvas alert.
   */
  | { type: 'error'; message: string };

/** Messages sent FROM the Figma main thread (code.ts) TO the UI iframe */
export type MainToUIMessage =
  | { type: 'init-done'; tokens: TokenStorageState | null; settings: Settings | null }
  | { type: 'tokens-loaded'; payload: TokenStorageState }
  | { type: 'settings-loaded'; payload: Settings | null }
  // Figma import/export results.
  | {
      type: 'figma-import-scan-done';
      payload: import('./figma-types.js').FigmaImportTree;
    }
  | {
      type: 'figma-import-apply-done';
      sets: Record<string, TokenSet>;
      warnings: string[];
    }
  | {
      type: 'figma-export-done';
      created: number;
      updated: number;
      warnings: string[];
    }
  | { type: 'figma-import-error'; message: string }
  | { type: 'figma-export-error'; message: string }
  | { type: 'error'; message: string };

/** Union for the full postMessage protocol — used at type-narrowing callsites */
export type PluginMessage = UIToMainMessage | MainToUIMessage;
