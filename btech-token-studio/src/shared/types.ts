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

/** Serialisable slice persisted to figma.clientStorage under 'btech.tokens' */
export interface TokenStorageState {
  sets: Record<string, TokenSet>;
  lastPullSha: string | null;
  lastPullAt: number | null;
  /**
   * Currently published `@btech/tokens` version, fetched from
   * packages/tokens/platforms/web/token/package.json on pull. Null when the
   * plugin has never pulled.
   */
  baseVersion: string | null;
  /**
   * Designer-proposed version for the next push. Defaults to `baseVersion`
   * after pull; designer can edit it through the header VersionField.
   * Sent as a `version:<x>` PR label so auto-version.yml can set the new
   * version explicitly instead of semver-bumping.
   */
  nextVersion: string | null;
}

// ── Settings model ──────────────────────────────────────────────────────────

/**
 * Designer-configurable connection settings stored in figma.clientStorage
 * under 'btech.settings'. PAT is encrypted by Figma's clientStorage layer.
 */
export interface Settings {
  orgUrl: string;
  project: string;
  repo: string;
  pat: string;
  baseBranch: string;
}

export const DEFAULT_SETTINGS: Settings = {
  orgUrl: 'https://dev.azure.com/buma',
  project: 'BUMA - Bspace Design System',
  repo: 'btech-ds',
  pat: '',
  baseBranch: 'main',
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
  | { type: 'error'; message: string };

/** Union for the full postMessage protocol — used at type-narrowing callsites */
export type PluginMessage = UIToMainMessage | MainToUIMessage;
