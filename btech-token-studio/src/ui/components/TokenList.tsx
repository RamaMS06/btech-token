/**
 * TokenList — main content area showing tokens for the active set
 * ----------------------------------------------------------------
 * Tokens are rendered grouped by $type (color, dimension, shadow, …).
 * Each group has a collapsible heading. Within each group, rows are sorted
 * alphabetically by path.
 *
 * The "+ Add Token" button in the header opens the editor in add mode.
 */

import React, { useMemo, useState } from 'react';
import { useTokens } from '../hooks/useTokens.js';
import { treeToFlatTokens } from '../../shared/transform.js';
import { TokenRow } from './TokenRow.js';
import { TokenEditor } from './TokenEditor.js';
import type { DTCGToken, DTCGType } from '../../shared/types.js';

// ── Grouping ─────────────────────────────────────────────────────────────────

const TYPE_ORDER: DTCGType[] = [
  'color', 'dimension', 'number', 'fontFamily', 'fontWeight',
  'typography', 'shadow', 'border', 'strokeStyle', 'gradient',
  'transition', 'duration', 'cubicBezier',
];

// ── Component ─────────────────────────────────────────────────────────────────

export function TokenList() {
  const { sets, activeSetId } = useTokens();
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const activeSet = activeSetId ? sets[activeSetId] : null;

  const grouped = useMemo(() => {
    if (!activeSet) return new Map<DTCGType, { path: string; token: DTCGToken }[]>();

    const flat = treeToFlatTokens(activeSet.tree);
    const map = new Map<DTCGType, typeof flat>();

    for (const item of flat) {
      const t = item.token.$type;
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(item);
    }

    // Sort each group alphabetically by path
    for (const [, items] of map) {
      items.sort((a, b) => a.path.localeCompare(b.path));
    }

    return map;
  }, [activeSet]);

  if (!activeSet) {
    return (
      <main className="token-list token-list--empty">
        <p className="token-list__empty-hint">
          Select a token set from the sidebar.
        </p>
      </main>
    );
  }

  return (
    <main className="token-list">
      <div className="token-list__toolbar">
        <span className="token-list__set-name">{activeSet.name}</span>
        {activeSet.dirty && <span className="token-list__dirty-badge">modified</span>}
        <button
          className="token-list__add-btn"
          onClick={() => setIsAdding(true)}
        >
          + Add Token
        </button>
      </div>

      {TYPE_ORDER.filter((t) => grouped.has(t)).map((type) => {
        const items = grouped.get(type)!;
        return (
          <section key={type} className="token-list__group">
            <h3 className="token-list__group-heading">{type.toUpperCase()}</h3>
            <ul className="token-list__items">
              {items.map(({ path, token }) => (
                <TokenRow
                  key={path}
                  path={path}
                  token={token}
                  onEdit={(p) => { setEditingPath(p); setIsAdding(false); }}
                />
              ))}
            </ul>
          </section>
        );
      })}

      {/* Types present in the set but not in TYPE_ORDER (future extension) */}
      {Array.from(grouped.keys())
        .filter((t) => !TYPE_ORDER.includes(t))
        .map((type) => {
          const items = grouped.get(type)!;
          return (
            <section key={type} className="token-list__group">
              <h3 className="token-list__group-heading">{type.toUpperCase()}</h3>
              <ul className="token-list__items">
                {items.map(({ path, token }) => (
                  <TokenRow
                    key={path}
                    path={path}
                    token={token}
                    onEdit={(p) => { setEditingPath(p); setIsAdding(false); }}
                  />
                ))}
              </ul>
            </section>
          );
        })}

      {/* Editor modal — edit mode */}
      {editingPath && !isAdding && (
        <TokenEditor
          mode="edit"
          editPath={editingPath}
          setId={activeSetId!}
          onClose={() => setEditingPath(null)}
        />
      )}

      {/* Editor modal — add mode */}
      {isAdding && (
        <TokenEditor
          mode="add"
          setId={activeSetId!}
          onClose={() => setIsAdding(false)}
        />
      )}
    </main>
  );
}
