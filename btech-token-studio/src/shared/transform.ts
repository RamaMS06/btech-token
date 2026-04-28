/**
 * DTCG tree ↔ flat list transforms + JSON serialization
 * -------------------------------------------------------
 * These are pure functions — no side effects, no Figma APIs. They can be
 * unit-tested in Node without any plugin shim.
 *
 * Why flat lists?
 *   The UI works with a flat `Array<{ path, token }>` for rendering and
 *   editing. The repo stores tokens as a nested tree (DTCG format). These
 *   utilities bridge the gap while keeping both representations correct.
 *
 * Path convention: dot-separated key segments, e.g. "color.brand.primary".
 * This mirrors how DTCG references work ({color.brand.primary}).
 */

import type { DTCGGroup, DTCGToken, TokenSet } from './types.js';

/** A single flattened token entry */
export interface FlatToken {
  /** Dot-separated path from the tree root, e.g. "color.brand.primary" */
  path: string;
  token: DTCGToken;
}

// ── Guards ──────────────────────────────────────────────────────────────────

/**
 * A node is a leaf token when it has both $value and $type.
 * Without $value it's a group (possibly with only $description).
 */
function isTokenNode(value: unknown): value is DTCGToken {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$value' in value &&
    '$type' in value
  );
}

/**
 * Keys that are metadata on a group node — not child tokens or groups.
 * We skip these during traversal.
 */
const METADATA_KEYS = new Set(['$description', '$schema']);

// ── treeToFlatTokens ────────────────────────────────────────────────────────

/**
 * Walk a DTCG group tree and produce a flat list of (path, token) pairs.
 * Only leaf nodes (with $value + $type) are emitted; group nodes are
 * traversed but not emitted themselves.
 *
 * @param tree   - The DTCG group to walk
 * @param prefix - Dot-path prefix for recursive calls (leave empty at root)
 */
export function treeToFlatTokens(tree: DTCGGroup, prefix = ''): FlatToken[] {
  const result: FlatToken[] = [];

  for (const [key, value] of Object.entries(tree)) {
    if (METADATA_KEYS.has(key)) continue;
    if (value === undefined) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (isTokenNode(value)) {
      result.push({ path, token: value });
    } else if (typeof value === 'object' && value !== null) {
      // Recurse into group node
      result.push(...treeToFlatTokens(value as DTCGGroup, path));
    }
    // Primitive values that are neither token nor group are ignored —
    // they shouldn't appear in well-formed DTCG files.
  }

  return result;
}

// ── countLeafChanges ────────────────────────────────────────────────────────

/**
 * Count the number of leaf-level edits between a current tree and its
 * baseline (`originalTree`). Each of the following counts as one change:
 *
 *   - **Added**     — a leaf path exists in `current` but not in `baseline`
 *   - **Removed**   — a leaf path exists in `baseline` but not in `current`
 *   - **Modified**  — a leaf path exists in both but its $value / $type /
 *                     metadata serializes differently
 *
 * This is what the bottom action bar uses to show "Push 17 changes …" instead
 * of "Push 1 change …" when a single set has many edited tokens. The set-level
 * `dirty` flag stays — it's still the right primitive for "is this set dirty
 * at all" — but the count shown to designers needs to be the per-leaf number
 * so it matches what they actually edited.
 *
 * Uses `JSON.stringify` for value comparison: DTCG tokens are pure JSON
 * (string/number/object — no Date/Map/function) so the serialised form is a
 * deterministic equality check. Same reasoning we already rely on for
 * `snapshotSet` and `parseJsonToSet`.
 */
