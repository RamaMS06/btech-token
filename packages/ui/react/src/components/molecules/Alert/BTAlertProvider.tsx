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
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' };

function reducer(state: ActiveAlert[], action: Action): ActiveAlert[] {
  switch (action.type) {
    case 'ADD':    return [...state, action.alert];
    case 'REMOVE': return state.filter((a) => a.id !== action.id);
    case 'CLEAR':  return [];
    default:       return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function BTAlertProvider({ children }: { children: ReactNode }) {
  const [alerts, dispatch] = useReducer(reducer, []);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    dispatch({ type: 'REMOVE', id });
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
    dispatch({ type: 'CLEAR' });
  }, []);

  return (
    <BTAlertContext.Provider value={{ show, dismiss, dismissAll }}>
      {children}
      {createPortal(
        <div className="bt-alert-container" aria-live="polite" aria-atomic="false">
          <div className="bt-alert-container__inner">
            {alerts.map((alert) => (
              <BTAlert
                key={alert.id}
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
            ))}
          </div>
        </div>,
        document.body,
      )}
    </BTAlertContext.Provider>
  );
}
