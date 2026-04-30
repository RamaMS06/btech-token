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
 * Snapshot of every Variable Collection + Style currently in the active
 * Figma file. The UI uses this to render the selection tree before the
 * designer commits to a full import.
 */
export interface FigmaImportTree {
  collections: Array<{
    /** Figma variable collection id (opaque, used to look up modes). */
    id: string;
    name: string;
    modes: Array<{
      /** Figma mode id — needed for `setValueForMode` calls. */
      modeId: string;
      name: string;
      /** Number of variables defined in this collection (same for every mode). */
      variableCount: number;
    }>;
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
 */
export interface ImportSelection {
  collections: Record<string, string[]>; // collectionId → modeIds
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
