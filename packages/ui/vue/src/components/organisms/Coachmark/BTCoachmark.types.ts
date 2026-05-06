/**
 * BTCoachmarkTour — type definitions.
 *
 * A coachmark tour orchestrates a sequence of [BTTooltipStep] balloons
 * over a darkened backdrop with a spotlight cutout around the active
 * target. Each [BTCoachmarkStep] points at one element by `targetRef`.
 */
import type { Ref } from 'vue';
import type {
  BTTooltipStepPosition,
  BTTooltipStepVariant,
} from '../../molecules/TooltipStep/BTTooltipStep.types';

export interface BTCoachmarkStep {
  /** Vue ref to the DOM element that is the coachmark target. */
  targetRef: Ref<HTMLElement | null>;
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
