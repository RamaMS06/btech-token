/**
 * ToggleSwitch — accessible iOS-style on/off control
 * ----------------------------------------------------
 * Used across the import/export modals where a label + secondary
 * description pair should map to a single boolean. The control is a
 * `role="switch"` button so screen readers announce it correctly and
 * keyboard activation (Space/Enter) just works via native button
 * semantics — no extra key handlers required.
 *
 * The track and thumb are pure CSS (see `.toggle-switch__*` blocks at
 * the end of globals.css); a single `--on` modifier flips the colour
 * and translates the thumb. This keeps the React side stateless apart
 * from the controlled `checked` prop.
 */

import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  /** Smaller secondary copy below the label. Optional. */
  description?: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: ToggleSwitchProps) {
  return (
    <div className="toggle-switch__row">
      <div className="toggle-switch__label-block">
        <span className="toggle-switch__label">{label}</span>
        {description && (
          <span className="toggle-switch__description">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        className={`toggle-switch ${checked ? 'toggle-switch--on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`toggle-switch__track ${checked ? 'toggle-switch__track--on' : ''}`}
        >
          <span className="toggle-switch__thumb" />
        </span>
      </button>
    </div>
  );
}
