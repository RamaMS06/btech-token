/**
 * Props for {@link BTBadge}.
 *
 * @example
 * ```tsx
 * <BTBadge label="Approved" variant="success" />
 * <BTBadge label="Draft" variant="draft" reverseColors />
 * <BTBadge label="Waiting" variant="waiting" leftIcon={<ClockIcon />} />
 * ```
 */
export interface BTBadgeProps {
  /** Text displayed inside the badge. @default 'Badge' */
  label?: string;
  /**
   * Color palette variant.
   * @default 'success'
   */
  variant?: 'success' | 'waiting' | 'neutral' | 'draft' | 'reject' | 'custom';
  /** When `true`: solid background + white text. @default false */
  reverseColors?: boolean;
  /** Optional 16×16 node rendered to the left of the label. */
  leftIcon?: React.ReactNode;
  /** Optional 16×16 node rendered to the right of the label. */
  rightIcon?: React.ReactNode;
  /** Additional CSS class names. */
  className?: string;
}
