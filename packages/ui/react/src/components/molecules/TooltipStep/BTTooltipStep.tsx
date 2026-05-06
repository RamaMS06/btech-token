/**
 * BTTooltipStep — coachmark / pagination-step balloon.
 *
 * Figma: https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=478-2463
 *
 * @example
 * ```tsx
 * <BTTooltipStep
 *   label="Fitur Baru"
 *   description="Klik tombol ini untuk memulai."
 *   stepLabel="Step 1 of 3"
 *   stepVariant="button"
 *   hasClose
 *   prevLabel="Kembali"
 *   nextLabel="Selanjutnya"
 *   position="bottom"
 *   onPrev={goPrev}
 *   onNext={goNext}
 *   onClose={endTour}
 * />
 * ```
 */
import { type ReactNode, type CSSProperties } from 'react';
import type {
  BTTooltipStepVariant,
  BTTooltipStepPosition,
  BTTooltipStepArrowPosition,
} from './BTTooltipStep.types';
import './BTTooltipStep.css';

export interface BTTooltipStepReactProps {
  label?: string;
  description: string;
  stepLabel?: string;
  stepVariant?: BTTooltipStepVariant;
  hasClose?: boolean;
  prevLabel?: string;
  nextLabel?: string;
  position?: BTTooltipStepPosition;
  arrowPosition?: BTTooltipStepArrowPosition;
  /**
   * Optional dynamic arrow offset (e.g. "120px") — overrides the
   * arrowPosition enum when provided.  Used by coachmark overlays that
   * compute the exact trigger-centre distance after viewport clamping.
   */
  arrowOffset?: string;
  /** Rich content rendered between description and footer. */
  children?: ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
  onClose?: () => void;
}

function getArrowPath(position: BTTooltipStepPosition): string {
  switch (position) {
    case 'bottom': return 'M0 8 L7 1 Q8 0 9 1 L16 8 Z';
    case 'left':   return 'M0 0 L7 7 Q8 8 7 9 L0 16 Z';
    case 'right':  return 'M8 0 L1 7 Q0 8 1 9 L8 16 Z';
    case 'top':
    default:       return 'M0 0 L7 7 Q8 8 9 7 L16 0 Z';
  }
}

export function BTTooltipStep({
  label,
  description,
  stepLabel,
  stepVariant = 'button',
  hasClose = false,
  prevLabel = 'Prev',
  nextLabel = 'Next',
  position = 'top',
  arrowPosition = 'mid',
  arrowOffset,
  children,
  onPrev,
  onNext,
  onClose,
}: BTTooltipStepReactProps) {
  const isHorizontal = position === 'left' || position === 'right';
  const arrowPath = getArrowPath(position);
  const arrowViewBox = isHorizontal ? '0 0 8 16' : '0 0 16 8';
  const arrowW = isHorizontal ? 8 : 16;
  const arrowH = isHorizontal ? 16 : 8;
  const hasHeader = !!(label || hasClose);
  const hasFooter = !!(stepLabel || stepVariant);

  const arrowSvg = (
    <svg className="bt-tooltip-step__arrow" width={arrowW} height={arrowH} viewBox={arrowViewBox} fill="none" aria-hidden="true">
      <path d={arrowPath} fill="var(--bg-inverse)" />
    </svg>
  );

  const arrowRowClass = `bt-tooltip-step__arrow-row bt-tooltip-step__arrow-row--${arrowPosition}`;
  const arrowColClass = `bt-tooltip-step__arrow-col bt-tooltip-step__arrow-col--${arrowPosition}`;

  return (
    <div
      className={`bt-tooltip-step bt-tooltip-step--${position}`}
      role="dialog"
      aria-modal={false}
    >
      {/* Arrow — arrowOffset prop overrides enum-based --bt-arrow-offset */}
      {!isHorizontal ? (
        <div
          className={arrowRowClass}
          style={arrowOffset ? { '--bt-arrow-offset': arrowOffset } as CSSProperties : undefined}
        >
          {arrowSvg}
        </div>
      ) : (
        <div
          className={arrowColClass}
          style={arrowOffset ? { '--bt-arrow-offset': arrowOffset } as CSSProperties : undefined}
        >
          {arrowSvg}
        </div>
      )}

      {/* Body card */}
      <div className="bt-tooltip-step__body">
        {/* Header */}
        {hasHeader && (
          <div className="bt-tooltip-step__header">
            {label && <p className="bt-tooltip-step__label">{label}</p>}
            {!label && hasClose && <div style={{ flex: 1 }} />}
            {hasClose && (
              <button
                className="bt-tooltip-step__close"
                type="button"
                aria-label="Tutup"
                onClick={onClose}
              >
                <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path
                    d="M14 4L4 14M4 4l10 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Description */}
        <p className="bt-tooltip-step__description">{description}</p>

        {/* Rich content slot */}
        {children}

        {/* Footer */}
        {hasFooter && (
          <div
            className={`bt-tooltip-step__footer${
              stepVariant === 'centered' ? ' bt-tooltip-step__footer--centered' : ''
            }`}
          >
            {/* ── button variant ── */}
            {stepVariant === 'button' && (
              <>
                {stepLabel && (
                  <p className="bt-tooltip-step__step-label">{stepLabel}</p>
                )}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button className="bt-tooltip-step__btn" type="button" onClick={onPrev}>
                    {prevLabel}
                  </button>
                  <button className="bt-tooltip-step__btn" type="button" onClick={onNext}>
                    {nextLabel}
                  </button>
                </div>
              </>
            )}

            {/* ── link variant ── */}
            {stepVariant === 'link' && (
              <>
                {stepLabel && (
                  <p className="bt-tooltip-step__step-label">{stepLabel}</p>
                )}
                <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                  <button
                    className="bt-tooltip-step__btn-link bt-tooltip-step__btn-link--prev"
                    type="button"
                    onClick={onPrev}
                  >
                    {prevLabel}
                  </button>
                  <button
                    className="bt-tooltip-step__btn-link bt-tooltip-step__btn-link--next"
                    type="button"
                    onClick={onNext}
                  >
                    {nextLabel}
                  </button>
                </div>
              </>
            )}

            {/* ── centered variant ── */}
            {stepVariant === 'centered' && (
              <>
                <button
                  className="bt-tooltip-step__btn-icon"
                  type="button"
                  aria-label="Sebelumnya"
                  onClick={onPrev}
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M10 12L6 8l4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {stepLabel && (
                  <p className="bt-tooltip-step__step-label">{stepLabel}</p>
                )}
                <button
                  className="bt-tooltip-step__btn-icon"
                  type="button"
                  aria-label="Selanjutnya"
                  onClick={onNext}
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M6 12l4-4-4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
