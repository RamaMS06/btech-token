/**
 * Token-set diff and resolve utilities
 * --------------------------------------
 * Used by ImportDiffModal to compare incoming sets (built from Figma) vs.
 * the current store state (representing what's in main repo). The diff is
 * leaf-level — every (setId, tokenPath) pair becomes its own DiffRow so
 * the designer can per-row accept Import or keep Main.
 *
 * Symmetry rule:
 *   We only emit `remove` rows for sets that are also referenced in the
 *   incoming map. If the import doesn't touch a set, the unrelated tokens
 *   in that set are out of scope — we don't dare delete them just because
 *   they aren't mentioned in Figma.
 *
 * Equality rule:
 *   `change` is reported when either `$value` (after a permissive
 *   normalisation) or `$type` differs. The normaliser trims strings,
 *   lowercases hex codes, and JSON-stringifies object/array values for
 *   comparison so `{r:0.5, g:0.5, b:0.5}` doesn't look different from
 *   itself across two different walks.
 */

import type { DTCGToken, TokenSet, DTCGType, DTCGGroup } from './types.js';
import { treeToFlatTokens, flatTokensToTree } from './transform.js';

// ── Public types ────────────────────────────────────────────────────────────

export type DiffKind = 'add' | 'change' | 'remove';

/**
 * One leaf-level difference. The `id` field is composite (setId + tokenPath)
 * so React can use it as a stable key and the resolution Map can address
 * each row individually.
 */
export interface DiffRow {
  /** `${setId}::${tokenPath}` — globally unique within a single diff. */
  id: string;
  setId: string;
  setName: string;
  tokenPath: string;
  kind: DiffKind;
  /** Present for `add` and `change`. */
  importValue?: DTCGToken['$value'];
  importType?: DTCGType;
  /** Present for `change` and `remove`. */
  mainValue?: DTCGToken['$value'];
  mainType?: DTCGType;
}

/** Per-row resolution — `skip` keeps everything as-is (no-op for that row). */
export type DiffChoice = 'import' | 'main' | 'skip';

// ── diffSets ────────────────────────────────────────────────────────────────

/**
 * Compare an incoming sets map against the current store. Iterates each
 * set in `incoming` so we never accidentally diff a set that wasn't part
 * of the import scope. For sets that exist on both sides, walks both
 * flattened trees and emits one row per differing path.
 */
export function diffSets(
  incoming: Record<string, TokenSet>,
  current: Record<string, TokenSet>,
): DiffRow[] {
  const rows: DiffRow[] = [];

  for (const [setId, incomingSet] of Object.entries(incoming)) {
    const currentSet = current[setId];

    const incomingFlat = treeToFlatTokens(incomingSet.tree);
    const currentFlat = currentSet ? treeToFlatTokens(currentSet.tree) : [];

    const incomingMap = new Map(incomingFlat.map((f) => [f.path, f.token]));
    const currentMap = new Map(currentFlat.map((f) => [f.path, f.token]));

    const allPaths = new Set<string>([
      ...incomingMap.keys(),
      ...currentMap.keys(),
    ]);

    for (const path of allPaths) {
      const inc = incomingMap.get(path);
      const cur = currentMap.get(path);
      const id = `${setId}::${path}`;

      if (inc && !cur) {
        rows.push({
          id,
          setId,
          setName: incomingSet.name,
          tokenPath: path,
          kind: 'add',
          importValue: inc.$value,
          importType: inc.$type,
        });
      } else if (!inc && cur) {
        rows.push({
          id,
          setId,
          setName: incomingSet.name,
          tokenPath: path,
          kind: 'remove',
          mainValue: cur.$value,
          mainType: cur.$type,
        });
      } else if (inc && cur && !tokensEqual(inc, cur)) {
        rows.push({
          id,
          setId,
          setName: incomingSet.name,
          tokenPath: path,
          kind: 'change',
          importValue: inc.$value,
          importType: inc.$type,
          mainValue: cur.$value,
          mainType: cur.$type,
        });
      }
    }
  }

  return rows;
}

// ── applyDiffResolution ────────────────────────────────────────────────────

/**
 * Build the merged sets map by applying per-row choices on top of the
 * current state. Returns the new sets map and the list of set ids that
 * actually received any `import` choice — those are the ids that should
 * be marked `dirty` in the store after merge.
 *
 * Logic per kind × choice:
 *   add    + import → write the leaf into target set
 *   add    + main   → drop (no-op; no main version exists)
 *   add    + skip   → drop
 *   change + import → write the import leaf
 *   change + main   → keep current (no-op)
 *   change + skip   → keep current (no-op)
 *   remove + import → delete leaf from target set (import says it's gone)
 *   remove + main   → keep current (no-op; the default for `remove`)
 *   remove + skip   → keep current
 *
 * For sets that don't exist in `current` at all (genuinely new tokens
 * being added), we synthesise a fresh TokenSet using the incoming set's
 * shape so the new entries land in a predictable container.
 */
