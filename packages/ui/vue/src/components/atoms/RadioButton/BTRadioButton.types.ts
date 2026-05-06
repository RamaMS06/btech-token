export type BTRadioButtonValue = string | number | boolean;

export interface BTRadioButtonProps {
  /**
   * The group's currently selected value (bind with v-model).
   * When modelValue === value, this radio is in Active state.
   */
  modelValue: BTRadioButtonValue;
  /**
   * This radio button's unique value within the group.
   */
  value: BTRadioButtonValue;
  /** Optional label text beside the radio circle. */
  label?: string;
  /** Optional helper text below the label. */
  subtext?: string;
  /** Disables interaction. */
  disabled?: boolean;
  /**
   * Shows error border on the radio circle.
   * Subtext turns error colour when error is true.
   */
  error?: boolean;
  /** Native name attribute for grouping radios in a form. */
  name?: string;
}
