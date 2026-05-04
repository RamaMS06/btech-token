/**
 * Avatar — circular badge that renders one of: image, initials, count, or
 * a placeholder icon (empty / error). Sliced from Figma `Avatar`
 * (node 497:979).
 *
 * Variant precedence (highest first):
 *   1. status="error"  → broken-image icon on neutral background
 *   2. src             → image (with optional bg color tint)
 *   3. count           → "+N" overflow counter
 *   4. initials        → 1-2 letters on colored background
 *   5. (nothing)       → empty placeholder (person icon)
 */
import * as React from 'react';
import type { AvatarProps } from './Avatar.types.js';
import './Avatar.css';

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

/** Inline person icon (Figma `person` symbol — used for empty state). */
const PersonIcon: React.FC = () => (
  <svg
    className="btech-avatar__icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5Z" />
  </svg>
);

/** Inline broken-image icon (Figma `hide_image` symbol — error state). */
const HideImageIcon: React.FC = () => (
  <svg
    className="btech-avatar__icon"
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 3l18 18-1.4 1.4-2-2H5a2 2 0 0 1-2-2V5.4L1.6 4 3 3Zm2 2v14h12.6L5 6.4V5Zm16 14V5a2 2 0 0 0-2-2H7l2 2h10v10l2 2Z" />
  </svg>
);

export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  src,
  alt,
  initials,
  color = 'green',
  count,
  status,
  className,
}) => {
  // Resolve which visual variant to render. Order matters — see file header.
  const isError = status === 'error';
  const isImage = !isError && Boolean(src);
  const isCount = !isError && !isImage && typeof count === 'number';
  const isInitials = !isError && !isImage && !isCount && Boolean(initials);
  const isEmpty = !isError && !isImage && !isCount && !isInitials;

  const variantClass = isError
    ? 'btech-avatar--error'
    : isImage
      ? `btech-avatar--image btech-avatar--color-${color}`
      : isCount
        ? 'btech-avatar--count'
        : isInitials
          ? `btech-avatar--initials btech-avatar--color-${color}`
          : 'btech-avatar--empty';

  const classes = cn('btech-avatar', `btech-avatar--${size}`, variantClass, className);

  return (
    <div className={classes} role="img" aria-label={alt ?? (initials || (isCount ? `+${count}` : 'avatar'))}>
      {isImage && src ? <img className="btech-avatar__img" src={src} alt={alt ?? ''} /> : null}
      {isInitials ? <span>{initials}</span> : null}
      {isCount ? <span>{`+${count}`}</span> : null}
      {isEmpty ? <PersonIcon /> : null}
      {isError ? <HideImageIcon /> : null}
    </div>
  );
};

Avatar.displayName = 'Avatar';
