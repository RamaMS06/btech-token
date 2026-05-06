export interface BTCheckboxProps {
  /** Controlled checked state — pair with @update:modelValue for v-model. */
  modelValue?: boolean;
  /** Puts the checkbox into the indeterminate (dash) state. */
  indeterminate?: boolean;
  /** Disables all interaction. */
  disabled?: boolean;
  /** Applies the error style to the box border and subtext. */
  error?: boolean;
  /** Optional text label beside the checkbox. */
  label?: string;
  /** Optional helper / error text below the label. */
  subtext?: string;
}
