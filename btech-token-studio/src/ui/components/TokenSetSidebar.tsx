/**
 * TokenSetSidebar — left panel listing every token set as a flat row
 * --------------------------------------------------------------------
 * Mirrors the Tokens Studio for Figma sidebar: just a vertical list of set
 * names, each with an active/inactive indicator. No folder grouping —
 * grouping by core/semantic/components/tenants made the list noisy when
 * the project grows. The set's full repo path is in the `title` tooltip
 * for designers who need it.
 *
 * Tenant filtering: when `activeTenant` is set in the store, sets under
 * other tenants are hidden so the designer focuses on the selected tenant
 * plus the shared base sets (core/semantic/components).
 *
 * Active state semantics:
 *   - `●` filled circle = currently focused (its tokens render in the right panel)
 *   - `○` hollow circle = not focused
 *   - dirty badge appears as a small dot on the right when the set has unsaved edits
 */

import React, { useMemo } from 'react';
import { useTokens } from '../hooks/useTokens.js';
import type { TokenSet } from '../../shared/types.js';
import {
  countOverridesForBase,
  findTenantOverrideSet,
} from '../../shared/tenant-resolver.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Pick a display name for a set. The repo id (e.g. `core/color.primitive`)
 * gets rewritten to a Title-Cased label without dots/slashes for the sidebar
 * — designers think in human labels ("Color Primitive"), not in file paths.
 *
 * Examples:
 *   "core/color.primitive"            → "Color Primitive"
 *   "semantic/color"                  → "Color"
 *   "components/button"               → "Button"
 *   "tenants/bspace/overrides"        → "Bspace Overrides"
 *   "core/typography.primitive"       → "Typography Primitive"
 *
 * The full repo path is still available via the row's `title` attribute on
 * hover, so the original file location is never hidden — just deprioritised
 * visually.
 */
function displayName(set: TokenSet): string {
  // Drop the namespace prefix (core/, semantic/, components/, tenants/<id>).
  // For tenant sets we keep the tenant id in the label so designers can tell
  // which tenant the override belongs to when several are loaded.
  let working = set.id;
  if (working.startsWith('tenants/')) {
    // "tenants/bspace/overrides" → "bspace/overrides"
    working = working.slice('tenants/'.length);
  } else {
    const firstSlash = working.indexOf('/');
    if (firstSlash !== -1) working = working.slice(firstSlash + 1);
  }

  // Replace structural separators with single spaces, then collapse repeats.
  const cleaned = working
    .replace(/[./_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Title-Case every whitespace-separated word. We touch only the first letter
  // so any internal capitalisation (acronyms like "UI") survives if a future
  // file is named that way.
  return cleaned
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

/** Sort: core first, then semantic, components, finally tenants. */
function namespaceWeight(id: string): number {
  if (id.startsWith('core/')) return 0;
  if (id.startsWith('semantic/')) return 1;
  if (id.startsWith('components/')) return 2;
  if (id.startsWith('tenants/')) return 3;
  return 4;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TokenSetSidebar() {
  // activeTenant DOES affect what the sidebar shows visually — when a tenant
  // is selected, each base set entry gets an "@" marker on the right if the
  // tenant's overrides file has at least one leaf overridden inside that
  // set. The `tenants/...` overrides themselves are still hidden as their
  // own list entries (they're diffs, not standalone sets).
  const { sets, activeSetId, activeTenant, setActiveSet } = useTokens();

  /*
   * Tenant override files (tenants/<id>/overrides) are NEVER shown as their
   * own sidebar entries — conceptually they're not standalone sets, they're
   * value diffs applied on top of the base sets. The top tenant filter
   * controls whether those overrides are merged into the values shown in
   * the right panel; the sidebar list is always the same base structure
   * regardless of the active tenant.
   */
  const visibleSets = useMemo(() => {
    return Object.values(sets)
      .filter((s) => !s.id.startsWith('tenants/'))
      .sort((a, b) => {
        const wa = namespaceWeight(a.id);
        const wb = namespaceWeight(b.id);
        if (wa !== wb) return wa - wb;
        return a.id.localeCompare(b.id);
      });
  }, [sets]);

  /**
   * Resolve the active tenant's overrides file once — every visible set
   * compares its leaves against this same tree, so doing the lookup
   * outside the loop avoids `O(N)` map lookups per render.
   */
  const overrideSet = useMemo(
    () => findTenantOverrideSet(sets, activeTenant),
    [sets, activeTenant],
  );

  /**
   * Per-set override count: how many leaves in this base set are
   * overridden by the active tenant's overrides file. Zero means "no
   * tenant divergence" — the sidebar entry renders without the @ marker.
   * Memoised on `[visibleSets, overrideSet]` because override counts are
   * stable until either side changes.
   */
  const overrideCounts = useMemo(() => {
    const out: Record<string, number> = {};
    if (!overrideSet) return out;
    for (const s of visibleSets) {
      out[s.id] = countOverridesForBase(s.tree, overrideSet.tree);
    }
    return out;
  }, [visibleSets, overrideSet]);

  if (visibleSets.length === 0) {
    return (
      <aside className="sidebar sidebar--empty">
        <p className="sidebar__empty-hint">Pull from Azure DevOps to load tokens.</p>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <ul className="sidebar__list">
        {visibleSets.map((s) => {
          const isActive = activeSetId === s.id;
          const overrideCount = overrideCounts[s.id] ?? 0;
          return (
            <li key={s.id}>
              <button
                className={`sidebar__set-btn${isActive ? ' sidebar__set-btn--active' : ''}`}
                onClick={() => setActiveSet(s.id)}
                title={
                  overrideCount > 0
                    ? `${s.path} — ${overrideCount} override${overrideCount === 1 ? '' : 's'} from ${activeTenant}`
                    : s.path
                }
              >
                {/* Active indicator: filled when this is the focused set */}
                <span
                  className={`sidebar__indicator${isActive ? ' sidebar__indicator--on' : ''}`}
                  aria-hidden
                >
                  {isActive ? '●' : '○'}
                </span>
                <span className="sidebar__set-name">{displayName(s)}</span>
                {/*
                  Tenant override marker — "@" badge with the count of leaves
                  the active tenant overrides inside this base set. Only
                  appears when a tenant is active AND this set has at least
                  one diverging leaf, so designers can see at a glance which
                  base sets are affected by the current tenant.
                */}
                {overrideCount > 0 && (
                  <span
                    className="sidebar__override-badge"
                    aria-label={`${overrideCount} override${overrideCount === 1 ? '' : 's'} from ${activeTenant}`}
                  >
                    @{overrideCount}
                  </span>
                )}
                {/* Dirty marker — small amber dot at the right edge */}
                {s.dirty && <span className="sidebar__dirty-dot" aria-label="modified" />}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
