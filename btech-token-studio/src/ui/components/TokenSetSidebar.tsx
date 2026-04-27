/**
 * TokenSetSidebar — left panel showing the tree of token sets
 * ------------------------------------------------------------
 * Token sets are grouped by folder: core/, semantic/, components/, tenants/<id>/.
 * Clicking a set makes it active (shown in the main panel).
 * A filled dot indicates the set has unsaved local edits (dirty flag).
 *
 * When activeTenant is set in the store, we filter to show only the selected
 * tenant's sets + core/semantic/components (the base sets). This is a pure
 * filter — no value resolution in Phase 1.
 */

import React, { useMemo } from 'react';
import { useTokens } from '../hooks/useTokens.js';
import type { TokenSet } from '../../shared/types.js';

// ── Grouping ─────────────────────────────────────────────────────────────────

type GroupedSets = {
  label: string;
  sets: TokenSet[];
};

function groupSets(sets: Record<string, TokenSet>, activeTenant: string | null): GroupedSets[] {
  const groups: Record<string, TokenSet[]> = {
    core: [],
    semantic: [],
    components: [],
  };
  const tenantGroups: Record<string, TokenSet[]> = {};

  for (const s of Object.values(sets)) {
    if (s.id.startsWith('tenants/')) {
      const tenantId = s.id.split('/')[1] ?? 'unknown';
      // When a tenant is active, show only that tenant's sets + base sets
      if (activeTenant && tenantId !== activeTenant) continue;
      tenantGroups[tenantId] = tenantGroups[tenantId] ?? [];
      tenantGroups[tenantId].push(s);
    } else if (s.id.startsWith('core/')) {
      groups.core.push(s);
    } else if (s.id.startsWith('semantic/')) {
      groups.semantic.push(s);
    } else if (s.id.startsWith('components/')) {
      groups.components.push(s);
    }
  }

  const result: GroupedSets[] = [];
  if (groups.core.length) result.push({ label: 'core', sets: groups.core });
  if (groups.semantic.length) result.push({ label: 'semantic', sets: groups.semantic });
  if (groups.components.length) result.push({ label: 'components', sets: groups.components });
  for (const [id, tenantSets] of Object.entries(tenantGroups)) {
    result.push({ label: `tenants / ${id}`, sets: tenantSets });
  }

  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TokenSetSidebar() {
  const { sets, activeSetId, activeTenant, setActiveSet } = useTokens();

  const grouped = useMemo(() => groupSets(sets, activeTenant), [sets, activeTenant]);

  if (Object.keys(sets).length === 0) {
    return (
      <aside className="sidebar sidebar--empty">
        <p className="sidebar__empty-hint">Pull from Azure DevOps to load tokens.</p>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      {grouped.map((group) => (
        <div key={group.label} className="sidebar__group">
          <span className="sidebar__group-label">{group.label}</span>
          <ul className="sidebar__list">
            {group.sets.map((s) => (
              <li key={s.id}>
                <button
                  className={[
                    'sidebar__set-btn',
                    activeSetId === s.id ? 'sidebar__set-btn--active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setActiveSet(s.id)}
                  title={s.path}
                >
                  {/* Filled dot = dirty; hollow dot = clean */}
                  <span
                    className={s.dirty ? 'sidebar__dot sidebar__dot--dirty' : 'sidebar__dot'}
                    aria-label={s.dirty ? 'modified' : 'clean'}
                  >
                    {s.dirty ? '●' : '○'}
                  </span>
                  <span className="sidebar__set-name">
                    {/* Show only the filename segment, not the full path */}
                    {s.id.split('/').pop() ?? s.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}
