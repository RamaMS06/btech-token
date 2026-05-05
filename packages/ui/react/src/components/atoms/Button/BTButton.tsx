/**
 * BTButton — interactive action atom.
 * Figma source: node 114:2645.
 *
 * @example
 * ```tsx
 * // Primary (default)
 * <BTButton label="Save" onClick={handleSave} />
 *
 * // With left icon
 * <BTButton label="Upload" variant="secondary" leftIcon={<UploadIcon />} />
 *
 * // Icon only
 * <BTButton iconOnly variant="ghost" onClick={handleClose}>
 *   <CloseIcon />
 * </BTButton>
 *
 * // Disabled
 * <BTButton label="Submit" disabled />
 * ```
 */
import { forwardRef } from 'react';
import './BTButton.css';
import type { BTButtonProps } from './BTButton.types';

const BTButton = forwardRef<HTMLButtonElement, BTButtonProps>(
  (
    {
      variant = 'primary',
      size = 'default',
      disabled = false,
      iconOnly = false,
      label,
      leftIcon,
      rightIcon,
      children,
      className,
      ...rest
    },
    ref,
  ) => {
    const cls = [
      'bt-button',
      `bt-button--${variant}`,
      size === 'small' ? 'bt-button--small' : '',
      iconOnly ? 'bt-button--icon-only' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={cls} disabled={disabled} data-testid="bt-button" {...rest}>
        {iconOnly ? (
          children
        ) : (
          <>
            {leftIcon}
            {label && <span className="bt-button__label">{label}</span>}
            {rightIcon}
          </>
        )}
      </button>
    );
  },
);

BTButton.displayName = 'BTButton';

export { BTButton };
