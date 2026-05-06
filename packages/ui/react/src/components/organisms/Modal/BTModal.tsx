/**
 * BTModal — centred dialog with backdrop, header, optional content, footer.
 *
 * Figma: D-Modal 2123:1992 (web) · M-Modal 2124:2190 (mobile).
 *
 * @example
 * ```tsx
 * import { useState } from 'react';
 * import { BTModal } from '@btech/ui-react';
 *
 * export function Example() {
 *   const [open, setOpen] = useState(false);
 *   return (
 *     <>
 *       <button onClick={() => setOpen(true)}>Open</button>
 *       <BTModal
 *         open={open}
 *         title="Confirm action"
 *         subtext="Are you sure you want to continue?"
 *         size="md"
 *         onPrimary={() => setOpen(false)}
 *         onSecondary={() => setOpen(false)}
 *         onClose={() => setOpen(false)}
 *       >
 *         <p>Optional content goes here.</p>
 *       </BTModal>
 *     </>
 *   );
 * }
 * ```
 */
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './BTModal.css';
import type { BTModalProps } from './BTModal.types';

interface BTModalReactProps extends BTModalProps {
  children?: ReactNode;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onClose?: () => void;
  onCheckbox?: (checked: boolean) => void;
}

export function BTModal({
  open,
  title,
  subtext,
  size = 'sm',
  hasClose = true,
  hasFooter = true,
  primaryLabel = 'Confirm',
  hasSecondaryButton = true,
  secondaryLabel = 'Cancel',
  hasCheckbox = false,
  checkboxLabel = "Don't show again",
  dismissable = true,
  children,
  onPrimary,
  onSecondary,
  onClose,
  onCheckbox,
}: BTModalReactProps) {
  const [checked, setChecked] = useState(false);

  // ── Body scroll lock ─────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [open]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const close = (): void => {
    onClose?.();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target !== e.currentTarget) return;
    if (dismissable) close();
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setChecked(e.target.checked);
    onCheckbox?.(e.target.checked);
  };

  return createPortal(
    <div
      className="bt-modal-backdrop bt-modal-backdrop--animated"
      onClick={handleBackdropClick}
    >
      <div className={`bt-modal-panel bt-modal-panel--${size}`} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="bt-modal-header">
          <h2 className="bt-modal-title">{title}</h2>
          {subtext && <p className="bt-modal-subtext">{subtext}</p>}
          {hasClose && (
            <button
              type="button"
              className="bt-modal-close"
              aria-label="Close"
              onClick={close}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Optional content */}
        {children && <div className="bt-modal-content">{children}</div>}

        {/* Footer */}
        {hasFooter && (
          <div className="bt-modal-footer">
            {hasCheckbox && (
              <div className="bt-modal-footer__left">
                <input
                  id="bt-modal-checkbox"
                  type="checkbox"
                  className="bt-modal-footer__checkbox"
                  checked={checked}
                  onChange={handleCheckboxChange}
                />
                <label htmlFor="bt-modal-checkbox" className="bt-modal-footer__checkbox-label">
                  {checkboxLabel}
                </label>
              </div>
            )}
            {hasSecondaryButton && (
              <button
                type="button"
                className="bt-modal-btn bt-modal-btn--secondary"
                onClick={() => onSecondary?.()}
              >
                {secondaryLabel}
              </button>
            )}
            <button
              type="button"
              className="bt-modal-btn bt-modal-btn--primary"
              onClick={() => onPrimary?.()}
            >
              {primaryLabel}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