export function countLeafChanges(current: DTCGGroup, baseline: DTCGGroup): number {
  // An empty baseline means "this set is brand new locally and has never
  // been on origin yet" — every current leaf is an addition. We still count
  // them so the designer sees the real number of new tokens being shipped.
  const cur = treeToFlatTokens(current);
  const base = treeToFlatTokens(baseline);
  const baseMap = new Map<string, DTCGToken>(base.map((t) => [t.path, t.token]));
  const seen = new Set<string>();
  let changes = 0;

  for (const { path, token } of cur) {
    seen.add(path);
    const baseToken = baseMap.get(path);
    if (!baseToken) {
      changes++; // added
      continue;
    }
    if (JSON.stringify(token) !== JSON.stringify(baseToken)) {
      changes++; // modified
    }
  }
  for (const path of baseMap.keys()) {
    if (!seen.has(path)) changes++; // removed
  }
  return changes;
}

// ── flatTokensToTree ────────────────────────────────────────────────────────

/**
 * Rebuild a DTCG group tree from a flat (path, token) list.
 * Insertion order is preserved so round-tripping produces the same key
 * ordering as the original file (important for diffing in the PR).
 *
 * @param flat - Output of treeToFlatTokens (or a hand-constructed list)
 */
export function flatTokensToTree(flat: FlatToken[]): DTCGGroup {
  const root: DTCGGroup = {};

  for (const { path, token } of flat) {
    const segments = path.split('.');
    let node: DTCGGroup = root;

    // Walk / create intermediate group nodes
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (!(seg in node) || isTokenNode(node[seg])) {
        // Create a new group if the segment doesn't exist.
        // We should never overwrite a token node with a group — that indicates
        // a collision in the flat list which is a caller bug.
        node[seg] = {} as DTCGGroup;
      }
      node = node[seg] as DTCGGroup;
    }

    // Assign the leaf token
    const leafKey = segments[segments.length - 1];
    node[leafKey] = token;
  }

  return root;
}

// ── serializeSetToJson ──────────────────────────────────────────────────────

/**
 * Serialize a TokenSet's tree to the DTCG JSON string that will be committed
 * to the repo. We use 2-space indentation + a trailing newline to match the
 * existing formatting of files under packages/tokens/sources/.
 */
export function serializeSetToJson(set: TokenSet): string {
  return JSON.stringify(set.tree, null, 2) + '\n';
}

// ── parseJsonToSet ──────────────────────────────────────────────────────────

/**
 * Parse a JSON string from the repo into a TokenSet, deriving `id` and
 * `name` from the file path.
 *
 * @param path - Repo-relative path, e.g. "packages/tokens/sources/core/color.primitive.json"
 * @param json - Raw JSON string content
 * @throws Error with the path included — callers show this to the designer
 */
export function parseJsonToSet(path: string, json: string): TokenSet {
  let tree: DTCGGroup;
  try {
    tree = JSON.parse(json) as DTCGGroup;
  } catch (err) {
    throw new Error(`Failed to parse JSON for ${path}: ${(err as Error).message}`);
  }

  // Derive a stable id: strip the sources prefix and .json suffix
  // "packages/tokens/sources/core/color.primitive.json" → "core/color.primitive"
  const id = path
    .replace(/^packages\/tokens\/sources\//, '')
    .replace(/\.json$/, '');

  return {
    id,
    path,
    name: id,
    tree,
    // Deep clone via JSON for the revert source. DTCG trees are pure JSON
    // (no functions, no Dates, no Maps) so the round-trip is lossless and
    // the clone shares no references with `tree`. We avoid `structuredClone`
    // because the Figma plugin sandbox cannot be relied upon to expose it
    // across all host versions.
    originalTree: JSON.parse(JSON.stringify(tree)) as DTCGGroup,
    dirty: false,
  };
}

// ── Snapshot helper ─────────────────────────────────────────────────────────

/**
 * Refresh `originalTree` from the current `tree`. Called after a successful
 * push so the next "Clear changes" reverts to what's now committed in repo,
 * not to whatever was last pulled. Returns a new TokenSet object — callers
 * must replace the entry in the store rather than mutate in place.
 */
export function snapshotSet(set: TokenSet): TokenSet {
  return {
    ...set,
    originalTree: JSON.parse(JSON.stringify(set.tree)) as DTCGGroup,
    dirty: false,
  };
}
