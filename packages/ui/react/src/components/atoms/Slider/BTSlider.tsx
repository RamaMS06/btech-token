/**
 * BTSlider — interactive range slider atom (Figma 434:7617).
 *
 * Three layout types: 'default' (horizontal · 1 thumb), 'range'
 * (horizontal · 2 thumbs), 'vertical' (1 thumb).
 * Three color variants: 'primary' · 'secondary' · 'destructive'.
 *
 * @example
 * ```tsx
 * // Default horizontal slider (controlled)
 * const [brightness, setBrightness] = useState(50);
 * <BTSlider value={brightness} onValueChange={setBrightness} />
 *
 * // Range slider
 * const [from, setFrom] = useState(20);
 * const [to, setTo] = useState(80);
 * <BTSlider type="range" startValue={from} endValue={to}
 *   onStartValueChange={setFrom} onEndValueChange={setTo} />
 *
 * // Vertical destructive slider
 * <BTSlider type="vertical" variant="destructive" value={level}
 *   onValueChange={setLevel} />
 * ```
 */
import { useState, useCallback } from 'react';
import './BTSlider.css';
import type { BTSliderProps } from './BTSlider.types';

function toRatio(v: number, min: number, max: number) {
  return (v - min) / (max - min);
}
function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
function hLeft(ratio: number) {
  return `calc(${ratio} * (100% - 24px) + 12px)`;
}

export function BTSlider({
  type = 'default',
  variant = 'primary',
  value: valueProp,
  startValue: startProp,
  endValue: endProp,
  min = 0,
  max = 100,
  step = 1,
  showTooltip = true,
  alwaysShown = true,
  disabled = false,
  onValueChange,
  onStartValueChange,
  onEndValueChange,
  className,
}: BTSliderProps) {
  // ── Internal state (uncontrolled fallback) ──────────────────────────────
  const [_value, _setValue] = useState(() => valueProp ?? Math.round((min + max) / 2));
  const [_start, _setStart] = useState(() => startProp ?? min + Math.round((max - min) * 0.2));
  const [_end, _setEnd] = useState(() => endProp ?? max - Math.round((max - min) * 0.2));

  const val   = valueProp   !== undefined ? valueProp   : _value;
  const start = startProp   !== undefined ? startProp   : _start;
  const end   = endProp     !== undefined ? endProp     : _end;

  // ── Derived styles ──────────────────────────────────────────────────────
  const fillStyle = (() => {
    if (type === 'range') {
      return {
        left: `${toRatio(start, min, max) * 100}%`,
        right: `${(1 - toRatio(end, min, max)) * 100}%`,
      };
    }
    if (type === 'vertical') {
      return { height: `${toRatio(val, min, max) * 100}%` };
    }
    return { left: '0%', right: `${(1 - toRatio(val, min, max)) * 100}%` };
  })();

  const thumbStyle       = { left: hLeft(toRatio(val, min, max)) };
  const thumbStartStyle  = { left: hLeft(toRatio(start, min, max)) };
  const thumbEndStyle    = { left: hLeft(toRatio(end, min, max)) };
  const vThumbStyle      = {
    bottom: `calc(${toRatio(val, min, max)} * (100% - 24px))`,
    left: '50%',
  };
  // +12px removed — translateY(50%) in CSS already centers tooltip on thumb center
  const vTooltipStyle    = {
    bottom: `calc(${toRatio(val, min, max)} * (100% - 24px))`,
  };
  const tooltipStyle     = { left: hLeft(toRatio(val, min, max)) };
  const ttStartStyle     = { left: hLeft(toRatio(start, min, max)) };
  const ttEndStyle       = { left: hLeft(toRatio(end, min, max)) };

  // Range z-index management
  const startZ = toRatio(start, min, max) > 0.9 ? 4 : 3;
  const endZ   = toRatio(end, min, max) < 0.1   ? 4 : 3;

  // ── Handlers ────────────────────────────────────────────────────────────
  const onValueInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = clamp(Number(e.target.value), min, max);
      _setValue(v);
      onValueChange?.(v);
    },
    [min, max, onValueChange],
  );

  const onStartInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = clamp(Math.min(Number(e.target.value), end - step), min, max);
      _setStart(v);
      onStartValueChange?.(v);
    },
    [min, max, step, end, onStartValueChange],
  );

  const onEndInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = clamp(Math.max(Number(e.target.value), start + step), min, max);
      _setEnd(v);
      onEndValueChange?.(v);
    },
    [min, max, step, start, onEndValueChange],
  );

  const rootClass = [
    'bt-slider',
    type === 'vertical' ? 'bt-slider--vertical' : 'bt-slider--horizontal',
    `bt-slider--${variant}`,
    disabled ? 'bt-slider--disabled' : '',
    showTooltip && !alwaysShown ? 'bt-slider--tooltip-hover' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  // ── Single-thumb template ───────────────────────────────────────────────
  if (type !== 'range') {
    return (
      <div className={rootClass}>
        {showTooltip && (
          <div
            className="bt-slider__tooltip"
            style={type === 'vertical' ? vTooltipStyle : tooltipStyle}
          >
            {val}
          </div>
        )}

        <div className="bt-slider__track">
          <div className="bt-slider__fill" style={fillStyle} />
        </div>

        <input
          className="bt-slider__input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={val}
          disabled={disabled}
          aria-orientation={type === 'vertical' ? 'vertical' : 'horizontal'}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={val}
          onChange={onValueInput}
        />

        <div
          className="bt-slider__thumb"
          style={type === 'vertical' ? vThumbStyle : thumbStyle}
        />
      </div>
    );
  }

  // ── Range (two thumbs) template ─────────────────────────────────────────
  return (
    <div className={rootClass}>
      {showTooltip && (
        <>
          <div className="bt-slider__tooltip" style={ttStartStyle}>{start}</div>
          <div className="bt-slider__tooltip" style={ttEndStyle}>{end}</div>
        </>
      )}

      <div className="bt-slider__track">
        <div className="bt-slider__fill" style={fillStyle} />
      </div>

      <input
        className="bt-slider__input bt-slider__input--start"
        type="range"
        style={{ zIndex: startZ }}
        min={min}
        max={max}
        step={step}
        value={start}
        disabled={disabled}
        aria-label="Range start"
        onChange={onStartInput}
      />
      <input
        className="bt-slider__input bt-slider__input--end"
        type="range"
        style={{ zIndex: endZ }}
        min={min}
        max={max}
        step={step}
        value={end}
        disabled={disabled}
        aria-label="Range end"
        onChange={onEndInput}
      />

      <div className="bt-slider__thumb" style={thumbStartStyle} />
      <div className="bt-slider__thumb" style={thumbEndStyle} />
    </div>
  );
}

BTSlider.displayName = 'BTSlider';
