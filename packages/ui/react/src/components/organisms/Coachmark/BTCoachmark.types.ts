/**
 * BTCoachmarkTour — type definitions.
 *
 * A coachmark tour orchestrates a sequence of [BTTooltipStep] balloons
 * over a darkened backdrop with a spotlight cutout around the active
 * target. Each [BTCoachmarkStep] points at one element by `targetRef`.
 */
import type { RefObject } from 'react';
import type {
  BTTooltipStepPosition,
  BTTooltipStepVariant,
} from '../../molecules/TooltipStep/BTTooltipStep.types';

export interface BTCoachmarkStep {
  /** React ref to the DOM element that is the coachmark target. */
  targetRef: RefObject<HTMLElement | null>;
  /** Optional bold title shown at top of the balloon. */
  label?: string;
  /** Description text (required). */
  description: string;
  /** Step indicator, e.g. "Step 1 of 3". */
  stepLabel?: string;
  /** Footer navigation variant. Defaults to the tour-level value. */
  stepVariant?: BTTooltipStepVariant;
  /** Balloon position. Auto-detected when omitted. */
  position?: BTTooltipStepPosition;
  /** Per-step override for the prev button label. */
  prevLabel?: string;
  /** Per-step override for the next button label. */
  nextLabel?: string;
}

export interface BTCoachmarkTourProps {
  steps: BTCoachmarkStep[];
  /** Current step index. -1 = hidden. */
  step: number;
  /** Click backdrop to dismiss. @default true */
  dismissable?: boolean;
  /** Tour-level default footer variant. @default 'button' */
  stepVariant?: BTTooltipStepVariant;
  /** Tour-level default prev label. @default 'Prev' */
  prevLabel?: string;
  /** Tour-level default next label. @default 'Next' */
  nextLabel?: string;
  /** Called whenever the active step changes (including -1 on close). */
  onStepChange: (step: number) => void;
  /** Fires when the tour completes or is dismissed. */
  onFinish?: () => void;
}
