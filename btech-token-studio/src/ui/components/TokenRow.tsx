/**
 * TokenRow — single row in the token list
 * -----------------------------------------
 * Renders the token path, a value preview, and a context menu trigger.
 * Clicking the row opens the editor in edit mode.
 *
 * Color preview: a small swatch is shown when $type === 'color' and the
 * value is a plain hex/rgb string (not a reference). References ({…})
 * show a placeholder icon instead.
 */

import React from 'react';
import type { DTCGToken } from '../../shared/types.js';

// ── Props ────────────────────────────────────────────────────────────────────

interface TokenRowProps {
  path: string;
  token: DTCGToken;
  onEdit: (path: string) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true when the value string looks like a DTCG alias reference */
function isReference(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

function renderValuePreview(token: DTCGToken): React.ReactNode {
  const { $value, $type } = token;

  if ($type === 'color' && typeof $value === 'string' && !isReference($value)) {
    return (
      <span className="token-row__color-preview" style={{ backgroundColor: $value }} aria-hidden />
    );
  }

  if ($type === 'color' && isReference($value)) {
    return <span className="token-row__ref-badge" title={String($value)}>alias</span>;
  }

  if (typeof $value === 'object') {
    return <span className="token-row__value token-row__value--complex">{'{…}'}</span>;
  }

  const truncated = String($value).slice(0, 30);
  return (
    <span className="token-row__value">
      {truncated}{String($value).length > 30 ? '…' : ''}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TokenRow({ path, token, onEdit }: TokenRowProps) {
  return (
    <li className="token-row">
      <button
        className="token-row__btn"
        onClick={() => onEdit(path)}
        title={`Edit ${path}`}
      >
        <span className="token-row__preview-slot">
          {renderValuePreview(token)}
        </span>
        <span className="token-row__path">{path}</span>
        <span className="token-row__meta">
          {token.$deprecated && (
            <span className="token-row__deprecated-badge">deprecated</span>
          )}
        </span>
      </button>

      <button
        className="token-row__menu-btn"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(path); // Phase 1: menu only has Edit; open editor
        }}
        aria-label={`Options for ${path}`}
      >
        ⋯
      </button>
    </li>
  );
}
