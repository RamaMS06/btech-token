/**
 * BTModal — type definitions.
 *
 * A centred modal dialog with a header (title + optional subtext + optional
 * close button), an optional content slot, and an optional footer with
 * checkbox + secondary/primary actions. Backdrop overlay with click-to-
 * dismiss when [dismissable] is true.
 */

/** Width preset — sm = 500 px, md = 720 px, lg = 1042 px. */
export type BTModalSize = 'sm' | 'md' | 'lg';

export interface BTModalProps {
  /** Whether the modal is visible. */
  open: boolean;
  /** Bold title shown at the top of the header. */
  title: string;
  /** Optional supporting text shown below the title. */
  subtext?: string;
  /** Width preset. @default 'sm' */
  size?: BTModalSize;
  /** Show the X button in the top-right of the header. @default true */
  hasClose?: boolean;
  /** Show the footer section. @default true */
  hasFooter?: boolean;
  /** Label for the right-most primary action button. @default 'Confirm' */
  primaryLabel?: string;
  /** Show the secondary (cancel) button next to the primary one. @default true */
  hasSecondaryButton?: boolean;
  /** Label for the secondary action button. @default 'Cancel' */
  secondaryLabel?: string;
  /** Show a checkbox at the left of the footer. @default false */
  hasCheckbox?: boolean;
  /** Label rendered next to the footer checkbox. @default "Don't show again" */
  checkboxLabel?: string;
  /** Click on backdrop closes the modal. @default true */
  dismissable?: boolean;
}
