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
 *   - `@N` brand-blue pill on the right = the active tenant has N overrides
 *     defined for this base set. Structural info, ALWAYS visible while a
 *     tenant is selected (an override is an intentional divergence from
 *     base, not a pending change — pull does not clear it).
 *   - `+N` amber pill on the right = this set has N unsynced leaf edits
 *     waiting to be pushed. Disappears after pull or push.
 */

import React, { useMemo } from 'react';
import { useTokens } from '../hooks/useTokens.js';
import type { TokenSet } from '../../shared/types.js';
import {
  countOverridesForBase,
  findTenantOverrideSet,
} from '../../shared/tenant-resolver.js';
import { countLeafChanges } from '../../shared/transform.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Pick a display name for a set from its repo id.
 *
 * Rules (derived from the actual sources/ directory structure):
 *
 *   folder == filename (e.g. shadow/shadow)
 *     → use folder once, tokenise → "Shadow"
 *     → spacing-and-radius/spacing-and-radius → "Spacing & Radius"  (& special-case)
 *
 *   folder != filename
 *     → combine folder + filename, tokenise hyphens → Title-Case words
 *     → brand/color              → "Brand Color"
 *     → primitives/color         → "Primitives Color"
 *     → semantic-color/dark      → "Semantic Color Dark"
 *     → semantic-color/light     → "Semantic Color Light"
 *     → typography/font          → "Typography Font"
 *     → typography/scale         → "Typography Scale"
 *
 *   tenants/<id>/…
 *     → strip "tenants/" prefix  → "Bspace Overrides"
 *
 * The full repo path is always accessible in the row's `title` tooltip.
 */
function displayName(set: TokenSet): string {
  if (set.id.startsWith('tenants/')) {
    // "tenants/bspace/overrides" → "Bspace Overrides"
    const withoutPrefix = set.id.slice('tenants/'.length);
    return toTitleCase(withoutPrefix.replace(/[/_-]+/g, ' '));
  }

  const slashIdx = set.id.indexOf('/');
  const folder   = slashIdx !== -1 ? set.id.slice(0, slashIdx) : set.id;
  const filename = slashIdx !== -1 ? set.id.slice(slashIdx + 1) : set.id;

  // When folder and filename are identical, use the folder string only —
  // avoids "Shadow Shadow", "Stroke Stroke", "Spacing And Radius Spacing …".
  const raw = folder === filename ? folder : `${folder} ${filename}`;

  // Tokenise on hyphens, slashes, underscores → individual words.
  const words = raw.split(/[/_-]+/).filter(Boolean);
  let label    = words.join(' ');

  // "spacing and radius" → "Spacing & Radius"  (more compact, standard DS notation)
  label = label.replace(/\bspacing and radius\b/i, 'Spacing & Radius');

  return toTitleCase(label);
}

function toTitleCase(str: string): string {
  return str
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Sort order: primitives → brand → semantic-color → spacing-and-radius
 *             → typography → shadow → stroke → components → tenants → rest.
 * Mirrors the conceptual layers: foundation → brand → semantic → layout → type → elevation.
 */
function namespaceWeight(id: string): number {
  if (id.startsWith('primitives/'))        return 0;
  if (id.startsWith('brand/'))             return 1;
  if (id.startsWith('semantic-color/'))    return 2;
  if (id.startsWith('spacing-and-radius/')) return 3;
  if (id.startsWith('typography/'))        return 4;
  if (id.startsWith('shadow/'))            return 5;
  if (id.startsWith('stroke/'))            return 6;
  if (id.startsWith('components/'))        return 7;
  if (id.startsWith('tenants/'))           return 8;
  // Legacy / unknown namespaces fall to the bottom
  return 9;
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
   *
   * Note: this is STRUCTURAL information (the tenant has N overrides
   * defined), not pending edits. It stays visible after a successful
   * pull — pending edits get their own `+N` badge below.
   */
  const overrideCounts = useMemo(() => {
    const out: Record<string, number> = {};
    if (!overrideSet) return out;
    for (const s of visibleSets) {
      out[s.id] = countOverridesForBase(s.tree, overrideSet.tree);
    }
    return out;
  }, [visibleSets, overrideSet]);

  /**
   * Per-set pending-edit count: how many leaf tokens in this set differ
   * from `originalTree` (= the snapshot from the last pull / push). Zero
   * means "no unsynced edits in this file" — the sidebar entry renders
   * without the `+N` badge.
   *
   * The amber `+N` badge is the truthful "you have changes here" signal
   * the designer is looking for. It clears automatically after pull
   * (because `parseJsonToSet` resets every set to `originalTree === tree`,
   * making the diff zero).
   */
  const changeCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const s of visibleSets) {
      out[s.id] = s.dirty
        ? countLeafChanges(s.tree, s.originalTree ?? s.tree)
        : 0;
    }
    // Tenant override file isn't in `visibleSets` (filtered out), but its
    // edits affect base-set rows — surface the override file's diff under
    // the base set the edited leaves belong to. Cheaper alternative for
    // now: roll the entire override-file diff onto the active base set,
    // since that's the only one the designer is currently editing into.
    if (overrideSet?.dirty && activeSetId && out[activeSetId] !== undefined) {
      out[activeSetId] += countLeafChanges(
        overrideSet.tree,
        overrideSet.originalTree ?? overrideSet.tree,
      );
    }
    return out;
  }, [visibleSets, overrideSet, activeSetId]);

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
          const changeCount = changeCounts[s.id] ?? 0;
          // Compose the tooltip from whichever signals are present so the
          // designer can hover any row and learn exactly what each badge
          // means. We never show both badges' text in the title at once
          // unless both apply — keeps the hover string short and honest.
          const titleParts = [s.path];
          if (overrideCount > 0) {
            titleParts.push(
              `${overrideCount} ${activeTenant} override${overrideCount === 1 ? '' : 's'} (intentional difference from base)`,
            );
          }
          if (changeCount > 0) {
            titleParts.push(
              `${changeCount} unsynced ${changeCount === 1 ? 'edit' : 'edits'} (will be pushed)`,
            );
          }
          return (
            <li key={s.id}>
              <button
                className={`sidebar__set-btn${isActive ? ' sidebar__set-btn--active' : ''}`}
                onClick={() => setActiveSet(s.id)}
                title={titleParts.join(' — ')}
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
                  Two visually distinct badges, each meaning a different
                  thing — keep them apart so designers don't confuse
                  "tenant has overrides" with "you have unsaved edits":

                    @N  (brand-blue) → the active tenant overrides N leaves
                                       in this base set. Structural info,
                                       always visible while a tenant is
                                       selected. Survives pull.
                    +N  (amber)      → this set has N unsynced edits
                                       (`tree` ≠ `originalTree`). Cleared
                                       automatically by pull / push.
                */}
                {overrideCount > 0 && (
                  <span
                    className="sidebar__override-badge"
                    aria-label={`${overrideCount} ${activeTenant} override${overrideCount === 1 ? '' : 's'}`}
                    title={`${overrideCount} ${activeTenant} override${overrideCount === 1 ? '' : 's'} — intentional difference from base, not a pending change`}
                  >
                    @{overrideCount}
                  </span>
                )}
                {changeCount > 0 && (
                  <span
                    className="sidebar__change-badge"
                    aria-label={`${changeCount} unsynced ${changeCount === 1 ? 'edit' : 'edits'}`}
                    title={`${changeCount} unsynced ${changeCount === 1 ? 'edit' : 'edits'} in this set — will be pushed`}
                  >
                    +{changeCount}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
