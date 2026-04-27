/**
 * TokenList — orchestrator for the active set's main panel
 * ----------------------------------------------------------
 * Owns the toolbar (set name, dirty badge, view-mode toggle, +Add) and
 * delegates rendering to either TokenTreeView (visual previews) or
 * TokenJsonView (read-only DTCG JSON). View mode is local state — we don't
 * persist it across sets because re-opening on the visual view is the
 * expected default for designers.
 *
 * The two view modes show the SAME data; the toggle is purely cosmetic.
 * Editing always happens through the TokenEditor modal.
 */

import React, { useMemo, useState } from 'react';
import { useTokens } from '../hooks/useTokens.js';
import { TokenTreeView } from './TokenTreeView.js';
import { TokenJsonView } from './TokenJsonView.js';
import { TokenEditor } from './TokenEditor.js';
import {
  findTenantOverrideSet,
  resolveSetForTenant,
} from '../../shared/tenant-resolver.js';
import type { DTCGType } from '../../shared/types.js';

// ── View modes ───────────────────────────────────────────────────────────────

type ViewMode = 'preview' | 'json';

// ── Component ─────────────────────────────────────────────────────────────────

export function TokenList() {
  const { sets, activeSetId, activeTenant } = useTokens();
  const baseSet = activeSetId ? sets[activeSetId] : null;

  /**
   * When a tenant is active, splice that tenant's overrides into the base
   * tree so the right panel shows the values the tenant actually consumes.
   * Edits route to the override file via the store (see `editToken`/
   * `addToken` in `store/tokens.ts`); this component only handles display.
   * The overridden leaves carry a `__overriddenBy` marker which
   * TokenTreeView uses to render the override badge.
   */
  const activeSet = useMemo(() => {
    if (!baseSet) return null;
    if (!activeTenant) return baseSet;
    const override = findTenantOverrideSet(sets, activeTenant);
    return resolveSetForTenant(baseSet, override, activeTenant);
  }, [baseSet, sets, activeTenant]);

  const [mode, setMode] = useState<ViewMode>('preview');
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  /**
   * When the user clicks the per-section `+` button, we remember which $type
   * was clicked so the editor can pre-select it. Null means "use the editor's
   * default" — the toolbar `+ Add Token` button.
   */
  const [addType, setAddType] = useState<DTCGType | null>(null);

  if (!activeSet) {
    return (
      <main className="token-list token-list--empty">
        <p className="token-list__empty-hint">
          Select a token set from the sidebar.
        </p>
      </main>
    );
  }

  function openAdd(type: DTCGType | null = null) {
    setAddType(type);
    setIsAdding(true);
    setEditingPath(null);
  }

  return (
    <main className="token-list">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="token-list__toolbar">
        <span className="token-list__set-name" title={activeSet.path}>
          {activeSet.name}
        </span>
        {activeSet.dirty && <span className="token-list__dirty-badge">modified</span>}

        {/* View mode toggle — segmented buttons mirroring Tokens Studio */}
        <div className="view-toggle" role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            className={`view-toggle__btn${mode === 'preview' ? ' view-toggle__btn--active' : ''}`}
            onClick={() => setMode('preview')}
            title="Preview"
          >
            {/* Three horizontal lines = list / preview view */}
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M2 4h10M2 7h10M2 10h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'json'}
            className={`view-toggle__btn${mode === 'json' ? ' view-toggle__btn--active' : ''}`}
            onClick={() => setMode('json')}
            title="JSON"
          >
            {/* Curly braces = code view */}
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M5.5 2.5c-1.2 0-1.7.6-1.7 1.6v1.6c0 .8-.4 1.3-1.3 1.3.9 0 1.3.5 1.3 1.3v1.6c0 1 .5 1.6 1.7 1.6M8.5 2.5c1.2 0 1.7.6 1.7 1.6v1.6c0 .8.4 1.3 1.3 1.3-.9 0-1.3.5-1.3 1.3v1.6c0 1-.5 1.6-1.7 1.6"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </button>
        </div>

        <button
          className="token-list__add-btn"
          onClick={() => openAdd(null)}
          title="Add a token of any type"
        >
          + Add Token
        </button>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {mode === 'preview' ? (
        <TokenTreeView
          activeSet={activeSet}
          onEdit={(p) => { setEditingPath(p); setIsAdding(false); }}
          onAddOfType={openAdd}
        />
      ) : (
        <TokenJsonView activeSet={activeSet} />
      )}

      {/* ── Editor modals ───────────────────────────────────────────────── */}
      {editingPath && !isAdding && (
        <TokenEditor
          mode="edit"
          editPath={editingPath}
          onClose={() => setEditingPath(null)}
        />
      )}

      {isAdding && (
        <TokenEditor
          mode="add"
          /* If a per-section + was clicked, pre-select that type in the editor.
             TokenEditor reads `defaultType` only in add mode. */
          defaultType={addType ?? undefined}
          onClose={() => { setIsAdding(false); setAddType(null); }}
        />
      )}
    </main>
  );
}
