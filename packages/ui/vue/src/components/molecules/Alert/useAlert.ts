/**
 * useAlert — programmatic alert / notification system for Vue 3.
 *
 * Singleton module-level reactive state (no Provider needed).
 * Mount <BTAlertContainer /> once at app root to render the queue.
 *
 * @example
 * ```ts
 * const { show } = useAlert();
 * show({ variant: 'success', label: 'Saved!' });
 * show({ variant: 'error', label: 'Failed', description: 'Try again', duration: 0 });
 * ```
 */
import { reactive, readonly } from 'vue';
import type { BTAlertVariant } from './BTAlert.types';

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

export interface ActiveAlert extends ShowAlertOptions {
  id: string;
}

// Module-level reactive store — singleton, no Provider pattern needed in Vue
const _state = reactive<{ alerts: ActiveAlert[] }>({ alerts: [] });

function show(options: ShowAlertOptions): string {
  const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  _state.alerts.push({ variant: 'info', dismissible: true, ...options, id });

  const duration = options.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => dismiss(id), duration);
  }
  return id;
}

function dismiss(id: string): void {
  const idx = _state.alerts.findIndex((a) => a.id === id);
  if (idx !== -1) _state.alerts.splice(idx, 1);
}

function dismissAll(): void {
  _state.alerts.splice(0, _state.alerts.length);
}

export function useAlert() {
  return {
    alerts: readonly(_state.alerts),
    show,
    dismiss,
    dismissAll,
  };
}
