/**
 * TokenEditor — modal for adding or editing a single token
 * ---------------------------------------------------------
 * Two modes:
 *   - "add"  : type selector first, then path + value + description
 *   - "edit" : path is read-only display, all other fields are editable
 *
 * Routing is owned by the token store: when a tenant is active, both add
 * and edit operations write to that tenant's `tenants/<id>/overrides.json`.
 * Otherwise they write to the currently focused base set (`activeSetId`).
 * The editor doesn't need to know — it just calls `editToken(path, …)` /
 * `addToken(path, token)` and the store decides where the value lands.
 *
 * Validation runs on save via Ajv (inline per-field errors). On success the
 * modal closes and the dirty badge appears on the affected set.
 */

import React, { useState, useEffect } from 'react';
import { useTokens } from '../hooks/useTokens.js';
import { validateToken } from '../../shared/validators.js';
import { DTCG_TYPES } from '../../shared/types.js';
import type { DTCGToken, DTCGType } from '../../shared/types.js';

// ── Props ────────────────────────────────────────────────────────────────────

interface TokenEditorProps {
  mode: 'add' | 'edit';
  /** Required in edit mode — the path of the token being edited */
  editPath?: string;
  /**
   * Pre-select this $type when opening in add mode (e.g. the per-section
   * `+` button in TokenTreeView passes the section's type here). Ignored
   * in edit mode — the existing token's type is used instead.
   */
  defaultType?: DTCGType;
  onClose: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPlaceholder(type: DTCGType): string {
  switch (type) {
    case 'color': return '#145bc3 or {color.brand.primary}';
    case 'dimension': return '8px or {radius.sm}';
    case 'fontFamily': return 'Rubik, system-ui';
    case 'fontWeight': return '400';
    case 'number': return '1.5';
    case 'duration': return '200ms';
    default: return 'Value…';
  }
}

/**
 * Parse the raw string input into the correct $value type.
 * Color stays as string. Number/fontWeight parses to number.
 * CubicBezier/gradient/shadow stay as strings in Phase 1 (complex editing deferred).
 */
function parseValue(raw: string, type: DTCGType): DTCGToken['$value'] {
  if (type === 'number' || type === 'fontWeight') {
    const n = Number(raw);
    return Number.isNaN(n) ? raw : n;
  }
  return raw;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TokenEditor({ mode, editPath, defaultType, onClose }: TokenEditorProps) {
  const { sets, activeSetId, activeTenant, addToken, editToken } = useTokens();

  // The "source of truth" set that the editor reads from when hydrating an
  // edit form. For edit mode we still want to show the *resolved* value the
  // designer clicked on — so we look up the leaf in the active base set,
  // since override files are sparse and may not contain $type.
  const baseSet = activeSetId ? sets[activeSetId] : null;

  // Form state — when opening in add mode with a pre-selected type, seed it
  // so the type dropdown lands on the right value without a flash of "color".
  const [tokenType, setTokenType] = useState<DTCGType>(defaultType ?? 'color');
  const [path, setPath] = useState('');
  const [rawValue, setRawValue] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Hydrate form when editing an existing token. We read from the BASE set
  // because that's where $type lives even when an override exists. The value
  // shown is the override's value if present, falling back to base.
  useEffect(() => {
    if (mode !== 'edit' || !editPath || !baseSet) return;

    const segments = editPath.split('.');
    let baseNode: unknown = baseSet.tree;
    for (const seg of segments) {
      if (typeof baseNode !== 'object' || baseNode === null) return;
      baseNode = (baseNode as Record<string, unknown>)[seg];
    }
    if (!baseNode || typeof baseNode !== 'object' || !('$value' in baseNode)) return;

    const baseLeaf = baseNode as DTCGToken;
    setTokenType(baseLeaf.$type);
    setDescription(baseLeaf.$description ?? '');

    // If a tenant override exists for this path, prefer its current value so
    // the editor opens on what the designer is actually looking at on screen.
    let displayedValue: DTCGToken['$value'] = baseLeaf.$value;
    if (activeTenant) {
      const overrideId = `tenants/${activeTenant}/overrides`;
      const overrideSet = sets[overrideId];
      if (overrideSet) {
        let n: unknown = overrideSet.tree;
        for (const seg of segments) {
          if (typeof n !== 'object' || n === null) { n = null; break; }
          n = (n as Record<string, unknown>)[seg];
        }
        if (n && typeof n === 'object' && '$value' in n) {
          displayedValue = (n as DTCGToken).$value;
        }
      }
    }

    setRawValue(
      typeof displayedValue === 'object'
        ? JSON.stringify(displayedValue, null, 2)
        : String(displayedValue),
    );
  }, [mode, editPath, baseSet, activeTenant, sets]);

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    const token: DTCGToken = {
      $type: tokenType,
      $value: parseValue(rawValue, tokenType),
      ...(description ? { $description: description } : {}),
    };

    const result = validateToken(token);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors([]);

    if (mode === 'add') {
      if (!path.trim()) {
        setErrors(['Path is required.']);
        return;
      }
      addToken(path.trim(), token);
    } else if (editPath) {
      // For edits the store routes on tenant context; we pass updates only.
      editToken(editPath, token);
    }

    onClose();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // Visible target description so designers know where the edit will land.
  const targetLabel = activeTenant
    ? `tenants/${activeTenant}/overrides`
    : (baseSet?.id ?? '—');

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal aria-label={mode === 'add' ? 'Add token' : 'Edit token'}>
        <div className="modal__header">
          <h2 className="modal__title">{mode === 'add' ? 'Add Token' : 'Edit Token'}</h2>
          <button className="modal__close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__body">
          {/* Routing hint — keeps the designer aware that tenant edits land on the override file */}
          <div className="form-routing-hint" role="note">
            <span className="form-routing-hint__label">Saves to</span>
            <span className="form-routing-hint__target">{targetLabel}</span>
          </div>

          {/* Type selector — shown first in add mode, read-only display in edit mode */}
          <label className="form-field">
            <span className="form-field__label">Type</span>
            {mode === 'add' ? (
              <select
                className="form-field__input"
                value={tokenType}
                onChange={(e) => setTokenType(e.target.value as DTCGType)}
              >
                {DTCG_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <span className="form-field__static">{tokenType}</span>
            )}
          </label>

          {/* Path — editable in add, read-only in edit */}
          <label className="form-field">
            <span className="form-field__label">Path</span>
            {mode === 'add' ? (
              <input
                className="form-field__input"
                type="text"
                placeholder="color.brand.tertiary"
                value={path}
                onChange={(e) => setPath(e.target.value)}
              />
            ) : (
              <span className="form-field__static form-field__static--path">{editPath}</span>
            )}
          </label>

          {/* Value */}
          <label className="form-field">
            <span className="form-field__label">Value</span>
            {tokenType === 'color' && !rawValue.startsWith('{') && (
              <input
                type="color"
                className="form-field__color-picker"
                value={rawValue.startsWith('#') ? rawValue : '#000000'}
                onChange={(e) => setRawValue(e.target.value)}
                title="Color picker"
              />
            )}
            <input
              className="form-field__input"
              type={tokenType === 'number' || tokenType === 'fontWeight' ? 'number' : 'text'}
              placeholder={getPlaceholder(tokenType)}
              value={rawValue}
              onChange={(e) => setRawValue(e.target.value)}
            />
          </label>

          {/* Description */}
          <label className="form-field">
            <span className="form-field__label">Description</span>
            <textarea
              className="form-field__input form-field__input--textarea"
              placeholder="Optional description…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </label>

          {/* Validation errors */}
          {errors.length > 0 && (
            <ul className="form-errors">
              {errors.map((e, i) => (
                <li key={i} className="form-errors__item">{e}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSave}>
            {mode === 'add' ? 'Add' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
