/**
 * BTTooltip — hover tooltip wrapping a trigger element.
 *
 * Figma: https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=479-2624
 *
 * @example
 * ```tsx
 * <BTTooltip text="Klik untuk menyimpan" position="top">
 *   <BTButton>Simpan</BTButton>
 * </BTTooltip>
 *
 * // Rich content
 * <BTTooltip position="bottom" arrowPosition="left" content={<strong>Bold tip</strong>}>
 *   <span>Hover me</span>
 * </BTTooltip>
 * ```
 */
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type MouseEvent,
  type FocusEvent,
} from 'react';
import { createPortal } from 'react-dom';
import type { BTTooltipPosition, BTTooltipArrowPosition } from './BTTooltip.types';
import './BTTooltip.css';

export interface BTTooltipReactProps {
  /** Plain-text content. Use `content` prop for rich JSX. */
  text?: string;
  /** Rich JSX content — overrides `text`. */
  content?: ReactNode;
  /** Preferred placement relative to trigger. @default 'top' */
  position?: BTTooltipPosition;
  /** Arrow offset along the axis. @default 'mid' */
  arrowPosition?: BTTooltipArrowPosition;
  /** Disable tooltip. @default false */
  disabled?: boolean;
  /** Delay before show (ms). @default 0 */
  showDelay?: number;
  /** Delay before hide (ms). @default 0 */
  hideDelay?: number;
  /** Trigger element (required). */
  children: ReactNode;
  /** Called when the tooltip becomes visible. */
  onShow?: () => void;
  /** Called when the tooltip hides. */
  onHide?: () => void;
}

const GAP = 4;

function arrowFraction(ap: BTTooltipArrowPosition): number {
  const map: Record<BTTooltipArrowPosition, number> = {
    left: 17 / 320,
    'left-mid': 0.25,
    mid: 0.5,
    'right-mid': 0.75,
    right: (320 - 17) / 320,
  };
  return map[ap] ?? 0.5;
}

function getArrowPath(position: BTTooltipPosition): string {
  switch (position) {
    case 'bottom': return 'M0 8 L7 1 Q8 0 9 1 L16 8 Z';
    case 'left':   return 'M0 0 L7 7 Q8 8 7 9 L0 16 Z';
    case 'right':  return 'M8 0 L1 7 Q0 8 1 9 L8 16 Z';
    case 'top':
    default:       return 'M0 0 L7 7 Q8 8 9 7 L16 0 Z';
  }
}

export function BTTooltip({
  text,
  content,
  position = 'top',
  arrowPosition = 'mid',
  disabled = false,
  showDelay = 0,
  hideDelay = 0,
  children,
  onShow,
  onHide,
}: BTTooltipReactProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const balloonRef = useRef<HTMLDivElement>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isHorizontal = position === 'left' || position === 'right';
  const arrowPath = getArrowPath(position);
  const arrowViewBox = isHorizontal ? '0 0 8 16' : '0 0 16 8';
  const arrowW = isHorizontal ? 8 : 16;
  const arrowH = isHorizontal ? 16 : 8;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const balloon = balloonRef.current;
    if (!trigger || !balloon) return;

    const tr = trigger.getBoundingClientRect();
    const bw = balloon.offsetWidth;
    const bh = balloon.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const af = arrowFraction(arrowPosition);

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = tr.bottom + GAP;
        left = tr.left + tr.width / 2 - bw * af;
        break;
      case 'left':
        top = tr.top + tr.height / 2 - bh * af;
        left = tr.left - bw - GAP;
        break;
      case 'right':
        top = tr.top + tr.height / 2 - bh * af;
        left = tr.right + GAP;
        break;
      case 'top':
      default:
        top = tr.top - bh - GAP;
        left = tr.left + tr.width / 2 - bw * af;
        break;
    }

    left = Math.max(8, Math.min(left, vw - bw - 8));
    top = Math.max(8, Math.min(top, vh - bh - 8));

    balloon.style.top = `${top}px`;
    balloon.style.left = `${left}px`;
  }, [position, arrowPosition]);

  const show = useCallback(() => {
    if (disabled) return;
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    showTimerRef.current = setTimeout(() => {
      setIsVisible(true);
      onShow?.();
    }, showDelay);
  }, [disabled, showDelay, onShow]);

  const hide = useCallback(() => {
    if (showTimerRef.current) { clearTimeout(showTimerRef.current); showTimerRef.current = null; }
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      onHide?.();
    }, hideDelay);
  }, [hideDelay, onHide]);

  // Update position after balloon becomes visible
  useEffect(() => {
    if (isVisible) {
      // Double-rAF to ensure DOM is fully painted with new height
      requestAnimationFrame(() => requestAnimationFrame(updatePosition));
    }
  }, [isVisible, updatePosition]);

  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const balloonClass = [
    'bt-tooltip__balloon',
    `bt-tooltip__balloon--${position}`,
    isVisible ? 'bt-tooltip__balloon--visible' : '',
  ].join(' ');

  const arrowRowClass = `bt-tooltip__arrow-row bt-tooltip__arrow-row--${arrowPosition}`;
  const arrowColClass = `bt-tooltip__arrow-col bt-tooltip__arrow-col--${arrowPosition}`;

  const arrowSvg = (
    <svg
      className="bt-tooltip__arrow"
      width={arrowW}
      height={arrowH}
      viewBox={arrowViewBox}
      fill="none"
      aria-hidden="true"
    >
      <path d={arrowPath} fill="var(--bg-inverse)" />
    </svg>
  );

  return (
    <div
      ref={triggerRef}
      className="bt-tooltip"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={(_e: FocusEvent) => show()}
      onBlur={(_e: FocusEvent) => hide()}
    >
      {children}

      {createPortal(
        <div ref={balloonRef} className={balloonClass} role="tooltip" aria-live="polite">
          {/* Arrow */}
          {!isHorizontal ? (
            <div className={arrowRowClass}>{arrowSvg}</div>
          ) : (
            <div className={arrowColClass}>{arrowSvg}</div>
          )}

          {/* Body */}
          <div className="bt-tooltip__body">
            {content ?? (text ? <p className="bt-tooltip__text">{text}</p> : null)}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