export function applyDiffResolution(
  incoming: Record<string, TokenSet>,
  current: Record<string, TokenSet>,
  choices: Map<string, DiffChoice>,
  rows: DiffRow[],
): { sets: Record<string, TokenSet>; touchedIds: string[] } {
  // Start from a deep clone of current to avoid mutating store state.
  const next: Record<string, TokenSet> = {};
  for (const [id, s] of Object.entries(current)) {
    next[id] = {
      ...s,
      tree: cloneTree(s.tree),
      originalTree: s.originalTree, // keep reference — we only mutate `tree`.
    };
  }

  // Group rows by setId for efficient walking.
  const rowsBySet = new Map<string, DiffRow[]>();
  for (const row of rows) {
    const arr = rowsBySet.get(row.setId);
    if (arr) arr.push(row);
    else rowsBySet.set(row.setId, [row]);
  }

  const touched = new Set<string>();

  for (const [setId, setRows] of rowsBySet) {
    // Resolve target — start from current set (cloned above) or seed a
    // brand-new one from incoming when the set is wholly new.
    let target = next[setId];
    if (!target) {
      const incomingSet = incoming[setId];
      target = {
        ...incomingSet,
        tree: {},
        // `originalTree: {}` matches the convention used by
        // `ensureTenantOverrideSet` for sets that don't yet exist in repo.
        originalTree: {},
        dirty: false,
      };
      next[setId] = target;
    }

    let setTouched = false;

    for (const row of setRows) {
      const choice = choices.get(row.id) ?? defaultChoice(row.kind);

      if (row.kind === 'add' && choice === 'import') {
        setLeaf(target.tree, row.tokenPath, {
          $value: row.importValue!,
          $type: row.importType!,
        });
        setTouched = true;
      } else if (row.kind === 'change' && choice === 'import') {
        setLeaf(target.tree, row.tokenPath, {
          $value: row.importValue!,
          $type: row.importType!,
        });
        setTouched = true;
      } else if (row.kind === 'remove' && choice === 'import') {
        deleteLeaf(target.tree, row.tokenPath);
        setTouched = true;
      }
      // All other (kind, choice) pairs are no-ops — current state stands.
    }

    if (setTouched) {
      touched.add(setId);
      next[setId] = { ...target, dirty: true };
    }
  }

  return { sets: next, touchedIds: Array.from(touched) };
}

/**
 * The default radio position when DiffModal first renders a row. See plan
 * §4c — adds default to import (designer's clear intent), removes default
 * to main (safer — must be explicit to delete), changes default to import
 * (the just-imported value is the newer one).
 */
export function defaultChoice(kind: DiffKind): DiffChoice {
  switch (kind) {
    case 'add':
      return 'import';
    case 'change':
      return 'import';
    case 'remove':
      return 'main';
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────

function cloneTree(tree: DTCGGroup): DTCGGroup {
  return JSON.parse(JSON.stringify(tree)) as DTCGGroup;
}

function tokensEqual(a: DTCGToken, b: DTCGToken): boolean {
  if (a.$type !== b.$type) return false;
  return normaliseValue(a.$value) === normaliseValue(b.$value);
}

/**
 * Normalise a `$value` to a canonical string for equality comparison.
 * - Trims whitespace
 * - Lowercases hex color strings so `#FF0000` matches `#ff0000`
 * - JSON-stringifies non-primitive values for stable comparison
 *
 * The normaliser is permissive on purpose: we'd rather not flag a row as
 * `change` for a purely cosmetic difference (case, whitespace) than to
 * over-report and overwhelm the designer with noise.
 */
function normaliseValue(v: unknown): string {
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (/^#[0-9a-f]+$/i.test(trimmed)) return trimmed.toLowerCase();
    return trimmed;
  }
  if (typeof v === 'number' || typeof v === 'boolean' || v == null) {
    return String(v);
  }
  return JSON.stringify(v);
}

/** Set a leaf at a dot-path inside an existing tree (mutates). */
function setLeaf(tree: DTCGGroup, path: string, token: DTCGToken): void {
  const segs = path.split('.');
  let node: DTCGGroup = tree;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    const child = node[seg];
    if (typeof child !== 'object' || child === null || '$value' in child) {
      // Replace any non-group value with a fresh group; in practice this
      // only matters when an incoming `add` straddles a previously-leaf
      // segment, which is a caller bug — but we don't crash on it.
      node[seg] = {} as DTCGGroup;
    }
    node = node[seg] as DTCGGroup;
  }
  node[segs[segs.length - 1]] = token;
}

/** Remove a leaf at a dot-path; cleans up empty parent groups. */
function deleteLeaf(tree: DTCGGroup, path: string): void {
  const segs = path.split('.');
  // Walk to the parent; bail early if any segment is missing — nothing to delete.
  const stack: Array<{ node: DTCGGroup; key: string }> = [];
  let node: DTCGGroup = tree;
  for (let i = 0; i < segs.length - 1; i++) {
    const seg = segs[i];
    const child = node[seg];
    if (typeof child !== 'object' || child === null || '$value' in child) {
      return;
    }
    stack.push({ node, key: seg });
    node = child as DTCGGroup;
  }
  delete node[segs[segs.length - 1]];

  // Walk back up, dropping any group that became empty. This keeps the
  // serialised JSON tidy when an import removes the last token in a group.
  for (let i = stack.length - 1; i >= 0; i--) {
    const { node: parent, key } = stack[i];
    const groupChild = parent[key];
    if (
      typeof groupChild === 'object' &&
      groupChild !== null &&
      Object.keys(groupChild).length === 0
    ) {
      delete parent[key];
    } else {
      break;
    }
  }
}

// `flatTokensToTree` is re-exported for callers that need to rebuild a
// tree after manual flat manipulation (e.g. the import builder). Pulling
// it through here keeps diff-related modules importing from one place.
export { flatTokensToTree };
