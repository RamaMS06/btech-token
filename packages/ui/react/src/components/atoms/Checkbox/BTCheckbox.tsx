/**
 * BTCheckbox — Figma 504:4181
 *
 * @example
 * ```tsx
 * // Basic controlled checkbox
 * const [checked, setChecked] = useState(false);
 * <BTCheckbox checked={checked} onChange={setChecked} label="I agree" />
 *
 * // Indeterminate / error / disabled
 * <BTCheckbox checked={false} indeterminate onChange={onChange} label="Select all" />
 * <BTCheckbox checked={false} error onChange={onChange} subtext="Required field" />
 * <BTCheckbox checked={false} disabled label="Unavailable" />
 * ```
 */
import { useRef, useEffect, useCallback } from 'react';
import './BTCheckbox.css';
import type { BTCheckboxProps } from './BTCheckbox.types';

export function BTCheckbox({
  checked = false,
  indeterminate = false,
  disabled = false,
  error = false,
  label,
  subtext,
  onChange,
  className,
}: BTCheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // The indeterminate state is a DOM property, not an HTML attribute.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event.target.checked);
    },
    [onChange],
  );

  const rootClass = [
    'bt-checkbox',
    disabled ? 'bt-checkbox--disabled' : '',
    error && !disabled ? 'bt-checkbox--error' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={rootClass}>
      <span className="bt-checkbox__control">
        <input
          ref={inputRef}
          type="checkbox"
          className="bt-checkbox__input"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
        />
        <span className="bt-checkbox__box" aria-hidden />
      </span>

      {(label || subtext) && (
        <span className="bt-checkbox__text">
          {label && <span className="bt-checkbox__label">{label}</span>}
          {subtext && <span className="bt-checkbox__subtext">{subtext}</span>}
        </span>
      )}
    </label>
  );
}

BTCheckbox.displayName = 'BTCheckbox';
