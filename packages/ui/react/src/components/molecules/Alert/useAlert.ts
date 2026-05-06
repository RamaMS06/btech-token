/**
 * useAlert — access the programmatic alert queue.
 * Must be used inside <BTAlertProvider>.
 *
 * @example
 * ```tsx
 * const { show } = useAlert();
 * show({ variant: 'success', label: 'Saved!' });
 * ```
 */
import { useContext } from 'react';
import { BTAlertContext } from './BTAlertProvider';

export function useAlert() {
  const ctx = useContext(BTAlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used inside <BTAlertProvider>.');
  }
  return ctx;
}
