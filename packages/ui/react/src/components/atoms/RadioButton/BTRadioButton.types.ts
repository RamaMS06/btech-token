export type BTRadioButtonValue = string | number | boolean;

export interface BTRadioButtonProps {
  /** The group's currently selected value. Active when modelValue === value. */
  modelValue: BTRadioButtonValue;
  /** This radio button's unique value within the group. */
  value: BTRadioButtonValue;
  /** Called with this button's value when clicked. */
  onChange: (value: BTRadioButtonValue) => void;
  /** Optional label text beside the radio circle. */
  label?: string;
  /** Optional helper text below the label. */
  subtext?: string;
  /** Disables interaction. */
  disabled?: boolean;
  /** Error border on circle; subtext turns error colour. */
  error?: boolean;
  /** Native name attribute for form grouping. */
  name?: string;
  /** Additional CSS class names. */
  className?: string;
}
