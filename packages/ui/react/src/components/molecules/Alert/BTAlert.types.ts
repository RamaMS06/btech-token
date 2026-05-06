/**
 * BTAlert — Figma node 681:11285
 * https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=681-11285
 */

export type BTAlertVariant =
  | 'info'
  | 'success'
  | 'error'
  | 'warning'
  | 'neutral'
  | 'neutral-dark';

export interface BTAlertProps {
  /** Visual style of the alert. @default 'info' */
  variant?: BTAlertVariant;
  /** Primary alert message (required). Bold when `description` is present. */
  label: string;
  /** Optional supporting text below the label. */
  description?: string;
  /** Label for the optional action button / text link. */
  actionLabel?: string;
  /** Show a dismiss (×) button on the right. */
  dismissible?: boolean;
}
