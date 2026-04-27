/**
 * ConfirmDialog — generic destructive-action confirmation modal
 * --------------------------------------------------------------
 * A small focused modal whose only job is to make the designer pause before
 * an irreversible action. Currently used by:
 *   - "Clear changes" in BottomActionBar (revert all dirty sets)
 *   - Tenant switching when there are unsaved changes (ThemeSwitcher)
 *
 * The component is presentational only — it renders the chrome and emits
 * `onConfirm` / `onClose`. Owners decide what "confirmed" means.
 *
 * Conventions:
 *   - The default button styling is danger-red so the destructive intent is
 *     unmistakable; pass `tone="default"` for non-destructive confirms.
 *   - Cancel is the visually quieter button on the LEFT and is the default
 *     keyboard focus target so misclicks land on the safer choice.
 *   - The overlay catches outside clicks the same way as TokenEditor's modal,
 *     i.e. `e.target === e.currentTarget` so clicks inside the dialog don't
 *     close it.
 */

import React, { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  title: string;
  /** Body text. Plain string or pre-formatted React content. */
  body: React.ReactNode;
  /** Label for the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the cancel button. Defaults to "Cancel". */
  cancelLabel?: string;
  /**
   * Visual tone of the confirm button.
   *  - "danger"  (default) — destructive red treatment
   *  - "default"           — neutral primary treatment
   */
  tone?: 'danger' | 'default';
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  // Focus the cancel button on mount — the safer default for destructive confirms
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);

  // Esc closes. Enter is intentionally NOT bound globally — pressing Enter
  // while the cancel button has focus would otherwise fire BOTH the button's
  // native click (cancel) AND this handler (confirm), which the user
  // experiences as "the button does nothing" because the modal closes
  // immediately after attempting the destructive action. Native button
  // activation handles Enter on whichever button is focused, which is the
  // correct, predictable behaviour.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal
        aria-labelledby="confirm-dialog__title"
      >
        <h2 id="confirm-dialog__title" className="confirm-dialog__title">{title}</h2>
        <div className="confirm-dialog__body">{body}</div>
        <div className="confirm-dialog__footer">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
