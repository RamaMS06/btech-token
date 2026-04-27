/**
 * Tenant override resolver
 * -------------------------
 * Tenant override files (sources/tenants/<id>/overrides.json) are NOT
 * standalone token sets — they are diff layers that replace specific values
 * inside the base sets (core/, semantic/, components/).
 *
 * This module produces a *resolved* TokenSet for display when a tenant is
 * active in the top filter. The store still keeps base + overrides separate
 * (so push writes the right files), but the UI renders the merged result so
 * designers see the values their tenant actually consumes.
 *
 * Pure functions only — no DOM, no Figma APIs, no store imports. Safe to
 * unit-test in Node.
 */

import type { DTCGGroup, DTCGToken, TokenSet } from './types.js';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * A leaf token augmented with the tenant id that supplied its `$value`.
 * The marker is non-DTCG (key starts with `__`) and gets stripped before
 * any push / serialise step. Renderers use it to draw the "overridden by
 * tenant X" badge.
 */
export interface ResolvedToken extends DTCGToken {
  /** Set when this leaf's value came from a tenant override layer. */
  __overriddenBy?: string;
}

// ── Guards ───────────────────────────────────────────────────────────────────

function isLeafToken(value: unknown): value is DTCGToken {
  return (
    typeof value === 'object' &&
    value !== null &&
    '$value' in (value as Record<string, unknown>) &&
    '$type' in (value as Record<string, unknown>)
  );
}

// ── Path lookup in an override tree ─────────────────────────────────────────

/**
 * Walk an override tree following `segments`. Returns the leaf token at that
 * path if it exists AND is a leaf, or null otherwise. We don't merge at the
 * group level — only individual leaves get overridden, even if the override
 * file happens to have a fuller subtree shape.
 */
function findOverrideLeaf(overrideTree: DTCGGroup, segments: string[]): DTCGToken | null {
  let node: unknown = overrideTree;
  for (const seg of segments) {
    if (typeof node !== 'object' || node === null) return null;
    node = (node as Record<string, unknown>)[seg];
  }
  return isLeafToken(node) ? node : null;
}

// ── Tree merge ───────────────────────────────────────────────────────────────

/**
 * Walk the base tree and produce a new tree where any leaf with a matching
 * path in the override tree gets its `$value` replaced. `$type` and metadata
 * keys (`$description`, `$deprecated`, …) are kept from the base — overrides
 * are value-only, never structural.
 *
 * The result is a deep-cloned tree; callers can mutate it freely without
 * disturbing the source data.
 */
function mergeTree(
  baseTree: DTCGGroup,
  overrideTree: DTCGGroup,
  tenantId: string,
  prefix: string[] = [],
): DTCGGroup {
  const out: DTCGGroup = {};

  for (const [key, value] of Object.entries(baseTree)) {
    if (value === undefined) continue;
    // Pass through metadata keys ($description, $schema)
    if (key.startsWith('$')) {
      out[key] = value as never;
      continue;
    }

    const segments = [...prefix, key];

    if (isLeafToken(value)) {
      const overrideLeaf = findOverrideLeaf(overrideTree, segments);
      if (overrideLeaf && overrideLeaf.$value !== value.$value) {
        // Replace just the value (and description if the override supplies one),
        // tag the leaf so the UI can mark it visually.
        const merged: ResolvedToken = {
          ...value,
          $value: overrideLeaf.$value,
          ...(overrideLeaf.$description ? { $description: overrideLeaf.$description } : {}),
          __overriddenBy: tenantId,
        };
        out[key] = merged as DTCGToken;
      } else {
        // No override (or override matches base) — keep the original leaf
        out[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recurse into nested groups
      out[key] = mergeTree(value as DTCGGroup, overrideTree, tenantId, segments);
    } else {
      // Primitive at a non-metadata key shouldn't occur in well-formed DTCG —
      // pass through to avoid lossy conversion if it ever does.
      out[key] = value as never;
    }
  }

  return out;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Resolve a single base set against a tenant's override file. The returned
 * TokenSet keeps the base set's id / path / name (so the sidebar entry stays
 * stable). Only the tree changes — leaves whose path appears in overrides
 * get the override's `$value`, marked with `__overriddenBy: tenantId`.
 *
 * If `overrideSet` is null/undefined, the base set is returned unchanged.
 */
export function resolveSetForTenant(
  baseSet: TokenSet,
  overrideSet: TokenSet | null | undefined,
  tenantId: string,
): TokenSet {
  if (!overrideSet) return baseSet;
  return {
    ...baseSet,
    tree: mergeTree(baseSet.tree, overrideSet.tree, tenantId),
  };
}

/**
 * Find a tenant's override TokenSet from the loaded sets map. Returns null
 * if the tenant has no override file or `tenantId` is null.
 *
 * Convention: tenant overrides live at id `tenants/<tenantId>/overrides`.
 * If the repo grows multi-file overrides per tenant later, this lookup
 * becomes the single seam to update.
 */
export function findTenantOverrideSet(
  sets: Record<string, TokenSet>,
  tenantId: string | null,
): TokenSet | null {
  if (!tenantId) return null;
  const id = `tenants/${tenantId}/overrides`;
  return sets[id] ?? null;
}

/**
 * Produce a list of all tenant ids that have at least one override file
 * loaded. Used by the tenant filter dropdown — only tenants with data
 * should appear as options.
 */
export function listAvailableTenants(sets: Record<string, TokenSet>): string[] {
  const ids = new Set<string>();
  for (const setId of Object.keys(sets)) {
    if (setId.startsWith('tenants/')) {
      const parts = setId.split('/');
      if (parts[1]) ids.add(parts[1]);
    }
  }
  return Array.from(ids).sort();
}

// ── Editor target helpers ───────────────────────────────────────────────────

/**
 * Return the override TokenSet for a tenant, or fabricate a fresh empty one
 * if the override file doesn't exist yet. Used by the store's edit-routing
 * logic: when a designer edits a token while a tenant is active, the write
 * targets this set so values diverge per-tenant rather than mutating the
 * shared base.
 *
 * The fresh set is NOT inserted into `sets` here — this function is pure.
 * The caller (the store) merges it into state via Zustand's `set()`.
 *
 * Convention (must match `findTenantOverrideSet`):
 *   id   = `tenants/<tenantId>/overrides`
 *   path = `packages/tokens/sources/tenants/<tenantId>/overrides.json`
 */
export function ensureTenantOverrideSet(
  sets: Record<string, TokenSet>,
  tenantId: string,
): TokenSet {
  const existing = findTenantOverrideSet(sets, tenantId);
  if (existing) return existing;

  const id = `tenants/${tenantId}/overrides`;
  return {
    id,
    path: `packages/tokens/sources/${id}.json`,
    name: id,
    tree: {},
    // Empty originalTree means a "Clear changes" on this freshly-created
    // override discards every entry — back to "no override file existed".
    originalTree: {},
    // The set is born dirty: it doesn't exist in repo until pushed.
    dirty: true,
  };
}
