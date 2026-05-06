/**
 * BTHint — notification indicator atom.
 *
 * Renders as a red dot or a red badge containing a count value.
 * Numbers > 99 are automatically clamped to "99+".
 *
 * @example
 * // Dot indicator (no count)
 * <BTHint />
 * <BTHint size="sm" />
 *
 * @example
 * // Count badge
 * <BTHint count={5} />
 * <BTHint count={22} size="md" />
 * <BTHint count={150} />  // renders "99+"
 */
import './BTHint.css';
import type { BTHintProps } from './BTHint.types';

export function BTHint({ count, size = 'lg', className }: BTHintProps) {
  const displayText: string | null =
    count === null || count === undefined
      ? null
      : count > 99
        ? '99+'
        : String(count);

  const isDot = displayText === null;
  const isOverflow = displayText === '99+';
  const isSingle = displayText !== null && displayText.length === 1;
  const isMulti = displayText !== null && displayText.length === 2;

  const classes = [
    'bt-hint',
    `bt-hint--${size}`,
    isDot ? 'bt-hint--dot' : 'bt-hint--count',
    isOverflow && 'bt-hint--overflow',
    isSingle && 'bt-hint--single',
    isMulti && 'bt-hint--multi',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} role="status" aria-label={displayText ?? 'notification'}>
      {!isDot && displayText}
    </span>
  );
}

BTHint.displayName = 'BTHint';
