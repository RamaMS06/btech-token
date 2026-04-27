/**
 * TokenEditor — modal for adding or editing a single token
 * ---------------------------------------------------------
 * Two modes:
 *   - "add"  : type selector first, then path + value + description + set picker
 *   - "edit" : path is read-only display, all other fields are editable
 *
 * Validation runs on save via Ajv (inline per-field errors).
 * On success the store's addToken/editToken is called and the modal closes.
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
  /** The active set id where the token lives (edit) or will be added (add) */
  setId: string;
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

export function TokenEditor({ mode, editPath, setId, onClose }: TokenEditorProps) {
  const { sets, addToken, editToken } = useTokens();
  const activeSet = sets[setId];

  // Form state
  const [tokenType, setTokenType] = useState<DTCGType>('color');
  const [path, setPath] = useState('');
  const [rawValue, setRawValue] = useState('');
  const [description, setDescription] = useState('');
  const [targetSetId, setTargetSetId] = useState(setId);
  const [errors, setErrors] = useState<string[]>([]);

  // Hydrate form when editing an existing token
  useEffect(() => {
    if (mode !== 'edit' || !editPath || !activeSet) return;

    // Walk the tree to find the token
    const segments = editPath.split('.');
    let node: unknown = activeSet.tree;
    for (const seg of segments) {
      if (typeof node !== 'object' || node === null) return;
      node = (node as Record<string, unknown>)[seg];
    }
    if (!node || typeof node !== 'object' || !('$value' in node)) return;

    const token = node as DTCGToken;
    setTokenType(token.$type);
    setRawValue(
      typeof token.$value === 'object'
        ? JSON.stringify(token.$value, null, 2)
        : String(token.$value),
    );
    setDescription(token.$description ?? '');
  }, [mode, editPath, activeSet]);

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
      addToken(targetSetId, path.trim(), token);
    } else if (editPath) {
      editToken(setId, editPath, token);
    }

    onClose();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const allSetIds = Object.keys(sets);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal aria-label={mode === 'add' ? 'Add token' : 'Edit token'}>
        <div className="modal__header">
          <h2 className="modal__title">{mode === 'add' ? 'Add Token' : 'Edit Token'}</h2>
          <button className="modal__close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__body">
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

          {/* Set selector — only in add mode */}
          {mode === 'add' && (
            <label className="form-field">
              <span className="form-field__label">Token Set</span>
              <select
                className="form-field__input"
                value={targetSetId}
                onChange={(e) => setTargetSetId(e.target.value)}
              >
                {allSetIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </label>
          )}

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
