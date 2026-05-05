/**
 * BTBadge — status label atom.
 * Sliced from Figma `Badge` (node 72:1516). Mirrors @btech/ui-vue BTBadge
 * one-to-one (same prop names, same variant logic, same render priority).
 *
 * ## Usage:
 * ```tsx
 * // Normal
 * <BTBadge label="Approved" variant="success" />
 *
 * // With left icon
 * <BTBadge label="Waiting" variant="waiting" leftIcon={<ClockIcon size={16} />} />
 *
 * // Reverse (solid bg + white text)
 * <BTBadge label="Rejected" variant="reject" reverseColors />
 * ```
 */
import * as React from 'react';
import type { BTBadgeProps } from './BTBadge.types.js';
import './BTBadge.css';

/**
 * Status label pill. See file header for usage examples.
 */
export const BTBadge = React.forwardRef<HTMLSpanElement, BTBadgeProps>(
  (
    {
      label = 'Badge',
      variant = 'success',
      reverseColors = false,
      leftIcon,
      rightIcon,
      className,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      'bt-badge',
      `bt-badge--${variant}`,
      reverseColors ? 'bt-badge--reverse' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classes} data-testid="bt-badge" {...rest}>
        {leftIcon}
        <span className="bt-badge__label">{label}</span>
        {rightIcon}
      </span>
    );
  },
);

BTBadge.displayName = 'BTBadge';
