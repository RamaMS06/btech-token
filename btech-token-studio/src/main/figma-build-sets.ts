/**
 * figma-build-sets — assemble TokenSets from raw Figma scan output
 * -----------------------------------------------------------------
 * The import flow is split into two phases:
 *   1. `figma-import.ts` walks the Figma APIs (variables, paint/text/effect
 *      styles) and produces a *flat* per-leaf description of every token it
 *      saw.
 *   2. This module groups those flat entries into named `TokenSet` shells
 *      that match the on-disk repo convention so `mergeSets` (and the diff
 *      modal that uses it) can treat the import like any other pull.
 *
 * Naming convention (mirrors `parseJsonToSet`):
 *   - Variables   → `figma-import/<collection>/<mode>`
 *   - Paint set   → `figma-import/styles/color`
 *   - Text set    → `figma-import/styles/text`
 *   - Effect set  → `figma-import/styles/effect`
 *
 * `path` mirrors the on-disk JSON layout
 *   `packages/tokens/sources/figma-import/<id>.json`
 * so a designer who later pushes these tokens lands them in a clearly-named
 * folder rather than scattering them through the existing tree.
 */

import type { TokenSet, DTCGGroup, DTCGToken } from '../shared/types.js';
import { flatTokensToTree } from '../shared/transform.js';

/** A flat leaf produced by the Figma walk, before grouping into sets. */
export interface ImportLeaf {
  /** Logical bucket — drives the TokenSet id/path. */
  bucket:
    | { kind: 'variables'; collectionName: string; modeName: string }
    | { kind: 'paint' }
    | { kind: 'text' }
    | { kind: 'effect' };
  /** Dot-path inside the resulting TokenSet tree. */
  path: string;
  token: DTCGToken;
}

/** Sanitise an arbitrary Figma name into a path-safe id segment. */
function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Group leaves into TokenSets. Empty buckets are dropped — we don't want
 * the diff modal showing rows for sets the designer never selected.
 */
export function buildSetsFromLeaves(leaves: ImportLeaf[]): Record<string, TokenSet> {
  // Bucket leaves by destination set id.
  const grouped = new Map<string, { name: string; path: string; flat: Array<{ path: string; token: DTCGToken }> }>();

  for (const leaf of leaves) {
    const setMeta = setMetaForBucket(leaf.bucket);
    const existing = grouped.get(setMeta.id);
    if (existing) {
      existing.flat.push({ path: leaf.path, token: leaf.token });
    } else {
      grouped.set(setMeta.id, {
        name: setMeta.name,
        path: setMeta.path,
        flat: [{ path: leaf.path, token: leaf.token }],
      });
    }
  }

  const out: Record<string, TokenSet> = {};
  for (const [id, { name, path, flat }] of grouped) {
    const tree: DTCGGroup = flatTokensToTree(flat);
    out[id] = {
      id,
      path,
      name,
      tree,
      // Empty `originalTree` mirrors the convention used by
      // `ensureTenantOverrideSet` for sets that don't yet exist on disk —
      // the diff modal will treat every leaf as `add` against an empty
      // current set, and the push pipeline can later recognise the file
      // as new (rather than edit).
      originalTree: {},
      dirty: true,
    };
  }
  return out;
}

function setMetaForBucket(bucket: ImportLeaf['bucket']): {
  id: string;
  name: string;
  path: string;
} {
  switch (bucket.kind) {
    case 'variables': {
      const coll = slugify(bucket.collectionName) || 'collection';
      const mode = slugify(bucket.modeName) || 'mode';
      const id = `figma-import/${coll}/${mode}`;
      return {
        id,
        name: id,
        path: `packages/tokens/sources/${id}.json`,
      };
    }
    case 'paint': {
      const id = 'figma-import/styles/color';
      return { id, name: id, path: `packages/tokens/sources/${id}.json` };
    }
    case 'text': {
      const id = 'figma-import/styles/text';
      return { id, name: id, path: `packages/tokens/sources/${id}.json` };
    }
    case 'effect': {
      const id = 'figma-import/styles/effect';
      return { id, name: id, path: `packages/tokens/sources/${id}.json` };
    }
  }
}
