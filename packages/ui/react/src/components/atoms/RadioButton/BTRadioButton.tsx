/**
 * BTRadioButton — radio selection atom (Figma 555:3529).
 *
 * Use multiple BTRadioButton with the same modelValue + onChange to build
 * a radio group. Each item selects itself by calling onChange with its value.
 *
 * @example
 * const [selected, setSelected] = useState('a');
 *
 * <BTRadioButton modelValue={selected} value="a" onChange={setSelected} label="Option A" />
 * <BTRadioButton modelValue={selected} value="b" onChange={setSelected} label="Option B" subtext="Helper" />
 * <BTRadioButton modelValue={selected} value="c" onChange={setSelected} label="Disabled" disabled />
 * <BTRadioButton modelValue={selected} value="d" onChange={setSelected} label="Error" error subtext="Error msg" />
 */
import './BTRadioButton.css';
import type { BTRadioButtonProps } from './BTRadioButton.types';

export function BTRadioButton({
  modelValue,
  value,
  onChange,
  label,
  subtext,
  disabled = false,
  error = false,
  name,
  className,
}: BTRadioButtonProps) {
  const isActive = modelValue === value;

  const classes = [
    'bt-radio',
    isActive && 'bt-radio--active',
    disabled && 'bt-radio--disabled',
    error && !disabled && 'bt-radio--error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  function handleChange() {
    if (!disabled) onChange(value);
  }

  return (
    <label className={classes}>
      <input
        className="bt-radio__input"
        type="radio"
        name={name}
        value={String(value)}
        checked={isActive}
        disabled={disabled}
        aria-checked={isActive}
        onChange={handleChange}
      />

      <span className="bt-radio__circle" aria-hidden>
        <span className="bt-radio__dot" />
      </span>

      {(label || subtext) && (
        <span className="bt-radio__text">
          {label && <span className="bt-radio__label">{label}</span>}
          {subtext && <span className="bt-radio__subtext">{subtext}</span>}
        </span>
      )}
    </label>
  );
}

BTRadioButton.displayName = 'BTRadioButton';
