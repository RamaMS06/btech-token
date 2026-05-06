/**
 * Props for BTBadge.
 *
 * @example
 * <BTBadge label="Approved" variant="success" />
 * <BTBadge label="Draft" variant="draft" :reverseColors="true" />
 */
export interface BTBadgeProps {
  /** Text displayed inside the badge. @default 'Badge' */
  label?: string
  /**
   * Color palette variant. @default 'success'
   * success | waiting | neutral | draft | reject | custom
   */
  variant?: 'success' | 'waiting' | 'neutral' | 'draft' | 'reject' | 'custom'
  /** When true: solid background + white text. @default false */
  reverseColors?: boolean
}
