/**
 * BTTooltipStep — type definitions shared between Vue and React.
 * Coachmark / pagination-step tooltip balloon.
 * Figma: https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=478-2463
 */

/** Navigation button style inside the step footer. */
export type BTTooltipStepVariant = 'button' | 'link' | 'centered';

/** Which side the arrow caret appears on. */
export type BTTooltipStepPosition = 'top' | 'bottom' | 'left' | 'right';

/** Arrow offset along its axis (same semantics as BTTooltipArrowPosition). */
export type BTTooltipStepArrowPosition =
  | 'left'
  | 'left-mid'
  | 'mid'
  | 'right-mid'
  | 'right';

export interface BTTooltipStepProps {
  /** Bold title shown at the top of the card. Hidden when omitted. */
  label?: string;
  /** Main description text. Required. */
  description: string;
  /** Step indicator text, e.g. "Step 1 of 5". Hidden when omitted. */
  stepLabel?: string;
  /**
   * Navigation button style.
   * - `button` (default) — secondary rounded buttons (Prev / Next).
   * - `link` — text-link buttons (grey Prev / blue Next).
   * - `centered` — icon-only chevron buttons flanking the step label.
   */
  stepVariant?: BTTooltipStepVariant;
  /**
   * Show a × close button in the top-right corner.
   * Clicking it fires `@close` / `onClose`. @default false
   */
  hasClose?: boolean;
  /** Prev button label. @default 'Prev' */
  prevLabel?: string;
  /** Next button label. @default 'Next' */
  nextLabel?: string;
  /** Which side the arrow caret renders on. @default 'top' */
  position?: BTTooltipStepPosition;
  /** Arrow offset along the axis. @default 'mid' */
  arrowPosition?: BTTooltipStepArrowPosition;
}
