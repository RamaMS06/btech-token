/**
 * BTCoachmarkTour — multi-step coachmark / onboarding overlay.
 *
 * Renders a darkened backdrop with a spotlight cutout around the
 * current step's target, plus a positioned [BTTooltipStep] balloon
 * that fades / scales in. Controlled via the `step` prop.
 *
 * @example
 * ```tsx
 * const [tourStep, setTourStep] = useState(-1);
 * const ref0 = useRef<HTMLButtonElement | null>(null);
 *
 * const steps: BTCoachmarkStep[] = [
 *   { targetRef: ref0, description: 'Mulai di sini.', position: 'bottom' },
 * ];
 *
 * <BTCoachmarkTour
 *   steps={steps}
 *   step={tourStep}
 *   onStepChange={setTourStep}
 *   onFinish={() => setTourStep(-1)}
 * />
 * ```
 */
import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { BTTooltipStep } from '../../molecules/TooltipStep/BTTooltipStep';
import type { BTTooltipStepPosition } from '../../molecules/TooltipStep/BTTooltipStep.types';
import type { BTCoachmarkStep, BTCoachmarkTourProps } from './BTCoachmark.types';
import './BTCoachmarkTour.css';

// ── Layout constants (must match BTCoachmarkController in Flutter) ─────────

const BALLOON_W = 320;
const BALLOON_H = 160;
const ARROW = 8;
const GAP = 2;
const SPOTLIGHT_PAD = 4;

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Layout {
  pos: BTTooltipStepPosition;
  top: number;
  left: number;
  arrowOffset: string;
  spotlight: SpotlightRect;
}

function autoPosition(rect: DOMRect): BTTooltipStepPosition {
  const cy = rect.top + rect.height / 2;
  return cy > window.innerHeight * 0.6 ? 'top' : 'bottom';
}

function computeLayout(stepDef: BTCoachmarkStep): Layout | null {
  const target = stepDef.targetRef.current;
  if (!target) return null;
  const rect = target.getBoundingClientRect();

  const pos = stepDef.position ?? autoPosition(rect);
  const tcx = rect.left + rect.width / 2;
  const tcy = rect.top + rect.height / 2;

  let top = 0;
  let left = 0;
  switch (pos) {
    case 'top':
      top  = rect.top - BALLOON_H - ARROW - GAP;
      left = tcx - BALLOON_W / 2;
      break;
    case 'bottom':
      top  = rect.bottom + GAP;
      left = tcx - BALLOON_W / 2;
      break;
    case 'left':
      top  = tcy - BALLOON_H / 2;
      left = rect.left - BALLOON_W - ARROW - GAP;
      break;
    case 'right':
      top  = tcy - BALLOON_H / 2;
      left = rect.right + GAP;
      break;
  }

  left = Math.max(8, Math.min(left, window.innerWidth  - BALLOON_W - 8));
  top  = Math.max(8, Math.min(top,  window.innerHeight - BALLOON_H - 8));

  const arrowOffset = (pos === 'left' || pos === 'right') ? tcy - top : tcx - left;

  return {
    pos,
    top,
    left,
    arrowOffset: `${arrowOffset}px`,
    spotlight: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
  };
}

export function BTCoachmarkTour({
  steps,
  step,
  dismissable = true,
  stepVariant = 'button',
  prevLabel = 'Prev',
  nextLabel = 'Next',
  onStepChange,
  onFinish,
}: BTCoachmarkTourProps) {
  const [layout, setLayout] = useState<Layout | null>(null);

  const visible = step >= 0 && step < steps.length;

  useEffect(() => {
    if (!visible) {
      setLayout(null);
      return;
    }
    const def = steps[step];
    if (!def) {
      setLayout(null);
      return;
    }
    // Defer to next frame so the target ref is populated/measured.
    const id = window.requestAnimationFrame(() => {
      setLayout(computeLayout(def));
    });
    return () => window.cancelAnimationFrame(id);
  }, [step, steps, visible]);

  if (!visible || !layout) return null;

  const close = (): void => {
    onStepChange(-1);
    onFinish?.();
  };

  const backdropClick = (): void => {
    if (dismissable) close();
  };

  const goPrev = (): void => {
    if (step > 0) onStepChange(step - 1);
    else close();
  };

  const goNext = (): void => {
    if (step < steps.length - 1) onStepChange(step + 1);
    else close();
  };

  const activeStep = steps[step];
  if (!activeStep) return null;
  const sl = layout.spotlight;

  const backdropStyle: CSSProperties = {
    position: 'fixed',
    top:    sl.top    - SPOTLIGHT_PAD,
    left:   sl.left   - SPOTLIGHT_PAD,
    width:  sl.width  + SPOTLIGHT_PAD * 2,
    height: sl.height + SPOTLIGHT_PAD * 2,
    borderRadius: 5,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
    zIndex: 9000,
    cursor: dismissable ? 'pointer' : 'default',
  };

  const stepWrapperStyle: CSSProperties = {
    position: 'fixed',
    top: layout.top,
    left: layout.left,
    zIndex: 9001,
    pointerEvents: 'all',
    animation: 'bt-coachmark-in 0.18s ease forwards',
  };

  return createPortal(
    <>
      <div style={backdropStyle} onClick={backdropClick} />
      <div key={`bt-coachmark-step-${step}`} style={stepWrapperStyle}>
        <BTTooltipStep
          label={activeStep.label}
          description={activeStep.description}
          stepLabel={activeStep.stepLabel}
          stepVariant={activeStep.stepVariant ?? stepVariant}
          hasClose
          prevLabel={activeStep.prevLabel ?? prevLabel}
          nextLabel={activeStep.nextLabel ?? nextLabel}
          position={layout.pos}
          arrowOffset={layout.arrowOffset}
          onPrev={goPrev}
          onNext={goNext}
          onClose={close}
        />
      </div>
    </>,
    document.body,
  );
}
