/**
 * ThemeSwitcher — tenant filter dropdown in the top toolbar
 * ----------------------------------------------------------
 * Picks which tenant's overrides are merged into the values shown in the
 * right panel. The sidebar list (which token sets exist) is independent of
 * this selection — only the *values* change.
 *
 * Options:
 *   - "Default"    → no overrides applied; designers see base values
 *   - "<tenantId>" → that tenant's overrides merged into base values for
 *                    every leaf whose path appears in tenants/<id>/overrides.json
 *
 * The dropdown only lists tenants that actually have an override file
 * loaded — pulling the repo with no tenant overrides means just "Default".
 *
 * Switching while dirty
 * ---------------------
 * Switching tenants discards unsaved edits (the store calls `discardAll`
 * on tenant change). When dirty work exists, we put up a ConfirmDialog so
 * the designer doesn't lose work to a stray click. With no dirty sets the
 * switch is instant — no confirmation, no friction.
 */

import React, { useMemo, useState } from 'react';
import { useTokens } from '../hooks/useTokens.js';
import { listAvailableTenants } from '../../shared/tenant-resolver.js';
import { ConfirmDialog } from './ConfirmDialog.js';

/** Title-Case a tenant id for display: "bspace" → "Bspace" */
function prettifyTenantId(id: string): string {
  return id
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export function ThemeSwitcher() {
  const { sets, activeTenant, setActiveTenant, discardAll } = useTokens();
  const tenants = useMemo(() => listAvailableTenants(sets), [sets]);
  const dirtyCount = useMemo(
    () => Object.values(sets).filter((s) => s.dirty).length,
    [sets],
  );

  // Pending tenant id captured from the dropdown when we need to confirm
  // first. `null` means "no switch in flight".
  const [pendingTenant, setPendingTenant] = useState<string | null | undefined>(undefined);

  function handleChange(value: string) {
    const next = value || null;
    if (next === activeTenant) return;

    if (dirtyCount > 0) {
      // Park the request, surface the confirm modal
      setPendingTenant(next);
      return;
    }
    setActiveTenant(next);
  }

  function confirmSwitch() {
    if (pendingTenant === undefined) return;
    discardAll();
    setActiveTenant(pendingTenant);
    setPendingTenant(undefined);
  }

  return (
    <div className="theme-switcher">
      <span className="theme-switcher__label">Tenant</span>
      <select
        className="theme-switcher__select"
        value={activeTenant ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        aria-label="Active tenant"
      >
        <option value="">Default</option>
        {tenants.map((id) => (
          <option key={id} value={id}>{prettifyTenantId(id)}</option>
        ))}
      </select>

      {pendingTenant !== undefined && (
        <ConfirmDialog
          title="Switch tenant?"
          body={
            <>
              You have <strong>{dirtyCount}</strong> unsaved {dirtyCount === 1 ? 'change' : 'changes'}.
              Switching tenants will discard {dirtyCount === 1 ? 'it' : 'them'} and revert to the last pulled state.
            </>
          }
          confirmLabel="Discard & switch"
          cancelLabel="Stay here"
          onConfirm={confirmSwitch}
          onClose={() => setPendingTenant(undefined)}
        />
      )}
    </div>
  );
}
