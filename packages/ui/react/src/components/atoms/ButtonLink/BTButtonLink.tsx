/**
 * BTButtonLink — inline hyperlink-style action atom.
 * Figma source: node 480:3197.
 *
 * @example
 * ```tsx
 * // Primary (default)
 * <BTButtonLink label="View details" onClick={goToDetails} />
 *
 * // With left icon
 * <BTButtonLink
 *   label="Cancel"
 *   variant="secondary"
 *   leftIcon={<CloseIcon />}
 *   disabled={loading}
 *   onClick={handleCancel}
 * />
 *
 * // Invert — for dark surfaces
 * <BTButtonLink label="Learn more" variant="invert" onClick={openUrl} />
 * ```
 */
import './BTButtonLink.css';
import type { BTButtonLinkProps } from './BTButtonLink.types';

export function BTButtonLink({
  label,
  variant = 'primary',
  leftIcon,
  rightIcon,
  disabled,
  className,
  ...rest
}: BTButtonLinkProps) {
  return (
    <button
      type="button"
      className={[
        'bt-button-link',
        `bt-button-link--${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={disabled}
      data-testid="bt-button-link"
      {...rest}
    >
      {leftIcon}
      <span className="bt-button-link__label">{label}</span>
      {rightIcon}
    </button>
  );
}

BTButtonLink.displayName = 'BTButtonLink';
