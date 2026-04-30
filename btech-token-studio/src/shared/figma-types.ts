/**
 * Figma import/export message payloads
 * --------------------------------------
 * Wire types shared between the UI iframe and the main thread for the
 * `figma-import-*` and `figma-export-*` message family. Kept separate
 * from `types.ts` so the import/export feature stays self-contained
 * and easy to remove or evolve without touching the core protocol.
 */

// ── Import scan result (main → UI) ───────────────────────────────────────────

/**
 * Per-variable metadata included in the scan result so the UI can perform
 * a diff against the existing token store without a second API round-trip.
 * All fields are serialisable through Figma's postMessage channel.
 */
export interface FigmaVariableInfo {
  /** Figma variable id (opaque). */
  id: string;
  /** Original Figma variable name, e.g. `"primary/100"`. */
  name: string;
  /**
   * Pre-computed DTCG path (namespace prefix + slashes→dots).
   * e.g. `"color.primary.100"` for a variable in a Primitives collection.
   */
  path: string;
  /**
   * Figma resolved type: `'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'`.
   * Typed as `string` so the shared module doesn't depend on Figma API types.
   */
  resolvedType: string;
  /**
   * Raw Figma values keyed by modeId. Each value is one of:
   *   - `{ r, g, b, a }` for COLOR
   *   - `number` for FLOAT
   *   - `string` for STRING
   *   - `boolean` for BOOLEAN
   *   - `{ type: 'VARIABLE_ALIAS', id: string }` for an alias
   * Typed as `unknown` to remain free of Figma-specific type imports.
   */
  valuesByMode: Record<string, unknown>;
}

/**
 * Snapshot of every Variable Collection + Style currently in the active
 * Figma file. The UI uses this to render the selection tree before the
 * designer commits to a full import.
 */
export interface FigmaImportTree {
  collections: Array<{
    /** Figma variable collection id (opaque, used to look up modes). */
    id: string;
    name: string;
    /**
     * True when the collection has exactly one mode (e.g. "Mode 1").
     * The UI uses this to flatten the tree — instead of showing the lone
     * mode as an intermediate node the collection itself becomes the
     * selectable / countable parent.
     */
    singleMode: boolean;
    modes: Array<{
      /** Figma mode id — needed for `setValueForMode` calls. */
      modeId: string;
      name: string;
      /** Number of variables defined in this collection (same for every mode). */
      variableCount: number;
    }>;
    /**
     * All variables in this collection, with pre-computed DTCG paths and
     * raw values per mode. Included so the UI can diff against the existing
     * token store without a second main-thread round-trip.
     */
    variables: FigmaVariableInfo[];
  }>;
  paintStyles: Array<{ id: string; name: string }>;
  textStyles: Array<{ id: string; name: string }>;
  effectStyles: Array<{ id: string; name: string }>;
}

// ── Import selection (UI → main) ─────────────────────────────────────────────

/**
 * What the designer ticked in the import tree. The UI ships this to the
 * main thread which then walks the Variables/Styles APIs to build the
 * actual TokenSets.
 *
 * `collections` is keyed by collection id so a designer can include only
 * a subset of modes within a collection (e.g. only `Light`, skip `Dark`).
 *
 * `variableFilter` is an optional allowlist of variable ids. When present,
 * only those specific variables are imported from the selected collection
 * modes — used when the diff tree shows per-variable leaf nodes so the
 * designer can cherry-pick only new/changed items.
 */
export interface ImportSelection {
  collections: Record<string, string[]>; // collectionId → modeIds
  /** When set, restrict variable import to these ids (null/absent = import all). */
  variableFilter?: string[];
  paintStyles: string[];
  textStyles: string[];
  effectStyles: string[];
}

// ── Import options (UI → main) ───────────────────────────────────────────────

/**
 * Designer-controlled conversion knobs for import. Numbers in Figma are
 * untyped — they could be radii, durations, or just opacity values. The
 * options let the designer hint how to treat them when building the DTCG
 * tree, since the wrong type would break Style Dictionary downstream.
 */
export interface ImportOptions {
  /** When true, FLOAT variables become DTCG `dimension` tokens (px). */
  numbersAsDimension: boolean;
  /** When true (and `numbersAsDimension`), values are `Xrem` (1rem = 16px). */
  useRem: boolean;
}

// ── Export payload (UI → main) ───────────────────────────────────────────────

/** Resolved Figma Variable types we know how to write. */
export type FigmaExportType = 'color' | 'string' | 'number' | 'boolean';

/**
 * Per-type include flags. The ExportFigmaModal renders one ToggleSwitch
 * per key so the designer can opt out of (e.g.) booleans without losing
 * the rest of the export.
 */
export interface FigmaExportPayload {
  enabledTypes: Record<FigmaExportType, boolean>;
}
