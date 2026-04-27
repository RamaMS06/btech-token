/**
 * ThemeSwitcher — tenant filter dropdown in the top toolbar
 * ----------------------------------------------------------
 * Phase 1 behaviour: selecting a tenant filters the sidebar to show only
 * that tenant's sets + base sets (core/semantic/components). It does NOT
 * resolve values (base + override merging is Phase 3).
 *
 * Tenant options are derived from the loaded sets — any set with a path
 * under "tenants/<id>/" contributes a tenant option. If no tenant sets are
 * loaded, the dropdown still renders but only shows "All sets".
 */

import React, { useMemo } from 'react';
import { useTokens } from '../hooks/useTokens.js';

export function ThemeSwitcher() {
  const { sets, activeTenant, setActiveTenant } = useTokens();

  const tenants = useMemo(() => {
    const ids = new Set<string>();
    for (const id of Object.keys(sets)) {
      if (id.startsWith('tenants/')) {
        const parts = id.split('/');
        if (parts[1]) ids.add(parts[1]);
      }
    }
    return Array.from(ids).sort();
  }, [sets]);

  return (
    <div className="theme-switcher">
      <label htmlFor="tenant-select" className="theme-switcher__label">
        Tenant
      </label>
      <select
        id="tenant-select"
        className="theme-switcher__select"
        value={activeTenant ?? ''}
        onChange={(e) => setActiveTenant(e.target.value || null)}
      >
        <option value="">All sets</option>
        {tenants.map((id) => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>
    </div>
  );
}
