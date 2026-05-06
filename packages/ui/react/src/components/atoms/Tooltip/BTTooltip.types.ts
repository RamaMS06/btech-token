/**
 * BTTooltip — type definitions shared between Vue and React.
 * Figma: https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=479-2624
 */

/** Which side of the trigger the tooltip balloon appears on. */
export type BTTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Where the arrow sits along its axis.
 * - `left` / `right`: ~17 px from the respective edge (Figma L / R positions).
 * - `left-mid` / `right-mid`: 25% / 75% along the axis.
 * - `mid` (default): 50% — centred.
 */
export type BTTooltipArrowPosition =
  | 'left'
  | 'left-mid'
  | 'mid'
  | 'right-mid'
  | 'right';

export interface BTTooltipProps {
  /** Plain-text content shown in the balloon. Use the `content` slot for rich content. */
  text?: string;
  /** Preferred placement relative to the trigger element. @default 'top' */
  position?: BTTooltipPosition;
  /** Arrow offset along the axis. @default 'mid' */
  arrowPosition?: BTTooltipArrowPosition;
  /** Disable the tooltip entirely (no show on hover). @default false */
  disabled?: boolean;
  /** Delay before the balloon appears (ms). @default 0 */
  showDelay?: number;
  /** Delay before the balloon hides (ms). @default 0 */
  hideDelay?: number;
}
