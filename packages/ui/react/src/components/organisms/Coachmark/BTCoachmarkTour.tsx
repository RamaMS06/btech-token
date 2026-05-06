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
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { BTTooltipStep } from '../../molecules/TooltipStep/BTTooltipStep';
import type { BTTooltipStepPosition } from '../../molecules/TooltipStep/BTTooltipStep.types';
import type { BTCoachmarkStep, BTCoachmarkTourProps } from './BTCoachmark.types';
import './BTCoachmarkTour.css';

// ── Layout constants (must match BTCoachmarkController in Flutter) ─────────

const BALLOON_W = 320;
const BALLOON_H_EST = 160; // first-pass estimate; actual measured via balloonRef
const ARROW = 8;
const GAP = 10; // SPOTLIGHT_PAD(4) + visual gap(6)
const SPOTLIGHT_PAD = 4;

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Layout {
  pos: BTTooltipStepPosition;
  top: number; // all positions use top; 2-pass corrects with actual height
  left: number;
  arrowOffset: string;
  spotlight: SpotlightRect;
}

function autoPosition(rect: DOMRect): BTTooltipStepPosition {
  const cy = rect.top + rect.height / 2;
  return cy > window.innerHeight * 0.6 ? 'top' : 'bottom';
}

function computeLayout(stepDef: BTCoachmarkStep, actualH?: number): Layout | null {
  const target = stepDef.targetRef.current;
  if (!target) return null;
  const rect = target.getBoundingClientRect();

  const pos = stepDef.position ?? autoPosition(rect);
  const tcx = rect.left + rect.width / 2;
  const tcy = rect.top + rect.height / 2;
  const spotlight = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

  switch (pos) {
    case 'top': {
      // 2-pass: arrow tip = balloon BOTTOM = rect.top − GAP.
      // top = balloon bottom − h = rect.top − GAP − h.
      const left = Math.max(8, Math.min(tcx - BALLOON_W / 2, window.innerWidth - BALLOON_W - 8));
      const h = actualH ?? BALLOON_H_EST;
      const top = Math.max(8, rect.top - GAP - h);
      return { pos, top, left, arrowOffset: `${tcx - left}px`, spotlight };
    }
    case 'bottom': {
      const left = Math.max(8, Math.min(tcx - BALLOON_W / 2, window.innerWidth - BALLOON_W - 8));
      const top = rect.bottom + GAP;
      return { pos, top, left, arrowOffset: `${tcx - left}px`, spotlight };
    }
    case 'left': {
      const left = Math.max(8, Math.min(rect.left - BALLOON_W - ARROW - GAP, window.innerWidth - BALLOON_W - 8));
      const h = actualH ?? BALLOON_H_EST;
      const top = Math.max(8, Math.min(tcy - h / 2, window.innerHeight - h - 8));
      return { pos, top, left, arrowOffset: `${tcy - top}px`, spotlight };
    }
    case 'right': {
      const left = Math.max(8, Math.min(rect.right + GAP, window.innerWidth - BALLOON_W - 8));
      const h = actualH ?? BALLOON_H_EST;
      const top = Math.max(8, Math.min(tcy - h / 2, window.innerHeight - h - 8));
      return { pos, top, left, arrowOffset: `${tcy - top}px`, spotlight };
    }
  }
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
  // Ref to the balloon wrapper — used for 2-pass height measurement (left/right).
  const balloonRef = useRef<HTMLDivElement>(null);

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
    // Pass 1: first frame — target ref is populated, compute with estimate.
    const id1 = window.requestAnimationFrame(() => {
      const l = computeLayout(def);
      setLayout(l);

      // Pass 2 (top / left / right): after balloon renders with the estimate,
      // read its actual height and recompute for accurate positioning.
      // • top    → exact top = rect.top − GAP − h (arrow-tip anchored)
      // • left/right → correct vertical centering
      if (l?.pos !== 'bottom') {
        const id2 = window.requestAnimationFrame(() => {
          const h = balloonRef.current?.offsetHeight;
          if (h) setLayout(computeLayout(def, h));
        });
        return () => window.cancelAnimationFrame(id2);
      }
      return undefined;
    });
    return () => window.cancelAnimationFrame(id1);
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
      <div key={`bt-coachmark-step-${step}`} ref={balloonRef} style={stepWrapperStyle}>
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
