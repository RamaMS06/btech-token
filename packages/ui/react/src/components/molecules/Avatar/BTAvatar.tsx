/**
 * BTAvatar v2 — circular badge with image, initials, empty, or error state.
 * Sliced from Figma `Avatar` (node 497:979). Mirrors @btech/ui-vue +
 * btech_ui (Flutter) one-to-one (same prop names, same variant
 * precedence, same render priority).
 *
 * ## Variant precedence (highest first):
 *   1. isLoading=true              → skeleton placeholder
 *   2. status='error' | imageError → hide_image icon on bg/subtler
 *   3. item == undefined           → person icon on bg/subtler (empty)
 *   4. item.imageUrl               → <img>; onError → error state
 *   5. (default)                   → initials on colored background
 *
 * ## Usage:
 * ```tsx
 * <BTAvatar item={{ name: 'Faisal Lestari' }} size="md" />
 * <BTAvatar item={{ name: 'JD', imageUrl: 'https://...' }} size="lg" />
 * <BTAvatar item={{ name: 'AB', color: 'purple' }} />
 * <BTAvatar item={{ name: '?' }} isLoading />
 * <BTAvatar status="error" />
 * <BTAvatar />
 * ```
 */
import * as React from 'react';
import type { BTAvatarProps } from './BTAvatar.types.js';
import { deriveInitials } from './BTAvatar.types.js';
import './BTAvatar.css';

// ── Icon SVGs (Material Design paths, inline — no external dep) ──────────────

/** Material `person` icon (filled 24x24) — empty state. */
const PersonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

/** Material `hide_image` icon (outlined 24x24) — error state. */
const HideImageIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM18.5 10l-5.33 6.5-3.67-4.34L6 17h12l-2.5-3.33z" />
    <path d="M4.34 2.93 2.93 4.34 19.07 20.48l1.41-1.41z" />
  </svg>
);

// ────────────────────────────────────────────────────────────────────────────

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export const BTAvatar: React.FC<BTAvatarProps> = ({
  item,
  size = 'md',
  isLoading = false,
  status,
  className,
}) => {
  const [imageErrored, setImageErrored] = React.useState(false);

  // Reset error state when imageUrl changes
  React.useEffect(() => {
    setImageErrored(false);
  }, [item?.imageUrl]);

  // Resolve variant — order MUST match Vue/Flutter precedence
  const variant: 'loading' | 'error' | 'empty' | 'image' | 'initials' =
    isLoading
      ? 'loading'
      : status === 'error' || imageErrored
        ? 'error'
        : item == null
          ? 'empty'
          : item.imageUrl && !imageErrored
            ? 'image'
            : 'initials';

  const colorClass =
    variant === 'initials' || variant === 'image'
      ? `btech-avatar--color-${item?.color ?? 'green'}`
      : null;

  const classes = cn(
    'btech-avatar',
    `btech-avatar--${size}`,
    `btech-avatar--${variant}`,
    colorClass,
    className,
  );

  return (
    <div
      data-slot="avatar"
      data-size={size}
      data-variant={variant}
      className={classes}
      role="img"
      aria-label={item?.name ?? (variant === 'error' ? 'Error' : 'Empty')}
    >
      {variant === 'loading' && <div className="btech-avatar__skeleton" />}

      {variant === 'error' && (
        <span className="btech-avatar__icon">
          <HideImageIcon />
        </span>
      )}

      {variant === 'empty' && (
        <span className="btech-avatar__icon">
          <PersonIcon />
        </span>
      )}

      {variant === 'image' && item?.imageUrl && (
        <img
          className="btech-avatar__img"
          src={item.imageUrl}
          alt={item.name}
          onError={() => setImageErrored(true)}
        />
      )}

      {variant === 'initials' && item && (
        <span className="btech-avatar__initials">{deriveInitials(item.name)}</span>
      )}
    </div>
  );
};

BTAvatar.displayName = 'BTAvatar';
