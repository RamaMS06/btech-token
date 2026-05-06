/**
 * BTAlertProvider — context + portal for programmatic alerts.
 *
 * Wrap your app once:
 * ```tsx
 * <BTAlertProvider>
 *   <App />
 * </BTAlertProvider>
 * ```
 * Then anywhere: `const { show } = useAlert();`
 */
import {
  createContext,
  useCallback,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { BTAlert } from './BTAlert';
import './BTAlert.css';
import './BTAlertContainer.css';
import type { BTAlertVariant } from './BTAlert.types';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ShowAlertOptions {
  variant?: BTAlertVariant;
  label: string;
  description?: string;
  linkLabel?: string;
  actionLabel?: string;
  dismissible?: boolean;
  /** Auto-dismiss after this many ms. 0 = never. @default 5000 */
  duration?: number;
  onAction?: () => void;
  onLink?: () => void;
}

interface ActiveAlert extends ShowAlertOptions {
  id: string;
  exiting?: boolean;
}

interface AlertContextValue {
  show: (options: ShowAlertOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

export const BTAlertContext = createContext<AlertContextValue | null>(null);

// ── Reducer ───────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD'; alert: ActiveAlert }
  | { type: 'MARK_EXITING'; id: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' };

function reducer(state: ActiveAlert[], action: Action): ActiveAlert[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.alert];
    case 'MARK_EXITING':
      return state.map((a) => (a.id === action.id ? { ...a, exiting: true } : a));
    case 'REMOVE':
      return state.filter((a) => a.id !== action.id);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function BTAlertProvider({ children }: { children: ReactNode }) {
  const [alerts, dispatch] = useReducer(reducer, []);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    // Cancel any auto-dismiss timer first
    const t = timers.current.get(id);
    if (t) clearTimeout(t);

    // Mark as exiting so the CSS exit animation plays
    dispatch({ type: 'MARK_EXITING', id });

    // Remove from state after the exit animation finishes (220ms)
    timers.current.set(
      id,
      setTimeout(() => {
        dispatch({ type: 'REMOVE', id });
        timers.current.delete(id);
      }, 240),
    );
  }, []);

  const show = useCallback(
    (options: ShowAlertOptions): string => {
      const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      dispatch({ type: 'ADD', alert: { variant: 'info', dismissible: true, ...options, id } });
      const duration = options.duration ?? 5000;
      if (duration > 0) {
        timers.current.set(id, setTimeout(() => dismiss(id), duration));
      }
      return id;
    },
    [dismiss],
  );

  const dismissAll = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current.clear();
    // Mark all as exiting, then clear after animation
    dispatch({ type: 'CLEAR' });
  }, []);

  return (
    <BTAlertContext.Provider value={{ show, dismiss, dismissAll }}>
      {children}
      {createPortal(
        <div className="bt-alert-container" aria-live="polite" aria-atomic="false">
          <div className="bt-alert-container__inner">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bt-alert-item${alert.exiting ? ' bt-alert-item--exiting' : ''}`}
              >
                <BTAlert
                  variant={alert.variant}
                  label={alert.label}
                  description={alert.description}
                  linkLabel={alert.linkLabel}
                  actionLabel={alert.actionLabel}
                  dismissible={alert.dismissible ?? true}
                  onAction={alert.onAction}
                  onLink={alert.onLink}
                  onDismiss={() => dismiss(alert.id)}
                />
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </BTAlertContext.Provider>
  );
}
