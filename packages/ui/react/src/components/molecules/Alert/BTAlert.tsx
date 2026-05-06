/**
 * BTAlert — contextual feedback banner.
 *
 * Without description: `[icon] [label] [action-link?] [dismiss?]`
 * With description:    `[icon] [label + description] [action-btn?] [dismiss?]`
 *
 * @example
 * ```tsx
 * <BTAlert variant="success" label="Saved!" />
 * <BTAlert variant="error" label="Something went wrong"
 *   description="Please try again later."
 *   actionLabel="Retry" dismissible
 *   onAction={retry} onDismiss={hideAlert} />
 * ```
 */
import './BTAlert.css';
import type { BTAlertProps, BTAlertVariant } from './BTAlert.types';

// ── Icon SVG paths per variant (viewBox="0 0 16 16") ─────────────────────────

const ICONS: Record<BTAlertVariant, string> = {
  info: 'M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM8 4a.833.833 0 1 1 0 1.667A.833.833 0 0 1 8 4ZM7.333 6.667h1.334V11H7.333V6.667Z',
  success: 'M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM11.138 6.195 7.333 10l-2-2-.943.943 2.943 2.943 4.748-4.748-.943-.943Z',
  error: 'M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM7.333 4.667h1.334V9.5H7.333V4.667ZM8 10.833a.833.833 0 1 0 0 1.667.833.833 0 0 0 0-1.667Z',
  warning: 'M8.866 2.167a1 1 0 0 0-1.732 0L1.2 12.5A1 1 0 0 0 2.067 14h11.866A1 1 0 0 0 14.8 12.5L8.866 2.167ZM7.333 6.5h1.334v3.333H7.333V6.5ZM8 11.167a.833.833 0 1 0 0 1.666.833.833 0 0 0 0-1.666Z',
  neutral: 'M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM8 4a.833.833 0 1 1 0 1.667A.833.833 0 0 1 8 4ZM7.333 6.667h1.334V11H7.333V6.667Z',
  'neutral-dark': 'M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM8 4a.833.833 0 1 1 0 1.667A.833.833 0 0 1 8 4ZM7.333 6.667h1.334V11H7.333V6.667Z',
};

const CLOSE_PATH =
  'M12 4.667 11.333 4 8 7.333 4.667 4 4 4.667 7.333 8 4 11.333l.667.667L8 8.667 11.333 12l.667-.667L8.667 8 12 4.667Z';

// ── Component ─────────────────────────────────────────────────────────────────

export interface BTAlertReactProps extends BTAlertProps {
  /** Called when the action button / link is clicked. */
  onAction?: () => void;
  /** Called when the dismiss × button is clicked. */
  onDismiss?: () => void;
}

export function BTAlert({
  variant = 'info',
  label,
  description,
  actionLabel,
  dismissible = false,
  onAction,
  onDismiss,
}: BTAlertReactProps) {
  const hasDescription = Boolean(description);

  const rootClass = [
    'bt-alert',
    `bt-alert--${variant}`,
    hasDescription && 'bt-alert--with-description',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="alert">
      {/* Icon */}
      <span className="bt-alert__icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path fillRule="evenodd" clipRule="evenodd" d={ICONS[variant]} fill="currentColor" />
        </svg>
      </span>

      {/* Body */}
      <div className="bt-alert__body">
        <p className="bt-alert__label">{label}</p>
        {description && <p className="bt-alert__description">{description}</p>}
      </div>

      {/* Action — text link when no description */}
      {actionLabel && !hasDescription && (
        <button className="bt-alert__action-link" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}

      {/* Action — bordered button when description is present */}
      {actionLabel && hasDescription && (
        <button className="bt-alert__action-btn" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}

      {/* Dismiss */}
      {dismissible && (
        <button
          className="bt-alert__dismiss"
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d={CLOSE_PATH} fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  );
}

BTAlert.displayName = 'BTAlert';
