/**
 * BTSeparator — visual divider atom (Figma 194:756).
 *
 * Renders a 1px line using the border.primary token.
 * Orientation: 'horizontal' (default) | 'vertical'.
 *
 * @example
 * ```tsx
 * // Horizontal (default) — inside a flex-col container
 * <BTSeparator />
 *
 * // Vertical — inside a flex-row container with defined height
 * <BTSeparator orientation="vertical" />
 * ```
 */
import './BTSeparator.css';
import type { BTSeparatorProps } from './BTSeparator.types';

export function BTSeparator({ orientation = 'horizontal', className }: BTSeparatorProps) {
  const classes = ['bt-separator', `bt-separator--${orientation}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={classes}
    />
  );
}

BTSeparator.displayName = 'BTSeparator';
