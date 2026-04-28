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
import type { ResolvedToken } from '../../shared/tenant-resolver.js';

// ── Props ────────────────────────────────────────────────────────────────────

interface TokenRowProps {
  path: string;
  token: DTCGToken;
  onEdit: (path: string) => void;
}

/**
 * Read the tenant id that supplied this leaf's value, if any. Mirrors the
 * helper in TokenTreeView — composite types (shadow, typography, border,
 * gradient, transition) fall back to TokenRow rendering, so without this
 * the override badge would silently drop on those types when a tenant is
 * active.
 */
function overriddenBy(token: DTCGToken): string | null {
  return (token as ResolvedToken).__overriddenBy ?? null;
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
  const override = overriddenBy(token);
  return (
    <li className={`token-row${override ? ' token-row--overridden' : ''}`}>
      <button
        className="token-row__btn"
        onClick={() => onEdit(path)}
        title={
          override
            ? `Edit ${path} (overridden by ${override})`
            : `Edit ${path}`
        }
      >
        <span className="token-row__preview-slot">
          {renderValuePreview(token)}
          {/* Tenant override marker — small dot in the corner of the preview
              slot. Visible regardless of token type so composite tokens
              (shadow, typography, border, gradient, transition) signal
              tenant divergence the same way swatches and pills do. */}
          {override && (
            <span className="token-row__override-dot" aria-hidden />
          )}
        </span>
        <span className="token-row__path">{path}</span>
        <span className="token-row__meta">
          {override && (
            <span
              className="token-row__override-badge"
              title={`Overridden by ${override}`}
            >
              {override}
            </span>
          )}
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
